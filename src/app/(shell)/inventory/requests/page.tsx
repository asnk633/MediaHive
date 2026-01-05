"use client";

import React from "react";
import RequestManager from "@/components/requests/RequestManager";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function RequestsPage() {
    const { user } = useAuth();

    return (
        <div className="pt-24 px-4 pb-20 max-w-5xl mx-auto w-full">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <Link href="/inventory" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition-colors text-sm">
                        <ArrowLeft size={16} /> Back to Inventory
                    </Link>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-violet-400">
                        {user?.role === 'admin' ? 'Manage Requests' : 'My Requests'}
                    </h1>
                    <p className="text-slate-400 text-sm">
                        {user?.role === 'admin' ? 'Approve, Issue and Return equipment.' : 'Track your equipment requests.'}
                    </p>
                </div>

                <Link href="/requests/new">
                    <Button className="bg-blue-600 hover:bg-blue-500 gap-2 shadow-glow">
                        <Plus size={18} /> New Request
                    </Button>
                </Link>
            </div>

            <RequestManager />
        </div>
    );
}
