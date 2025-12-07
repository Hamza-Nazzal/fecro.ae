// src/components/BuyerQuotationsViewer.jsx
// This component is used to display the quotations for a given RFQ.
// It is used in the BuyerRFQDetail component.
// It is used to display the quotations for a given RFQ.
// It is used in the BuyerRFQDetail component.

import React, { useState, useMemo, useCallback } from "react";
import { useOnceEffect } from "../hooks/useOnceEffect";
import { X, AlertCircle, DollarSign, Clock, Package } from "lucide-react";
import { listQuotationsForRFQ, updateQuotation } from "../services/quotationsService";
import { quotationDbToJs } from "../utils/mappers";
import QuotationViewer from "./QuotationViewer";
import BuyerRFQQuotationsPreview from "./BuyerRFQQuotationsPreview";

// ---------- Quotation Card ----------
function QuotationCard({ quotation, onView, onAccept, onReject }) {
  const statusStyles = {
    draft: "bg-gray-100 text-gray-800",
    submitted: "bg-blue-100 text-blue-800",
    accepted: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
    withdrawn: "bg-orange-100 text-orange-800",
    expired: "bg-gray-100 text-gray-600",
  };

  const formatCurrency = (amount, currency = "AED") => {
    const n = Number(amount);
    if (!Number.isFinite(n)) return `${currency} —`;
    return `${currency} ${n.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    const d = new Date(dateString);
    return Number.isFinite(d.getTime())
      ? d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
      : "—";
  };

  return (
    <div className="bg-white rounded-xl border p-4 hover:shadow-sm transition">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Package size={18} />
            <h3 className="font-semibold">From: {quotation.sellerCompany || "Seller"}</h3>
            <span
              className={`px-2 py-1 rounded-lg text-xs font-medium ${
                statusStyles[quotation.status] || statusStyles.draft
              }`}
            >
              {quotation.status
                ? quotation.status.charAt(0).toUpperCase() + quotation.status.slice(1)
                : "Draft"}
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold text-gray-900">
            {formatCurrency(quotation.totalPrice, quotation.currency)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-blue-600" />
          <span>{quotation.deliveryTimelineDays ?? "—"} days delivery</span>
        </div>
        <div className="flex items-center gap-2">
          <DollarSign size={16} className="text-green-600" />
          <span>{quotation.paymentTerms || "—"}</span>
        </div>
      </div>

      <div className="text-xs text-gray-500 mb-3">
        <div>Submitted: {formatDate(quotation.submittedAt)}</div>
        {quotation.expiresAt && <div>Expires: {formatDate(quotation.expiresAt)}</div>}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onView?.(quotation)}
          className="flex-1 py-2 px-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
        >
          View Details
        </button>

        {quotation.status === "submitted" && (
          <>
            <button
              onClick={() => onAccept?.(quotation)}
              className="flex-1 py-2 px-3 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 text-sm font-medium"
            >
              Accept
            </button>
            <button
              onClick={() => onReject?.(quotation)}
              className="flex-1 py-2 px-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-sm font-medium"
            >
              Reject
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ---------- Buyer Quotation Viewer ----------
export default function BuyerQuotationsViewer({ rfq, onClose }) {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewingQuotation, setViewingQuotation] = useState(null);

  // Resolve RFQ identifier in the same way we use it when navigating
  // in BuyerRFQsInline (id || publicId)
  const rfqId = useMemo(
    () =>
      rfq?.id ??
      rfq?.rfqId ??
      rfq?.rfq_id ??
      rfq?.publicId ??
      rfq?.public_id ??
      null,
    [rfq?.id, rfq?.rfqId, rfq?.rfq_id, rfq?.publicId, rfq?.public_id]
  );

  const loadQuotations = useCallback(async () => {
    if (!rfqId) {
      setQuotations([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const rows = await listQuotationsForRFQ(rfqId);
      const data = (rows || []).map(quotationDbToJs);
      setQuotations(data || []);
    } catch (e) {
      setError(e?.message || "Failed to load quotations");
    } finally {
      setLoading(false);
    }
  }, [rfqId]);

  // StrictMode-safe effect (fires once per deps change in dev)
  useOnceEffect(() => {
    loadQuotations();
  }, [loadQuotations]);

  const handleView = (quotation) => setViewingQuotation(quotation);

  const handleAccept = async (quotation) => {
    if (!window.confirm("Accept this quotation?")) return;
    try {
      await updateQuotation(quotation.id, { status: "accepted" });
      await loadQuotations();
    } catch (e) {
      setError(e?.message || "Failed to accept quotation");
    }
  };

  const handleReject = async (quotation) => {
    if (!window.confirm("Reject this quotation?")) return;
    try {
      await updateQuotation(quotation.id, { status: "rejected" });
      await loadQuotations();
    } catch (e) {
      setError(e?.message || "Failed to reject quotation");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Quotations Received</h2>
            <p className="text-sm text-gray-600 mt-1">
              For: {rfq?.title} ({rfq?.publicId})
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {error && <div className="text-red-600 text-sm mb-3">{error}</div>}

          {loading ? (
            <div className="text-gray-500">Loading quotations...</div>
          ) : quotations.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No quotations yet</h3>
              <p className="text-gray-600">
                Quotations from sellers will appear here once they respond to your request.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-600">
                  {quotations.length} quotation{quotations.length !== 1 ? "s" : ""} received
                </p>
                <button onClick={loadQuotations} className="text-sm text-blue-600 hover:text-blue-700">
                  Refresh
                </button>
              </div>

              {/* Quotations preview block */}
              <BuyerRFQQuotationsPreview
                rfq={rfq}
                quotations={quotations}
                onViewQuotation={(quotation) => setViewingQuotation(quotation)}
              />

              {/* Existing cards list with Accept / Reject controls */}
              {quotations.map((quotation) => (
                <QuotationCard
                  key={quotation.id}
                  quotation={quotation}
                  onView={handleView}
                  onAccept={handleAccept}
                  onReject={handleReject}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quotation Detail Viewer */}
      {viewingQuotation && (
        <QuotationViewer
          quotation={viewingQuotation}
          onClose={() => setViewingQuotation(null)}
          userRole="buyer"
        />
      )}
    </div>
  );
}
