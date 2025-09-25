// src/hooks/useProducts.js

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../services/productsService";

const BLANK = {
  sku: "",
  name: "",
  description: "",
  category: "",
  subCategory: "",
  price: "",
  currency: "USD",
  stock: "",
  status: "active",
};

export default function useProducts(initial = {}) {
  // listing state
  const [items, setItems] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  // filters
  const [q, setQ] = useState(initial.q || "");
  const [status, setStatus] = useState(initial.status || "");

  // form
  const [form, setForm] = useState(BLANK);
  const [editingId, setEditingId] = useState(null);

  // ui
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const totalPages = useMemo(() => Math.max(1, Math.ceil((count || 0) / limit)), [count, limit]);

  const setSearch = useCallback((v) => {
    setQ(v);
    setPage(1);
  }, []);
  const setStatusFilter = useCallback((v) => {
    setStatus(v);
    setPage(1);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { rows, count } = await listProducts({ page, limit, q, status });
      setItems(rows);
      setCount(count);
    } catch (e) {
      setError(e?.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [page, limit, q, status]);

  useEffect(() => {
    load();
  }, [load]);

  const startEdit = useCallback((p) => {
    if (!p) return;
    setEditingId(p.id);
    setForm({
      sku: p.sku || "",
      name: p.name || "",
      description: p.description || "",
      category: p.category || "",
      subCategory: p.subCategory || "",
      price: p.price ?? "",
      currency: p.currency || "USD",
      stock: p.stock ?? "",
      status: p.status || "active",
    });
  }, []);

  const resetForm = useCallback(() => {
    setEditingId(null);
    setForm(BLANK);
  }, []);

  function toNumberOrNull(x) {
    if (x === "" || x === null || x === undefined) return null;
    const n = Number(x);
    return Number.isFinite(n) ? n : null;
  }

  const submit = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const payload = {
        ...form,
        price: toNumberOrNull(form.price),
        stock: toNumberOrNull(form.stock),
      };

      if (editingId) {
        const updated = await updateProduct(editingId, payload);
        setItems((prev) => prev.map((p) => (p.id === editingId ? updated : p)));
        resetForm();
        return true;
      } else {
        const created = await createProduct(payload);
        setItems((prev) => [created, ...prev]);
        setCount((c) => c + 1);
        resetForm();
        return true;
      }
    } catch (e) {
      const msg = e?.message || "";
      if (/duplicate key|unique constraint/i.test(msg)) {
        setError("SKU must be unique. Try another SKU or leave it blank.");
      } else {
        setError(msg || "Failed to save product");
      }
      return false;
    } finally {
      setLoading(false);
    }
  }, [editingId, form, resetForm]);

  const remove = useCallback(async (id) => {
    if (!id) return false;
    setLoading(true);
    setError("");
    try {
      await deleteProduct(id);
      setItems((prev) => prev.filter((p) => p.id !== id));
      setCount((c) => Math.max(0, c - 1));
      return true;
    } catch (e) {
      setError(e?.message || "Failed to delete product");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    // list
    items, count, page, totalPages, limit, loading, error, load,
    // filters
    q, setQ: setSearch, status, setStatus: setStatusFilter, setPage,
    // form
    form, setForm, editingId, startEdit, resetForm,
    // actions
    submit, remove,
  };
}
