// src/components/BuyerRFQDetail.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Building2, CalendarClock, Eye, MessageSquareText, Package, Tag,
} from "lucide-react";
import { listRFQsForCards } from "../services/rfqService/reads";
import {
  listQuotationsForRFQ, acceptQuotation, rejectQuotation,
} from "../services/quotationsService";
import { useToast } from "./Toasts.jsx";

function Chip({ icon: Icon, children }) {
  return <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs bg-slate-100 text-slate-700">{Icon ? <Icon className="w-3 h-3" /> : null}{children}</span>;
}
function StatusBadge({ status }) {
  const map = { accepted: "bg-green-50 text-green-700 ring-1 ring-green-200", rejected: "bg-red-50 text-red-700 ring-1 ring-red-200", pending: "bg-slate-50 text-slate-700 ring-1 ring-slate-200" };
  return status ? <span className={`rounded-full px-2 py-0.5 text-xs ${map[status] || map.pending}`}>{String(status).toUpperCase()}</span> : null;
}
function ItemRow({ item }) {
  return (
    <div className="grid grid-cols-12 items-center gap-3 rounded-lg border border-slate-100 bg-white p-2">
      <div className="col-span-5 flex items-center gap-2 truncate"><Package className="w-4 h-4 text-slate-500" /><span className="truncate font-medium">{item.name}</span></div>
      <div className="col-span-2 text-slate-700"><span className="font-medium">{item.quantity}</span><span className="ml-1 text-slate-500">{item.unit}</span></div>
      <div className="col-span-4 truncate text-slate-600">{item.categoryPath || "—"}</div>
      <div className="col-span-1 flex justify-end"><Chip icon={Tag}>{item.attrsCount ?? 0}</Chip></div>
    </div>
  );
}

export default function BuyerRFQDetail() {
  const { rfqId } = useParams();
  const toast = useToast();

  const [rfq, setRfq] = useState(null);
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qLoading, setQLoading] = useState(true);
  const [error, setError] = useState(null);
  const [qError, setQError] = useState(null);
  const [busy, setBusy] = useState(null);
  const [awardedId, setAwardedId] = useState(null);

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

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setQLoading(true); setQError(null);
        const rows = await listQuotationsForRFQ(rfqId);
        if (!alive) return;
        setQuotes(rows || []);
        const pre = (rows || []).find(q => (q.status || "").toLowerCase() === "accepted");
        if (pre) setAwardedId(pre.id);
      } catch (e) { if (!alive) return; setQError(e?.message || String(e)); setQuotes([]); }
      finally { if (!alive) return; setQLoading(false); }
    })();
    return () => { alive = false; };
  }, [rfqId]);

  const meta = useMemo(() => rfq && (
    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-600">
      <Chip icon={Building2}>{rfq.buyer?.name || "—"}</Chip>
      <Chip icon={Eye}>{rfq.views ?? 0} views</Chip>
      <Chip icon={MessageSquareText}>{rfq.quotationsCount ?? 0} quotes</Chip>
      {rfq.postedAt && <Chip icon={CalendarClock}>Posted {new Date(rfq.postedAt).toLocaleDateString()}</Chip>}
      {rfq.deadline && <Chip icon={CalendarClock}>Due {new Date(rfq.deadline).toLocaleDateString()}</Chip>}
    </div>
  ), [rfq]);

  async function decide(q, status) {
    setBusy(q.id);
    try {
      if (status === "accepted") {
        await acceptQuotation({ quotationId: q.id, rfqId });
        setAwardedId(q.id);
        toast.success("Quotation accepted");
      } else {
        await rejectQuotation({ quotationId: q.id, rfqId });
        toast.info("Quotation rejected");
      }
      setQuotes(prev => prev.map(row => row.id === q.id ? { ...row, status } : row));
    } catch (err) {
      toast.error(err?.message || "Action failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <Link to="/buyer/rfqs" className="text-blue-600 hover:underline text-sm">← Back to My RFQs</Link>
        {!!rfq?.publicId && <span className="text-xs text-slate-500">RFQ ID: {rfq.publicId}</span>}
      </div>

      {loading ? (
        <div className="text-slate-500">Loading RFQ…</div>
      ) : error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{String(error)}</div>
      ) : !rfq ? (
        <div className="rounded-md border border-slate-200 bg-white p-4">Not found.</div>
      ) : (
        <>
          <div className="flex items-center gap-2"><h1 className="text-xl font-semibold">{rfq.title || "Untitled RFQ"}</h1></div>
          {meta}

          <section className="mt-4">
            <h2 className="mb-2 text-sm font-semibold text-slate-700">Items</h2>
            <div className="grid grid-cols-12 items-center gap-3 text-xs uppercase tracking-wide text-slate-500">
              <div className="col-span-5">Item</div><div className="col-span-2">Qty</div><div className="col-span-4">Category</div><div className="col-span-1 text-right">Specs</div>
            </div>
            <div className="mt-2 space-y-2">{(rfq.items || []).map((it, i) => <ItemRow key={i} item={it} />)}</div>
          </section>

          {rfq.notes && (
            <section className="mt-4">
              <h2 className="mb-2 text-sm font-semibold text-slate-700">Notes</h2>
              <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">{rfq.notes}</div>
            </section>
          )}

          <section className="mt-6">
            <h2 className="mb-2 text-sm font-semibold text-slate-700">Quotations</h2>
            {qLoading ? (
              <div className="text-slate-500">Loading quotations…</div>
            ) : qError ? (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{String(qError)}</div>
            ) : (quotes || []).length === 0 ? (
              <div className="rounded-xl border bg-white p-6 text-center text-slate-500">No quotations yet.</div>
            ) : (
              <div className="grid gap-3">
                {quotes.map((q) => {
                  const accepted = (q.status || "").toLowerCase() === "accepted";
                  const rejected = (q.status || "").toLowerCase() === "rejected";
                  const locked = awardedId && q.id !== awardedId;
                  return (
                    <div key={q.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-semibold">{q.seller?.company || q.seller?.name || "Seller"}</div>
                            <StatusBadge status={q.status || "pending"} />
                          </div>
                          <div className="text-xs text-slate-500">Submitted {q.created_at ? new Date(q.created_at).toLocaleString() : "—"}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-base font-semibold">
                            {q.currency || "AED"}{" "}
                            {Number(q.total_amount || q.amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </div>
                          {q.lead_time_days != null && <div className="text-xs text-slate-500">Lead time: {q.lead_time_days} day{q.lead_time_days === 1 ? "" : "s"}</div>}
                        </div>
                      </div>
                      {q.notes && <div className="mt-2 rounded-md bg-slate-50 p-2 text-sm text-slate-700">{q.notes}</div>}
                      <div className="mt-3 flex gap-2">
                        <button
                          className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                          onClick={() => decide(q, "accepted")}
                          disabled={busy === q.id || accepted || locked}
                        >
                          Accept
                        </button>
                        <button
                          className="rounded-lg border px-3 py-1.5 text-sm hover:bg-slate-50 disabled:opacity-50"
                          onClick={() => decide(q, "rejected")}
                          disabled={busy === q.id || rejected || locked}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
