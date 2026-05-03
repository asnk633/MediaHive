"use client";

import { ReactNode } from "react";
import { GlobalSyncBanner } from "@/components/ui/GlobalSyncBanner";

type ClientDataProviderProps = {
  children: ReactNode;
};

export function ClientDataProvider({ children }: ClientDataProviderProps) {
  return (
    <>
      {children}
      <GlobalSyncBanner />
    </>
  );
}
