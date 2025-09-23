// src/hooks/useSellerRFQs.js
//import { useMemo, useState } from "react";
//import { useOnceEffect } from "./useOnceEffect";
import { useMemo, useState, useEffect } from "react";
import { listRFQs } from "../services/rfqService";
import { listQuotations } from "../services/quotationsService";

// Helper function for more robust error checking
const isQuotationsTableMissing = (error) => {
  const msg = String(error?.message || error).toLowerCase();
  return (
    msg.includes("quotations") &&
    (msg.includes("does not exist") || msg.includes("could not find the table"))
  );
};

export default function useSellerRFQs({
  sellerId,
  onlyOpen = true,
  hideQuoted = true,
  search = "",
} = {}) {
  const [rfqs, setRfqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // StrictMode-safe loader (prevents duplicate calls in dev)
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        // Fetch RFQs (sellers see all RFQs created by buyers, not filtered by sellerId)
        const all = await listRFQs({ onlyOpen });
        if (!alive) return;
        //console.log("[seller] all:", all.length, all.map(r => r.status));
        // temp test

        const pool = onlyOpen
          ? all.filter((r) => String(r.status || "").toLowerCase() === "active")
          : all;
          //console.log("[seller] pool (onlyOpen):", pool.length);
          //temp test

        // Optionally fetch my quotations (only when needed)
        let mine = [];
        if (hideQuoted && sellerId) {
          try {
            mine = await listQuotations({ seller_id: sellerId });
          } catch (e) {
            if (isQuotationsTableMissing(e)) {
              console.warn(
                "[useSellerRFQs] quotations table missing; showing RFQs without hideQuoted filter"
              );
              if (alive) {
                setRfqs(pool);
                setLoading(false);
              }
              return;
            }
            throw e;
          }
//console.log("[seller] my quotations:", mine.length);
 //temp test

        }

        if (!alive) return;

        // quotationsService returns JS-shaped rows → use rfqId (camelCase)
        const quotedSet = new Set(mine.map((q) => q.rfqId));
        const visible = hideQuoted ? pool.filter((r) => !quotedSet.has(r.id)) : pool;
//console.log("[seller] visible (final):", visible.length);
// temp test

        setRfqs(visible);
      } catch (e) {
        console.error("[useSellerRFQs] Error fetching data:", e);
        if (alive) setError(e?.message || e);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [sellerId, onlyOpen, hideQuoted]); // 'search' handled below; no need to refetch on change

  // Client-side search
  const searched = useMemo(() => {
    if (!search) return rfqs;
    const s = search.toLowerCase();
    return rfqs.filter((r) =>
      [
        r.publicId,
        r.title,
        r.company,
        r.description,
        r.category,
        r.subCategory || r.sub_category, // tolerate either shape
        r.quantity,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(s)
    );
  }, [rfqs, search]);

  return { rfqs: searched, loading, error };
}
