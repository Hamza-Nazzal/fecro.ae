// src/components/RFQCard.jsx
import React, { useMemo, useState } from "react";
import {
  Hash, Eye, MessageSquareText, Tag, Package,
  EllipsisVertical, ChevronRight, ChevronDown,
} from "lucide-react";

function cx(...a) { return a.filter(Boolean).join(" "); }

const BADGE = {
  active: "bg-green-50 text-green-700 ring-1 ring-green-200",
  open:   "bg-green-50 text-green-700 ring-1 ring-green-200",
  closed: "bg-slate-50 text-slate-700 ring-1 ring-slate-200",
  draft:  "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  paused: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  inactive:"bg-slate-50 text-slate-700 ring-1 ring-slate-200",
};

function Chip({ icon: Icon, children, title }) {
  return (
    <span
      title={title}
      className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] leading-5 text-slate-700"
    >
      {Icon ? <Icon className="h-[14px] w-[14px] text-slate-500" aria-hidden="true" /> : null}
      {children}
    </span>
  );
}

function ItemRow({ item }) {
  return (
    <div className="grid grid-cols-12 items-center gap-3 rounded-lg border border-slate-100 bg-white px-2.5 py-2">
      <div className="col-span-5 truncate text-[13px] font-medium text-slate-900">
        {item.name}
      </div>
      <div className="col-span-2 text-[13px] text-slate-700">
        <span className="font-semibold">{item.quantity}</span>
        <span className="ml-1 text-slate-500">{item.unit}</span>
      </div>
      <div className="col-span-4 truncate text-[13px] text-slate-600">
        {item.categoryPath || "—"}
      </div>
      <div className="col-span-1 text-right text-[12px] text-slate-500">
        {item.attrsCount ?? 0}
      </div>
    </div>
  );
}
// near other derived fields
const quotationsCount = rfq?.quotationsCount ?? (Array.isArray(rfq?.quotations) ? rfq.quotations.length : 0);
const preview = Array.isArray(rfq?.itemsPreview) ? rfq.itemsPreview
              : Array.isArray(rfq?.items) ? rfq.items.slice(0, 3).map(it => ({
                  id: it.id ?? null,
                  name: it.name ?? it.title ?? "",
                  qty: it.qty ?? it.quantity ?? null,
                  unit: it.unit ?? null,
                }))
              : [];

const totalItems = Array.isArray(rfq?.items) ? rfq.items.length
                  : Array.isArray(rfq?.itemsPreview) ? rfq.itemsPreview.length
                  : preview.length;

const extraCount = Math.max(0, totalItems - preview.length);


/**
 * Works with your current view:
 * title, sellerIdDisplay, postedAt, status, qtyTotal, categoryPath (first_category_path)
 * Optional: items[], views, quotationsCount, deadline
 */
export default function RFQCard({
  rfq,
  role = "seller",
  ctaLabel,
  onPrimary,
  onSendQuote,
  showCTA = true,
}) {
  const [expanded, setExpanded] = useState(false);
  const primaryHandler = onPrimary || onSendQuote;
  const buttonLabel = ctaLabel || (role === "buyer" ? "View / Manage" : "Send Quote");

  const statusKey = String(rfq?.status || "active").toLowerCase();
  const sellerIdDisplay = rfq?.sellerIdDisplay || null;

  const categoryLabel = useMemo(() => {
    const raw = rfq?.categoryPath || "";
    const parts = raw.split(">").map((s) => s.trim()).filter(Boolean);
    return parts.at(-1) || raw || "—";
  }, [rfq?.categoryPath]);

  const hasItems = Array.isArray(rfq?.items) && rfq.items.length > 0;
  const preview = hasItems ? rfq.items.slice(0, 2) : [];
  const rest = hasItems ? rfq.items.slice(2) : [];

  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-[18px] font-semibold text-slate-900">
              {rfq?.title || "Untitled RFQ"}
            </h3>
            <span
              className={cx(
                "rounded-full px-2 py-0.5 text-[11px] uppercase tracking-wide",
                BADGE[statusKey] || BADGE.active
              )}
            >
              {(rfq?.status || "ACTIVE").toString()}
            </span>
          </div>

          {/* Meta chips (match look even if values are 0/—) */}
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px] text-slate-600">
              {sellerIdDisplay ? (
                <Chip icon={Hash} title="RFQ ID">{sellerIdDisplay}</Chip>
              ) : null}
              <Chip icon={Eye} title="Views">{rfq?.views ?? 0} views</Chip>
              <Chip icon={MessageSquareText} title="Quotations">
               {quotationsCount} {quotationsCount === 1 ? "quote" : "quotes"}
              </Chip>
            </div>
        </div>
              {/* Items preview row */}
              {preview.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2 text-[12px] text-slate-700">
                  {preview.map((it, idx) => (
                    <span key={it.id ?? idx} className="rounded bg-slate-100 px-2 py-1">
                      {it.name}{it.qty ? ` × ${it.qty}${it.unit ? ` ${it.unit}` : ""}` : ""}
                    </span>
                  ))}
                  {extraCount > 0 && (
                    <span className="rounded bg-slate-100 px-2 py-1" title={`${extraCount} more item(s)`}>
                      +{extraCount}
                    </span>
                  )}
                </div>
              )}

        <div className="flex items-center gap-2">
          {showCTA && (
            <button
              onClick={() => primaryHandler?.(rfq)}
              className="rounded-[14px] bg-blue-600 px-3.5 py-2 text-[13px] font-semibold text-white shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
              disabled={!primaryHandler}
            >
              {buttonLabel}
            </button>
          )}
          <button
            type="button"
            aria-label="More actions"
            className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100"
          >
            <EllipsisVertical className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Items section */}
      <div className="mt-3 rounded-2xl bg-slate-50 p-2.5 sm:p-3">
        <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          Item
        </div>

        {hasItems ? (
          <>
            <div className="grid grid-cols-12 items-center gap-3 px-1 text-[11px] uppercase tracking-wide text-slate-500">
              <div className="col-span-5">Item</div>
              <div className="col-span-2">Qty</div>
              <div className="col-span-4">Category</div>
              <div className="col-span-1 text-right">Specs</div>
            </div>

            <div className="mt-1 space-y-2">
              {preview.map((it, i) => <ItemRow key={i} item={it} />)}
              {rest.length > 0 && !expanded && (
                <button
                  onClick={() => setExpanded(true)}
                  className="inline-flex items-center gap-1 text-[13px] font-medium text-blue-700 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <ChevronRight className="h-4 w-4" /> Show {rest.length} more item{rest.length > 1 ? "s" : ""}
                </button>
              )}
              {expanded && (
                <>
                  {rest.map((it, i) => <ItemRow key={`rest-${i}`} item={it} />)}
                  <button
                    onClick={() => setExpanded(false)}
                    className="inline-flex items-center gap-1 text-[13px] font-medium text-blue-700 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <ChevronDown className="h-4 w-4" /> Hide items
                  </button>
                </>
              )}
            </div>
          </>
        ) : (
          // Fallback when your view has no items: still styled like the spec
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-slate-500" />
              <span className="text-[13px] text-slate-700">
                <span className="font-semibold">{rfq?.qtyTotal ?? 0}</span> total units requested
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-slate-500" />
              <span className="truncate text-[13px] text-slate-700">
                Category: <span className="font-semibold">{categoryLabel}</span>
              </span>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
