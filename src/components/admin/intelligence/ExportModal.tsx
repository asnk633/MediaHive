"use client";

import { useState, useEffect } from 'react';
import { X, Download, FileText, Calendar, Users, Building, ShieldAlert, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DateSelector } from '@/components/ui/selectors/DateSelector';
import { DropdownSelector } from '@/components/ui/selectors/DropdownSelector';

type ExportType = 'department' | 'attendance' | 'user';
type ExportFormat = 'csv' | 'json';

interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    availableUsers: { id: number; name: string }[]; // Users available for selection
}

export function ExportModal({ isOpen, onClose, availableUsers }: ExportModalProps) {
    const [exportType, setExportType] = useState<ExportType>('department');
    const [format, setFormat] = useState<ExportFormat>('csv');
    const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [selectedUserId, setSelectedUserId] = useState<number | ''>('');

    const [loading, setLoading] = useState(false);
    const [acknowledged, setAcknowledged] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const hasAck = localStorage.getItem('admin_compliance_acknowledged_v1');
            if (hasAck) setAcknowledged(true);
        }
    }, [isOpen]);

    const handleAcknowledge = () => {
        localStorage.setItem('admin_compliance_acknowledged_v1', 'true');
        setAcknowledged(true);
    };

    const handleExport = () => {
        setLoading(true);
        try {
            let url = '';
            const params = new URLSearchParams();
            params.append('format', format);

            if (exportType === 'department') {
                // Defaulting to "current" or "1" for now as we treat Department Health as Tenant Health
                url = `/api/admin/exports/department/1`;
                params.append('period', period);
            } else if (exportType === 'attendance') {
                url = `/api/admin/exports/attendance`;
                if (dateFrom) params.append('from', dateFrom);
                if (dateTo) params.append('to', dateTo);
            } else if (exportType === 'user') {
                if (!selectedUserId) {
                    alert('Please select a user');
                    setLoading(false);
                    return;
                }
                url = `/api/admin/exports/user/${selectedUserId}`;
                params.append('period', period);
            }

            // Trigger download
            const fullUrl = `${url}?${params.toString()}`;
            window.open(fullUrl, '_blank');

            // Optional: Close modal after short delay? Keep open for multiple exports.
            // onClose();
        } catch (error) {
            console.error('Export failed:', error);
        } finally {
            setTimeout(() => setLoading(false), 1000);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={onClose} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-[#0a0c10] border border-[#ffffff1a] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-[#ffffff1a] bg-foreground/5">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-500/20 rounded-lg">
                                <Download size={20} className="text-indigo-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-foreground">Export Data</h2>
                                <p className="text-xs text-gray-400">Secure, audited data export</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-foreground/10 text-gray-400 hover:text-foreground transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>



                    {/* Content (Hidden until acknowledged) */}
                    {acknowledged && (
                        <div className="p-6 space-y-6">

                            {/* Type Selector */}
                            <div>
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 block">Export Type</label>
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        onClick={() => setExportType('department')}
                                        className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${exportType === 'department'
                                            ? 'bg-indigo-600 border-indigo-500 text-foreground shadow-lg shadow-indigo-900/20'
                                            : 'bg-foreground/5 border-[#ffffff1a] text-gray-400 hover:bg-foreground/10'
                                            }`}
                                    >
                                        <Building size={20} className="mb-2" />
                                        <span className="text-xs font-medium">Department / Institution</span>
                                    </button>
                                    <button
                                        onClick={() => setExportType('attendance')}
                                        className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${exportType === 'attendance'
                                            ? 'bg-indigo-600 border-indigo-500 text-foreground shadow-lg shadow-indigo-900/20'
                                            : 'bg-foreground/5 border-[#ffffff1a] text-gray-400 hover:bg-foreground/10'
                                            }`}
                                    >
                                        <Users size={20} className="mb-2" />
                                        <span className="text-xs font-medium">Attendance</span>
                                    </button>
                                    <button
                                        onClick={() => setExportType('user')}
                                        className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${exportType === 'user'
                                            ? 'bg-indigo-600 border-indigo-500 text-foreground shadow-lg shadow-indigo-900/20'
                                            : 'bg-foreground/5 border-[#ffffff1a] text-gray-400 hover:bg-foreground/10'
                                            }`}
                                    >
                                        <FileText size={20} className="mb-2" />
                                        <span className="text-xs font-medium">Single User</span>
                                    </button>
                                </div>
                            </div>

                            {/* Dynamic Fields */}
                            <div className="space-y-4">

                                {/* Format */}
                                <div>
                                    <label className="text-xs text-gray-500 mb-1.5 block">Format</label>
                                    <div className="flex bg-black/20 p-1 rounded-lg border border-[#ffffff1a]">
                                        <button
                                            onClick={() => setFormat('csv')}
                                            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${format === 'csv' ? 'bg-foreground/10 text-foreground' : 'text-gray-500 hover:text-gray-300'
                                                }`}
                                        >
                                            CSV (Excel)
                                        </button>
                                        <button
                                            onClick={() => setFormat('json')}
                                            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${format === 'json' ? 'bg-foreground/10 text-foreground' : 'text-gray-500 hover:text-gray-300'
                                                }`}
                                        >
                                            JSON (Raw)
                                        </button>
                                    </div>
                                </div>

                                {/* Filters */}
                                <div className="bg-foreground/5 rounded-xl p-4 border border-[#ffffff1a] space-y-4">

                                    {exportType === 'attendance' ? (
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-0.5">
                                                <DateSelector 
                                                    label="From Date"
                                                    date={dateFrom ? new Date(dateFrom) : undefined}
                                                    onChange={date => setDateFrom(date ? date.toISOString().split('T')[0] : '')}
                                                />
                                            </div>
                                            <div className="space-y-0.5">
                                                <DateSelector 
                                                    label="To Date"
                                                    date={dateTo ? new Date(dateTo) : undefined}
                                                    onChange={date => setDateTo(date ? date.toISOString().split('T')[0] : '')}
                                                    disabledBefore={dateFrom ? new Date(dateFrom) : undefined}
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-0.5">
                                            <DateSelector 
                                                label="Period"
                                                date={period ? new Date(period + "-01") : new Date()}
                                                onChange={date => setPeriod(date ? date.toISOString().slice(0, 7) : '')}
                                            />
                                        </div>
                                    )}

                                    {exportType === 'user' && (
                                        <div className="space-y-0.5">
                                            <DropdownSelector 
                                                label="Team Member"
                                                value={selectedUserId.toString()}
                                                onChange={val => setSelectedUserId(Number(val))}
                                                options={availableUsers.map(user => ({
                                                    id: user.id.toString(),
                                                    label: user.name,
                                                    icon: <User size={14} />
                                                }))}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Audit Warning */}
                            <div className="flex items-start gap-3 p-3 bg-yellow-500/5 border border-yellow-500/10 rounded-lg">
                                <ShieldAlert size={16} className="text-yellow-500/50 mt-0.5 shrink-0" />
                                <p className="text-[10px] text-yellow-500/50 leading-relaxed">
                                    This action will be logged in the database audit trail. Exported files contain sensitive PII and must be handled according to data protection regulations.
                                </p>
                            </div>

                        </div>

                    )}

                    {/* Footer */}
                    {!acknowledged ? (
                        <div className="p-6">
                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6 text-center space-y-4">
                                <div className="mx-auto w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400">
                                    <ShieldAlert size={24} />
                                </div>
                                <h3 className="text-foreground font-bold text-lg">Institutional Compliance Required</h3>
                                <p className="text-sm text-gray-400 leading-relaxed">
                                    This system enforces strict accountability constraints. All data exports are:
                                </p>
                                <ul className="text-sm text-left text-gray-400 space-y-2 bg-black/20 p-4 rounded-lg">
                                    <li className="flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5" /> Logged in the permanent audit trail</li>
                                    <li className="flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5" /> Restricted to authorized personnel only</li>
                                    <li className="flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5" /> Monitored for regulatory compliance</li>
                                </ul>
                                <button
                                    onClick={handleAcknowledge}
                                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-foreground font-bold rounded-lg transition-colors shadow-lg shadow-blue-900/20"
                                >
                                    I Acknowledge & Agree
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="p-6 border-t border-[#ffffff1a] flex justify-end gap-3 bg-foreground/5">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-foreground transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleExport}
                                disabled={loading || (exportType === 'user' && !selectedUserId)}
                                className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-foreground text-sm font-medium rounded-lg transition-colors shadow-lg shadow-indigo-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <>Processing...</>
                                ) : (
                                    <>
                                        <Download size={16} />
                                        Download Report
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </motion.div >
            </div >
        </>
    );
}
