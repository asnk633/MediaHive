import React from "react";

type Props = {
  role?: "admin" | "team" | "guest";
};

export default function FAB({ role = "guest" }: Props) {
  // Presentational FAB. In your app ensure CSS var --bottom-nav-height: 22px is present.
  return (
    <div>
      <button
        aria-label="Main FAB"
        style={{
          position: "fixed",
          left: "50%",
          transform: "translateX(-50%)",
          bottom: "calc(var(--bottom-nav-height) + 2px)",
        }}
        className="fab w-16 h-16 rounded-full shadow-lg flex items-center justify-center text-white text-2xl"
      >
        +
      </button>
      {/* Note: overlay/backdrop and role-aware menu are intentionally minimal here */}
    </div>
  );
}