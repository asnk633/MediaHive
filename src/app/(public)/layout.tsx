import type { ReactNode } from "react";

export default function PublicLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen bg-gradient-to-b from-[#E3F4FF] to-[#F7FCFF] text-slate-900">
            <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 pt-[calc(2.5rem+env(safe-area-inset-top))] pb-[calc(2.5rem+env(safe-area-inset-bottom))]">
                {children}
            </div>
        </div>
    );
}
