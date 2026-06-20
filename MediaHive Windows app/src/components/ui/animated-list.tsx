"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface AnimatedListProps {
  children: React.ReactNode;
  className?: string;
  delayOffset?: number;
  maxDelay?: number;
}

export function AnimatedList({
  children,
  className = "",
  delayOffset = 0.03,
  maxDelay = 0.3,
}: AnimatedListProps) {
  const items = React.Children.toArray(children);

  const isGridOrRow = className.includes("grid") || className.includes("flex-row");
  return (
    <div className={`${isGridOrRow ? "" : "flex flex-col gap-3"} ${className}`}>
      <AnimatePresence>
        {items.map((child: any, index) => {
          return (
            <motion.div
              key={child?.key || index}
              layout
              initial={{ opacity: 0, scale: 0.96, y: 12, filter: "blur(4px)" }}
              animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.96, filter: "blur(4px)" }}
              transition={{ 
                type: "spring", 
                stiffness: 350, 
                damping: 26,
                delay: Math.min(index * delayOffset, maxDelay)
              }}
              className="w-full"
            >
              {child}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
