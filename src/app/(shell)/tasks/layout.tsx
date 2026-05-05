"use client";


import { ReactNode } from "react";

console.log('[STATIC CHECK] app/(shell)/tasks/layout.tsx');

export default function TasksRootLayout({ children, modal }: { children: ReactNode; modal: ReactNode }) {
    return (
        <>
            {children}
            {modal}
        </>
    );
}
