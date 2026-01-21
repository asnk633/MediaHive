'use client';

import React from "react";
import RequestList from "@/components/inventory/RequestList";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { PageLayout } from "@/components/ui/layout/PageLayout";
import { PageHeader } from "@/components/ui/layout/PageHeader";
import { Button } from "@/components/ui/button";

export default function InventoryRequestsClient() {
    return (
        <PageLayout mode="plain">
            <PageHeader
                title="Inventory Requests"
                description="Track status of equipment and device requests."
                actions={
                    <Link href="/inventory">
                        <Button variant="ghost" className="gap-2 text-slate-400 hover:text-white">
                            <ArrowLeft size={16} />
                            Back to Inventory
                        </Button>
                    </Link>
                }
            />

            {/* Content */}
            <div className="max-w-4xl mx-auto pb-20">
                <RequestList />
            </div>
        </PageLayout>
    );
}
