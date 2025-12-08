"use client";
import React from "react";
import useTheme from "@/lib/useTheme";

export default function TestThemeComponent() {
  const { theme, toggle } = useTheme();

  return (
    <div className="panel p-4 m-4">
      <h2 className="text-lg font-bold mb-2">Theme Test Component</h2>
      <p className="mb-2">Current theme: {theme}</p>
      <button 
        onClick={toggle}
        className="px-4 py-2 rounded bg-[var(--accent)] text-white"
      >
        Toggle Theme
      </button>
    </div>
  );
}