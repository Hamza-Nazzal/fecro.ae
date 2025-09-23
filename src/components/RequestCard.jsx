// src/components/RequestCard.jsx
import React from "react";
import {
  Eye,
  MessageSquareText,
  CalendarClock,
  Package,
  Edit3,
  Trash2,
} from "lucide-react";

/**
 * Backward-compatible props (same as your current usage):
 * - title, rfqId, qty, unit, categoryPath, category, subCategory, postedAt,
 *   quotations, views, status, onClick, onStatusChange, onEdit, onDelete
 *
 * New OPTIONAL props (no backend changes required):
 * - itemsCount?: number                      // shown as "Items: N"
 * - deadline?: string | Date (ISO ok)        // shows a Due chip, highlights if soon
 * - items?: Array<{ name?: string }>         // used only to infer itemsCount if present
 *
 * Safe inference:
 *   if itemsCount not provided -> falls back to items?.length
 */

function formatDate(d) {
  if (!d) return "—";
  try {
    const dt = typeof d === "string" ? new Date(d) : d;
    return dt.toLocaleDateString();
  } catch {
    return String(d);
  }
}

function daysUntil(dateLike) {
  if (!dateLike) return null;
  const d = new Date(dateLike);
  const now = new Date();
  const diffMs = d.setHours(0, 0, 0, 0) - now.setHours(0, 0, 0, 0);
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

function StatusBadge({ status }) {
  const s = (status || "").toLowerCase();
  const map = {
    open: "bg-green-50 text-green-700 ring-1 ring-green-200",
    draft: "bg-slate-50 text-slate-700 ring-1 ring-slate-200",
    closed: "bg-gray-100 text-gray-700 ring-1 ring-gray-200",
    inactive: "bg-gray-100 text-gray-700 ring-1 ring-gray-200",
    awarded: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
  };
  const cls = map[s] || map.draft;
  return <span className={`rounded-full px-2 py-0.5 text-xs ${cls}`}>{(status || "Draft").toUpperCase()}</span>;
}

function Chip({ icon: Icon, children, tone = "default", title }) {
  const tones = {
    default: "bg-slate-100 text-slate-700",
    warn: "bg-amber-100 text-amber-800",
    danger: "bg-red-100 text-red-700",
  };
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${tones[tone]}`}
    >
      {Icon ? <Icon className="h-3 w-3" /> : null}
      {children}
    </span>
  );
}

export default function RequestCard(props) {
  const {
    title,
    rfqId,
    qty,
    unit,
    categoryPath,
    postedAt,
    quotations,
    views,
    status,
    onClick,
    onStatusChange,
    onEdit,
    onDelete,

    // new optional props
    itemsCount: itemsCountProp,
    deadline,
    items,
  } = props;

  // Safe inference if parent didn't pass itemsCount
  const inferredItemsCount =
    typeof itemsCountProp === "number"
      ? itemsCountProp
      : Array.isArray(items)
      ? items.length
      : undefined;

  // Deadline tone
  const dleft = daysUntil(deadline);
  let dueTone = "default";
  if (dleft != null) {
    if (dleft < 0) dueTone = "danger";
    else if (dleft <= 3) dueTone = "warn";
  }

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 p-6 flex flex-col justify-between border border-slate-200">
      <div>
        {/* Header */}
        <div className="flex justify-between items-start mb-2">
          <h2 className="text-lg font-bold text-gray-800">
            {rfqId ? <span className="text-indigo-600 mr-1">{rfqId}</span> : null}
            {title || "Untitled RFQ"}
          </h2>
          <StatusBadge status={status} />
        </div>

        {/* Meta chips: NEW Items + Deadline (optional) */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {typeof inferredItemsCount === "number" && (
            <Chip icon={Package} title="Number of items">
              Items: {inferredItemsCount}
            </Chip>
          )}

          {deadline && (
            <Chip
              icon={CalendarClock}
              tone={dueTone}
              title={`Due ${formatDate(deadline)}${
                dleft != null ? ` (${dleft} day${Math.abs(dleft) === 1 ? "" : "s"} ${dleft >= 0 ? "left" : "ago"})` : ""
              }`}
            >
              Due {formatDate(deadline)}
            </Chip>
          )}

          {/* Existing quick facts */}
          <Chip icon={Eye} title="Views">
            {Number(views || 0)} views
          </Chip>
          <Chip icon={MessageSquareText} title="Quotations">
            {Number(quotations || 0)} quotes
          </Chip>
        </div>

        {/* Secondary line (kept from your design) */}
        <p className="text-gray-500 text-sm mb-2">
          {categoryPath ? (
            <>
              <span className="font-medium">Category:</span> {categoryPath}
              {qty ? (
                <>
                  {" "}
                  | <span className="font-medium">Quantity:</span> {qty} {unit || ""}
                </>
              ) : null}
            </>
          ) : (
            qty && (
              <>
                <span className="font-medium">Quantity:</span> {qty} {unit || ""}
              </>
            )
          )}
        </p>

        <p className="text-gray-400 text-xs">
          Posted: <span className="text-gray-600 font-medium">{formatDate(postedAt)}</span>
        </p>
      </div>

      {/* Footer actions */}
      <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center gap-3">
          {typeof onStatusChange === "function" && (
            <select
              aria-label="Change request status"
              className="border rounded-md px-2 py-1 text-sm"
              value={
                (status || "").toLowerCase() === "open"
                  ? "Open"
                  : (status || "").toLowerCase() === "closed"
                  ? "Closed"
                  : (status || "").toLowerCase() === "draft"
                  ? "Draft"
                  : "Inactive"
              }
              onChange={(e) => onStatusChange(e.target.value)}
            >
              <option>Open</option>
              <option>Draft</option>
              <option>Closed</option>
              <option>Inactive</option>
            </select>
          )}
        </div>

        <div className="flex items-center gap-2">
          {typeof onEdit === "function" && (
            <button
              onClick={onEdit}
              className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm hover:bg-slate-50"
            >
              <Edit3 className="h-4 w-4" /> Edit
            </button>
          )}
          {typeof onDelete === "function" && (
            <button
              onClick={onDelete}
              className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm hover:bg-red-50 text-red-600 border-red-200"
            >
              <Trash2 className="h-4 w-4" /> Delete
            </button>
          )}
          <button
            onClick={onClick}
            className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-md shadow-sm hover:bg-blue-700 transition-colors duration-200"
          >
            View & Manage
          </button>
        </div>
      </div>
    </div>
  );
}
