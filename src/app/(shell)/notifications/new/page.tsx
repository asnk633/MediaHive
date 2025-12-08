"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NotificationForm } from '@/components/NotificationForm';

export default function NewNotificationPage() {
    const router = useRouter();

    return (
        <div className="space-y-6 max-w-2xl mx-auto p-4 sm:p-6">
            <div className="flex items-center gap-3">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => router.back()}
                  className="bg-[var(--panel)] border-[var(--glass-border)] text-[var(--text)] hover:bg-[var(--panel-strong)] transition-all duration-200"
                >
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-3xl font-bold text-[var(--text)]">New Notification</h1>
            </div>

            <Card className="bg-[var(--panel)] border-[var(--glass-border)] p-4 sm:p-6">
                <CardHeader>
                    <CardTitle className="text-[var(--text)]">Compose Notification</CardTitle>
                </CardHeader>
                <CardContent>
                    <NotificationForm />
                </CardContent>
            </Card>
        </div>
    );
}