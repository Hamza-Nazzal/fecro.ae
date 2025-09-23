//src/containers/SavedProductsContainer.jsx

/*
1	Container that connects the products hook to SavedProductsTab.
	2	Handles navigation to the Products page and passes query/status/edit/delete handlers. 
  Orchestrates, no business logic.

*/

//src/containers/SavedProductsContainer.jsx



import React, { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import useProducts from "../hooks/useProducts";
import SavedProductsTab from "../components/SavedProductsTab";

export default function SavedProductsContainer({ mode = "buy" }) {
  const navigate = useNavigate();
  const {
    items, loading, error,
    q, setQ, status, setStatus,
    startEdit, remove,
  } = useProducts();

  const onAddClick = useCallback(() => {
    navigate("/products"); // go to full products page
  }, [navigate]);

  const onEditClick = useCallback((p) => {
    navigate(`/products?edit=${encodeURIComponent(p.id)}`);
    startEdit(p);
  }, [navigate, startEdit]);

  const onDeleteClick = useCallback((id) => {
    remove(id);
  }, [remove]);

  return (
    <SavedProductsTab
      mode={mode}
      items={items}
      loading={loading}
      error={error}
      q={q}
      status={status}
      onChangeQuery={setQ}
      onChangeStatus={setStatus}
      onAddClick={onAddClick}
      onEditClick={onEditClick}
      onDeleteClick={onDeleteClick}
    />
  );
}
