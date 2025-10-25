// src/components/SellerQuotationsTab.jsx

import React, { useEffect, useMemo, useState } from "react";
import { useOnceEffect } from "../hooks/useOnceEffect";
import { useAuth } from "../contexts/AuthContext";
import { listQuotations } from "../services/quotationsService";
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

  // initial load
  useOnceEffect(() => {
    loadQuotations();
  }, []);

  // reload if the user changes (e.g., sign-out/in)
  useEffect(() => {
    if (user?.id) loadQuotations();
  }, [user?.id]);

  // refresh when a quotation is submitted elsewhere
  useEffect(() => {
    const onSubmitted = () => loadQuotations();
    window.addEventListener("quotation:submitted", onSubmitted);
    return () => window.removeEventListener("quotation:submitted", onSubmitted);
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
        <h2 className="text-xl font-semibold text-gray-900">My Quotations</h2>
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
        />
      )}
    </div>
  );
}
