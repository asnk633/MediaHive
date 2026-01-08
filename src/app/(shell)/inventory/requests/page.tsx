"use client";

import React from "react";
import RequestManager from "@/components/requests/RequestManager";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageLayout } from "@/components/ui/layout/PageLayout";
import { PageHeader } from "@/components/ui/layout/PageHeader";
import { Button } from "@/components/ui/button";

export default function MyRequestsPage() {
    return (
        <PageLayout mode="plain">
            <PageHeader
                title="My Requests"
                description="Track status of equipment and device requests."
                actions={
                    <Link href="/inventory">
                        <Button variant="ghost" className="gap-2">
                            <ArrowLeft size={16} />
                            Back to Inventory
                        </Button>
                    </Link>
                }
            />

            {/* Content */}
            <div className="max-w-4xl">
                <RequestManager />
            </div>
        </PageLayout>
    );
}
