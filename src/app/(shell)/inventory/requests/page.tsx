"use client";

import React from "react";
import RequestManager from "@/components/requests/RequestManager";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function MyRequestsPage() {
    return (
        <div className="flex flex-col min-h-screen px-4 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8 pt-6">
                <Link
                    href="/inventory"
                    className="p-2 -ml-2 rounded-full hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
                >
                    <ArrowLeft size={24} />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
                        My Requests
                    </h1>
                    <p className="text-[var(--text-secondary)] mt-1">
                        Track status of equipment and device requests.
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl">
                <RequestManager />
            </div>
        </div>
    );
}
