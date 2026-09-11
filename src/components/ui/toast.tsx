"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from "lucide-react";

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: number;
  type: ToastType;
  title: string;
  description?: string;
}

const ToastContext = React.createContext<{
  toast: (type: ToastType, title: string, description?: string) => void;
}>({ toast: () => {} });

export const useToast = () => React.useContext(ToastContext);

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 className="h-5 w-5 text-emerald-400" />,
  error: <XCircle className="h-5 w-5 text-red-400" />,
  info: <Info className="h-5 w-5 text-sky-400" />,
  warning: <AlertTriangle className="h-5 w-5 text-amber-400" />,
};

export function Toaster() {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const remove = (id: number) =>
    setToasts((prev) => prev.filter((t) => t.id !== id));

  const toast = React.useCallback(
    (type: ToastType, title: string, description?: string) => {
      const id = Date.now();
      setToasts((prev) => [...prev, { id, type, title, description }]);
      setTimeout(() => remove(id), 4500);
    },
    []
  );

  const value = React.useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {typeof window !== "undefined" &&
        createPortal(
          <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 w-[calc(100vw-2rem)] max-w-sm">
            {toasts.map((t) => (
              <div
                key={t.id}
                className="flex items-start gap-3 rounded-xl border border-border bg-card/95 backdrop-blur p-4 shadow-2xl shadow-black/40 animate-[fadeIn_0.2s_ease]"
              >
                <div className="mt-0.5 shrink-0">{ICONS[t.type]}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{t.title}</p>
                  {t.description && (
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {t.description}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => remove(t.id)}
                  className="shrink-0 text-zinc-500 hover:text-zinc-300"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
}
