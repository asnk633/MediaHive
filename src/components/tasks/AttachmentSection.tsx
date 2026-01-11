import React from 'react';
import { Task, TaskFile, TaskFileSection, AttachmentLog } from '@/types/task';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, UploadCloud, FileIcon, Trash2, Lock, Eye, CheckCircle, EyeOff, Activity, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/apiClient';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { TaskService } from '@/services/tasks';
import { cn } from '@/lib/utils';
import { AttachmentActivityLog } from './AttachmentActivityLog';

interface AttachmentSectionProps {
    task: Task;
    onUpdate: () => void; // Trigger refresh
}

export const AttachmentSection: React.FC<AttachmentSectionProps> = ({ task, onUpdate }) => {
    const { user } = useAuth();
    const [uploading, setUploading] = React.useState(false);

    // Final Upload Confirmation State
    const [pendingFinalFile, setPendingFinalFile] = React.useState<File | null>(null);
    const [showInDownloads, setShowInDownloads] = React.useState(false);

    const inputs = (task.files || []).filter(f => f.section === 'requester-inputs');
    const working = (task.files || []).filter(f => f.section === 'team-working-files');

    const final = (task.files || []).filter(f => f.section === 'team-final-exports');

    // Permission Logic
    const isCreator = user?.uid === (typeof task.createdBy === 'string' ? task.createdBy : task.createdBy?.uid);
    const isTeam = user?.role === 'team' || user?.role === 'admin';
    const isAdmin = user?.role === 'admin';

    const canUploadInputs = user && (isAdmin || isCreator);
    const canUploadTeam = user && isTeam;

    const handleUpload = async (file: File, section: TaskFileSection, explicitShowInDownloads?: boolean) => {
        if (!user || uploading) return;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('section', section);
        if (explicitShowInDownloads !== undefined) {
            formData.append('showInDownloads', String(explicitShowInDownloads));
        }

        try {
            setUploading(true);
            const res = await apiClient(`/api/tasks/${task.id}/attachments`, {
                method: 'POST',
                body: formData,
            });

            if (res.file) {
                toast.success('File uploaded successfully');
                onUpdate();
            }
        } catch (error) {
            console.error('Upload failed', error);
            toast.error('Failed to upload file');
        } finally {
            setUploading(false);
        }
    };

    const confirmFinalUpload = () => {
        if (pendingFinalFile) {
            handleUpload(pendingFinalFile, 'team-final-exports', showInDownloads);
            setPendingFinalFile(null);
        }
    };

    const handleDelete = async (fileId: string) => {
        if (!confirm('Are you sure you want to delete this file?')) return;
        try {
            await apiClient(`/api/tasks/${task.id}/attachments?fileId=${fileId}`, {
                method: 'DELETE'
            });
            toast.success('File deleted');
            onUpdate();
        } catch (error) {
            console.error('Delete failed', error);
            toast.error('Failed to delete file');
        }
    };

    const handleVisibilityToggle = async (fileId: string, currentVal: boolean) => {
        const newVal = !currentVal;
        try {
            // Optimistic update handled by UI re-render on success, maybe add local loading state if needed
            // For now simple await
            await TaskService.toggleAttachmentVisibility(task.id, fileId, newVal);
            toast.success(newVal ? 'File is now Public' : 'File is now Private');
            onUpdate();
        } catch (e) {
            toast.error('Failed to update visibility');
        }
    };

    const FileList = ({ files, canDelete, showToggle }: { files: TaskFile[], canDelete: boolean, showToggle?: boolean }) => (
        <div className="space-y-2 mt-3">
            {files.length === 0 && (
                <div className="text-center py-6 border border-dashed border-white/10 rounded-xl bg-white/5">
                    <p className="text-sm text-white/40">No files</p>
                </div>
            )}
            {files.map(file => (
                <div key={file.id} className="flex items-center justify-between p-3 bg-[#0a0c10] border border-[#ffffff1a] rounded-xl hover:border-blue-500/30 transition-colors group">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${file.section === 'team-final-exports' ? 'bg-green-500/10 text-green-400' : 'bg-blue-500/10 text-blue-400'}`}>
                            <FileIcon size={20} />
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <a href={file.url} target="_blank" rel="noreferrer" className="text-sm font-medium text-white truncate hover:underline hover:text-blue-300 block max-w-[150px] sm:max-w-xs">{file.name}</a>
                                {file.showInDownloads ? (
                                    <Badge variant="secondary" className="text-[9px] h-4 bg-green-500/20 text-green-300 border-0 px-1 hidden sm:inline-flex gap-1 items-center">
                                        <Eye size={8} /> Public
                                    </Badge>
                                ) : (
                                    <Badge variant="secondary" className="text-[9px] h-4 bg-white/5 text-white/30 border-0 px-1 hidden sm:inline-flex gap-1 items-center">
                                        <Lock size={8} /> Private
                                    </Badge>
                                )}
                            </div>
                            <div className="text-xs text-white/40 flex items-center gap-2">
                                <span>{file.uploadedBy?.name || 'Unknown'}</span>
                                <span>•</span>
                                <span>{format(new Date(file.uploadedAt), 'MMM dd')}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {showToggle && canUploadTeam && (
                            <div className="flex items-center gap-2 mr-2 border-r border-white/10 pr-2">
                                <span className={`text-[10px] font-medium uppercase ${file.showInDownloads ? 'text-green-400' : 'text-white/30'}`}>
                                    {file.showInDownloads ? 'Public' : 'Private'}
                                </span>
                                <Switch
                                    checked={file.showInDownloads}
                                    onCheckedChange={() => handleVisibilityToggle(file.id, !!file.showInDownloads)}
                                    className="scale-75"
                                />
                            </div>
                        )}

                        <a
                            href={file.url}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                            title="Download / View"
                        >
                            <Download size={16} />
                        </a>
                        {(canDelete || user?.role === 'admin') && (
                            <button
                                onClick={() => handleDelete(file.id)}
                                className="p-2 text-red-400/60 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                title="Delete"
                            >
                                <Trash2 size={16} />
                            </button>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">

                {/* 1. Requester Inputs */}
                <Card className="border-none bg-gradient-to-b from-[#141e30] to-[#1e2a3b] shadow-lg rounded-[15px] text-white">
                    <CardHeader className="pb-2 border-b border-white/5">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-xs font-bold uppercase tracking-wider text-blue-300/80 flex items-center gap-2">
                                Requester Inputs
                                <Badge className="bg-white/10 text-white border-0 text-[10px] h-5">{inputs.length}</Badge>
                            </CardTitle>
                            {canUploadInputs && (
                                <div className="relative">
                                    <input
                                        type="file"
                                        id="upload-inputs"
                                        className="hidden"
                                        onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], 'requester-inputs')}
                                        disabled={uploading}
                                    />
                                    <label
                                        htmlFor="upload-inputs"
                                        className={`p-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-200 hover:text-white rounded-lg cursor-pointer transition-all ${uploading ? 'opacity-50' : ''}`}
                                        title="Upload Input"
                                    >
                                        <UploadCloud size={16} />
                                    </label>
                                </div>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <FileList files={inputs} canDelete={!!canUploadInputs} />
                    </CardContent>
                </Card>

                {/* 2. Team Working Files */}
                <Card className="border-none bg-gradient-to-b from-[#1e293b] to-[#0f172a] shadow-lg rounded-[15px] text-white">
                    <CardHeader className="pb-2 border-b border-white/5">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-300/80 flex items-center gap-2">
                                Internal / Working
                                <Badge className="bg-slate-500/20 text-slate-300 border-0 text-[10px] h-5">{working.length}</Badge>
                            </CardTitle>
                            {canUploadTeam ? (
                                <div className="relative">
                                    <input
                                        type="file"
                                        id="upload-working"
                                        className="hidden"
                                        onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], 'team-working-files')}
                                        disabled={uploading}
                                    />
                                    <label
                                        htmlFor="upload-working"
                                        className={`p-1.5 bg-slate-600/20 hover:bg-slate-600 text-slate-300 hover:text-white rounded-lg cursor-pointer transition-all ${uploading ? 'opacity-50' : ''}`}
                                        title="Upload Working File"
                                    >
                                        <UploadCloud size={16} />
                                    </label>
                                </div>
                            ) : <Lock size={14} className="text-white/20" />}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <FileList files={working} canDelete={!!canUploadTeam} />
                    </CardContent>
                </Card>

                {/* 3. Final Deliverables */}
                <Card className="border-none bg-gradient-to-b from-[#064e3b] to-[#022c22] shadow-lg rounded-[15px] text-white relative overflow-hidden ring-1 ring-green-500/20">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl -translate-y-16 translate-x-16 pointer-events-none" />

                    <CardHeader className="pb-2 border-b border-white/5 relative z-10">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-xs font-bold uppercase tracking-wider text-green-300/90 flex items-center gap-2">
                                Final Deliverables
                                <Badge className="bg-green-500/20 text-green-200 border-0 text-[10px] h-5">{final.length}</Badge>
                            </CardTitle>
                            {canUploadTeam ? (
                                <div className="relative">
                                    <input
                                        type="file"
                                        id="upload-final"
                                        className="hidden"
                                        onChange={(e) => e.target.files?.[0] && setPendingFinalFile(e.target.files[0])}
                                        disabled={uploading}
                                    />
                                    <label
                                        htmlFor="upload-final"
                                        className={`p-1.5 bg-green-500 hover:bg-green-400 text-white rounded-lg cursor-pointer transition-all shadow-lg hover:shadow-green-500/25 ${uploading ? 'opacity-50' : ''}`}
                                        title="Upload Final Deliverable"
                                    >
                                        <UploadCloud size={16} />
                                    </label>
                                </div>
                            ) : <CheckCircle size={14} className="text-green-500/40" />}
                        </div>
                    </CardHeader>
                    <CardContent className="relative z-10">
                        <FileList files={final} canDelete={!!canUploadTeam} showToggle={true} />
                    </CardContent>
                </Card>
            </div>

            {/* Lazy Loaded Activity Log */}
            <AttachmentActivityLog taskId={task.id} refreshTrigger={task.files?.length || 0} />


            {/* Final Upload Confirmation Dialog */}
            <Dialog open={!!pendingFinalFile} onOpenChange={(open) => !open && setPendingFinalFile(null)}>
                <DialogContent className="bg-[#1e293b] border-white/10 text-white">
                    <DialogHeader>
                        <DialogTitle>Confirm Final Deliverable</DialogTitle>
                        <DialogDescription className="text-slate-400">
                            You are uploading <strong>{pendingFinalFile?.name}</strong> to Final Deliverables.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        <label className="flex items-center gap-3 p-4 border border-white/10 rounded-xl bg-white/5 cursor-pointer hover:bg-white/10 transition-colors">
                            <input
                                type="checkbox"
                                checked={showInDownloads}
                                onChange={(e) => setShowInDownloads(e.target.checked)}
                                className="w-5 h-5 rounded border-gray-500 text-green-600 focus:ring-green-500 focus:ring-offset-gray-900"
                            />
                            <div>
                                <div className="font-medium text-white">Show in Downloads Page</div>
                                <div className="text-xs text-slate-400">Make this file available in the public downloads area.</div>
                            </div>
                        </label>
                    </div>

                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setPendingFinalFile(null)} className="text-slate-400 hover:text-white hover:bg-white/10">Cancel</Button>
                        <Button onClick={confirmFinalUpload} className="bg-green-600 hover:bg-green-500 text-white" disabled={uploading}>
                            {uploading ? 'Uploading...' : 'Confirm Upload'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
