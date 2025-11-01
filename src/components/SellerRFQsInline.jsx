// src/components/SellerRFQsInline.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { listSellerRFQs } from "../services/workerApi";
import { listMyQuotedRFQIds } from "../services/quotationsService";
import RFQCard from "./RFQCard";
import RFQToolbar from "./RFQToolbar";
import RFQCardSkeleton from "./RFQCardSkeleton";
import useDebouncedValue from "../hooks/useDebouncedValue";

export default function SellerRFQsInline() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [onlyOpen, setOnlyOpen] = useState(true);
  const [hideQuoted, setHideQuoted] = useState(true);
  const [dense, setDense] = useState(false);
  const [sort, setSort] = useState("posted_desc");
  const debouncedQuery = useDebouncedValue(query, 180);

  const [rfqs, setRfqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [quotedSet, setQuotedSet] = useState(() => new Set());
  const reqIdRef = useRef(0);

  useEffect(() => {
    let alive = true;
    reqIdRef.current += 1;
    const currentReqId = reqIdRef.current;
    (async () => {
      try {
        setLoading(true);
        setError("");
        const res = await listSellerRFQs({ page, pageSize });
        if (!alive) return;
        if (reqIdRef.current !== currentReqId) return;
        setRfqs(res?.rows ?? []);
        setTotal(res?.count ?? 0);
      } catch (e) {
        if (!alive) return;
        setError(e?.message || String(e));
        setRfqs([]);
        setTotal(0);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [user?.id, page, pageSize]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const ids = await listMyQuotedRFQIds();
        if (!alive) return;
        setQuotedSet(ids);
      } catch {
        /* non-fatal */
      }
    })();
    return () => {
      alive = false;
    };
  }, [user?.id]);

  useEffect(() => {
    const onSubmitted = async () => {
      try {
        const ids = await listMyQuotedRFQIds();
        setQuotedSet(ids);
      } catch {}
    };
    window.addEventListener("quotation:submitted", onSubmitted);
    return () => window.removeEventListener("quotation:submitted", onSubmitted);
  }, []);

  useEffect(() => setPage(1), [pageSize]); // Reset page when pageSize changes

  const display = useMemo(() => {
    let base = rfqs;
    if (hideQuoted && quotedSet && quotedSet.size) {
      base = base.filter((r) => !quotedSet.has(r.id));
    }
    return base;
  }, [rfqs, hideQuoted, quotedSet]);

  const hasNext = rfqs.length === pageSize;

  return (
    <div className="p-4">
      <h2 className="mb-1 text-lg font-semibold">RFQs</h2>
      <p className="mb-3 text-sm text-slate-600">
        Browse requests and send quotations.
      </p>

      <RFQToolbar
        total={display.length}
        query={query}
        setQuery={setQuery}
        onlyOpen={onlyOpen}
        setOnlyOpen={setOnlyOpen}
        sort={sort}
        setSort={setSort}
        dense={dense}
        setDense={setDense}
      />

      <div className="mb-3 flex items-center justify-between text-sm">
        <label className="inline-flex items-center gap-2 text-slate-700">
          <input
            type="checkbox"
            checked={hideQuoted}
            onChange={(e) => setHideQuoted(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-400"
            aria-label="Hide RFQs you already quoted"
          />
          Hide already quoted
        </label>
        <div className="text-slate-500">
          <span aria-live="polite" aria-atomic="true">
            Page {page} • Showing {loading ? "…" : display.length} items
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {String(error)}
        </div>
      )}

      {loading ? (
        <div className={dense ? "grid gap-2" : "grid gap-3"}>
          {Array.from({ length: 6 }).map((_, i) => (
            <RFQCardSkeleton key={i} dense={dense} />
          ))}
        </div>
      ) : display.length ? (
        <>
          <div className={dense ? "grid gap-2" : "grid gap-3"}>
            {display.map((rfq, index) => (
             <RFQCard
                key={rfq.id || rfq.sellerRfqId || `seller-rfq-${index}`}
                rfq={rfq}
                dense={dense}
                audience="seller"
                onSendQuote={(r) => navigate(`/seller/quote/${encodeURIComponent(r.id ?? "")}`)}
              />
            ))}
          </div>

          <nav
            className="mt-6 flex items-center justify-between"
            aria-label="Pagination"
          >
            <button
              className="px-3 py-1.5 rounded-md border text-sm disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={loading || page <= 1}
            >
              Prev
            </button>
            <div className="text-sm text-slate-600">Page {page}</div>
            <button
              className="px-3 py-1.5 rounded-md border text-sm disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={() => setPage((p) => p + 1)}
              disabled={loading || !hasNext}
            >
              Next
            </button>
          </nav>
        </>
      ) : (
        <div className="rounded-xl border bg-white p-8 text-center shadow-sm">
          <div className="text-slate-500">No requests to show.</div>
        </div>
      )}
    </div>
  );
}
