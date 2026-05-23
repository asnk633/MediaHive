'use client';


import { AppLoader } from "@/components/ui/AppLoader";

export default function Loading() {
    return (
        <div className="fixed inset-0 bg-[var(--glass-liquid-bg)] flex items-center justify-center z-[9999]">
            <AppLoader />
        </div>
    );
}
