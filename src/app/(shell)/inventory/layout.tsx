"use client";

import { ReactNode } from "react";

export default function InventoryRootLayout({ children, modal }: { children: ReactNode; modal: ReactNode }) {
    return (
        <>
            {children}
            {modal}
        </>
    );
}
