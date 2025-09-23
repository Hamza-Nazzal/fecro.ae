// src/components/RFQCardSkeleton.jsx
import React from "react";

export default function RFQCardSkeleton({ dense = false }) {
  return (
    <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="h-4 w-48 rounded bg-slate-200" />
        <div className="h-4 w-16 rounded bg-slate-200" />
      </div>

      <div className="mt-3 space-y-2">
        <div className="h-3 w-3/4 rounded bg-slate-200" />
        <div className="h-3 w-2/3 rounded bg-slate-200" />
      </div>

      <div className="mt-4 grid gap-2">
        <div className="h-8 rounded bg-slate-200" />
        {!dense && <div className="h-8 rounded bg-slate-200" />}
      </div>
    </div>
  );
}
