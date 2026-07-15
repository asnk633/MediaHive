"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContextProvider';
import { usePermissions } from '@/hooks/usePermissions';
import { PageLayout } from "@/components/ui/layout/PageLayout";
import { PageHeader } from "@/components/ui/layout/PageHeader";
import { ExportModal } from "@/components/admin/intelligence/ExportModal";
import { UserService } from '@/services/userService';
import { cn, nativeNavigate } from '@/lib/utils';
import { toast } from 'sonner';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { 
    Calendar, 
    Users, 
    Clock, 
    Activity, 
    MapPin, 
    Wifi, 
    QrCode, 
    Plus, 
    Trash2, 
    Download, 
    Loader2, 
    Check, 
    AlertCircle, 
    Printer, 
    Search,
    ShieldAlert,
    Pencil
} from 'lucide-react';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function AdminAttendancePage() {
    const router = useRouter();
    const { user, authResolved } = useAuth();
    const { role: currentRole } = usePermissions();

    // Check if user has admin/manager roles
    const isAllowed = useMemo(() => {
        const role = user?.role || currentRole;
        return role === 'admin' || role === 'manager';
    }, [user, currentRole]);

    // Redirection if unauthorized
    useEffect(() => {
        if (authResolved && !isAllowed) {
            toast.error("Permission Denied: Admin or Manager role required");
            nativeNavigate('/home', router, 'page.tsx');
        }
    }, [isAllowed, authResolved, router]);

    // UI Tab State
    const [activeTab, setActiveTab] = useState<'logs' | 'nfc' | 'qr'>('logs');

    // Users and Filters State
    const [usersList, setUsersList] = useState<any[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');

    // Modal States
    const [exportOpen, setExportOpen] = useState(false);
    const [registerOpen, setRegisterOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [editingTag, setEditingTag] = useState<any>(null);

    // Form fields for editing
    const [editTagName, setEditTagName] = useState('');
    const [editTagId, setEditTagId] = useState('');
    const [editTagType, setEditTagType] = useState('attendance');
    const [editLatitude, setEditLatitude] = useState('');
    const [editLongitude, setEditLongitude] = useState('');
    const [editRadius, setEditRadius] = useState('50');
    const [editWifiSsids, setEditWifiSsids] = useState('');
    const [editCampusName, setEditCampusName] = useState('');
    const [editActive, setEditActive] = useState(true);

    // Logs Data State
    const [logs, setLogs] = useState<any[]>([]);
    const [logsLoading, setLogsLoading] = useState<boolean>(false);

    // NFC Tags Data State
    const [tags, setTags] = useState<any[]>([]);
    const [tagsLoading, setTagsLoading] = useState<boolean>(false);
    const [selectedTagId, setSelectedTagId] = useState<string>('');

    // Register NFC Spot Form State
    const [tagName, setTagName] = useState('');
    const [tagId, setTagId] = useState('');
    const [latitude, setLatitude] = useState('');
    const [longitude, setLongitude] = useState('');
    const [radius, setRadius] = useState('50');
    const [wifiSsids, setWifiSsids] = useState('');
    const [campusName, setCampusName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch Employees list for dropdown & exports
    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/admin/users');
            if (res.ok) {
                const data = await res.json();
                if (data && Array.isArray(data.users)) {
                    setUsersList(data.users);
                    return;
                }
            }
            // Fallback to local service call
            const data = await UserService.getAllUsers();
            setUsersList(data || []);
        } catch (err) {
            console.error('Error fetching users:', err);
            try {
                const data = await UserService.getAllUsers();
                setUsersList(data || []);
            } catch (e) {
                console.error('Fallback fetching users failed:', e);
            }
        }
    };

    // Fetch Attendance Logs
    const fetchLogs = async () => {
        if (!authResolved || !isAllowed) return;
        setLogsLoading(true);
        try {
            const params = new URLSearchParams();
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);
            if (selectedUserId && selectedUserId !== 'all') {
                params.append('userId', selectedUserId);
            }
            params.append('limit', '100');

            const res = await fetch(`/api/admin/attendance?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setLogs(Array.isArray(data) ? data : []);
            } else {
                toast.error('Failed to load attendance logs');
            }
        } catch (err) {
            console.error('Error fetching logs:', err);
            toast.error('Error loading attendance logs');
        } finally {
            setLogsLoading(false);
        }
    };

    // Fetch NFC Tags
    const fetchTags = async () => {
        if (!authResolved || !isAllowed) return;
        setTagsLoading(true);
        try {
            const res = await fetch('/api/admin/nfc-tags');
            if (res.ok) {
                const data = await res.json();
                const activeTags = Array.isArray(data) ? data.filter(t => !t.deletedAt) : [];
                setTags(activeTags);
            } else {
                toast.error('Failed to load NFC spots');
            }
        } catch (err) {
            console.error('Error fetching tags:', err);
            toast.error('Error loading NFC spots');
        } finally {
            setTagsLoading(false);
        }
    };

    // Initial and conditional loading
    useEffect(() => {
        if (authResolved && isAllowed) {
            fetchUsers();
            fetchTags();
        }
    }, [authResolved, isAllowed]);

    // Refetch logs on filters change
    useEffect(() => {
        if (authResolved && isAllowed) {
            fetchLogs();
        }
    }, [startDate, endDate, selectedUserId, authResolved, isAllowed]);

    // Toggle Active Status on Tag
    const handleToggleActive = async (id: string, currentActive: boolean) => {
        try {
            const res = await fetch(`/api/admin/nfc-tags/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ active: !currentActive }),
            });
            if (res.ok) {
                toast.success('NFC Spot status updated');
                fetchTags();
            } else {
                toast.error('Failed to update NFC Spot');
            }
        } catch (err) {
            console.error('Error toggling active state:', err);
            toast.error('Error updating NFC Spot');
        }
    };

    // Soft-Delete Tag
    const handleDeleteTag = async (id: string) => {
        if (!confirm('Are you sure you want to delete this NFC check-in spot?')) return;
        try {
            const res = await fetch(`/api/admin/nfc-tags/${id}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                toast.success('NFC Spot deleted successfully');
                fetchTags();
                if (selectedTagId === id) {
                    setSelectedTagId('');
                }
            } else {
                toast.error('Failed to delete NFC Spot');
            }
        } catch (err) {
            console.error('Error deleting tag:', err);
            toast.error('Error deleting NFC Spot');
        }
    };

    // Register new NFC Spot
    const handleRegisterTag = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!tagName || !tagId || !latitude || !longitude || !radius) {
            toast.error('Please fill in all required fields');
            return;
        }
        setIsSubmitting(true);
        try {
            const res = await fetch('/api/admin/nfc-tags', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tagName,
                    tagId,
                    tagType: 'attendance',
                    latitude: parseFloat(latitude),
                    longitude: parseFloat(longitude),
                    radius: parseFloat(radius),
                    wifiSsids: wifiSsids || null,
                    campusName: campusName || null,
                }),
            });
            if (res.ok) {
                toast.success('NFC Spot registered successfully');
                setRegisterOpen(false);
                // Clear fields
                setTagName('');
                setTagId('');
                setLatitude('');
                setLongitude('');
                setRadius('50');
                setWifiSsids('');
                setCampusName('');
                fetchTags();
            } else {
                const data = await res.json();
                toast.error(data.error || 'Failed to register NFC Spot');
            }
        } catch (err) {
            console.error('Error registering spot:', err);
            toast.error('Error registering NFC Spot');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOpenEdit = (tag: any) => {
        setEditingTag(tag);
        setEditTagName(tag.tagName || '');
        setEditTagId(tag.tagId || '');
        setEditTagType(tag.tagType || 'attendance');
        setEditLatitude(tag.latitude !== undefined ? String(tag.latitude) : '');
        setEditLongitude(tag.longitude !== undefined ? String(tag.longitude) : '');
        setEditRadius(tag.radius !== undefined ? String(tag.radius) : '50');
        setEditWifiSsids(tag.wifiSsids || tag.wifi_ssids || '');
        setEditCampusName(tag.campusName || '');
        setEditActive(tag.active !== false);
        setEditOpen(true);
    };

    const handleUpdateTag = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editTagName || !editTagId || !editLatitude || !editLongitude || !editRadius) {
            toast.error('Please fill in all required fields');
            return;
        }
        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/admin/nfc-tags/${editingTag.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tagName: editTagName,
                    tagId: editTagId,
                    tagType: editTagType,
                    latitude: parseFloat(editLatitude),
                    longitude: parseFloat(editLongitude),
                    radius: parseFloat(editRadius),
                    wifiSsids: editWifiSsids || null,
                    campusName: editCampusName || null,
                    active: editActive,
                }),
            });
            if (res.ok) {
                toast.success('NFC Spot updated successfully');
                setEditOpen(false);
                fetchTags();
            } else {
                const data = await res.json();
                toast.error(data.error || 'Failed to update NFC Spot');
            }
        } catch (err) {
            console.error('Error updating spot:', err);
            toast.error('Error updating NFC Spot');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Auto-select first tag if none selected
    useEffect(() => {
        if (tags.length > 0 && !selectedTagId) {
            setSelectedTagId(tags[0].id);
        }
    }, [tags, selectedTagId]);

    const selectedTag = useMemo(() => {
        return tags.find(t => t.id === selectedTagId);
    }, [tags, selectedTagId]);

    // Client-side status filters for logs
    const filteredLogs = useMemo(() => {
        if (statusFilter === 'all') return logs;

        return logs.filter(log => {
            const status = (log.status || '').toLowerCase();
            if (statusFilter === 'present') return status === 'present';
            if (statusFilter === 'late') return status === 'late';
            if (statusFilter === 'half_day') return status === 'half_day' || status === 'half day';
            if (statusFilter === 'excused') return status === 'excused';
            if (statusFilter === 'active') return !log.checkOut;
            return true;
        });
    }, [logs, statusFilter]);

    // Metric Calculations
    const metrics = useMemo(() => {
        const total = logs.length;
        const present = logs.filter(l => (l.status || '').toLowerCase() === 'present').length;
        const late = logs.filter(l => (l.status || '').toLowerCase() === 'late').length;
        const active = logs.filter(l => !l.checkOut).length;

        return { total, present, late, active };
    }, [logs]);

    // Format users list for the export modal
    const availableUsersForExport = useMemo(() => {
        return usersList.map((u: any) => {
            let numericId = 0;
            if (typeof u.id === 'number') {
                numericId = u.id;
            } else if (typeof u.uid === 'number') {
                numericId = u.uid;
            } else {
                numericId = parseInt(String(u.id || u.uid || 0), 10) || 0;
            }
            return {
                id: numericId,
                name: u.fullName || u.name || u.email || 'Unknown User'
            };
        });
    }, [usersList]);

    // Trigger standard print dialog
    const handlePrint = () => {
        window.print();
    };

    // Access control fallback layout during verification or redirection
    if (!authResolved) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-10 w-10 animate-spin text-amber-500" />
                    <span className="text-zinc-400 font-medium">Verifying authorization details...</span>
                </div>
            </div>
        );
    }

    if (!isAllowed) {
        return (
            <div className="flex items-center justify-center min-h-[60vh] px-4">
                <div className="max-w-md w-full bg-card p-8 rounded-3xl border border-border text-center space-y-6">
                    <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-400 mx-auto border border-red-500/20">
                        <ShieldAlert size={32} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white mb-2">Access Denied</h1>
                        <p className="text-sm text-zinc-400 leading-relaxed">
                            You must be an administrator or manager to view the attendance dashboards.
                            Redirection back to the home page is underway.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <PageLayout mode="plain" className="px-6 py-8 text-white min-h-screen">
            {/* Embedded Inline CSS for High-Fidelity Badge Printing */}
            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #printable-qr-card, #printable-qr-card * {
                        visibility: visible;
                    }
                    #printable-qr-card {
                        position: fixed;
                        left: 50%;
                        top: 50%;
                        transform: translate(-50%, -50%) scale(1.5);
                        border: none !important;
                        background: white !important;
                        color: black !important;
                        box-shadow: none !important;
                    }
                    /* Ensure print handles colors cleanly */
                    html, body {
                        background: white !important;
                        color: black !important;
                        height: 100%;
                        overflow: hidden;
                    }
                }
            ` }} />

            <PageHeader 
                title="Attendance Control Hub"
                description="Manage physical NFC tags, print check-in badges, and audit active employee attendance sessions"
            />

            {/* Tab Navigation */}
            <div className="flex border-b border-border mt-8 mb-8 overflow-x-auto">
                <button
                    onClick={() => setActiveTab('logs')}
                    className={cn(
                        "flex items-center gap-2 px-6 py-4 text-xs sm:text-sm font-semibold tracking-wider uppercase border-b-2 transition-all duration-200 whitespace-nowrap",
                        activeTab === 'logs'
                            ? "border-primary text-primary bg-primary/5"
                            : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30"
                    )}
                >
                    <Clock size={16} />
                    Attendance Logs
                </button>
                <button
                    onClick={() => setActiveTab('nfc')}
                    className={cn(
                        "flex items-center gap-2 px-6 py-4 text-xs sm:text-sm font-semibold tracking-wider uppercase border-b-2 transition-all duration-200 whitespace-nowrap",
                        activeTab === 'nfc'
                            ? "border-primary text-primary bg-primary/5"
                            : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30"
                    )}
                >
                    <MapPin size={16} />
                    NFC Registry
                </button>
                <button
                    onClick={() => setActiveTab('qr')}
                    className={cn(
                        "flex items-center gap-2 px-6 py-4 text-xs sm:text-sm font-semibold tracking-wider uppercase border-b-2 transition-all duration-200 whitespace-nowrap",
                        activeTab === 'qr'
                            ? "border-primary text-primary bg-primary/5"
                            : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30"
                    )}
                >
                    <QrCode size={16} />
                    QR Code Center
                </button>
            </div>

            {/* TAB CONTENT: ATTENDANCE LOGS */}
            {activeTab === 'logs' && (
                <div className="space-y-8 animate-in fade-in duration-300">
                    {/* Metric Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Total Logs */}
                        <div className="bg-card border border-border rounded-2xl p-6 flex items-center justify-between shadow-sm">
                            <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Logs</p>
                                <p className="text-3xl font-black text-foreground mt-2">{metrics.total}</p>
                            </div>
                            <div className="p-3 bg-primary/10 text-primary rounded-xl border border-primary/20">
                                <Activity size={20} />
                            </div>
                        </div>

                        {/* Present Today */}
                        <div className="bg-card border border-border rounded-2xl p-6 flex items-center justify-between shadow-sm">
                            <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Present Today</p>
                                <p className="text-3xl font-black text-foreground mt-2">{metrics.present}</p>
                            </div>
                            <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl border border-emerald-500/20">
                                <Check size={20} />
                            </div>
                        </div>

                        {/* Late Arrivals */}
                        <div className="bg-card border border-border rounded-2xl p-6 flex items-center justify-between shadow-sm">
                            <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Late Arrivals</p>
                                <p className="text-3xl font-black text-foreground mt-2">{metrics.late}</p>
                            </div>
                            <div className="p-3 bg-orange-500/10 text-orange-500 rounded-xl border border-orange-500/20">
                                <Clock size={20} />
                            </div>
                        </div>

                        {/* Active Sessions */}
                        <div className="bg-card border border-border rounded-2xl p-6 flex items-center justify-between shadow-sm">
                            <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Sessions</p>
                                <p className="text-3xl font-black text-foreground mt-2">{metrics.active}</p>
                            </div>
                            <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-xl border border-indigo-500/20">
                                <Users size={20} />
                            </div>
                        </div>
                    </div>

                    {/* Filter Controls Box */}
                    <div className="bg-card border border-border rounded-2xl p-6 space-y-6 shadow-sm">
                        <div className="flex items-center justify-between border-b border-border pb-4">
                            <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-widest">Filter Controls</h3>
                            <button
                                onClick={() => setExportOpen(true)}
                                className="flex items-center gap-2 bg-muted hover:bg-muted/80 border border-border px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors text-foreground"
                            >
                                <Download size={14} className="text-primary" /> Export Logs
                            </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Start Date</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full bg-background border border-border text-foreground rounded-xl px-4 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">End Date</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full bg-background border border-border text-foreground rounded-xl px-4 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Employee</label>
                                <select
                                    value={selectedUserId}
                                    onChange={(e) => setSelectedUserId(e.target.value)}
                                    className="w-full bg-background border border-border text-foreground rounded-xl px-4 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                                >
                                    <option value="all">All Employees</option>
                                    {usersList.map((u) => (
                                        <option key={u.id ?? u.uid} value={u.id ?? u.uid}>
                                            {u.fullName || u.name || u.email}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</label>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="w-full bg-background border border-border text-foreground rounded-xl px-4 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                                >
                                    <option value="all">All Statuses</option>
                                    <option value="present">Present</option>
                                    <option value="late">Late</option>
                                    <option value="half_day">Half Day</option>
                                    <option value="excused">Excused</option>
                                    <option value="active">Active (On Duty)</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Logs Table */}
                    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-left">
                                <thead>
                                    <tr className="border-b border-border bg-muted/40 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                        <th className="p-4 sm:p-5">Employee</th>
                                        <th className="p-4 sm:p-5">Date</th>
                                        <th className="p-4 sm:p-5">Check-In</th>
                                        <th className="p-4 sm:p-5">Check-Out</th>
                                        <th className="p-4 sm:p-5">Worked Time</th>
                                        <th className="p-4 sm:p-5">Status</th>
                                        <th className="p-4 sm:p-5">Notes</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border text-sm text-foreground">
                                    {logsLoading ? (
                                        <tr>
                                            <td colSpan={7} className="text-center py-12">
                                                <div className="flex flex-col items-center gap-3">
                                                    <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                                                    <span className="text-zinc-500">Loading attendance logs...</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : filteredLogs.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="text-center py-12 text-zinc-500">
                                                No logs found matching filters.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredLogs.map((log) => {
                                            const checkInDate = new Date(log.checkIn);
                                            const dateStr = checkInDate.toLocaleDateString(undefined, {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric'
                                            });
                                            const checkInTime = checkInDate.toLocaleTimeString(undefined, {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            });
                                            const checkOutTime = log.checkOut 
                                                ? new Date(log.checkOut).toLocaleTimeString(undefined, {
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })
                                                : null;

                                            // Status badge custom styling matching Charcoal Honey
                                            const statusLower = (log.status || '').toLowerCase();
                                            let badgeClass = 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20';
                                            let statusText = log.status || 'Unknown';

                                            if (!log.checkOut) {
                                                badgeClass = 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 animate-pulse';
                                                statusText = 'Active';
                                            } else if (statusLower === 'present') {
                                                badgeClass = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
                                                statusText = 'Present';
                                            } else if (statusLower === 'late') {
                                                badgeClass = 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
                                                statusText = 'Late';
                                            } else if (statusLower === 'half_day' || statusLower === 'half day') {
                                                badgeClass = 'bg-orange-500/10 text-orange-400 border border-orange-500/20';
                                                statusText = 'Half Day';
                                            } else if (statusLower === 'excused') {
                                                badgeClass = 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
                                                statusText = 'Excused';
                                            }

                                            // Displaying hours & minutes worked
                                            let workedStr = '—';
                                            if (log.checkOut && typeof log.workedMinutes === 'number') {
                                                if (log.workedMinutes >= 60) {
                                                    workedStr = `${Math.floor(log.workedMinutes / 60)}h ${log.workedMinutes % 60}m`;
                                                } else {
                                                    workedStr = `${log.workedMinutes} mins`;
                                                }
                                            } else if (!log.checkOut) {
                                                workedStr = 'In Progress';
                                            }

                                            return (
                                                <tr key={log.id} className="hover:bg-muted/30 transition-colors border-b border-border">
                                                    <td className="p-4 sm:p-5">
                                                        <div className="flex items-center gap-3">
                                                            <Avatar className="h-8 w-8">
                                                                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold border border-primary/20">
                                                                    {(log.fullName || log.email || 'U').charAt(0).toUpperCase()}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div>
                                                                <p className="font-semibold text-foreground">{log.fullName || 'Unknown'}</p>
                                                                <p className="text-xs text-muted-foreground">{log.email}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 sm:p-5 text-foreground/90 font-medium">{dateStr}</td>
                                                    <td className="p-4 sm:p-5 text-foreground/90 font-medium">{checkInTime}</td>
                                                    <td className="p-4 sm:p-5 text-foreground/90 font-medium">
                                                        {checkOutTime ? (
                                                            checkOutTime
                                                        ) : (
                                                            <span className="text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-1 rounded-full animate-pulse">
                                                                Active
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="p-4 sm:p-5 text-foreground/90 font-medium">{workedStr}</td>
                                                    <td className="p-4 sm:p-5">
                                                        <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full", badgeClass)}>
                                                            {statusText}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 sm:p-5 text-muted-foreground text-xs max-w-xs truncate" title={log.notes}>
                                                        {log.notes || '—'}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: NFC REGISTRY */}
            {activeTab === 'nfc' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                        <div>
                            <h3 className="font-bold text-lg text-foreground">Registered Check-In Spots</h3>
                            <p className="text-xs text-muted-foreground mt-1">Manage physical NFC tags, coordinates, and WiFi validation networks</p>
                        </div>
                        <button
                            onClick={() => setRegisterOpen(true)}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-primary/10 text-sm w-fit"
                        >
                            <Plus size={16} /> Register NFC Spot
                        </button>
                    </div>

                    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-left">
                                <thead>
                                    <tr className="border-b border-border bg-muted/40 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                        <th className="p-4 sm:p-5">Spot/Tag Name</th>
                                        <th className="p-4 sm:p-5">Physical Tag ID</th>
                                        <th className="p-4 sm:p-5">Type</th>
                                        <th className="p-4 sm:p-5">Coordinates</th>
                                        <th className="p-4 sm:p-5">Radius</th>
                                        <th className="p-4 sm:p-5">WiFi SSIDs</th>
                                        <th className="p-4 sm:p-5">Created At</th>
                                        <th className="p-4 sm:p-5">Status</th>
                                        <th className="p-4 sm:p-5 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border text-sm text-foreground">
                                    {tagsLoading ? (
                                        <tr>
                                            <td colSpan={9} className="text-center py-12">
                                                <div className="flex flex-col items-center gap-3">
                                                    <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                                                    <span className="text-zinc-500">Loading check-in spots...</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : tags.length === 0 ? (
                                        <tr>
                                            <td colSpan={9} className="text-center py-12 text-zinc-500">
                                                No NFC check-in spots registered yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        tags.map((tag) => {
                                            const createdStr = tag.createdAt 
                                                ? new Date(tag.createdAt).toLocaleDateString(undefined, {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                })
                                                : '—';
                                            return (
                                                <tr key={tag.id} className="hover:bg-muted/30 transition-colors border-b border-border">
                                                    <td className="p-4 sm:p-5 font-semibold text-foreground">{tag.tagName}</td>
                                                    <td className="p-4 sm:p-5 text-muted-foreground font-mono text-xs">{tag.tagId}</td>
                                                    <td className="p-4 sm:p-5 text-foreground capitalize">{tag.tagType}</td>
                                                    <td className="p-4 sm:p-5 text-foreground font-mono text-xs">
                                                        {tag.latitude.toFixed(5)}, {tag.longitude.toFixed(5)}
                                                    </td>
                                                    <td className="p-4 sm:p-5 text-muted-foreground">{tag.radius}m</td>
                                                    <td className="p-4 sm:p-5 text-muted-foreground font-mono text-xs truncate max-w-[120px]" title={tag.wifiSsids}>
                                                        {tag.wifiSsids || '—'}
                                                    </td>
                                                    <td className="p-4 sm:p-5 text-muted-foreground text-xs">{createdStr}</td>
                                                    <td className="p-4 sm:p-5">
                                                        <button
                                                            onClick={() => handleToggleActive(tag.id, tag.active)}
                                                            className="transition-opacity active:scale-95"
                                                            title="Toggle Active status"
                                                        >
                                                            {tag.active ? (
                                                                <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                                                                    <Check size={10} /> Active
                                                                </span>
                                                            ) : (
                                                                <span className="flex items-center gap-1.5 text-zinc-400 text-xs font-semibold bg-zinc-500/10 border border-zinc-500/20 px-2.5 py-1 rounded-full">
                                                                    <AlertCircle size={10} /> Inactive
                                                                </span>
                                                            )}
                                                        </button>
                                                    </td>
                                                    <td className="p-4 sm:p-5 text-right flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => handleOpenEdit(tag)}
                                                            className="p-2 bg-zinc-500/15 text-amber-500 hover:bg-zinc-500/25 rounded-xl transition-colors inline-flex items-center justify-center border border-zinc-500/10"
                                                            title="Edit Spot"
                                                        >
                                                            <Pencil size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteTag(tag.id)}
                                                            className="p-2 bg-red-500/15 text-red-400 hover:bg-red-500/25 rounded-xl transition-colors inline-flex items-center justify-center border border-red-500/10"
                                                            title="Delete Spot"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: QR CODE CENTER */}
            {activeTab === 'qr' && (
                <div className="max-w-md mx-auto space-y-6 animate-in fade-in duration-300">
                    <div className="bg-card border border-border rounded-2xl p-6 space-y-4 shadow-sm">
                        <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-widest">Select Check-In Spot</h3>
                        <select
                            value={selectedTagId}
                            onChange={(e) => setSelectedTagId(e.target.value)}
                            className="w-full bg-background border border-border text-foreground rounded-xl px-4 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                        >
                            {tags.length === 0 ? (
                                <option value="">No spots registered</option>
                            ) : (
                                tags.map((t) => (
                                    <option key={t.id} value={t.id}>
                                        {t.tagName} ({t.tagId})
                                    </option>
                                ))
                            )}
                        </select>
                    </div>

                    {selectedTag ? (
                        <div className="space-y-6 flex flex-col items-center">
                            {/* Card Container styled for print & display */}
                            <div 
                                id="printable-qr-card" 
                                className="w-full max-w-sm bg-card border border-border rounded-3xl p-8 flex flex-col items-center text-center shadow-xl space-y-6 text-foreground"
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="font-black tracking-widest text-sm uppercase text-primary">MEDIAHIVE CHECK-IN SPOT</span>
                                </div>

                                <div className="w-full border-t border-dashed border-border my-1" />

                                <div>
                                    <h3 className="text-xl font-bold">{selectedTag.tagName}</h3>
                                    <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">Spot ID: {selectedTag.tagId}</p>
                                </div>

                                {/* QR Code Image */}
                                <div className="bg-white p-4 rounded-2xl shadow-inner flex items-center justify-center">
                                    <img 
                                        src={(() => {
                                            // Build the full deep-link first, THEN encode the entire thing as the `data` param.
                                            // If we inline &sig= directly, the ampersand is treated as a qrserver.com query
                                            // separator — the sig gets stripped and the scanned URL has no signature.
                                            const deepLink = `mediahive://attendance/scan?tagId=${encodeURIComponent(selectedTag.tagId || '')}${selectedTag.qrSignature ? `&sig=${encodeURIComponent(selectedTag.qrSignature)}` : ''}`;
                                            return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(deepLink)}`;
                                        })()} 
                                        alt={`QR Code for ${selectedTag.tagName}`} 
                                        className="w-48 h-48"
                                    />
                                </div>

                                {/* Dynamic Spot Details */}
                                <div className="w-full space-y-2 text-xs text-muted-foreground text-left bg-muted/40 p-4 rounded-xl border border-border">
                                    <div className="flex items-center gap-1.5">
                                        <MapPin size={12} className="text-primary shrink-0" />
                                        <span className="truncate">Coordinates: {selectedTag.latitude.toFixed(6)}, {selectedTag.longitude.toFixed(6)} (Radius: {selectedTag.radius}m)</span>
                                    </div>
                                    {selectedTag.wifiSsids && (
                                        <div className="flex items-center gap-1.5">
                                            <Wifi size={12} className="text-primary shrink-0" />
                                            <span className="truncate">WiFi network: {selectedTag.wifiSsids}</span>
                                        </div>
                                    )}
                                    {selectedTag.campusName && (
                                        <div className="flex items-center gap-1.5">
                                            <Calendar size={12} className="text-primary shrink-0" />
                                            <span className="truncate">Campus: {selectedTag.campusName}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="w-full border-t border-dashed border-border my-1" />

                                <p className="text-xs font-semibold text-primary uppercase tracking-widest animate-pulse">
                                    Scan QR or Tap NFC to Check In/Out
                                </p>
                            </div>

                            <button
                                onClick={handlePrint}
                                className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-full font-bold transition-all shadow-lg shadow-primary/20 text-sm"
                            >
                                <Printer size={16} /> Print Spot Badge
                            </button>
                        </div>
                    ) : (
                        <div className="text-center py-12 border border-dashed border-border rounded-2xl text-muted-foreground">
                            <QrCode size={48} className="mx-auto mb-4 opacity-50" />
                            <p className="text-sm">Please register or select a check-in spot to view the printable badge.</p>
                        </div>
                    )}
                </div>
            )}

            {/* EXPORT COMPLIANCE MODAL */}
            <ExportModal 
                isOpen={exportOpen} 
                onClose={() => setExportOpen(false)} 
                availableUsers={availableUsersForExport}
            />

            {/* REGISTER NFC SPOT MODAL DIALOG */}
            <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
                <DialogContent className="bg-popover border border-border text-foreground max-w-md rounded-2xl shadow-2xl p-6">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-foreground">Register NFC Check-In Spot</DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            Create a geofenced location spot for physical NFC check-in validation.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <form onSubmit={handleRegisterTag} className="space-y-4 mt-4">
                        <div>
                            <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Spot Name *</Label>
                            <Input
                                type="text"
                                required
                                placeholder="e.g. Downtown Lobby Entrance"
                                value={tagName}
                                onChange={(e) => setTagName(e.target.value)}
                                className="bg-background border-border text-foreground focus:border-primary focus:ring-primary"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Physical Tag ID *</Label>
                                <Input
                                    type="text"
                                    required
                                    placeholder="e.g. NFC_LOBBY_A"
                                    value={tagId}
                                    onChange={(e) => setTagId(e.target.value)}
                                    className="bg-background border-border text-foreground focus:border-primary focus:ring-primary"
                                />
                            </div>
                            <div>
                                <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Radius (meters) *</Label>
                                <Input
                                    type="number"
                                    required
                                    placeholder="50"
                                    value={radius}
                                    onChange={(e) => setRadius(e.target.value)}
                                    className="bg-background border-border text-foreground focus:border-primary focus:ring-primary"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Latitude *</Label>
                                <Input
                                    type="number"
                                    step="any"
                                    required
                                    placeholder="e.g. 13.756"
                                    value={latitude}
                                    onChange={(e) => setLatitude(e.target.value)}
                                    className="bg-background border-border text-foreground focus:border-primary focus:ring-primary"
                                />
                            </div>
                            <div>
                                <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Longitude *</Label>
                                <Input
                                    type="number"
                                    step="any"
                                    required
                                    placeholder="e.g. 100.50"
                                    value={longitude}
                                    onChange={(e) => setLongitude(e.target.value)}
                                    className="bg-background border-border text-foreground focus:border-primary focus:ring-primary"
                                />
                            </div>
                        </div>
                        <div>
                            <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Campus Name (Optional)</Label>
                            <Input
                                type="text"
                                placeholder="e.g. Downtown Campus"
                                value={campusName}
                                onChange={(e) => setCampusName(e.target.value)}
                                className="bg-background border-border text-foreground focus:border-primary focus:ring-primary"
                            />
                        </div>
                        <div>
                            <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">WiFi SSIDs (Optional, comma-separated)</Label>
                            <Input
                                type="text"
                                placeholder="e.g. MediaHive_HQ, MediaHive_Backup"
                                value={wifiSsids}
                                onChange={(e) => setWifiSsids(e.target.value)}
                                className="bg-background border-border text-foreground focus:border-primary focus:ring-primary"
                            />
                        </div>
                        <div className="flex justify-end gap-3 pt-4 border-t border-border">
                            <button
                                type="button"
                                onClick={() => setRegisterOpen(false)}
                                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 disabled:opacity-50"
                            >
                                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : null}
                                Register Spot
                            </button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* EDIT NFC SPOT MODAL DIALOG */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent className="bg-popover border border-border text-foreground max-w-md rounded-2xl shadow-2xl p-6">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-foreground">Edit NFC Check-In Spot</DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            Update the geofenced location spot and physical validation settings.
                        </DialogDescription>
                    </DialogHeader>
                    
                    {editingTag && (
                        <form onSubmit={handleUpdateTag} className="space-y-4 mt-4">
                            <div>
                                <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Spot Name *</Label>
                                <Input
                                    type="text"
                                    required
                                    placeholder="e.g. Downtown Lobby Entrance"
                                    value={editTagName}
                                    onChange={(e) => setEditTagName(e.target.value)}
                                    className="bg-background border-border text-foreground focus:border-primary focus:ring-primary"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-xs font-semibold text-zinc-400 mb-1.5 block">Physical Tag ID *</Label>
                                    <Input
                                        type="text"
                                        required
                                        placeholder="e.g. NFC_LOBBY_A"
                                        value={editTagId}
                                        onChange={(e) => setEditTagId(e.target.value)}
                                        className="bg-background border-border text-foreground focus:border-primary focus:ring-primary"
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs font-semibold text-zinc-400 mb-1.5 block">Radius (meters) *</Label>
                                    <Input
                                        type="number"
                                        required
                                        placeholder="50"
                                        value={editRadius}
                                        onChange={(e) => setEditRadius(e.target.value)}
                                        className="bg-background border-border text-foreground focus:border-primary focus:ring-primary"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-xs font-semibold text-zinc-400 mb-1.5 block">Latitude *</Label>
                                    <Input
                                        type="number"
                                        step="any"
                                        required
                                        placeholder="e.g. 13.756"
                                        value={editLatitude}
                                        onChange={(e) => setEditLatitude(e.target.value)}
                                        className="bg-background border-border text-foreground focus:border-primary focus:ring-primary"
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs font-semibold text-zinc-400 mb-1.5 block">Longitude *</Label>
                                    <Input
                                        type="number"
                                        step="any"
                                        required
                                        placeholder="e.g. 100.50"
                                        value={editLongitude}
                                        onChange={(e) => setEditLongitude(e.target.value)}
                                        className="bg-background border-border text-foreground focus:border-primary focus:ring-primary"
                                    />
                                </div>
                            </div>
                            <div>
                                <Label className="text-xs font-semibold text-zinc-400 mb-1.5 block">Campus Name (Optional)</Label>
                                <Input
                                    type="text"
                                    placeholder="e.g. Downtown Campus"
                                    value={editCampusName}
                                    onChange={(e) => setEditCampusName(e.target.value)}
                                    className="bg-background border-border text-foreground focus:border-primary focus:ring-primary"
                                />
                            </div>
                            <div>
                                <Label className="text-xs font-semibold text-zinc-400 mb-1.5 block">WiFi SSIDs (Optional, comma-separated)</Label>
                                <Input
                                    type="text"
                                    placeholder="e.g. MediaHive_HQ, MediaHive_Backup"
                                    value={editWifiSsids}
                                    onChange={(e) => setEditWifiSsids(e.target.value)}
                                    className="bg-background border-border text-foreground focus:border-primary focus:ring-primary"
                                />
                            </div>
                            <div>
                                <Label className="text-xs font-semibold text-zinc-400 mb-1.5 block">Tag Type *</Label>
                                <select
                                    value={editTagType}
                                    onChange={(e) => setEditTagType(e.target.value)}
                                    className="w-full bg-background border border-border text-foreground rounded-xl px-4 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                                >
                                    <option value="attendance">Attendance</option>
                                    <option value="equipment">Equipment</option>
                                    <option value="vehicle">Vehicle</option>
                                    <option value="location">Location</option>
                                    <option value="field_work">Field Work</option>
                                    <option value="mixed">Mixed</option>
                                </select>
                            </div>
                            <div className="flex items-center gap-2 py-2">
                                <input
                                    type="checkbox"
                                    id="editActive"
                                    checked={editActive}
                                    onChange={(e) => setEditActive(e.target.checked)}
                                    className="rounded border-border bg-background text-primary focus:ring-primary h-4 w-4"
                                />
                                <Label htmlFor="editActive" className="text-xs font-semibold text-zinc-400 cursor-pointer">
                                    Active Status
                                </Label>
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-border">
                                <button
                                    type="button"
                                    onClick={() => setEditOpen(false)}
                                    className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : null}
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </PageLayout>
    );
}
