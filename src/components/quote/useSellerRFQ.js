import { useEffect, useState } from "react";
import { hydrateRFQForSeller } from "../../services/backends/supabase/rfqs/hydrateSeller";
import { listRFQsForCards } from "../../services/rfqService/reads";

export function useSellerRFQ(rfqId, userId) {
  const [rfq, setRfq] = useState(null);
  const [hydrated, setHydrated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hydrating, setHydrating] = useState(false);
  const [error, setError] = useState(null);
  const [hydrateError, setHydrateError] = useState("");

  useEffect(() => {
    if (!rfqId) return;
    let alive = true;
    setLoading(true);
    (async () => {
      try {
        // Fetch card data from view (supports id/public_id/seller_rfq_id)
        const cardRes = await listRFQsForCards({ rfqId, page: 1, pageSize: 1 });
        const cardData = Array.isArray(cardRes) ? cardRes : cardRes?.data;
        const card = Array.isArray(cardData) ? cardData[0] : cardData?.[0];

        if (!card) {
          throw new Error(`RFQ not found: ${rfqId}`);
        }

        const baseItems = Array.isArray(card.itemsSummary)
          ? card.itemsSummary.map((entry, index) => ({
              productName:
                entry?.name ||
                entry?.title ||
                entry?.productName ||
                entry?.item ||
                `Item ${index + 1}`,
              quantity: entry?.qty ?? entry?.quantity ?? null,
              categoryPath: entry?.categoryPath ?? entry?.category_path ?? "",
              specifications:
                (entry?.specifications && typeof entry.specifications === "object"
                  ? entry.specifications
                  : {}) || {},
            }))
          : [];

        if (alive) {
          setRfq({
            ...card,
            items: baseItems,
          });
        }

        const actualRfqId = card.id;

        // Seller hydration (optional) – enrich with full items/specs
        if (userId && actualRfqId) {
          setHydrating(true);
          try {
            const sellerData = await hydrateRFQForSeller(actualRfqId, userId);
            if (alive && sellerData) {
              setHydrated(sellerData);
              setRfq((prev) => ({
                ...(prev || {}),
                id: sellerData.id ?? prev?.id ?? actualRfqId,
                publicId: sellerData.publicId ?? prev?.publicId,
                sellerRfqId: sellerData.sellerRfqId ?? prev?.sellerRfqId,
                title: sellerData.title ?? prev?.title,
                status: sellerData.status ?? prev?.status,
                items: Array.isArray(sellerData.items) && sellerData.items.length
                  ? sellerData.items
                  : prev?.items || [],
                payment: sellerData.orderDetails?.payment ?? prev?.payment,
                incoterms: sellerData.orderDetails?.incoterms ?? prev?.incoterms,
                deliveryTime: sellerData.orderDetails?.deliveryTime ?? prev?.deliveryTime,
                qtyTotal: sellerData.qtyTotal ?? prev?.qtyTotal,
              }));
            }
          } catch (err) {
            if (alive) setHydrateError(err.message || String(err));
          } finally {
            if (alive) setHydrating(false);
          }
        }
      } catch (e) {
        if (alive) {
          setError(e.message || String(e));
          setRfq((prev) => prev ?? { id: rfqId });
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [rfqId, userId]);

  return { rfq, hydrated, loading, hydrating, error, hydrateError };
}