"use client";
import { useEffect } from "react";
import { detectDomModifications } from "@/utils/detect-dom-modifications";

export function HydrationDetector() {
    useEffect(() => {
        detectDomModifications();
    }, []);
    return null;
}
