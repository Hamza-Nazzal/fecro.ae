import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import useProducts from "../hooks/useProducts";

const categoryPath = (p) => p?.categoryPath || p?.categories?.path_text || p?.category || "—";

function Input({ label, ...props }) {
  return (
    <label className="block text-sm mb-2">
      <span className="block mb-1 text-gray-700">{label}</span>
      <input className="border rounded px-3 py-2 w-full" {...props} />
    </label>
  );
}

export default function Products() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const editIdParam = params.get("edit") || "";

  const {
    // data
    items, count, page, totalPages, loading, error,
    // filters
    q, setQ, status, setStatus, setPage,
    // form
    form, setForm, editingId, startEdit, resetForm,
    // actions
    submit, remove, load,
  } = useProducts();

  useEffect(() => {
    if (!editIdParam) return;
    if (!items || items.length === 0) return;
    const found = items.find((p) => p.id === editIdParam);
    if (found) {
      startEdit(found);
      const clean = new URLSearchParams(location.search);
      clean.delete("edit");
      navigate({ pathname: location.pathname, search: clean.toString() }, { replace: true });
    }
  }, [editIdParam, items, startEdit, navigate, location.pathname, location.search]);

  const onDelete = async (id) => {
    if (!id) return;
    if (window.confirm("Delete this product?")) {
      try {
        await remove(id);
      } catch (err) {
        console.error('Failed to delete product:', err);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) return;
    
    try {
      await submit();
    } catch (err) {
      console.error('Failed to submit product:', err);
    }
  };

  const handleNewProduct = () => {
    resetForm();
  };

  const handleEdit = (product) => {
    startEdit(product);
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Products</h1>

      <div className="flex flex-wrap gap-3 items-end">
        <label className="text-sm">
          <div className="mb-1">Search</div>
          <input
            value={q || ''}
            onChange={(e) => setQ(e.target.value)}
            placeholder="name or SKU"
            className="border rounded px-3 py-2"
          />
        </label>

        <label className="text-sm">
          <div className="mb-1">Status</div>
          <select
            value={status || ''}
            onChange={(e) => setStatus(e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </label>

        <button
          type="button"
          className="ml-auto border rounded px-4 py-2 hover:bg-gray-50 transition-colors"
          onClick={handleNewProduct}
          title="Clear the form to add a new product"
        >
          New Product
        </button>
      </div>

      <div className="overflow-auto border rounded">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              {["SKU","Name","Category","Price","Stock","Status","Actions"].map(h => (
                <th key={h} className="text-left px-3 py-2 font-semibold border-b">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items && items.map((p) => (
              <tr key={p.id} className="border-b hover:bg-gray-50">
                <td className="px-3 py-2 font-mono">{p.sku || "-"}</td>
                <td className="px-3 py-2">{p.name}</td>
                <td className="px-3 py-2">{categoryPath(p)}</td>
                <td className="px-3 py-2">{p.price != null ? `${p.price} ${p.currency || ""}` : "-"}</td>
                <td className="px-3 py-2">{p.stock ?? "-"}</td>
                <td className="px-3 py-2">{p.status}</td>
                <td className="px-3 py-2 space-x-2">
                  <button 
                    type="button"
                    className="border rounded px-2 py-1 hover:bg-blue-50 transition-colors"
                    onClick={() => handleEdit(p)}
                    disabled={loading}
                  >
                    Edit
                  </button>
                  <button 
                    type="button"
                    className="border rounded px-2 py-1 hover:bg-red-50 transition-colors"
                    onClick={() => onDelete(p.id)}
                    disabled={loading}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {(!items || items.length === 0) && (
              <tr><td className="px-3 py-6 text-gray-500" colSpan={7}>No products</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          className="border rounded px-3 py-1 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
          disabled={page <= 1 || loading}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          Prev
        </button>
        <div>Page {page} / {totalPages}</div>
        <button
          type="button"
          className="border rounded px-3 py-1 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
          disabled={page >= totalPages || loading}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
        >
          Next
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-4 border rounded p-4">
        <h2 className="md:col-span-2 text-lg font-semibold">
          {editingId ? "Edit Product" : "New Product"}
        </h2>

        <Input 
          label="SKU" 
          value={form.sku || ''} 
          onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))} 
        />
        <Input 
          label="Name *" 
          value={form.name || ''} 
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} 
          required
        />
        <Input 
          label="Category" 
          value={form.category || ''} 
          onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} 
        />
        <Input 
          label="Sub-Category" 
          value={form.subCategory || ''} 
          onChange={(e) => setForm((f) => ({ ...f, subCategory: e.target.value }))} 
        />
        <Input 
          label="Price" 
          type="number" 
          step="0.01" 
          value={form.price || ''} 
          onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} 
        />
        <Input 
          label="Currency" 
          value={form.currency || ''} 
          onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))} 
        />
        <Input 
          label="Stock" 
          type="number" 
          value={form.stock || ''} 
          onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))} 
        />

        <label className="text-sm">
          <div className="mb-1">Status</div>
          <select
            className="border rounded px-3 py-2 w-full"
            value={form.status || 'active'}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
          >
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </label>

        <label className="md:col-span-2 text-sm">
          <div className="mb-1">Description</div>
          <textarea
            className="border rounded px-3 py-2 w-full"
            rows={3}
            value={form.description || ''}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
        </label>

        <div className="md:col-span-2 flex gap-2">
          <button 
            type="button"
            className="border rounded px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-50 transition-colors"
            onClick={handleSubmit} 
            disabled={loading || !form.name}
          >
            {editingId ? "Save Changes" : "Add Product"}
          </button>
          <button 
            type="button"
            className="border rounded px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            onClick={resetForm} 
            disabled={loading}
          >
            Clear
          </button>
          {error && <div className="text-red-600 ml-auto">{error}</div>}
        </div>
      </div>

      {loading && <div className="text-gray-500">Loading…</div>}
    </div>
  );
}