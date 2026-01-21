'use client';

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

export default function PublicLayout({ children }: { children: ReactNode }) {
    return <div className="min-h-screen bg-night-sky">{children}</div>;
}
