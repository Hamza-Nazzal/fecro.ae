import { useEffect, useState } from "react";
import { SELLER_HYDRATE_ENABLED } from "../../config/flags";
import { hydrateRFQForSeller } from "../../services/backends/supabase/rfqs/hydrateSeller";
import { listRFQsForCards } from "../../services/rfqService/reads";

export function useSellerRFQ(rfqId, userId) {
  const [rfq, setRfq] = useState(null);
  const [hydrated, setHydrated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hydrating, setHydrating] = useState(false);
  const [error, setError] = useState(null);
  const [hydrateError, setHydrateError] = useState("");

  // Base RFQ fetch
  useEffect(() => {
    if (!rfqId) return;
    let alive = true;
    setLoading(true);
    (async () => {
      try {
        const res = await listRFQsForCards({ rfqId, page: 1, pageSize: 1 });
        const data = Array.isArray(res) ? res : res?.data;
        const first = Array.isArray(data) ? data[0] : data?.[0];
        if (alive) setRfq(first || { id: rfqId });
      } catch (e) {
        if (alive) setError(e.message || String(e));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [rfqId]);

  // Hydration
  useEffect(() => {
    if (!SELLER_HYDRATE_ENABLED || !rfq?.id || !userId) return;
    let cancelled = false;
    setHydrating(true);
    (async () => {
      try {
        const result = await hydrateRFQForSeller(rfq.id, userId);
        if (!cancelled) setHydrated(result ?? null);
      } catch (err) {
        if (!cancelled) setHydrateError(err.message || String(err));
      } finally {
        if (!cancelled) setHydrating(false);
      }
    })();
    return () => { cancelled = true; };
  }, [rfq?.id, userId]);

  return { rfq, hydrated, loading, hydrating, error, hydrateError };
}