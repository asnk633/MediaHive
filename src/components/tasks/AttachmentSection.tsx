import React from 'react';
import { Task, TaskFile, TaskFileSection, AttachmentLog } from '@/features/tasks/types/task';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, UploadCloud, FileIcon, Trash2, Lock, Eye, CheckCircle, EyeOff, Activity, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/apiClient';
import { useAuth } from '@/contexts/AuthContextProvider';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import { cn } from '@/lib/utils';
import { AttachmentActivityLog } from './AttachmentActivityLog';
import { TaskService } from '@/services/tasks';

interface AttachmentSectionProps {
    task: Task;
    onUpdate: () => void; // Trigger refresh
}

export const AttachmentSection: React.FC<AttachmentSectionProps> = ({ task, onUpdate }) => {
    const { user } = useAuth();
    const [uploading, setUploading] = React.useState(false);

    // Final Upload Confirmation State
    const [pendingFinalFile, setPendingFinalFile] = React.useState<File | null>(null);
    const [show_in_downloads, setShowInDownloads] = React.useState(false);

    const inputs = (task.files || []).filter(f => f.section === 'requester-inputs');
    const working = (task.files || []).filter(f => f.section === 'team-working-files');

    const final = (task.files || []).filter(f => f.section === 'team-final-exports');

    // Permission Logic
    const isCreator = user?.uid === (typeof task.created_by === 'string' ? task.created_by : task.created_by?.uid);
    const isTeam = (user?.role === 'manager' || user?.role === 'member') || user?.role === 'admin';
    const isAdmin = user?.role === 'admin';

    const canUploadInputs = user && (isAdmin || isCreator);
    const canUploadTeam = user && isTeam;

    const handleUpload = async (file: File, section: TaskFileSection, explicitShowInDownloads?: boolean) => {
        if (!user || uploading) return;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('section', section);
        if (explicitShowInDownloads !== undefined) {
            formData.append('show_in_downloads', String(explicitShowInDownloads));
        }

        try {
            setUploading(true);
            const fileExt = file.name.split('.').pop();
            const fileName = `${uuidv4()}.${fileExt}`;
            const filePath = `${task.id}/${fileName}`;

            await supabase.storage.from('task_attachments').upload(filePath, file);
            const { data: publicUrlData } = supabase.storage.from('task_attachments').getPublicUrl(filePath);

            const newFile = {
                id: uuidv4(),
                name: file.name,
                mimeType: file.type,
                size: file.size,
                url: publicUrlData.publicUrl,
                uploaded_by: { uid: user.uid, name: user.name, role: user.role },
                uploaded_at: new Date().toISOString(),
                section: section,
                show_in_downloads: explicitShowInDownloads || false
            };

            const updatedFiles = [...(task.files || []), newFile];
            await TaskService.updateTask(task.id, { files: updatedFiles });

            toast.success('File uploaded successfully');
            onUpdate();
        } catch (error) {
            console.error('Upload failed', error);
            toast.error('Failed to upload file');
        } finally {
            setUploading(false);
        }
    };

    const confirmFinalUpload = () => {
        if (pendingFinalFile) {
            handleUpload(pendingFinalFile, 'team-final-exports', show_in_downloads);
            setPendingFinalFile(null);
        }
    };

    const handleDelete = async (file_id: string) => {
        if (!confirm('Are you sure you want to delete this file?')) return;
        try {
            const updatedFiles = (task.files || []).filter((f: any) => f.id !== file_id);
            await TaskService.updateTask(task.id, { files: updatedFiles });

            toast.success('File deleted');
            onUpdate();
        } catch (error) {
            console.error('Delete failed', error);
            toast.error('Failed to delete file');
        }
    };

    const handleVisibilityToggle = async (file_id: string, currentVal: boolean) => {
        const newVal = !currentVal;
        try {
            const updatedFiles = (task.files || []).map((f: any) =>
                f.id === file_id ? { ...f, show_in_downloads: newVal } : f
            );
            await TaskService.updateTask(task.id, { files: updatedFiles });
            toast.success(newVal ? 'File is now Public' : 'File is now Private');
            onUpdate();
        } catch (e) {
            toast.error('Failed to update visibility');
        }
    };

    const FileList = ({ files, canDelete, showToggle }: { files: TaskFile[], canDelete: boolean, showToggle?: boolean }) => (
        <div className="space-y-2 mt-3">
            {files.length === 0 && (
                <div className="text-center py-6 border border-dashed border-foreground/10 rounded-xl bg-foreground/5">
                    <p className="text-sm text-foreground/80">No files</p>
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
                                <a href={file.url} target="_blank" rel="noreferrer" className="text-sm font-medium text-foreground truncate hover:underline hover:text-blue-300 block max-w-[150px] sm:max-w-xs">{file.name}</a>
                                {file.show_in_downloads ? (
                                    <Badge variant="neutral" className="text-[9px] h-4 bg-green-500/20 text-green-300 border-0 px-1 hidden sm:inline-flex gap-1 items-center">
                                        <Eye size={8} /> Public
                                    </Badge>
                                ) : (
                                    <Badge variant="neutral" className="text-[9px] h-4 bg-foreground/5 text-foreground/70 border-0 px-1 hidden sm:inline-flex gap-1 items-center">
                                        <Lock size={8} /> Private
                                    </Badge>
                                )}
                            </div>
                            <div className="text-xs text-foreground/80 flex items-center gap-2">
                                <span>{file.uploaded_by?.name || 'Unknown'}</span>
                                <span>•</span>
                                <span>{format(new Date(file.uploaded_at), 'MMM dd')}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {showToggle && canUploadTeam && (
                            <div className="flex items-center gap-2 mr-2 border-r border-foreground/10 pr-2">
                                <span className={`text-[10px] font-medium uppercase ${file.show_in_downloads ? 'text-green-400' : 'text-foreground/70'}`}>
                                    {file.show_in_downloads ? 'Public' : 'Private'}
                                </span>
                                <Switch
                                    checked={file.show_in_downloads}
                                    onCheckedChange={() => handleVisibilityToggle(file.id, !!file.show_in_downloads)}
                                    className="scale-75"
                                />
                            </div>
                        )}

                        <a
                            href={file.url}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 text-foreground/80 hover:text-foreground hover:bg-foreground/10 rounded-lg transition-colors"
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
                <Card className="border-none bg-gradient-to-b from-[#141e30] to-[#1e2a3b] shadow-lg rounded-[15px] text-foreground">
                    <CardHeader className="pb-2 border-b border-foreground/5">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-xs font-bold uppercase tracking-wider text-blue-300/80 flex items-center gap-2">
                                Requester Inputs
                                <Badge className="bg-foreground/10 text-foreground border-0 text-[10px] h-5">{inputs.length}</Badge>
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
                                        className={`p-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-200 hover:text-foreground rounded-lg cursor-pointer transition-all ${uploading ? 'opacity-50' : ''}`}
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
                <Card className="border-none bg-gradient-to-b from-[#1e293b] to-[#0f172a] shadow-lg rounded-[15px] text-foreground">
                    <CardHeader className="pb-2 border-b border-foreground/5">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground/80 flex items-center gap-2">
                                Internal / Working
                                <Badge className="bg-slate-500/20 text-foreground border-0 text-[10px] h-5">{working.length}</Badge>
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
                                        className={`p-1.5 bg-slate-600/20 hover:bg-slate-600 text-foreground hover:text-foreground rounded-lg cursor-pointer transition-all ${uploading ? 'opacity-50' : ''}`}
                                        title="Upload Working File"
                                    >
                                        <UploadCloud size={16} />
                                    </label>
                                </div>
                            ) : <Lock size={14} className="text-foreground/80" />}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <FileList files={working} canDelete={!!canUploadTeam} />
                    </CardContent>
                </Card>

                {/* 3. Final Deliverables */}
                <Card className="border-none bg-gradient-to-b from-[#064e3b] to-[#022c22] shadow-lg rounded-[15px] text-foreground relative overflow-hidden ring-1 ring-green-500/20">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl -translate-y-16 translate-x-16 pointer-events-none" />

                    <CardHeader className="pb-2 border-b border-foreground/5 relative z-10">
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
                                        className={`p-1.5 bg-green-500 hover:bg-green-400 text-foreground rounded-lg cursor-pointer transition-all shadow-lg hover:shadow-green-500/25 ${uploading ? 'opacity-50' : ''}`}
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
                <DialogContent className="bg-[#1e293b] border-foreground/10 text-foreground">
                    <DialogHeader>
                        <DialogTitle>Confirm Final Deliverable</DialogTitle>
                        <DialogDescription className="text-foreground/60">
                            You are uploading <strong>{pendingFinalFile?.name}</strong> to Final Deliverables.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        <label className="flex items-center gap-3 p-4 border border-foreground/10 rounded-xl bg-foreground/5 cursor-pointer hover:bg-foreground/10 transition-colors">
                            <input
                                type="checkbox"
                                checked={show_in_downloads}
                                onChange={(e) => setShowInDownloads(e.target.checked)}
                                className="w-5 h-5 rounded border-gray-500 text-green-600 focus:ring-green-500 focus:ring-offset-gray-900"
                            />
                            <div>
                                <div className="font-medium text-foreground">Show in Downloads Page</div>
                                <div className="text-xs text-foreground/60">Make this file available in the public downloads area.</div>
                            </div>
                        </label>
                    </div>

                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setPendingFinalFile(null)} className="text-foreground/60 hover:text-foreground hover:bg-foreground/10">Cancel</Button>
                        <Button onClick={confirmFinalUpload} className="bg-green-600 hover:bg-green-500 text-foreground" disabled={uploading}>
                            {uploading ? 'Uploading...' : 'Confirm Upload'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
