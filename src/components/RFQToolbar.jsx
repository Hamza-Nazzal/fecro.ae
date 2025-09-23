// src/components/RFQToolbar.jsx
import React from "react";
import { Search, Filter } from "lucide-react";

export default function RFQToolbar({
  total = 0,
  query, setQuery,
  onlyOpen, setOnlyOpen,
  sort, setSort,
  dense, setDense,
}) {
  return (
    <section className="mb-3 rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
      {/* Row 1: title + controls summary */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-[15px] font-semibold text-slate-900">RFQs</h2>
        <div className="text-[12px] text-slate-600">{total} result{total === 1 ? "" : "s"}</div>
      </div>

      {/* Row 2: search */}
      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <label className="relative block w-full sm:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title, RFQ ID, category…"
            className="w-full rounded-[12px] border border-slate-300 pl-9 pr-3 py-2 text-[13px] placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </label>

        <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
          <span className="inline-flex items-center gap-1 text-[12px] font-medium text-slate-700">
            <Filter className="h-4 w-4 text-slate-400" /> Filters
          </span>

          <label className="inline-flex items-center gap-2 rounded-[10px] border border-slate-300 px-2 py-1 text-[12px] text-slate-700 hover:bg-slate-50">
            <input
              type="checkbox"
              checked={!!onlyOpen}
              onChange={(e) => setOnlyOpen(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-400"
            />
            Open only
          </label>

          <label className="inline-flex items-center gap-2 rounded-[10px] border border-slate-300 px-2 py-1 text-[12px] text-slate-700 hover:bg-slate-50">
            <input
              type="checkbox"
              checked={!!dense}
              onChange={(e) => setDense(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-400"
            />
            Compact
          </label>

          <label className="inline-flex items-center gap-2 rounded-[10px] border border-slate-300 px-2 py-1 text-[12px] text-slate-700">
            <span>Sort by</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="rounded-[10px] border px-2 py-1 text-[12px] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="posted_desc">Newest first</option>
              <option value="posted_asc">Oldest first</option>
              <option value="deadline_asc">Due date (soonest)</option>
            </select>
          </label>
        </div>
      </div>
    </section>
  );
}
