import React, { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import useSellerRFQs from "../hooks/useSellerRFQs";
import RFQListForSeller from "./RFQListForSeller";

export default function SellerRFQsInline() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [onlyOpen, setOnlyOpen] = useState(true);
  const [hideQuoted, setHideQuoted] = useState(true);

  const { rfqs, loading, error } = useSellerRFQs({
    sellerId: user?.id,
    onlyOpen,
    hideQuoted,
    search,
  });

  const seller = useMemo(
    () => ({ id: user?.id, name: user?.name, company: user?.company }),
    [user]
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Available Requests</h2>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={onlyOpen}
              onChange={(e) => setOnlyOpen(e.target.checked)}
            />
            Show only Open
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={hideQuoted}
              onChange={(e) => setHideQuoted(e.target.checked)}
            />
            Hide already quoted
          </label>
          <span>RFQs: {loading ? "…" : rfqs.length}</span>
        </div>
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search className="h-5 w-5 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search requests..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-base"
          />
        </div>
      </div>

      {error && (
        <div className="text-red-600 text-sm mb-3">
          {String(error?.message || error)}
        </div>
      )}

      {loading ? (
        <div className="text-gray-500">Loading…</div>
      ) : rfqs.length ? (
        <RFQListForSeller rfqs={rfqs} seller={seller} />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
          <div className="text-gray-500">No requests to show.</div>
          {onlyOpen && hideQuoted && (
            <p className="text-sm text-gray-400 mt-2">
              Try unchecking the filters above to see more results.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
