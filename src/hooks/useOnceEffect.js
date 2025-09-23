// src/hooks/useOnceEffect.js
import { useEffect, useRef } from "react";

export function useOnceEffect(effect, deps) {
  const lastKeyRef = useRef("");
  const ranForKeyRef = useRef(false);

  // make a stable key from deps for simple equality; adjust if you pass functions in deps
  const key = JSON.stringify(deps ?? []);

  useEffect(() => {
    const isDev =
      (typeof import.meta !== "undefined" && import.meta.env?.DEV) ||
      process.env.NODE_ENV === "development";

    // reset the dev-run flag when deps change
    if (key !== lastKeyRef.current) {
      lastKeyRef.current = key;
      ranForKeyRef.current = false;
    }

    if (isDev && ranForKeyRef.current) {
      // skip the second StrictMode invoke for the same deps
      return;
    }

    ranForKeyRef.current = true;
    return effect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
