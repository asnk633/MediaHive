"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"; // Assuming shadcn or similar
import { Button } from '@/components/ui/button'; // Assuming
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DriveFile, FileVisibility } from '@/types/file';
import { FileService } from '@/services/fileService';
import { Loader2, UploadCloud } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { apiClient } from '@/lib/apiClient';

interface UploadModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    eventId?: string;
    taskId?: string;
}

export function UploadModal({ open, onClose, onSuccess, eventId, taskId }: UploadModalProps) {
    const { user, loading } = useAuth();
    const [uploading, setUploading] = useState(false);
    const { register, handleSubmit, reset, setValue, watch } = useForm();
    const [visibilityMode, setVisibilityMode] = useState<FileVisibility['mode']>('all');
    const [folderMode, setFolderMode] = useState('auto');

    // Organization Data
    const [departmentsList, setDepartmentsList] = useState<string[]>([]);
    const [institutionsList, setInstitutionsList] = useState<string[]>([]);

    // Fetch Organizations when open
    React.useEffect(() => {
        if (open) {
            const fetchOrgs = async () => {
                try {
                    const [deptsRes, instsRes] = await Promise.all([
                        apiClient<{ departments: { name: string }[] }>('/api/departments?limit=1000'),
                        apiClient<{ institutions: { name: string }[] }>('/api/institutions?limit=1000')
                    ]);

                    const departments = deptsRes.departments || [];
                    const institutions = instsRes.institutions || [];

                    setDepartmentsList(departments.map(d => d.name));
                    setInstitutionsList(institutions.map(i => i.name));
                } catch (e) {
                    console.error("Failed to fetch organizations", e);
                }
            };
            fetchOrgs();
        }
    }, [open]);
    const handleUpload = async (data: any) => {
        if (!data.file?.[0]) return;

        // Check if auth is still loading
        if (loading) {
            alert('Authentication is still loading. Please wait...');
            return;
        }

        // Check if user is authenticated before attempting upload
        if (!user) {
            alert('You must be logged in to upload files.');
            return;
        }

        setUploading(true);
        try {
            const file = data.file[0];
            const metadata = {
                name: data.name || file.name,
                type: 'other', // derive from file?
                uploadedBy: user?.uid,
                uploadedByRole: user?.role,
                uploadedByName: user?.name,
                visibility: {
                    mode: visibilityMode,
                    departments: data.departments ? data.departments.split(',').map((s: string) => s.trim()) : [],
                    institutions: data.institutions ? data.institutions.split(',').map((s: string) => s.trim()) : []
                },
                department: data.department,
                institution: data.institution,
                folder: data.folder,
                subfolder: data.subfolder,
                // Linkage
                eventId: eventId,
                taskId: taskId,
                // DIRECT DOWNLOADS UPLOAD - ALWAYS FINAL & PUBLIC
                uploadContext: 'downloads_direct',
                isFinal: true
            };

            await FileService.uploadFile(file, metadata as any);
            reset();
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('[UploadModal] Upload error:', error);
            alert(`Upload failed: ${error.message || 'Unknown error'}`);
        } finally {
            setUploading(false);
        }
    };

    // Styles matching CreateEventForm "Night Sky" theme
    const inputClasses = "bg-[#0a0c10] border-[#ffffff1a] text-white placeholder:text-white/30 focus:border-blue-500/50 focus:ring-blue-500/10 transition-all rounded-xl h-11 file:text-white file:bg-white/10 file:border-0 file:rounded-lg file:mr-4 file:px-3 file:py-1 file:hover:bg-white/20 cursor-pointer";
    const labelClasses = "uppercase text-[10px] font-bold tracking-widest text-white/50 mb-1.5 block";
    const selectTriggerClasses = "bg-[#0a0c10] border-[#ffffff1a] text-white focus:ring-blue-500/10 h-11 rounded-xl";
    const selectContentClasses = "bg-[#0a0c10] border-[#ffffff1a] text-white";
    const selectItemClasses = "hover:bg-white/5 text-white focus:bg-white/5 focus:text-white cursor-pointer";

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent aria-describedby={undefined} className="sm:max-w-md bg-[#10111a] text-white border-[#ffffff1a] shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] p-6 rounded-[24px]">
                <DialogHeader className="mb-4">
                    <DialogTitle className="text-xl font-bold tracking-tight text-white flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-blue-600/10 text-blue-500">
                            <UploadCloud size={24} />
                        </div>
                        Upload File
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(handleUpload)} className="space-y-5">
                    <div className="space-y-1">
                        <Label className={labelClasses}>File Selection</Label>
                        <Input
                            type="file"
                            {...register('file', { required: true })}
                            className={`${inputClasses} pt-2`}
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className={labelClasses}>Display Name (Optional)</Label>
                        <Input
                            placeholder="e.g. Annual Report 2024"
                            {...register('name')}
                            className={inputClasses}
                        />
                    </div>

                    {(user?.role === 'admin' || user?.role === 'team') && (
                        <div className="space-y-5 pt-4 border-t border-[#ffffff1a] animate-in slide-in-from-top-2">
                            <div className="space-y-3">
                                <Label className={labelClasses}>Visibility Settings</Label>
                                <Select value={visibilityMode} onValueChange={(v: any) => setVisibilityMode(v)}>
                                    <SelectTrigger className={selectTriggerClasses}>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className={selectContentClasses}>
                                        <SelectItem value="all" className={selectItemClasses}>All Users</SelectItem>
                                        <SelectItem value="include" className={selectItemClasses}>Specific Groups Only</SelectItem>
                                        <SelectItem value="exclude" className={selectItemClasses}>Exclude Specific Groups</SelectItem>
                                    </SelectContent>
                                </Select>

                                {visibilityMode !== 'all' && (
                                    <div className="grid grid-cols-2 gap-3 animate-in fade-in pt-2">
                                        <div className="space-y-1">
                                            <Label className={labelClasses}>Offices / Units</Label>
                                            <Input placeholder="Comma separated" {...register('departments')} className={inputClasses} />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className={labelClasses}>Institutions</Label>
                                            <Input placeholder="Comma separated" {...register('institutions')} className={inputClasses} />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-3">
                                <Label className={labelClasses}>Organization</Label>

                                <Tabs defaultValue="department" className="w-full" onValueChange={(v) => {
                                    if (v === 'department') {
                                        setValue('institution', '');
                                    } else {
                                        setValue('department', '');
                                    }
                                }}>
                                    <TabsList className="grid w-full grid-cols-2 bg-[#0a0c10] border border-[#ffffff1a] rounded-xl p-1 h-auto">
                                        <TabsTrigger
                                            value="department"
                                            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg text-gray-400 rounded-lg py-2 transition-all"
                                        >
                                            Office / Unit
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="institution"
                                            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg text-gray-400 rounded-lg py-2 transition-all"
                                        >
                                            Institution
                                        </TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="department" className="mt-3">
                                        <Select onValueChange={(v) => setValue('department', v)}>
                                            <SelectTrigger className={selectTriggerClasses}>
                                                <SelectValue placeholder="Select Office / Unit" />
                                            </SelectTrigger>
                                            <SelectContent className={selectContentClasses}>
                                                <SelectItem value="General" className={selectItemClasses}>General</SelectItem>
                                                {departmentsList.map(d => <SelectItem key={d} value={d} className={selectItemClasses}>{d}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </TabsContent>
                                    <TabsContent value="institution" className="mt-3">
                                        <Select onValueChange={(v) => setValue('institution', v)}>
                                            <SelectTrigger className={selectTriggerClasses}>
                                                <SelectValue placeholder="Select Institution" />
                                            </SelectTrigger>
                                            <SelectContent className={selectContentClasses}>
                                                <SelectItem value="General" className={selectItemClasses}>General</SelectItem>
                                                {institutionsList.map(i => <SelectItem key={i} value={i} className={selectItemClasses}>{i}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </TabsContent>
                                </Tabs>
                            </div>

                            <div className="space-y-3">
                                <Label className={labelClasses}>Storage Location</Label>
                                <Select
                                    value={folderMode}
                                    onValueChange={(v) => {
                                        setFolderMode(v);
                                        if (v !== 'custom') {
                                            setValue('folder', v);
                                        } else {
                                            setValue('folder', '');
                                        }
                                    }}
                                >
                                    <SelectTrigger className={selectTriggerClasses}>
                                        <SelectValue placeholder="Select folder" />
                                    </SelectTrigger>
                                    <SelectContent className={selectContentClasses}>
                                        <SelectItem value="auto" className={selectItemClasses}><span className="text-yellow-400 mr-2">✨</span> Auto-detect (Smart)</SelectItem>
                                        <SelectItem value="Essential Documents" className={selectItemClasses}>Essential Documents</SelectItem>
                                        <SelectItem value="Brochures" className={selectItemClasses}>Brochures</SelectItem>
                                        <SelectItem value="Posters" className={selectItemClasses}>Posters</SelectItem>
                                        <SelectItem value="Photos" className={selectItemClasses}>Photos</SelectItem>
                                        <SelectItem value="Videos" className={selectItemClasses}>Videos</SelectItem>
                                        <SelectItem value="Archives" className={selectItemClasses}>Archives</SelectItem>
                                        <SelectItem value="Events" className={selectItemClasses}>Events</SelectItem>
                                        <SelectItem value="custom" className={selectItemClasses}><span className="text-blue-400 mr-2">➕</span> Create / Custom Folder</SelectItem>
                                    </SelectContent>
                                </Select>

                                {folderMode === 'custom' && (
                                    <Input
                                        placeholder="Main Folder Name (e.g. Legal)"
                                        {...register('folder', { required: folderMode === 'custom' })}
                                        className={`${inputClasses} animate-in slide-in-from-top-1`}
                                    />
                                )}

                                {folderMode !== 'auto' && (
                                    <Input
                                        placeholder="Subfolder Name (Optional, e.g. 2025)"
                                        {...register('subfolder')}
                                        className={`${inputClasses} animate-in slide-in-from-top-1`}
                                    />
                                )}
                            </div>
                        </div>
                    )
                    }

                    <div className="flex justify-end gap-3 pt-6 border-t border-white/5">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onClose}
                            disabled={uploading}
                            className="text-gray-400 hover:text-white hover:bg-white/5 rounded-xl text-sm font-semibold h-11 px-6"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={uploading || loading}
                            className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold h-11 px-8 shadow-lg shadow-blue-500/20"
                        >
                            {(uploading || loading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {loading ? 'Auth Loading...' : (uploading ? 'Uploading...' : 'Upload File')}
                        </Button>
                    </div>
                </form >
            </DialogContent >
        </Dialog >
    );
}

