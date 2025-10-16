// src/components/RFQListForSeller.jsx

// src/components/RFQListForSeller.jsx

import React, { useMemo, useState } from "react";
import RequestCard from "./RequestCard";
import QuotationForm from "./QuotationForm";
const categoryPath = (r) => r?.categoryPath || r?.categories?.path_text || r?.category || "—";



export default function RFQListForSeller({ rfqs, seller }) {
  const [selected, setSelected] = useState(null);

  const list = useMemo(
    () =>
      [...rfqs].sort(
        (a, b) =>
          new Date(b.postedTime || 0) -
          new Date(a.postedTime || 0)
      ),
    [rfqs]
  );

  return (
    <>
      <div className="space-y-4">
        {list.map((r) => (
          <RequestCard
            key={r.id}
            title={r.title || ""}
            rfqId={r.sellerRfqId || "—"}
            qty={parseInt(r.quantity) || undefined}
            unit=""
            categoryPath={categoryPath(r)}
            category={r.category || "—"}        // keep as fallback
            subCategory={r.subCategory || r.sub_category}
            postedAt={r.postedTime}
            quotations={r.quotations || 0}
            views={r.views || 0}
            status={
              String(r.status).toLowerCase() === "active"
                ? "Open"
                : String(r.status).toLowerCase() === "paused"
                ? "Draft"
                : String(r.status).toLowerCase() === "closed"
                ? "Closed"
                : "Inactive"
            }
            onClick={() => setSelected(r)}
            ctaLabel="Send Quote"
          />
        ))}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <QuotationForm
            rfq={selected}
            seller={seller}
            onClose={() => setSelected(null)}
            onSubmitted={() => setSelected(null)}
          />
        </div>
      )}
    </>
  );
}
