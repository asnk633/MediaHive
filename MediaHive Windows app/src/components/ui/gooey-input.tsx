"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X } from "lucide-react";

interface GooeyInputProps {
  placeholder?: string;
  className?: string;
}

export function GooeyInput({ placeholder = "Search anything...", className = "" }: GooeyInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [value, setValue] = useState("");

  return (
    <div className={`relative ${className}`}>
      {/* SVG Filter Definition for the Gooey Effect */}
      <svg className="absolute hidden">
        <defs>
          <filter id="goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -8"
              result="goo"
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>

      {/* Container applying the gooey filter */}
      <div 
        className="relative flex items-center h-10 w-full rounded-xl overflow-hidden"
        style={{ filter: "url(#goo)", transform: "translateZ(0)" }}
      >
        {/* Animated Background Blob */}
        <motion.div
          className="absolute left-0 top-0 h-full bg-black/60 origin-left"
          animate={{
            width: isFocused || value ? "100%" : "36px",
            backgroundColor: isFocused ? "rgba(20, 184, 166, 0.15)" : "rgba(0, 0, 0, 0.4)",
            borderRadius: isFocused || value ? "12px" : "18px",
          }}
          transition={{ type: "spring", stiffness: 180, damping: 14 }}
        />

        {/* Liquid Indicator Drop */}
        <motion.div
          className="absolute h-8 w-8 rounded-full bg-teal-500/60 mix-blend-screen"
          initial={false}
          animate={{
            left: isFocused || value ? "100%" : "4px",
            x: isFocused || value ? "-36px" : "0px",
            scale: isFocused || value ? 1.2 : 0.8,
            opacity: isFocused || value ? 0.3 : 0,
          }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
        />

        <div className="relative z-10 w-10 flex items-center justify-center shrink-0 pointer-events-none">
          <motion.div
            animate={{
              color: isFocused ? "#14b8a6" : "#71717a",
            }}
          >
            <Search className="w-4 h-4" />
          </motion.div>
        </div>

        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className="relative z-10 w-full h-full bg-transparent border-none pr-10 pl-1 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none transition-all"
        />

        <AnimatePresence>
          {value && (
            <motion.button
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              onClick={() => setValue("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 text-zinc-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
      
      {/* Static Border on top of the gooey effect */}
      <motion.div 
        className="absolute inset-0 border rounded-xl pointer-events-none"
        animate={{
          borderColor: isFocused ? "rgba(20, 184, 166, 0.3)" : "rgba(255, 255, 255, 0.05)"
        }}
        transition={{ duration: 0.3 }}
      />
    </div>
  );
}
