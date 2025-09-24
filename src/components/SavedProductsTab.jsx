// src/components/SavedProductsTab.jsx
//src/components/SavedProductsTab.jsx
/*
1	UI list for saved products with search, status filter, and add/edit/delete.
	2	Gets items + callbacks from a container; shows loading/error/empty states. 
    Tailwind layout with simple controls.
*/

import React from "react";
import { Package, Plus, Search, X } from "lucide-react";

const categoryPath = (p) => p?.categoryPath || p?.categories?.path_text || p?.category || "";




export default function SavedProductsTab({
  mode = "buy",
  items = [],
  loading = false,
  error = "",
  q = "",
  status = "",
  onChangeQuery,
  onChangeStatus,
  onAddClick,
  onEditClick,
  onDeleteClick,
}) {
  
//debug 1
  console.log('SavedProductsTab props:', { 
    onAddClick: typeof onAddClick, 
    onEditClick: typeof onEditClick, 
    onDeleteClick: typeof onDeleteClick,
    items: items.length,
    mode 
  });


  const isEmpty = !loading && items.length === 0;

  if (isEmpty) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
        <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">
          {mode === "buy" ? "No saved products yet" : "No product templates yet"}
        </h3>
        <p className="text-gray-600 mb-4">
          {mode === "buy"
            ? "Save products you frequently need to make requesting faster."
            : "Save product templates you can supply for quick quoting."}
        </p>
        <button
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 inline-flex items-center"
          onClick={onAddClick}
        >
          <Plus className="h-4 w-4 mr-2" />
          {mode === "buy" ? "Add Your First Product" : "Add Your First Template"}
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Top bar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <h2 className="text-xl font-bold flex-1">
          {mode === "buy" ? "My Saved Products" : "My Product Templates"}
        </h2>
        <input
          className="border rounded px-3 py-2 text-sm"
          placeholder="Search name or SKU"
          value={q}
          onChange={(e) => onChangeQuery?.(e.target.value)}
        />
        <select
          className="border rounded px-3 py-2 text-sm"
          value={status}
          onChange={(e) => onChangeStatus?.(e.target.value)}
        >
          <option value="">All</option>
          <option value="active">Active</option>
          <option value="archived">Archived</option>
        </select>
        <button
          className="bg-blue-600 text-white px-3 py-2 rounded-lg font-medium hover:bg-blue-700 inline-flex items-center text-sm"
          onClick={onAddClick}
        >
          <Plus className="h-4 w-4 mr-1" /> Add Product
        </button>
      </div>

      {/* List */}
      <div className="space-y-4">
        {items.map((p) => (
          <div key={p.id} className="bg-white rounded-xl shadow-sm border p-4">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-1">{p.name}</h3>
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  {categoryPath(p) && (
                   <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                      {categoryPath(p)}
                      </span>
                     )}
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      p.status === "active"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {p.status === "active" ? "Active" : "Archived"}
                  </span>
                  {p.sku && (
                    <span className="px-2 py-1 bg-gray-50 rounded text-xs font-mono">
                      {p.sku}
                    </span>
                  )}
                </div>
                {p.description && (
                  <p className="text-gray-600 text-sm">{p.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2 ml-4">
                <button
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                  title="View / edit"
                  onClick={() => onEditClick?.(p)}
                >
                  <Search className="h-4 w-4" />
                </button>
                <button
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  title="Delete"
                  onClick={() => onDeleteClick?.(p.id)}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Quick actions */}
            <div className="flex gap-2 pt-3 border-t border-gray-100">
              {mode === "buy" ? (
                <>
                  <button className="flex-1 py-2 px-3 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 text-sm font-medium">
                    Create Request
                  </button>
                  <button className="flex-1 py-2 px-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium">
                    Edit Template
                  </button>
                </>
              ) : (
                <>
                  <button className="flex-1 py-2 px-3 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 text-sm font-medium">
                    Quick Quote
                  </button>
                  <button className="flex-1 py-2 px-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium">
                    Edit Template
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {loading && <div className="text-gray-500 mt-4">Loading…</div>}
      {error && <div className="text-red-600 mt-2">{error}</div>}
    </div>
  );
}
