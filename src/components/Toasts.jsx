// src/components/Toasts.jsx
import React, { createContext, useContext, useMemo, useRef, useState } from "react";
import { CheckCircle2, AlertTriangle, Info } from "lucide-react";

const ToastCtx = createContext(null);

export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(1);

  const api = useMemo(() => {
    function push(kind, message, opts = {}) {
      const id = idRef.current++;
      const t = { id, kind, message, timeout: opts.timeout ?? 3000 };
      setToasts((a) => [...a, t]);
      if (t.timeout > 0) {
        setTimeout(() => remove(id), t.timeout);
      }
      return id;
    }
    function remove(id) {
      setToasts((a) => a.filter((t) => t.id !== id));
    }
    return {
      push,
      remove,
      success: (m, o) => push("success", m, o),
      error: (m, o) => push("error", m, o),
      info: (m, o) => push("info", m, o),
    };
  }, []);

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="pointer-events-none fixed bottom-4 right-4 z-[1000] flex w-full max-w-sm flex-col gap-2"
      >
        {toasts.map((t) => (
          <Toast key={t.id} kind={t.kind} onClose={() => api.remove(t.id)}>
            {t.message}
          </Toast>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}

function Toast({ kind = "info", children, onClose }) {
  const styles = {
    success: "bg-emerald-600",
    error: "bg-rose-600",
    info: "bg-slate-700",
  };
  const Icon = kind === "success" ? CheckCircle2 : kind === "error" ? AlertTriangle : Info;
  return (
    <div className={`pointer-events-auto rounded-xl px-3 py-2 text-white shadow-lg ${styles[kind]}`}>
      <div className="flex items-start gap-2">
        <Icon className="h-5 w-5 mt-0.5 shrink-0" aria-hidden="true" />
        <div className="text-sm">{children}</div>
        <button
          className="ml-auto rounded-md/none p-1 text-white/80 hover:text-white"
          onClick={onClose}
          aria-label="Dismiss notification"
        >
          ×
        </button>
      </div>
    </div>
  );
}
