'use client';

import React from "react";
import ShellProviders from "@/components/layout/ShellProviders";


export default function ShellLayout({ children }: { children: React.ReactNode }) {
  return <ShellProviders>{children}</ShellProviders>;
}

