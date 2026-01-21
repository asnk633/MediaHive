'use client';
export const dynamic = 'force-static';


import { AppLoader } from "@/components/ui/AppLoader";

export default function Loading() {
    return (
        <div className="fixed inset-0 bg-[#0f172a] flex items-center justify-center z-[9999]">
            <AppLoader />
        </div>
    );
}
