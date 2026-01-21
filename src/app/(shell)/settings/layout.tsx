'use client';
export const dynamic = 'force-dynamic';


import { ReactNode } from "react";

export default function SettingsRootLayout({ children }: { children: ReactNode }) {
    return <>{children}</>;
}
