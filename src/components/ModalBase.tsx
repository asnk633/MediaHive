"use client";

import React, { useEffect, useRef } from "react";
import { useModalHistory } from "@/hooks/useModalHistory";

export default function ModalBase({
  open,
  onClose,
  children,
  panelClass = "fixed inset-x-0 bottom-0 z-[70] mx-auto max-w-xl rounded-t-2xl bg-[#1E1E1E] p-4 modal-enter",
  overlayClass = "fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm",
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  panelClass?: string;
  overlayClass?: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useModalHistory(open, onClose);

  // Scroll lock
  useEffect(() => {
    if (!open) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = overflow; };
  }, [open]);

  // Simple focus trap
  useEffect(() => {
    if (!open) return;
    const el = panelRef.current;
    const focusable = el?.querySelectorAll<HTMLElement>(
      'a,button,input,textarea,select,[tabindex]:not([tabindex="-1"])'
    );
    const first = focusable?.[0];
    first?.focus();
    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !focusable || focusable.length === 0) return;
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        if (first) first.focus();
      }
    };
    document.addEventListener("keydown", handleTab);
    return () => document.removeEventListener("keydown", handleTab);
  }, [open]);

  if (!open) return null;
  return (
    <>
      <div className={overlayClass} onClick={onClose} />
      <div ref={panelRef} className={panelClass}>{children}</div>
    </>
  );
}
