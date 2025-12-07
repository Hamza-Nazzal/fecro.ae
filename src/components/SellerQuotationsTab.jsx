// src/components/SellerQuotationsTab.jsx

import React, { useEffect, useMemo, useState } from "react";
import { useOnceEffect } from "../hooks/useOnceEffect";
import { useAuth } from "../contexts/AuthContext";
import { listQuotations, listPendingInterestsForCurrentSeller } from "../services/quotationsService";
import { Package } from "lucide-react";
import QuotationViewer from "./QuotationViewer";
import QuotationCard from "./QuotationCard"; // unified card




export default function SellerQuotationsTab() {
  const { user } = useAuth();
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all"); // 'all' | 'draft' | 'submitted' | 'accepted' | 'rejected'
  const [viewingQuotation, setViewingQuotation] = useState(null);
  const [pendingByQuoteId, setPendingByQuoteId] = useState(new Set());
  const [hasPendingAny, setHasPendingAny] = useState(false);

  const inFlight = React.useRef(false);
  
  async function loadQuotations() {
    if (inFlight.current) return;
         inFlight.current = true;
    try {
      setLoading(true);
      setError("");
      const rows = await listQuotations({});
      setQuotations(rows || []);
    } catch (e) {
      setError(e?.message || "Failed to load quotations");
    } finally {
      setLoading(false);
      inFlight.current = false;
    }
  }

  // Load pending interests
  async function loadPendingInterests() {
    try {
      const interests = await listPendingInterestsForCurrentSeller();
      const quoteIds = new Set(interests.map((i) => i.quotationId).filter(Boolean));
      setPendingByQuoteId(quoteIds);
      const hasAny = quoteIds.size > 0;
      setHasPendingAny(hasAny);
      // NEW: broadcast to other parts of the app (e.g. top tab badge)
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("sellerPendingInterests:changed", {
            detail: { hasPending: hasAny },
          })
        );
      }
    } catch (e) {
      // Silently fail – don't block UI
      // eslint-disable-next-line no-console
      console.error("Failed to load pending interests:", e);
    }
  }

  // initial load
  useOnceEffect(() => {
    loadQuotations();
    loadPendingInterests();
  }, []);

  // reload if the user changes (e.g., sign-out/in)
  useEffect(() => {
    if (user?.id) {
      loadQuotations();
      loadPendingInterests();
    }
  }, [user?.id]);

  // refresh when a quotation is submitted elsewhere
  useEffect(() => {
    const onSubmitted = () => loadQuotations();
    window.addEventListener("quotation:submitted", onSubmitted);
    return () => window.removeEventListener("quotation:submitted", onSubmitted);
  }, []);

  // refresh pending interests when seller approves/rejects interest
  useEffect(() => {
    const onInterestUpdated = () => loadPendingInterests();
    window.addEventListener("quotationInterest:updated", onInterestUpdated);
    return () => window.removeEventListener("quotationInterest:updated", onInterestUpdated);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleView = (quotation) => setViewingQuotation(quotation);

  const handleEdit = (quotation) => {
    // TODO: open edit modal or navigate to edit screen
    // For now, just log to console
    // eslint-disable-next-line no-console
    console.warn("Edit quotation not implemented yet:", quotation?.id || quotation);
  };

  const handleWithdraw = async (quotation) => {
    if (!window.confirm("Are you sure you want to withdraw this quotation?")) return;
    try {
      // TODO: call a real withdraw API when available
      await loadQuotations(); // temporary: just refresh the list
    } catch (e) {
      setError(e?.message || "Failed to withdraw quotation");
    }
  };

  const filtered = useMemo(() => {
    if (filter === "all") return quotations || [];
    const f = (filter || "").toLowerCase();
    return (quotations || []).filter((q) => (q.status || "").toLowerCase() === f);
  }, [quotations, filter]);

  if (loading) return <div className="text-gray-500">Loading quotations...</div>;

  return (
    <div className="space-y-4">
      {/* Header + Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <h2 className="text-xl font-semibold text-gray-900">My Quotations</h2>
          {hasPendingAny && (
            <span className="ml-2 inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          )}
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Status:</label>
          <select
            className="border rounded-md px-2 py-1 text-sm"
            value={filter ?? ""}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All</option>
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Error */}
      {error && <div className="text-red-600 text-sm">{String(error)}</div>}

      {/* List / Empty */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
          <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {filter === "all" ? "No quotations yet" : `No ${filter} quotations`}
          </h3>
          <p className="text-gray-600 mb-4">
            Browse available requests and start sending competitive quotations to grow your business.
          </p>
          <button
            onClick={() => (window.location.hash = "#dashboard")}
            className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            Browse Requests
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map((quotation) => (
            <QuotationCard
              key={quotation.id}
              quotation={quotation}
              rfq={quotation.rfq}
              currentUserId={user?.id}
              userRole="seller"
              hasPendingInterest={pendingByQuoteId.has(quotation.id)}
              onView={() => handleView(quotation)}
              onEdit={handleEdit}
              onWithdraw={handleWithdraw}
            />
          ))}
        </div>
      )}

      {/* Quotation Viewer */}
      {viewingQuotation && (
        <QuotationViewer
          quotation={viewingQuotation}
          onClose={() => setViewingQuotation(null)}
          userRole="seller"
        />
      )}
    </div>
  );
}
