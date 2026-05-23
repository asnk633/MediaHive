"use client";

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

type Toast = { id: string; title: string; variant?: "success" | "error" | "info" };
type Ctx = { show: (title: string, variant?: Toast["variant"]) => void };

const ToastCtx = createContext<Ctx | null>(null);
export function useToast() {
  const v = useContext(ToastCtx);
  if (!v) throw new Error("useToast must be used inside <ToastProvider>");
  return v;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const show = useCallback((title: string, variant: Toast["variant"] = "info") => {
    const id = `t_${++idRef.current}`;
    setToasts((prev) => [...prev, { id, title, variant }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 2500);
  }, []);

  return (
    <ToastCtx.Provider value={{ show }}>
      {children}
      {/* Toast viewport */}
      <div className="pointer-events-none fixed bottom-20 left-1/2 z-[200] w-[92%] max-w-md -translate-x-1/2 space-y-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto rounded-xl px-4 py-3 text-sm shadow-lg ${
              t.variant === "success"
                ? "bg-emerald-600 text-black"
                : t.variant === "error"
                ? "bg-red-600 text-foreground"
                : "bg-foreground/90 text-black"
            }`}
          >
            {t.title}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
