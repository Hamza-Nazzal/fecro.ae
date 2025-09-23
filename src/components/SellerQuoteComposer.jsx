import React, { useEffect, useRef, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { listRFQsForCards } from "../services/rfqService/reads";
import { createQuotation } from "../services/quotationsService";
import { useToast } from "./Toasts.jsx";

export default function SellerQuoteComposer() {
  const { rfqId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [rfq, setRfq] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("AED");
  const [leadDays, setLeadDays] = useState(7);
  const [validUntil, setValidUntil] = useState(() => {
    const dt = new Date(); dt.setDate(dt.getDate() + 14); return dt.toISOString().slice(0, 10);
  });
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitErr, setSubmitErr] = useState(null);

  const reqRef = useRef(0);

  useEffect(() => {
    let alive = true; const my = ++reqRef.current;
    (async () => {
      try {
        setLoading(true); setError(null);
        const res = await listRFQsForCards({ rfqId, page: 1, pageSize: 1 });
        const data = Array.isArray(res) ? res : res?.data;
        if (!alive || my !== reqRef.current) return;
        setRfq(data?.[0] || null);
      } catch (e) { if (!alive || my !== reqRef.current) return; setError(e?.message || String(e)); setRfq(null); }
      finally { if (!alive || my !== reqRef.current) return; setLoading(false); }
    })();
    return () => { alive = false; };
  }, [rfqId]);

  async function handleSubmit(e) {
    e.preventDefault(); setSubmitting(true); setSubmitErr(null);
    try {
      await createQuotation({
        rfqId,
        total_amount: Number(amount),
        currency,
        lead_time_days: Number(leadDays),
        valid_until: validUntil,
        notes: notes?.trim() || null,
      });
      window.dispatchEvent(new Event("quotation:submitted"));
      toast.success("Quotation submitted");
      navigate("/seller");
    } catch (err) {
      setSubmitErr(err?.message || String(err));
      toast.error(err?.message || "Submit failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-4">
      <div className="mb-3"><Link to="/seller" className="text-blue-600 hover:underline text-sm">← Back to Seller</Link></div>
      <h1 className="text-xl font-semibold">Compose Quotation</h1>
      <div className="mt-1 text-sm text-slate-600">RFQ: {rfqId}</div>

      {loading ? <div className="mt-4 text-slate-500">Loading RFQ…</div> :
       error ? <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{String(error)}</div> :
       rfq && (
        <div className="mt-4 rounded-xl border bg-white p-4">
          <div className="text-sm">
            <div className="font-semibold">{rfq.title || "Untitled RFQ"}</div>
            {rfq.items?.length ? (
              <ul className="mt-2 list-disc pl-5 text-slate-700">
                {rfq.items.slice(0, 3).map((it, i) => (
                  <li key={i}>{it.name} — {it.quantity} {it.unit} {it.categoryPath ? `(${it.categoryPath})` : ""}</li>
                ))}
                {rfq.items.length > 3 && <li className="text-slate-500">…and {rfq.items.length - 3} more items</li>}
              </ul>
            ) : <div className="mt-2 text-slate-500">No items metadata.</div>}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 max-w-lg space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">Total Amount</label>
          <div className="mt-1 flex gap-2">
            <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-28 rounded-lg border px-3 py-2 text-sm">
              <option>AED</option><option>USD</option><option>EUR</option><option>SAR</option>
            </select>
            <input type="number" required step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)}
              className="flex-1 rounded-lg border px-3 py-2 text-sm" placeholder="e.g., 12500.00" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700">Lead Time (days)</label>
            <input type="number" min="0" value={leadDays} onChange={(e) => setLeadDays(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Valid Until</label>
            <input type="date" required value={validUntil} onChange={(e) => setValidUntil(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Notes</label>
          <textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" placeholder="Delivery schedule, exclusions, brand, alternates…" />
        </div>

        {submitErr && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{String(submitErr)}</div>}

        <div className="pt-2">
          <button type="submit" disabled={submitting} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
            {submitting ? "Submitting…" : "Submit Quotation"}
          </button>
        </div>
      </form>
    </div>
  );
}
