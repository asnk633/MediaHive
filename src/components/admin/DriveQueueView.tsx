"use client";

import React, { useEffect, useState } from 'react';
import { DriveQueueItem } from '@/types/drive-queue';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { RefreshCw, Check, X, ExternalLink, HardDrive, FolderOpen } from 'lucide-react';
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

// Helper for safely parsing Firestore Timestamps (Admin SDK serializes to _seconds)
function parseFirestoreDate(value: any): Date | null {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value === 'string') return new Date(value); // ISO String
    if (typeof value.toDate === 'function') return value.toDate(); // Real Timestamp object
    if (typeof value._seconds === 'number') return new Date(value._seconds * 1000); // Admin SDK serialized
    if (typeof value.seconds === 'number') return new Date(value.seconds * 1000); // Client SDK serialized
    return null;
}

export function DriveQueueView() {
    const [items, setItems] = useState<DriveQueueItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [scanning, setScanning] = useState(false);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [folderInfo, setFolderInfo] = useState<{ id: string, name: string, webViewLink: string | null } | null>(null);
    const [scanLogs, setScanLogs] = useState<string[]>([]);

    // Bulk Selection State
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Modal State
    const [modalOpen, setModalOpen] = useState(false);
    const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
    const [targetId, setTargetId] = useState<string | null>(null); // null means bulk

    // Metadata Form State
    const [metadata, setMetadata] = useState({
        name: '',
        description: '',
        visibility: 'all', // 'all' | 'internal'
        category: 'Documents', // Default fallback
        tags: '', // Comma separated
        namePrefix: '',
        nameSuffix: ''
    });

    useEffect(() => {
        loadQueue();
        loadFolderInfo();
    }, []);

    // Helper: Auto-Suggest Category
    const getAutoCategory = (mimeType: string) => {
        if (mimeType.startsWith('image/')) return 'Photos';
        if (mimeType.startsWith('video/')) return 'Videos';
        if (mimeType.startsWith('audio/')) return 'Audio';
        if (mimeType.includes('pdf') || mimeType.startsWith('text/')) return 'Documents';
        if (mimeType.includes('zip') || mimeType.includes('compressed') || mimeType.includes('tar')) return 'Archives';
        return 'Documents';
    };

    // Helper: Auto-Suggest Tags (Enhanced)
    const getAutoTags = (item: DriveQueueItem) => {
        const tags: string[] = [];

        // 1. Year Detection (Regex > Drive Date > Current)
        const nameYearMatch = item.name.match(/\b20\d{2}\b/);
        if (nameYearMatch) {
            tags.push(nameYearMatch[0]);
        } else if (item.detectedAt) {
            const date = parseFirestoreDate(item.detectedAt);
            if (date) tags.push(date.getFullYear().toString());
            else tags.push(new Date().getFullYear().toString());
        } else {
            tags.push(new Date().getFullYear().toString());
        }

        // 2. Event Extraction [Event] or (Event)
        const eventMatch = item.name.match(/[\[\(](.*?)[\]\)]/);
        if (eventMatch && eventMatch[1]) {
            tags.push(eventMatch[1].trim());
        }

        // 3. Institution / Unit Mapping
        const lowerName = item.name.toLowerCase();
        if (lowerName.includes('orchid')) tags.push('Orchids');
        if (lowerName.includes('thaiba')) tags.push('Thaiba');
        if (lowerName.includes('garden')) tags.push('Garden');
        if (lowerName.includes('koppa')) tags.push('Koppa');
        if (lowerName.includes('feroke')) tags.push('Feroke');

        // 4. Type & Source
        const type = item.mimeType.startsWith('image/') ? 'Image' :
            item.mimeType.startsWith('video/') ? 'Video' :
                item.mimeType.includes('pdf') ? 'Doc' : 'File';
        tags.push(type);
        tags.push('Drive Import');

        // 5. Extension
        const ext = item.name.includes('.') ? item.name.split('.').pop()?.toUpperCase() : '';
        if (ext && ext.length < 5) tags.push(ext);

        // Dedup
        return Array.from(new Set(tags)).filter(Boolean).join(', ');
    };

    const loadQueue = async () => {
        // ... (rest of loadQueue)

        try {
            const res = await fetch('/api/admin/drive-queue');
            const data = await res.json();
            if (res.ok) {
                setItems(data);
                setSelectedIds(new Set());
            } else {
                throw new Error(data.error);
            }
        } catch (e) {
            console.error(e);
            toast.error('Failed to load queue');
        } finally {
            setLoading(false);
        }
    };

    const loadFolderInfo = async () => {
        try {
            const res = await fetch('/api/admin/drive-queue/meta');
            const data = await res.json();
            if (res.ok) {
                setFolderInfo(data);
            }
        } catch (e) {
            console.error('Failed to load folder info', e);
        }
    };

    const handleScan = async () => {
        setScanning(true);
        setScanLogs([]);
        try {
            const res = await fetch('/api/admin/drive-queue/scan', { method: 'POST' });
            const data = await res.json();

            if (data.logs) {
                setScanLogs(data.logs);
            }

            if (res.ok) {
                toast.success(data.message);
                loadQueue();
            } else {
                throw new Error(data.error);
            }
        } catch (e: any) {
            toast.error(e.message || 'Scan failed');
        } finally {
            setScanning(false);
        }
    };

    // Open Modal for Single Action
    const initiateSingleAction = (item: DriveQueueItem, action: 'approve' | 'reject') => {
        setTargetId(item.id);
        setActionType(action);

        // Reset/Init Metadata
        if (action === 'approve') {
            setMetadata({
                name: item.name,
                description: '',
                visibility: 'all', // Default to public
                category: getAutoCategory(item.mimeType), // Auto-suggest
                tags: getAutoTags(item),
                namePrefix: '',
                nameSuffix: ''
            });
            setModalOpen(true);
        } else {
            // Specific flow for reject (skip metadata)
            executeAction(item.id, 'reject');
        }
    };

    // Open Modal for Bulk Action
    const initiateBulkAction = (action: 'approve' | 'reject') => {
        const ids = Array.from(selectedIds);
        if (ids.length === 0) return;

        setTargetId(null); // Indicates Bulk
        setActionType(action);

        if (action === 'approve') {
            // For bulk, we can't auto-suggest per file easily in a single shared form.
            // We'll default to 'Documents' or maybe detect if mixed?
            // "Shared fields apply to all".

            // Heuristic: If all selected are images, default to Photos.
            const selectedItems = items.filter(i => selectedIds.has(i.id));
            const firstMime = selectedItems[0]?.mimeType || '';
            const allSameType = selectedItems.every(i => i.mimeType.split('/')[0] === firstMime.split('/')[0]);

            setMetadata({
                name: '',
                description: '',
                visibility: 'all',
                category: allSameType ? getAutoCategory(firstMime) : 'Documents',
                tags: `Drive Import, ${new Date().getFullYear()}`, // Generic bulk tags
                namePrefix: '',
                nameSuffix: ''
            });
            setModalOpen(true);
        } else {
            // Skip metadata for bulk reject, but maybe confirm?
            // For now, let's just confirm.
            if (confirm(`Are you sure you want to reject ${ids.length} items?`)) {
                executeBulkAction(ids, 'reject');
            }
        }
    };

    // Final Execution for Single
    const executeAction = async (id: string, action: 'approve' | 'reject', payloadMetadata?: any) => {
        setProcessingId(id);
        setModalOpen(false);

        try {
            const body: any = { id, action };
            if (action === 'approve' && payloadMetadata) {
                body.metadata = payloadMetadata;
            }

            const res = await fetch('/api/admin/drive-queue', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await res.json();

            if (res.ok) {
                toast.success(action === 'approve' ? 'File approved & published' : 'File rejected');
                setItems(prev => prev.filter(i => i.id !== id));
                if (selectedIds.has(id)) {
                    const newSet = new Set(selectedIds);
                    newSet.delete(id);
                    setSelectedIds(newSet);
                }
            } else {
                throw new Error(data.error);
            }
        } catch (e: any) {
            toast.error(e.message || 'Action failed');
        } finally {
            setProcessingId(null);
        }
    };

    // Final Execution for Bulk
    const executeBulkAction = async (ids: string[], action: 'approve' | 'reject', payloadMetadata?: any) => {
        setProcessingId('bulk');
        setModalOpen(false);

        try {
            const body: any = { ids, action };
            if (action === 'approve' && payloadMetadata) {
                // Only include relevant fields for bulk
                body.metadata = {
                    description: payloadMetadata.description,
                    visibility: payloadMetadata.visibility,
                    category: payloadMetadata.category,
                    tags: payloadMetadata.tags, // Pass tags
                    namePrefix: payloadMetadata.namePrefix,
                    nameSuffix: payloadMetadata.nameSuffix
                };
            }

            const res = await fetch('/api/admin/drive-queue', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await res.json();

            if (res.ok) {
                toast.success(`Bulk Action: ${data.success} succeeded, ${data.failed} failed`);
                loadQueue();
            } else {
                throw new Error(data.error);
            }
        } catch (e: any) {
            toast.error(e.message || 'Bulk action failed');
        } finally {
            setProcessingId(null);
        }
    };

    const confirmModal = () => {
        if (!actionType) return;

        // Prepare visibility object based on simple select
        const finalMetadata = {
            ...metadata,
            visibility: metadata.visibility === 'all' ? { mode: 'all' } : { mode: 'internal', roles: ['admin', 'team'] }
        };

        if (targetId) {
            executeAction(targetId, actionType, finalMetadata);
        } else {
            executeBulkAction(Array.from(selectedIds), actionType, finalMetadata);
        }
    };

    // Checkbox Logic
    const toggleSelect = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const toggleAll = () => {
        if (selectedIds.size === items.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(items.map(i => i.id)));
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-white mb-1">Detected from Drive</h2>
                    <p className="text-sm text-white/50">
                        Review and approve files uploaded to {folderInfo?.webViewLink ? (
                            <a
                                href={folderInfo.webViewLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-300 inline-flex items-center gap-1 font-medium bg-blue-500/10 px-2 py-0.5 rounded transition-colors"
                            >
                                <FolderOpen size={12} />
                                {folderInfo.name}
                                <ExternalLink size={10} />
                            </a>
                        ) : (
                            <span className="font-mono text-xs bg-white/10 px-1 py-0.5 rounded">MediaHive/Incoming</span>
                        )}.
                    </p>
                </div>
                <button
                    onClick={handleScan}
                    disabled={scanning || !!processingId}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all"
                >
                    <RefreshCw size={20} className={scanning ? 'animate-spin' : ''} />
                    {scanning ? 'Scanning...' : 'Scan Now'}
                </button>
            </div>

            {loading ? (
                <div className="text-center py-12 text-white/30 animate-pulse">Loading queue...</div>
            ) : items.length === 0 ? (
                <div className="space-y-4">
                    <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-[#ffffff1a] rounded-xl bg-slate-900/20">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                            <HardDrive className="text-white/20" size={32} />
                        </div>
                        <h3 className="text-xl font-medium text-white/40 mb-2">Queue is empty</h3>
                        <p className="text-white/20 max-w-sm mx-auto">
                            Upload files to the Incoming folder and click Scan.
                        </p>
                    </div>

                    {scanLogs.length > 0 && (
                        <div className="mt-4 p-4 rounded-xl bg-black/40 border border-white/5">
                            <h4 className="text-xs font-mono text-white/50 mb-2 uppercase tracking-wide">Last Scan Debug Log</h4>
                            <div className="font-mono text-xs text-white/60 space-y-1 max-h-40 overflow-y-auto">
                                {scanLogs.map((log, i) => (
                                    <div key={i} className="whitespace-pre-wrap border-b border-white/5 pb-1 last:border-0">{log}</div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Bulk Selection Toolbar */}
                    <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3 sticky top-0 z-10 backdrop-blur-md">
                        <div className="flex items-center gap-3">
                            <Checkbox
                                id="select-all"
                                checked={items.length > 0 && selectedIds.size === items.length}
                                onCheckedChange={toggleAll}
                            />
                            <label htmlFor="select-all" className="text-sm font-medium text-white cursor-pointer select-none">
                                {selectedIds.size > 0 ? `${selectedIds.size} Selected` : 'Select All'}
                            </label>
                        </div>

                        {selectedIds.size > 0 && (
                            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-200">
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => initiateBulkAction('reject')}
                                    disabled={!!processingId}
                                >
                                    <X size={16} />
                                    Reject ({selectedIds.size})
                                </Button>
                                <Button
                                    variant="default" // Using default (primary) for Approve
                                    size="sm"
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white border-0"
                                    onClick={() => initiateBulkAction('approve')}
                                    disabled={!!processingId}
                                >
                                    <Check size={16} />
                                    Approve ({selectedIds.size})
                                </Button>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {items.map(item => (
                            <div
                                key={item.id}
                                className={`bg-[var(--bg-surface)] border rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center gap-4 transition-all duration-200 ${selectedIds.has(item.id)
                                    ? 'border-indigo-500/50 bg-indigo-500/5 shadow-[0_0_15px_rgba(99,102,241,0.1)]'
                                    : 'border-[var(--border-subtle)] hover:border-[var(--border-default)]'
                                    }`}
                            >
                                <div className="mt-1 md:mt-0">
                                    <Checkbox
                                        checked={selectedIds.has(item.id)}
                                        onCheckedChange={() => toggleSelect(item.id)}
                                    />
                                </div>

                                {/* Thumbnail / Icon */}
                                <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center shrink-0 overflow-hidden">
                                    {item.thumbnailLink ? (
                                        <img src={item.thumbnailLink} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <HardDrive size={24} className="text-white/40" />
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-medium text-white truncate text-lg">{item.name}</h4>
                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 opacity-75">
                                            <HardDrive size={10} />
                                            Detected from Drive
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-3 text-sm text-white/50 mt-1">
                                        <span className="bg-white/5 px-2 py-0.5 rounded text-xs uppercase tracking-wide">{item.mimeType.split('/').pop()}</span>
                                        <span>•</span>
                                        <span>{(item.size / 1024 / 1024).toFixed(2)} MB</span>
                                        <span>•</span>
                                        <span>{item.uploadedBy === 'Drive User' ? 'Uploaded via Drive' : item.uploadedBy}</span>
                                        <span>•</span>
                                        <span>
                                            {(() => {
                                                const date = parseFirestoreDate(item.detectedAt);
                                                return date ? `Detected ${formatDistanceToNow(date, { addSuffix: true })}` : '—';
                                            })()}
                                        </span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 w-full md:w-auto mt-2 md:mt-0">
                                    <a
                                        href={item.webViewLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="h-10 w-10 flex items-center justify-center rounded-lg hover:bg-white/5 text-white/70 transition-colors"
                                        title="Preview in Drive"
                                    >
                                        <ExternalLink size={20} />
                                    </a>

                                    <div className="h-6 w-px bg-white/10 mx-1 hidden md:block"></div>

                                    <button
                                        onClick={() => initiateSingleAction(item, 'reject')}
                                        title="Will not appear in Downloads"
                                        disabled={!!processingId || selectedIds.has(item.id)}
                                        className="flex-1 md:flex-none h-10 px-4 flex items-center justify-center gap-2 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-colors font-medium hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                                    >
                                        <X size={18} />
                                        Reject
                                    </button>

                                    <button
                                        onClick={() => initiateSingleAction(item, 'approve')}
                                        disabled={!!processingId || selectedIds.has(item.id)}
                                        className="flex-1 md:flex-none h-10 px-6 flex items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 transition-all font-medium hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                                    >
                                        {processingId === item.id ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                <Check size={18} />
                                                Approve & Publish
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Metadata / Approval Modal */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Approve & Publish</DialogTitle>
                        <DialogDescription>
                            {targetId
                                ? "Review updated details before publishing to Downloads."
                                : `Review details for ${selectedIds.size} selected items.`}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        {/* Single Item: File Preview & Name Edit */}
                        {targetId && (
                            <>
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Display Name</Label>
                                    <Input
                                        id="name"
                                        value={metadata.name}
                                        onChange={(e) => setMetadata({ ...metadata, name: e.target.value })}
                                    />
                                    <p className="text-xs text-muted-foreground">Original Drive filename: {items.find(i => i.id === targetId)?.name}</p>
                                </div>
                            </>
                        )}

                        {/* Bulk Item: Prefix/Suffix */}
                        {!targetId && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="prefix">Name Prefix (Optional)</Label>
                                    <Input
                                        id="prefix"
                                        placeholder="e.g. [Event A] "
                                        value={metadata.namePrefix}
                                        onChange={(e) => setMetadata({ ...metadata, namePrefix: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="suffix">Name Suffix (Optional)</Label>
                                    <Input
                                        id="suffix"
                                        placeholder="e.g. - Final"
                                        value={metadata.nameSuffix}
                                        onChange={(e) => setMetadata({ ...metadata, nameSuffix: e.target.value })}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Common Fields */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="category">Category (Auto)</Label>
                                <Select
                                    value={metadata.category}
                                    onValueChange={(val) => setMetadata({ ...metadata, category: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Documents">Documents</SelectItem>
                                        <SelectItem value="Photos">Photos</SelectItem>
                                        <SelectItem value="Videos">Videos</SelectItem>
                                        <SelectItem value="Audio">Audio</SelectItem>
                                        <SelectItem value="Archives">Archives</SelectItem>
                                        <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="visibility">Visibility</Label>
                                <Select
                                    value={metadata.visibility}
                                    onValueChange={(val) => setMetadata({ ...metadata, visibility: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Public (Visible to All)</SelectItem>
                                        <SelectItem value="internal">Internal (Admin & Team only)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="tags">Tags (Auto-Generated)</Label>
                            <Input
                                id="tags"
                                placeholder="Year, Type, Source..."
                                value={metadata.tags}
                                onChange={(e) => setMetadata({ ...metadata, tags: e.target.value })}
                            />
                            <p className="text-[10px] text-muted-foreground">Comma-separated values.</p>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="description">Description (Optional)</Label>
                            <Textarea
                                id="description"
                                placeholder="Add context regarding this file..."
                                className="resize-none"
                                rows={3}
                                value={metadata.description}
                                onChange={(e) => setMetadata({ ...metadata, description: e.target.value })}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
                        <Button onClick={confirmModal} className="bg-emerald-600 hover:bg-emerald-500 text-white">
                            Publish {targetId ? 'File' : 'Files'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
