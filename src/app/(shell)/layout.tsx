'use client';

import React from "react";
import ShellProviders from "@/components/layout/ShellProviders";
import { useMonitoringContext } from "@/hooks/useMonitoringContext";
import { useAuth } from "@/contexts/AuthContextProvider";

export default function ShellLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  
  // Wire monitoring context automatically
  useMonitoringContext(user);

  return <ShellProviders>{children}</ShellProviders>;
}

