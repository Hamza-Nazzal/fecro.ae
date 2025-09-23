// src/hooks/useRFQ.js
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  listRFQsForCards,
  createRFQ as beCreateRFQ,
  updateRFQ as beUpdateRFQ,
} from "../services/rfqService";

// ---- helpers ---------------------------------------------------------------
const INITIAL_NEW_REQUEST = {
  barcode: "",
  title: "",
  description: "",
  category: "",
  subCategory: "",
  categoryId: null,
  categoryPath: "",
  quantity: "",
  deliveryTime: "today",
  customDate: "",
  orderType: "one-time",
  delivery: null,
  warranty: null,
  installation: null,
};

function toBackendPayload(req, { userId, forUpdate = false } = {}) {
  const p = {
    userId: userId ?? req?.userId ?? null,
    title: req?.title ?? "",
    description: req?.description ?? null,
    categoryId: req?.categoryId ?? null,
    category: req?.category ?? null,
    subCategory: req?.subCategory ?? null,
    quantity: req?.quantity ?? null,
    orderType: req?.orderType ?? null,
    deliveryTime: req?.deliveryTime ?? null,
    customDate: req?.customDate ?? null,
    delivery: req?.delivery ?? null,
    incoterms: req?.incoterms ?? null,
    payment: req?.payment ?? null,
    warranty: req?.warranty ?? null,
    installation: req?.installation ?? null,
  };
  if (forUpdate) delete p.userId;
  return p;
}

// ---- default export: legacy-compatible useRFQ hook -------------------------
export default function useRFQ({ user } = {}) {
  const [buyRequests, setBuyRequests] = useState([]);            // <- always an array
  const [newRequest, setNewRequest] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [quotation, setQuotation] = useState(null);
  const [editingRequestId, setEditingRequestId] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const reqId = useRef(0);
  const inFlight = useRef(false);

  // Load my RFQs after login / on demand
  const refresh = useCallback(async () => {
    if (!user?.id) { setBuyRequests([]); return; }
    
      //prevent overlapping calls (dedupe)
      if (inFlight.current) return;
      inFlight.current = true;
    try {
      setLoading(true);
      setError(null);
      const id = ++reqId.current;

      const { data } = await listRFQsForCards({ buyerId: user.id, page: 1, pageSize: 20 });

    if (id === reqId.current) setBuyRequests(Array.isArray(data) ? data : []);
  } catch (e) {
      console.error("[useRFQ] listMyRFQs error:", e);
      setError(e);
      setBuyRequests([]); // keep array shape
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }, [user?.id]);

 const mountedOnce = useRef(false);     // ADD THIS LINE (near other refs)

useEffect(() => {
  if (mountedOnce.current) return;     // ignore the second StrictMode run
  mountedOnce.current = true;
  refresh();
}, [refresh]);

  // ---- actions expected by the screens ------------------------------------

  // Toggle RFQ status (e.g., active/paused/closed)
  const handleRequestStatusChange = useCallback(async (requestId, nextStatus) => {
    try {
      const updated = await beUpdateRFQ(requestId, { status: nextStatus });
      setBuyRequests((curr) => curr.map((r) => (r.id === requestId ? updated : r)));
      return true;
    } catch (e) {
      console.error("[useRFQ] update status error:", e);
      return false;
    }
  }, []);

  // Begin editing: copy existing RFQ into the form state
  const handleEditRequest = useCallback((requestId) => {
    const found = (buyRequests || []).find((r) => r.id === requestId);
    if (found) {
      setEditingRequestId(requestId);
      setNewRequest({
        ...INITIAL_NEW_REQUEST,
        title: found.title ?? "",
        description: found.description ?? "",
        category: found.category ?? "",
        subCategory: found.subCategory ?? "",
        categoryId: found.categoryId ?? null,
        categoryPath: found.categoryPath ?? "",
        quantity: found.quantity ?? "",
        deliveryTime: found.deliveryTime ?? "today",
        customDate: found.customDate ?? "",
        orderType: found.orderType ?? "one-time",
        delivery: found.delivery ?? null,
        warranty: found.warranty ?? null,
        installation: found.installation ?? null,
      });
    }
  }, [buyRequests]);

  // Submit create/update
  const handleSubmitRequest = useCallback(() => {
    (async () => {
      if (!newRequest) return;
      try {
        let rfq;
        if (editingRequestId) {
          rfq = await beUpdateRFQ(
            editingRequestId,
            toBackendPayload(newRequest, { forUpdate: true })
          );
          setBuyRequests((curr) => curr.map((r) => (r.id === editingRequestId ? rfq : r)));
        } else {
          rfq = await beCreateRFQ({
            ...toBackendPayload(newRequest, { userId: user?.id }),
            userId: user?.id,
          });
          setBuyRequests((curr) => [rfq, ...curr]);
        }
        // reset local editing state
        setEditingRequestId(null);
        setNewRequest(null);
      } catch (e) {
        console.error("[useRFQ] submit error:", e);
      }
    })();
    return true; // keep legacy truthy behavior for callers
  }, [newRequest, editingRequestId, user?.id]);

  // Old flow placeholder: send quotation from the modal (no-op here)
  const handleSendQuotation = useCallback(() => {
    // This app seems to handle quotations elsewhere now; keep a truthy return.
    return true;
  }, []);

  // ---- return legacy shape -------------------------------------------------
  return useMemo(() => ({
    // lists
    buyRequests, setBuyRequests,

    // form/editing state
    newRequest, setNewRequest,
    selectedRequest, setSelectedRequest,
    quotation, setQuotation,
    editingRequestId, setEditingRequestId,

    // actions used by screens
    handleRequestStatusChange,
    handleEditRequest,
    handleSubmitRequest,
    handleSendQuotation,

    // extras (not always used but handy)
    loading,
    error,
    refresh,
  }), [
    buyRequests,
    newRequest, selectedRequest, quotation, editingRequestId,
    handleRequestStatusChange, handleEditRequest, handleSubmitRequest, handleSendQuotation,
    loading, error, refresh,
  ]);
}






/*

// src/hooks/useRFQ.js

// imports first
import { useRFQ as _useRFQ } from "./useRFQ/useRFQSingle";
import { useRFQList, useRFQs as _useRFQs } from "./useRFQ/useRFQList";
import * as rfqActions from "./useRFQ/actions";

// named exports
export { useRFQList, _useRFQs as useRFQs, _useRFQ as useRFQ };
export { rfqActions };

// default export: BACK-COMPAT → list hook returning an ARRAY
export default _useRFQs;

*/