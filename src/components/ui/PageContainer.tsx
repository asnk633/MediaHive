// src/components/ui/PageContainer.tsx
import React, { PropsWithChildren } from "react";
import "./page-container.css";

export default function PageContainer({ children, className = "" }: PropsWithChildren<{ className?: string }>) {
  return (
    <main className={`ds-page ${className}`}>
      <div className="ds-page-inner">{children}</div>
    </main>
  );
}