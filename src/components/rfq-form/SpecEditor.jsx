import React, { useMemo, useState } from "react"
import { Plus, Trash2 } from "lucide-react"
import {
  normalizeKey,
  splitValueUnit,
  joinValueUnit,
  keyUsuallyHasUnit,
  COMMON_UNITS,
  formatKey,
} from "../../utils/rfqSpecs"

/**
 * Props:
 *  - specs: Record<string,string>
 *  - onChange: (nextSpecs: Record<string,string>) => void
 *
 * Keeps UI ergonomic:
 *  - For keys that typically have a unit, shows (number + unit) inputs
 *  - For others, shows a single text input
 *  - Prevents dup keys (case-insensitive via normalizeKey)
 *  - Stores back to a plain object (value OR "value unit")
 */
export default function SpecEditor({ specs = {}, onChange }) {
  const [newKey, setNewKey] = useState("")
  const [newVal, setNewVal] = useState("")
  const [newUnit, setNewUnit] = useState("")

  const normalizedSet = useMemo(() => {
    const s = new Set()
    Object.keys(specs || {}).forEach((k) => s.add(normalizeKey(k)))
    return s
  }, [specs])

  function setSpec(label, composite) {
    const next = { ...(specs || {}) }
    if (!composite || !String(composite).trim()) {
      delete next[label]
    } else {
      next[label] = composite
    }
    onChange?.(next)
  }

  function handleAdd(e) {
    e?.preventDefault?.()
    const label = newKey.trim()
    const value = newVal.trim()
    const nkey = normalizeKey(label)
    if (!label || !value) return
    if (normalizedSet.has(nkey)) return
    const composite = joinValueUnit(value, newUnit.trim() || null)
    onChange?.({ ...(specs || {}), [label]: composite })
    setNewKey("")
    setNewVal("")
    setNewUnit("")
  }

  function removeKey(label) {
    const next = { ...(specs || {}) }
    delete next[label]
    onChange?.(next)
  }

  const entries = Object.entries(specs || {})

  return (
    <div className="space-y-4">
      {/* Existing specs */}
      {entries.length > 0 ? (
        <div className="space-y-3">
          {entries.map(([label, composite]) => {
            const keyNorm = normalizeKey(label)
            const { value, unit } = splitValueUnit(composite)
            const showUnit = keyUsuallyHasUnit(keyNorm)
            const unitOptions = COMMON_UNITS[keyNorm] || []

            return (
              <div
                key={label}
                className="grid grid-cols-12 gap-2 items-center rounded-xl border p-3"
              >
                <div className="col-span-3">
                  <div className="text-xs text-gray-500 mb-1">Attribute</div>
                  <div className="font-medium truncate" title={label}>
                    {label || formatKey(keyNorm)}
                  </div>
                </div>

                <div className="col-span-7">
                  <div className="text-xs text-gray-500 mb-1">Value</div>

                  {showUnit ? (
                    <div className="flex gap-2">
                      <input
                        type="number"
                        inputMode="decimal"
                        className="w-full rounded-lg border px-3 py-2 outline-none focus:ring"
                        value={value || ""}
                        onChange={(e) =>
                          setSpec(label, joinValueUnit(e.target.value, unit || null))
                        }
                        placeholder="e.g. 180"
                      />
                      <select
                        className="min-w-[96px] rounded-lg border px-3 py-2 outline-none focus:ring"
                        value={unit || ""}
                        onChange={(e) =>
                          setSpec(label, joinValueUnit(value || "", e.target.value || null))
                        }
                      >
                        <option value="">(unit)</option>
                        {unitOptions.map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                        {/* Allow custom units even if not in COMMON_UNITS */}
                        {unit && !unitOptions.includes(unit) && (
                          <option value={unit}>{unit}</option>
                        )}
                      </select>
                    </div>
                  ) : (
                    <input
                      type="text"
                      className="w-full rounded-lg border px-3 py-2 outline-none focus:ring"
                      value={value || ""}
                      onChange={(e) => setSpec(label, joinValueUnit(e.target.value, null))}
                      placeholder="e.g. Blue"
                    />
                  )}
                </div>

                <div className="col-span-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeKey(label)}
                    className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-red-600 hover:bg-red-50"
                    aria-label={`Remove ${label}`}
                  >
                    <Trash2 size={16} />
                    Remove
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-sm text-gray-500">No specifications yet.</div>
      )}

      {/* Add new spec */}
      <form
        onSubmit={handleAdd}
        className="grid grid-cols-12 gap-2 items-end rounded-xl border p-3"
      >
        <div className="col-span-4">
          <label className="text-xs text-gray-500 mb-1 block">New attribute</label>
          <input
            type="text"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            placeholder="e.g. Height"
            className="w-full rounded-lg border px-3 py-2 outline-none focus:ring"
          />
          {/* Dedup hint */}
          {newKey && normalizedSet.has(normalizeKey(newKey)) && (
            <div className="mt-1 text-xs text-red-600">
              An attribute with this name already exists.
            </div>
          )}
        </div>

        {/* Decide between unit vs. plain text for the *new* key */}
        {keyUsuallyHasUnit(normalizeKey(newKey)) ? (
          <>
            <div className="col-span-4">
              <label className="text-xs text-gray-500 mb-1 block">Value</label>
              <input
                type="number"
                inputMode="decimal"
                value={newVal}
                onChange={(e) => setNewVal(e.target.value)}
                placeholder="e.g. 180"
                className="w-full rounded-lg border px-3 py-2 outline-none focus:ring"
              />
            </div>
            <div className="col-span-3">
              <label className="text-xs text-gray-500 mb-1 block">Unit</label>
              <select
                value={newUnit}
                onChange={(e) => setNewUnit(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 outline-none focus:ring"
              >
                <option value="">(unit)</option>
                {(COMMON_UNITS[normalizeKey(newKey)] || []).map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </>
        ) : (
          <div className="col-span-7">
            <label className="text-xs text-gray-500 mb-1 block">Value</label>
            <input
              type="text"
              value={newVal}
              onChange={(e) => setNewVal(e.target.value)}
              placeholder="e.g. Blue"
              className="w-full rounded-lg border px-3 py-2 outline-none focus:ring"
            />
          </div>
        )}

        <div className="col-span-1 flex justify-end">
          <button
            type="submit"
            disabled={
              !newKey.trim() ||
              !newVal.trim() ||
              normalizedSet.has(normalizeKey(newKey))
            }
            className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
            title="Add specification"
          >
            <Plus size={16} />
            Add
          </button>
        </div>
      </form>
    </div>
  )
}
