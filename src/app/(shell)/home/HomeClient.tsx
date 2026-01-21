'use client';

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { RippleLogo } from "@/components/RippleLogo";
import { getWelcomeData } from "@/utils/greetings";

import { SectionHeader } from "@/components/ui/SectionHeader";
import { PageLayout } from "@/components/ui/layout/PageLayout";
import { PageHeader } from "@/components/ui/layout/PageHeader";

export default function HomeClient() {
    const { user, loading } = useAuth();
    const [showSplash, setShowSplash] = useState(true);

    const welcomeData = getWelcomeData(user?.name || 'Guest');

    useEffect(() => {
        const splashTimer = setTimeout(() => setShowSplash(false), 2000);
        return () => clearTimeout(splashTimer);
    }, []);

    if (loading || showSplash) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-background z-50">
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.5 }}
                >
                    <RippleLogo />
                </motion.div>
            </div>
        );
    }

    return (
        <PageLayout mode="plain">
            <PageHeader
                title={welcomeData.greeting}
                description={welcomeData.message}
            />

            <div className="p-8 text-center text-muted">
                <p>Home dashboard loading...</p>
                <p className="text-sm mt-2">Widgets temporarily disabled during build refactor</p>
            </div>
        </PageLayout>
    );
}
