"use client";

import { ReactNode } from "react";

console.log('[STATIC CHECK] app/(shell)/events/layout.tsx');

export default function EventsRootLayout({ children, modal }: { children: ReactNode; modal: ReactNode }) {
    return (
        <>
            {children}
            {modal}
        </>
    );
}
