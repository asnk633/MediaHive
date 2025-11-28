
import React from "react";

export default function Card({ title, children }) {
  return (
    <div className="p-4 mb-4 rounded-lg shadow bg-white/10 border border-white/10">
      <h3 className="font-semibold text-lg">{title}</h3>
      <div className="mt-2 text-sm">{children}</div>
    </div>
  );
}
