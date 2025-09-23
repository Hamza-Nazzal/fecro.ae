// src/hooks/useRFQ/useRFQSingle.js
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useSafeState } from "./useSafeState";
import {
  fetchRFQ as doFetch,
  createRFQ as doCreate,
  updateRFQ as doUpdate,
  deleteRFQ as doDelete,
  addSpec as doAddSpec,
  updateSpec as doUpdateSpec,
  removeSpec as doRemoveSpec,
} from "./actions";

/** Single RFQ (fully hydrated) */
export function useRFQ(rfqId) {
  const [data, setData] = useSafeState(null);
  const [loading, setLoading] = useSafeState(false);
  const [error, setError] = useSafeState(null);
  const reqId = useRef(0);

  const refresh = useCallback(async () => {
    if (!rfqId) { setData(null); return; }
    try {
      setLoading(true);
      setError(null);
      const id = ++reqId.current;
      const rfq = await doFetch(rfqId);
      if (id === reqId.current) setData(rfq);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [rfqId, setLoading, setError, setData]);

  useEffect(() => { refresh(); }, [refresh]);

  // ------- actions that keep this RFQ in sync -------
  const createRFQ = useCallback(async (payload) => {
    const rfq = await doCreate(payload);
    setData(rfq);
    return rfq;
  }, [setData]);

  const updateRFQ = useCallback(async (idOrPatch, maybePatch) => {
    const id = typeof idOrPatch === "string" ? idOrPatch : rfqId;
    const patch = typeof idOrPatch === "string" ? maybePatch : idOrPatch;
    if (!id) throw new Error("updateRFQ: missing rfqId");
    const rfq = await doUpdate(id, patch);
    setData(rfq);
    return rfq;
  }, [rfqId, setData]);

  const deleteRFQ = useCallback(async (id = rfqId) => {
    if (!id) throw new Error("deleteRFQ: missing rfqId");
    await doDelete(id);
    setData(null);
    return true;
  }, [rfqId, setData]);

  const addSpec = useCallback(async (args) => {
    const rfq = await doAddSpec(args);
    setData(rfq);
    return rfq;
  }, [setData]);

  const updateSpec = useCallback(async (args) => {
    const rfq = await doUpdateSpec(args);
    setData(rfq);
    return rfq;
  }, [setData]);

  const removeSpec = useCallback(async (args) => {
    const rfq = await doRemoveSpec(args);
    setData(rfq);
    return rfq;
  }, [setData]);

  return useMemo(() => ({
    data, loading, error, refresh,
    createRFQ, updateRFQ, deleteRFQ,
    addSpec, updateSpec, removeSpec,
  }), [
    data, loading, error, refresh,
    createRFQ, updateRFQ, deleteRFQ,
    addSpec, updateSpec, removeSpec,
  ]);
}
