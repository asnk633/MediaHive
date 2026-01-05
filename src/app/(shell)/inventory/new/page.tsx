"use client";

import React from "react";
import InventoryForm from "@/components/inventory/InventoryForm";

export default function NewInventoryItemPage() {
    return (
        <div className="pt-20 px-4 pb-20 max-w-7xl mx-auto w-full">
            <InventoryForm mode="create" />
        </div>
    );
}
