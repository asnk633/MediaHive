
import React from "react";
export default function FAB() {
  return (
    <button
      aria-label="Main FAB"
      style={{ position: "fixed", left: "50%", transform: "translateX(-50%)", bottom: "calc(var(--bottom-nav-height) + 2px)" }}
      className="fab w-16 h-16 rounded-full shadow-lg bg-indigo-600 text-white text-3xl flex items-center justify-center"
    >
      +
    </button>
  );
}
