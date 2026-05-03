"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { apiClient } from '@/lib/apiClient';
import { toast } from 'sonner';
import { Megaphone, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// Minimal interface for list items
interface SystemUpdate {
    id: string;
    title: string;
    body: string;
    severity: 'info' | 'important' | 'critical';
    created_at: any;
    created_by?: { name: string };
}

export const SystemUpdatesView = () => {
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [severity, setSeverity] = useState<'info' | 'important' | 'critical'>('info');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [history, setHistory] = useState<SystemUpdate[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(true);

    // Fetch History (Mock/Direct for now? Or Admin API needs GET?)
    // Required: "Read-only list of published updates"
    // Valid approach: Add GET to /api/admin/system-updates
    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const data = await apiClient('/api/admin/system-updates');
                if (data.updates) setHistory(data.updates);
            } catch (e) {
                console.error("Failed to load history", e);
            } finally {
                setLoadingHistory(false);
            }
        };
        fetchHistory();
    }, []);

    const handlePublish = async () => {
        if (!title.trim() || !body.trim()) {
            toast.error('Title and Body required');
            return;
        }

        setIsSubmitting(true);
        try {
            await apiClient('/api/admin/system-updates', {
                method: 'POST',
                body: JSON.stringify({ title, body, severity })
            });

            toast.success('System Update Published!');

            // Reset form
            setTitle('');
            setBody('');
            setSeverity('info');

            // Refresh list
            const data = await apiClient('/api/admin/system-updates');
            setHistory(data.updates || []);

        } catch (error) {
            console.error('Publish failed', error);
            toast.error('Failed to publish update');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getSeverityColor = (sev: string) => {
        switch (sev) {
            case 'critical': return 'text-red-400 bg-red-500/10 border-red-500/20';
            case 'important': return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
            default: return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
        }
    };

    return (
        <div className="space-y-8 max-w-5xl mx-auto p-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-indigo-500/20 rounded-xl">
                    <Megaphone className="w-8 h-8 text-indigo-400" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white">System Updates Manager</h1>
                    <p className="text-slate-400">Broadcast announcements to the entire organization.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Compose Form */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="bg-slate-950/40 border-slate-800">
                        <CardHeader>
                            <CardTitle className="text-lg">Compose Update</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Title</Label>
                                <Input
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    placeholder="e.g. New Feature: Inventory Tracking"
                                    className="bg-slate-900 border-slate-700"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Severity</Label>
                                <Select value={severity} onValueChange={(v: any) => setSeverity(v)}>
                                    <SelectTrigger className="bg-slate-900 border-slate-700">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="info">Info (Blue)</SelectItem>
                                        <SelectItem value="important">Important (Orange)</SelectItem>
                                        <SelectItem value="critical">Critical (Red)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Message Body</Label>
                                <Textarea
                                    value={body}
                                    onChange={e => setBody(e.target.value)}
                                    placeholder="Details about the update..."
                                    className="bg-slate-900 border-slate-700 min-h-[150px]"
                                />
                            </div>

                            <Button
                                onClick={handlePublish}
                                disabled={isSubmitting}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                            >
                                {isSubmitting ? 'Publishing...' : 'Publish Update'}
                            </Button>

                            <p className="text-xs text-slate-500 text-center">
                                This will notify all opted-in users immediately.
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* History List */}
                <div className="lg:col-span-2">
                    <Card className="bg-slate-950/40 border-slate-800 h-full">
                        <CardHeader>
                            <CardTitle className="text-lg flex justify-between items-center">
                                Published History
                                <span className="text-sm font-normal text-slate-500">
                                    {history.length} updates
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                                {loadingHistory ? (
                                    <p className="text-slate-500 text-center py-8">Loading history...</p>
                                ) : history.length === 0 ? (
                                    <p className="text-slate-500 text-center py-8">No updates published yet.</p>
                                ) : (
                                    history.map(update => (
                                        <div key={update.id} className="p-4 rounded-lg bg-slate-900/50 border border-slate-800 flex flex-col gap-2">
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${getSeverityColor(update.severity)}`}>
                                                        {update.severity}
                                                    </span>
                                                    <h3 className="font-semibold text-slate-200">{update.title}</h3>
                                                </div>
                                                <span className="text-xs text-slate-500">
                                                    {update.created_at ? formatDistanceToNow(new Date(update.created_at), { addSuffix: true }) : 'Unknown'}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-400 whitespace-pre-wrap pl-1">{update.body}</p>
                                            <div className="flex justify-end items-center gap-2 mt-2">
                                                <span className="text-[10px] text-slate-600">
                                                    By {update.created_by?.name || 'Admin'}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};
