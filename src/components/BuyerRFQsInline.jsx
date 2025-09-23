// src/components/BuyerRFQsInline.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import RFQToolbar from "./RFQToolbar";
import RFQCard from "./RFQCard";
import RFQCardSkeleton from "./RFQCardSkeleton";
import { listRFQsForCards } from "../services/rfqService/reads";
import useDebouncedValue from "../hooks/useDebouncedValue";

export default function BuyerRFQsInline() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [dense, setDense] = useState(false);
  const [sort, setSort] = useState("posted_desc");
  const debouncedQuery = useDebouncedValue(query, 180);

  const [rfqs, setRfqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [page, setPage] = useState(1);
  const pageSize = 20;
  const reqIdRef = useRef(0);

  useEffect(() => {
    let alive = true;
    const myReq = ++reqIdRef.current;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await listRFQsForCards({
          page,
          pageSize,
          onlyOpen,
          search: debouncedQuery,
          sort,
          buyerId: user?.id,
        });
        if (!alive || myReq !== reqIdRef.current) return;

        let rows = Array.isArray(res) ? res : res?.data || [];

        // Fallback to ensure "my" RFQs if server doesn't filter
        if (user?.id) {
          const had = !!rows.length && rows.some(
            (r) => r.buyerId === user.id || r.createdBy === user.id || r.ownerId === user.id
          );
          if (!had) {
            rows = rows.filter(
              (r) => r.buyerId === user.id || r.createdBy === user.id || r.ownerId === user.id
            );
          }
        }

        setRfqs(rows);
      } catch (e) {
        if (!alive || myReq !== reqIdRef.current) return;
        setError(e?.message || String(e));
        setRfqs([]);
      } finally {
        if (!alive || myReq !== reqIdRef.current) return;
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [user?.id, page, pageSize, onlyOpen, debouncedQuery, sort]);

  useEffect(() => setPage(1), [onlyOpen, sort, debouncedQuery]);

  const display = useMemo(() => rfqs, [rfqs]);
  const hasNext = rfqs.length === pageSize;

  return (
    <div className="p-4">
      <h2 className="mb-1 text-lg font-semibold">My RFQs</h2>
      <p className="mb-3 text-sm text-slate-600">
        Manage your posted requests.
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
            {display.map((rfq) => (
              <RFQCard
                key={rfq.id || rfq.publicId}
                rfq={rfq}
                role="buyer"
                ctaLabel="View / Manage"
                onPrimary={(r) =>
                  navigate(`/buyer/rfq/${encodeURIComponent(r.id || r.publicId)}`)
                }
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
          <div className="text-slate-500">No RFQs yet.</div>
        </div>
      )}
    </div>
  );
}
