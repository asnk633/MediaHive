'use client';
export const dynamic = 'force-dynamic';


import { ReactNode } from "react";

export default function MediaRootLayout({ children }: { children: ReactNode }) {
    return <>{children}</>;
}
