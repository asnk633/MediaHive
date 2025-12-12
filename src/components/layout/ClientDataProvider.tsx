"use client";

import { ReactNode } from "react";
// import whatever hooks you need (theme, user, etc.)

type ClientDataProviderProps = {
  children: ReactNode;
};

export function ClientDataProvider({ children }: ClientDataProviderProps) {
  // run any client-side hooks here (e.g. theme sync, user store, etc.)
  // BUT do not add extra divs or change classNames conditionally.

  return <>{children}</>;
}