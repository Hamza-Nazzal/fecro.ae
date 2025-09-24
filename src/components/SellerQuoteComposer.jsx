// src/components/SellerQuoteComposer.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { SELLER_HYDRATE_ENABLED } from "../config/flags";
import { hydrateRFQForSeller } from "../services/backends/supabase/rfqs/hydrateSeller";
import { listRFQsForCards } from "../services/rfqService/reads";
import { useToast } from "./Toasts.jsx";

export default function SellerQuoteComposer() {
  const { rfqId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();

  const [rfq, setRfq] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [hydrated, setHydrated] = useState(null);
  const [hydrating, setHydrating] = useState(false);
  const [hydrateError, setHydrateError] = useState("");

  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("AED");
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitErr, setSubmitErr] = useState(null);

  // Load base RFQ (card) by id
  useEffect(() => {
    if (!rfqId) return;
    let alive = true;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        // Keep your existing signature; normalize results defensively.
        const res = await listRFQsForCards({ rfqId, page: 1, pageSize: 1 });
        const data = Array.isArray(res) ? res : res?.data;
        const first = Array.isArray(data) ? data[0] : data?.[0];
        if (alive) setRfq(first || { id: rfqId, title: "", sellerIdDisplay: null });
      } catch (e) {
        if (alive) {
          setError(e?.message || String(e));
          setRfq({ id: rfqId, title: "", sellerIdDisplay: null }); // safe fallback
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [rfqId]);

  // Seller-safe hydrate (lazy, behind flag)
  useEffect(() => {
    if (!SELLER_HYDRATE_ENABLED) return;
    if (!rfq?.id || !user?.id) {
      setHydrated(null);
      setHydrateError("");
      setHydrating(false);
      return;
    }
    let cancelled = false;
    setHydrating(true);
    setHydrateError("");
    (async () => {
      try {
        const result = await hydrateRFQForSeller(rfq.id, user.id);
        if (!cancelled) setHydrated(result ?? null);
      } catch (err) {
        if (!cancelled) {
          setHydrated(null);
          setHydrateError(err?.message || String(err));
        }
      } finally {
        if (!cancelled) setHydrating(false);
      }
    })();
    return () => { cancelled = true; };
  }, [rfq?.id, user?.id]);

  // Choose items from hydrated payload (if present) else card payload
  const items = hydrated?.items?.length ? hydrated.items : (rfq?.items ?? []);
  const sellerIdDisplay = hydrated?.sellerIdDisplay ?? rfq?.sellerIdDisplay ?? null;

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setSubmitErr(null);
    try {
      // TODO: call your real createQuotation signature here.
      // Example (adjust to your API):
      // await createQuotation({ rfqId: rfq?.id, amount, currency, notes, items });
      toast?.success?.("Quotation submitted");
      navigate("/seller");
    } catch (err) {
      setSubmitErr(err?.message || String(err));
      toast?.error?.("Failed to submit quotation");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="p-4">
        <div className="mb-3">
          <Link to="/seller" className="text-blue-600 hover:underline text-sm">← Back to Seller</Link>
        </div>
        <div className="rounded-xl border bg-white p-4">Loading…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="mb-3">
          <Link to="/seller" className="text-blue-600 hover:underline text-sm">← Back to Seller</Link>
        </div>
        <div className="rounded-xl border bg-white p-4 text-red-600 text-sm">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
  <div className="mb-3">
    <Link to="/seller" className="text-blue-600 hover:underline text-sm">← Back to Seller</Link>
  </div>

  <div className="mt-4 rounded-xl border bg-white p-4">
    <div className="text-sm">
      {/* Title + seller-facing ID (prefer hydrated) */}
      <div className="font-semibold">
        {hydrated?.title || rfq?.title || "Untitled RFQ"}
        {sellerIdDisplay && (
          <span className="ml-2 text-xs text-slate-600">({sellerIdDisplay})</span>
        )}
      </div>

      {/* Hydration banners */}
      {SELLER_HYDRATE_ENABLED && hydrating && (
        <div className="animate-pulse text-sm text-gray-500 mb-2">
          Loading RFQ details…
        </div>
      )}
      {SELLER_HYDRATE_ENABLED && hydrateError && (
        <div className="text-xs text-red-600 mb-2">{hydrateError}</div>
      )}

      {/* Seller-safe header chips */}
      {hydrated && (
        <div className="mt-2 flex flex-wrap gap-2">
          {hydrated.categoryPathLast && (
            <span className="inline-block text-xs bg-gray-100 text-gray-700 rounded px-2 py-1">
              Category: {hydrated.categoryPathLast}
            </span>
          )}
          <span className="inline-block text-xs bg-gray-100 text-gray-700 rounded px-2 py-1">
            Total units: {hydrated.qtyTotal ?? 0}
          </span>
          {hydrated.status && (
            <span className="inline-block text-xs bg-gray-100 text-gray-700 rounded px-2 py-1">
              Status: {hydrated.status}
            </span>
          )}
          {hydrated.orderDetails?.incoterms && (
            <span className="inline-block text-xs bg-gray-100 text-gray-700 rounded px-2 py-1">
              Incoterms: {hydrated.orderDetails.incoterms}
            </span>
          )}
          {hydrated.orderDetails?.payment && (
            <span className="inline-block text-xs bg-gray-100 text-gray-700 rounded px-2 py-1">
              Payment: {hydrated.orderDetails.payment}
            </span>
          )}
          {hydrated.orderDetails?.deliveryTime && (
            <span className="inline-block text-xs bg-gray-100 text-gray-700 rounded px-2 py-1">
              Delivery: {hydrated.orderDetails.deliveryTime}
            </span>
          )}
        </div>
      )}

      {/* Items preview (hydrated first, fallback to rfq.items) */}
      {items.length ? (
        <ul className="mt-2 list-disc pl-5 text-slate-700">
          {items.slice(0, 3).map((it, i) => {
            const label = it.productName || it.name || "Item";
            const qty = typeof it.quantity === "number" ? it.quantity : Number(it.quantity ?? 0) || 0;
            const cat = it.categoryPath ? ` (${it.categoryPath})` : "";
            return <li key={i}>{label} — {qty}{cat}</li>;
          })}
          {items.length > 3 && (
            <li className="text-slate-500">…and {items.length - 3} more items</li>
          )}
        </ul>
      ) : (
        <div className="mt-2 text-slate-500">No items metadata.</div>
      )}
    </div>

    {/* Quote form */}
    <form onSubmit={handleSubmit} className="mt-4 space-y-3">
      <div className="flex gap-2">
        <input
          className="border rounded px-3 py-2 w-40"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <select
          className="border rounded px-3 py-2 w-28"
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
        >
          <option>AED</option>
          <option>USD</option>
        </select>
      </div>
      <textarea
        className="border rounded px-3 py-2 w-full"
        placeholder="Notes (optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />

      {submitErr && (
        <div className="text-xs text-red-600">{submitErr}</div>
      )}

      <div className="mt-2">
        <button
          type="submit"
          disabled={submitting}
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {submitting ? "Submitting…" : "Submit quotation"}
        </button>
      </div>
    </form>
  </div>
</div>

  );
}
