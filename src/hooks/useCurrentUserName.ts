"use client";

import { useEffect, useState } from "react";

export function useCurrentUserName() {
    const [name, setName] = useState<string>("Alex");

    useEffect(() => {
        if (typeof window === "undefined") return;
        try {
            const raw = localStorage.getItem("thaiba-tasks:user");
            if (!raw) return;
            const user = JSON.parse(raw);
            if (user?.name) {
                setName(user.name);
            }
        } catch (err) {
            console.warn("Failed to read user from localStorage", err);
        }
    }, []);

    return name;
}
