'use client';

export const dynamic = 'force-static';


import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function HomePage() {
    const router = useRouter();
    const { user, loading } = useAuth();

    useEffect(() => {
        if (!loading) {
            if (user) {
                router.replace("/home");
            } else {
                router.replace("/login");
            }
        }
    }, [user, loading, router]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-night-sky">
            <div className="w-8 h-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
        </div>
    );
}
