// src/components/rfq-form/ReviewItemsList.jsx
import React from "react";
import { Edit, Minus, Plus } from "lucide-react";
import { getItemName, toSpecList } from "../../utils/rfq/itemHelpers";

/**
 * ReviewItemsList - Displays the list of requested items in an RFQ
 * Supports grouping by category and inline quantity/edit controls
 */
export default function ReviewItemsList({
  items = [],
  groupByCategory = false,
  onEditItem = null,
  onUpdateQuantity = null,
}) {
  // Grouping logic: either group by category or show all items together
  const groups = React.useMemo(() => {
    if (!groupByCategory) return [["All Items", items]];
    const map = new Map();
    for (const it of items) {
      const key = it?.categoryPath || it?.category_path || "—";
      const arr = map.get(key) || [];
      arr.push(it);
      map.set(key, arr);
    }
    return Array.from(map.entries());
  }, [items, groupByCategory]);

  return (
    <div className="mb-10">
      <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide mb-6">
        2. Requested Items
      </h2>

      <div className="space-y-6">
        {(() => {
          let itemCounter = 0;
          return groups.map(([groupName, groupItems]) => (
            <div key={groupName}>
              {groupByCategory && (
                <div className="bg-gray-50 border-l-4 border-t-4 border-blue-600 px-4 py-3 mb-4">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                    {groupName}
                  </h3>
                </div>
              )}

              <div className="space-y-4">
                {groupItems.map((it, idx) => {
                  itemCounter += 1;
                  const specs = toSpecList(it?.specifications || it?.specs || it?.rfq_item_specs);

                  return (
                    <div
                      key={it?.id || `${getItemName(it)}-${idx}`}
                      className="border-l-2 border-blue-500 pl-3"
                    >
                      {/* Item Header */}
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xs font-bold text-gray-500 uppercase">
                          Item #{itemCounter}
                        </span>
                        <h4 className="text-base font-bold text-gray-900">
                          {getItemName(it)}
                        </h4>
                        <div className="flex items-center gap-2">
                          {onUpdateQuantity ? (
                            <div className="inline-flex items-center bg-green-100 text-green-700 rounded-full px-2 py-1">
                              {onUpdateQuantity && (
                                <button
                                  onClick={() => onUpdateQuantity(it.id, -1)}
                                  disabled={Number(it?.quantity ?? 0) <= 1}
                                  className={`px-1 transition-colors ${
                                    Number(it?.quantity ?? 0) <= 1 
                                      ? 'opacity-50 cursor-not-allowed' 
                                      : 'hover:bg-green-200'
                                  }`}
                                  title={Number(it?.quantity ?? 0) <= 1 ? "Minimum quantity is 1" : "Decrease quantity"}
                                >
                                  <Minus className="h-3 w-3" />
                                </button>
                              )}
                              <span className="text-xs font-medium px-1">
                                Qty: {Number(it?.quantity ?? 0).toFixed(2).replace(/\.?0+$/, '')}
                              </span>
                              {onUpdateQuantity && (
                                <button
                                  onClick={() => onUpdateQuantity(it.id, 1)}
                                  className="px-1 hover:bg-green-200 transition-colors"
                                  title="Increase quantity"
                                >
                                  <Plus className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          ) : (
                            <span className="inline-block bg-green-100 text-green-700 rounded-full px-3 py-0.5 text-xs font-medium">
                              Qty: {Number(it?.quantity ?? 0).toFixed(2).replace(/\.?0+$/, '')}
                            </span>
                          )}
                          {onEditItem && (
                            <button
                              onClick={() => onEditItem(it.id)}
                              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg border border-blue-300 transition-colors"
                              title="Edit this item"
                            >
                              <Edit className="h-4 w-4" />
                              <span>Edit</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Specs as pills */}
                      <div className="mt-2">
                        {specs.length ? (
                          <div>
                            <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                              Product Details
                            </div>
                            <div className="flex flex-wrap gap-2" role="list">
                              {specs.map((s, i) => (
                                <span
                                  key={`${it?.id || idx}-spec-${i}`}
                                  role="listitem"
                                  className="bg-blue-600 text-white rounded-full px-3 py-1 text-xs font-medium"
                                  aria-label={`${s.label}: ${s.display}`}
                                >
                                  <span className="font-semibold">{s.label}:</span>
                                  <span className="ml-1 font-normal">{s.display}</span>
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500 italic">
                            No product details provided
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ));
        })()}
      </div>
    </div>
  );
}

