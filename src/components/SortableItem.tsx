// src/components/SortableItem.tsx
"use client";

import React from "react";
import {
  useSortable,
} from "@dnd-kit/sortable";
import type { CSS } from "@dnd-kit/utilities";

// Remove the problematic import and type
type Props = {
  id: string | number;
  columnId?: string;
  children: React.ReactNode;
  className?: string;
};

export function SortableItem({ id, columnId, children, className }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
  });

  const style: React.CSSProperties & { "--translate-x"?: string; "--translate-y"?: string } = {
    transform: transform
      ? `translate3d(${(transform as any).x ?? 0}px, ${(transform as any).y ?? 0}px, 0) scale(${(transform as any)?.scale ?? 1})`
      : undefined,
    transition,
    touchAction: "manipulation",
    // pointer cursor when draggable
    cursor: isDragging ? "grabbing" : "grab",
  };

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      data-draggable="true"
      data-column-id={columnId}
      data-draggable-id={String(id)}
      role="button"
      tabIndex={0}
      className={className}
      style={style}
    >
      {children}
    </div>
  );
}

export default SortableItem;
