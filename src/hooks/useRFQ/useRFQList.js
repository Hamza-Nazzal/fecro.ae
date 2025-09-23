// src/hooks/useRFQ/useRFQList.js
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useSafeState } from "./useSafeState";
import {
  createRFQ as doCreate,
  updateRFQ as doUpdate,
  deleteRFQ as doDelete,
  addSpec as doAddSpec,
  updateSpec as doUpdateSpec,
  removeSpec as doRemoveSpec,
  seedDemoRFQs as doSeed,
} from "./actions";
import { listRFQs, listMyRFQs } from "../../services/rfqService";

/** Full-featured list hook (object API) */
export function useRFQList({ mine = false, onlyOpen = false, search = "" } = {}) {
  const [data, setData] = useSafeState([]);
  const [loading, setLoading] = useSafeState(false);
  const [error, setError] = useSafeState(null);
  const reqId = useRef(0);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const id = ++reqId.current;
      const rows = mine
        ? await listMyRFQs()
        : await listRFQs({ onlyOpen, userId: undefined, search });
      if (id === reqId.current) setData(rows);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [mine, onlyOpen, search, setLoading, setError, setData]);

  useEffect(() => { refresh(); }, [refresh]);

  const createRFQ = useCallback(async (payload) => {
    const rfq = await doCreate(payload);
    setData((curr) => [rfq, ...curr]);
    return rfq;
  }, [setData]);

  const updateRFQ = useCallback(async (id, patch) => {
    const rfq = await doUpdate(id, patch);
    setData((curr) => curr.map((r) => (r.id === id ? rfq : r)));
    return rfq;
  }, [setData]);

  const deleteRFQ = useCallback(async (id) => {
    await doDelete(id);
    setData((curr) => curr.filter((r) => r.id !== id));
    return true;
  }, [setData]);

  const addSpec = useCallback(async (args) => {
    const rfq = await doAddSpec(args);
    setData((curr) => curr.map((r) => (r.id === rfq.id ? rfq : r)));
    return rfq;
  }, [setData]);

  const updateSpec = useCallback(async (args) => {
    const rfq = await doUpdateSpec(args);
    setData((curr) => curr.map((r) => (r.id === rfq.id ? rfq : r)));
    return rfq;
  }, [setData]);

  const removeSpec = useCallback(async (args) => {
    const rfq = await doRemoveSpec(args);
    setData((curr) => curr.map((r) => (r.id === rfq.id ? rfq : r)));
    return rfq;
  }, [setData]);

  const seedDemoRFQs = useCallback(async (opts) => {
    const n = await doSeed(opts);
    await refresh();
    return n;
  }, [refresh]);

  return useMemo(() => ({
    data, loading, error, refresh,
    createRFQ, updateRFQ, deleteRFQ,
    addSpec, updateSpec, removeSpec,
    seedDemoRFQs,
  }), [
    data, loading, error, refresh,
    createRFQ, updateRFQ, deleteRFQ,
    addSpec, updateSpec, removeSpec,
    seedDemoRFQs,
  ]);
}

/** Back-compat wrapper: returns just the array so `.length` works */
export function useRFQs(opts) {
  const { data } = useRFQList(opts);
  return data || [];
}
