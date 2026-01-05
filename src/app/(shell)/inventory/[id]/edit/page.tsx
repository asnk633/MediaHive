"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import InventoryForm from "@/components/inventory/InventoryForm";
import { inventoryService } from "@/services/inventoryService";
import { InventoryItem } from "@/types/inventory";
import { toast } from "sonner";

export default function EditInventoryItemPage() {
    const { id } = useParams();
    const [item, setItem] = useState<InventoryItem | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            loadItem(id as string);
        }
    }, [id]);

    const loadItem = async (itemId: string) => {
        try {
            setLoading(true);
            const data = await inventoryService.getById(itemId);
            setItem(data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load item for editing.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!item) {
        return <div className="p-8 text-center text-red-400">Item not found.</div>;
    }

    return (
        <div className="pt-20 px-4 pb-20 max-w-7xl mx-auto w-full">
            <InventoryForm mode="edit" initialData={item} />
        </div>
    );
}
