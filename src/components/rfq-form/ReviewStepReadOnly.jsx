// src/components/rfq-form/ReviewStepReadOnly.jsx
import React from "react";
import ReviewStep from "./ReviewStep";
import { normalizeSpecsInput } from "../../utils/rfq/rfqSpecs";

/**
 * Map RFQ card object (from listRFQsForCards) into
 * { items, orderDetails, meta } for ReviewStep.
 */
function mapItemsFromRfq(rfq = {}) {
  const summary = Array.isArray(rfq.itemsSummary) ? rfq.itemsSummary : [];

  if (!summary.length) {
    return [];
  }

  return summary.map((it, idx) => {
    const categoryPath =
      it.categoryPath ||
      it.category_path ||
      rfq.categoryPath ||
      rfq.first_category_path ||
      "—";

    const name =
      it.name ||
      it.title ||
      it.item_name ||
      (typeof it === "string" ? it : "Product");

    const qty =
      typeof it.qty === "number"
        ? it.qty
        : typeof it.quantity === "number"
        ? it.quantity
        : 1;

    // Specs → { label, value }[]
    const specsList = normalizeSpecsInput(it.specifications);
    const specs =
      specsList
        ?.map((spec) => {
          const label = (spec.key_label || spec.key_norm || "").trim();
          const rawVal = (spec.value ?? "").toString().trim();
          const unit = (spec.unit ?? "").toString().trim();
          if (!label || !rawVal) return null;
          const value = unit ? `${rawVal} ${unit}`.trim() : rawVal;
          return { label, value };
        })
        .filter(Boolean) || [];

    return {
      id: it.id ?? idx,
      key: it.id ?? idx,
      name,
      categoryPath,
      quantity: qty,
      specs,
    };
  });
}

function mapMetaFromRfq(rfq = {}) {
  const issuedAtRaw = rfq.postedAt || rfq.posted_time || rfq.created_at;
  const issuedAt = issuedAtRaw ? new Date(issuedAtRaw) : new Date();

  return {
    publicId: rfq.publicId || rfq.public_id || rfq.sellerRfqId || "RFQ-—",
    rfqId: rfq.id,
    issuedAt,
    validDays: rfq.validDays ?? 14,
    // We don’t yet have structured location on RFQ cards, so keep defaults.
    location: rfq.location || {
      city: "—",
      emirate: "—",
      country: "—",
    },
  };
}

function mapOrderDetailsFromRfq(rfq = {}) {
  return {
    // These may or may not exist; ReviewStep has safe fallbacks.
    deliveryTimelineLabel:
      rfq.deliveryTimelineLabel ||
      rfq.deliveryTimeline ||
      rfq.delivery_time ||
      undefined,
    deliveryTermsLabel:
      rfq.deliveryTermsLabel ||
      rfq.incotermsLabel ||
      rfq.deliveryTerms ||
      rfq.incoterms ||
      undefined,
    paymentTermsLabel:
      rfq.paymentTermsLabel || rfq.paymentTerms || undefined,
  };
}

/**
 * ReviewStepReadOnly
 *
 * Usage:
 *   <ReviewStepReadOnly rfq={someRfqCard} />
 *
 * Shows the same layout as ReviewStep, but driven from an RFQ card object.
 */
export default function ReviewStepReadOnly({ rfq }) {
  const items = mapItemsFromRfq(rfq);
  const orderDetails = mapOrderDetailsFromRfq(rfq);
  const meta = mapMetaFromRfq(rfq);

  return (
    <ReviewStep
      items={items}
      orderDetails={orderDetails}
      meta={meta}
      groupByCategory={true}
      showItemControls={false}
      onQuantityChange={null} // keep it visually same but behavior read-only
    />
  );
}