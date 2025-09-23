// src/hooks/useRFQ/useSafeState.js
import { useCallback, useEffect, useRef, useState } from "react";

export function useSafeState(initial) {
  const mounted = useRef(true);
  const [state, setState] = useState(initial);
  useEffect(() => () => { mounted.current = false; }, []);
  const safeSet = useCallback((v) => { if (mounted.current) setState(v); }, []);
  return [state, safeSet];
}
