'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { NotificationFormData, notificationFormSchema } from '@/lib/forms/validators';
import { useAuth } from '@/contexts/AuthContextProvider';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { DateSelector } from '@/components/ui/selectors/DateSelector';
import { TimeSelector } from '@/components/ui/selectors/TimeSelector';
import { format } from 'date-fns';
import { X, Send, Loader2, Bell, AlignLeft, Users, Paperclip, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { AlertService } from '@/services/alertService';
import { StructureService } from '@/services/structureService';
import { UserService } from '@/services/userService';
import { MultiSelect } from '@/components/ui/selectors/MultiSelect';
import { Institution, Department } from '@/types/structure';
import { User } from '@/types/user';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
// import { apiClient } from '@/lib/apiClient';
// import { NotificationService } from '@/services/notificationService';

interface NotificationFormProps {
  initialData?: Partial<NotificationFormData>;
  onSubmitSuccess?: () => void;
  onCancel?: () => void;
}

export function NotificationForm({ initialData, onSubmitSuccess, onCancel }: NotificationFormProps) {
  const { user, getIdToken } = useAuth();
  const router = useRouter();

  // Restore form logic and remove dummy UI
  const [isLoading, setIsLoading] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<NotificationFormData>({
    resolver: zodResolver(notificationFormSchema),
    defaultValues: initialData || {
      title: '',
      body: '',
      schedule: null,
      audience: ['all'],
      media: null,
    },
  });

  const watchedValues = watch();

  useEffect(() => {
    if (initialData) {
      reset(initialData);
    }
  }, [initialData, reset]);

  // Targeting State
  const [audienceMode, setAudienceMode] = useState<'broadcast' | 'institutions' | 'departments' | 'direct' | 'combined'>('broadcast');
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  
  const [selectedInstIds, setSelectedInstIds] = useState<string[]>([]);
  const [selectedDeptIds, setSelectedDeptIds] = useState<string[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [instRes, deptRes, usersRes] = await Promise.all([
          StructureService.getInstitutions(),
          StructureService.getDepartments(),
          UserService.getAllUsers()
        ]);
        setInstitutions(instRes.institutions);
        setDepartments(deptRes.departments);
        setAllUsers(usersRes);
      } catch (err) {
        console.error("Failed to fetch targeting data:", err);
      }
    };
    fetchData();
  }, []);

  // Custom file state
  const [selectedFile, setSelectedFile] = useState<File | undefined>(undefined);

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setSelectedFile(e.target.files[0]);
      setValue('media', 'present'); // Dummy value to satisfy validator (min 1 char?) No, optional.
    } else {
      setSelectedFile(undefined);
      setValue('media', null);
    }
  };

  const handleRemoveAttachment = () => {
    setSelectedFile(undefined);
    setValue('media', null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onSubmit = async (data: NotificationFormData) => {
    if (!user) {
      toast.error('You must be logged in to send notifications.');
      return;
    }

    setIsSending(true);
    try {
      const token = await getIdToken();
      if (!token) {
        toast.error('Authentication token not found.');
        return;
      }

      let targetUserIds: string[] = [];

      switch (audienceMode) {
        case 'broadcast':
          targetUserIds = allUsers.map(u => u.uid || u.id);
          break;
        case 'institutions':
          targetUserIds = allUsers
            .filter(u => u.institution_id && selectedInstIds.includes(String(u.institution_id)))
            .map(u => u.uid || u.id);
          break;
        case 'departments':
          targetUserIds = allUsers
            .filter(u => u.department_id && selectedDeptIds.includes(String(u.department_id)))
            .map(u => u.uid || u.id);
          break;
        case 'direct':
          targetUserIds = selectedUserIds;
          break;
        case 'combined':
          targetUserIds = allUsers
            .filter(u => 
              u.institution_id && selectedInstIds.includes(String(u.institution_id)) &&
              u.department_id && selectedDeptIds.includes(String(u.department_id))
            )
            .map(u => u.uid || u.id);
          break;
      }

      if (targetUserIds.length === 0) {
        toast.error('No recipients found for the current selection.');
        setIsSending(false);
        return;
      }

      const params = {
        title: data.title,
        message: data.body,
        type: 'announcement' as any,
        priority: 'medium' as any,
        entity_type: 'announcement' as any,
        entity_id: 'broadcast',
        created_by: user.id
      };

      await AlertService.createBatchNotifications(targetUserIds, params);

      toast.success(`Notification broadcasted to ${targetUserIds.length} users!`);
      reset();
      setSelectedFile(undefined);
      setSelectedInstIds([]);
      setSelectedDeptIds([]);
      setSelectedUserIds([]);
      onSubmitSuccess?.();
    } catch (error: any) {
      console.error('Error sending notification:', error);
      toast.error(error.message || 'An unexpected error occurred.');
    } finally {
      setIsSending(false);
    }
  };

  const labelClasses = "text-[10px] font-black uppercase tracking-[0.2em] text-white/40 px-1 mb-2 flex items-center gap-2";

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="space-y-6">
          <div>
            <label className={labelClasses}>
              <Bell size={12} className="text-blue-400" />
              Notification Title
            </label>
            <Input 
              {...register('title')} 
              placeholder="e.g. System Maintenance Update" 
              className="h-12 bg-white/[0.03] border-white/10 rounded-2xl focus:bg-white/[0.08] transition-all"
              error={errors.title?.message}
            />
          </div>

          <div>
            <label className={labelClasses}>
              <AlignLeft size={12} className="text-blue-400" />
              Broadcast Message
            </label>
            <Textarea 
              {...register('body')} 
              placeholder="Type your message here..." 
              className="min-h-[120px] bg-white/[0.03] border-white/10 rounded-2xl focus:bg-white/[0.08] transition-all resize-none p-4"
            />
            {errors.body && <p className="text-red-400 text-xs mt-1.5 ml-1">{errors.body.message}</p>}
          </div>

          <div>
            <label className={labelClasses}>
              <Users size={12} className="text-blue-400" />
              Target Audience Mode
            </label>
            <ToggleGroup 
              type="single" 
              value={audienceMode} 
              onValueChange={(val) => val && setAudienceMode(val as any)}
              className="bg-white/[0.03] p-1 rounded-2xl border border-white/10 w-full flex-wrap gap-1"
            >
              {[
                { id: 'broadcast', label: 'Broadcast' },
                { id: 'institutions', label: 'Institutions' },
                { id: 'departments', label: 'Departments' },
                { id: 'direct', label: 'Direct' },
                { id: 'combined', label: 'Inst & Dept' }
              ].map(mode => (
                <ToggleGroupItem 
                  key={mode.id}
                  value={mode.id} 
                  className="flex-1 rounded-xl data-[state=on]:bg-blue-600 data-[state=on]:text-white transition-all py-6 text-[10px] font-black uppercase tracking-widest"
                >
                  {mode.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          {(audienceMode === 'institutions' || audienceMode === 'combined') && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              <MultiSelect 
                label="Select Institutions"
                placeholder="Search Institutions..."
                options={institutions.map(i => ({ id: String(i.id), label: i.name }))}
                selected={selectedInstIds}
                onChange={setSelectedInstIds}
              />
            </div>
          )}

          {(audienceMode === 'departments' || audienceMode === 'combined') && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              <MultiSelect 
                label="Select Departments"
                placeholder="Search Departments..."
                options={departments.map(d => ({ id: String(d.id), label: d.name }))}
                selected={selectedDeptIds}
                onChange={setSelectedDeptIds}
              />
            </div>
          )}

          {audienceMode === 'direct' && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              <MultiSelect 
                label="Select Recipients"
                placeholder="Search Users..."
                options={allUsers.map(u => ({ id: u.uid || u.id, label: u.name || u.full_name || 'User' }))}
                selected={selectedUserIds}
                onChange={setSelectedUserIds}
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <DateSelector 
              label="Schedule Date"
              date={watchedValues.schedule ? new Date(watchedValues.schedule) : undefined}
              onChange={(date) => {
                if (!date) {
                  setValue('schedule', null);
                  return;
                }
                const newDate = new Date(date);
                if (watchedValues.schedule) {
                  const current = new Date(watchedValues.schedule);
                  newDate.setHours(current.getHours());
                  newDate.setMinutes(current.getMinutes());
                }
                setValue('schedule', newDate.toISOString());
              }}
            />
            <TimeSelector 
              label="Schedule Time"
              value={watchedValues.schedule ? format(new Date(watchedValues.schedule), "HH:mm") : "09:00"}
              onChange={(time) => {
                const [h, m] = time.split(':').map(Number);
                const newDate = watchedValues.schedule ? new Date(watchedValues.schedule) : new Date();
                newDate.setHours(h);
                newDate.setMinutes(m);
                setValue('schedule', newDate.toISOString());
              }}
            />
          </div>

          <div>
            <label className={labelClasses}>
              <Paperclip size={12} className="text-blue-400" />
              Media Attachment
            </label>
            <div className="flex flex-col gap-3">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all",
                  selectedFile 
                    ? "border-blue-500/50 bg-blue-500/5" 
                    : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
                )}
              >
                {!selectedFile ? (
                  <>
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40">
                      <Paperclip size={20} />
                    </div>
                    <span className="text-sm font-bold text-white/60">Upload Assets</span>
                    <span className="text-[10px] text-white/30 uppercase tracking-wider">PNG, JPG or PDF</span>
                  </>
                ) : (
                  <div className="flex items-center justify-between w-full px-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                        <Paperclip size={20} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-white/90 truncate max-w-[200px]">
                          {selectedFile.name}
                        </span>
                        <span className="text-[10px] text-white/40 uppercase tracking-tight">
                          {(selectedFile.size / 1024).toFixed(1)} KB
                        </span>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      onClick={(e) => { e.stopPropagation(); handleRemoveAttachment(); }}
                      className="p-2 hover:bg-white/10 rounded-full text-white/40 hover:text-red-400 transition-colors"
                    >
                      <X size={18} />
                    </button>
                  </div>
                )}
              </div>
              <input type="file" ref={fileInputRef} className="hidden" onChange={onFileSelect} />
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-white/5 flex items-center justify-between">
          <p className="text-[10px] text-white/20 font-medium max-w-[200px]">
            By clicking send, you agree to broadcast this message to the selected audience.
          </p>
          <div className="flex gap-4">
            <Button 
              type="submit" 
              isLoading={isSending} 
              className="min-w-[160px] rounded-2xl h-14 font-black uppercase tracking-widest bg-blue-600 hover:bg-blue-500 shadow-[0_0_30px_rgba(37,99,235,0.3)] border-t border-white/20"
            >
              {!isSending && <Send size={16} className="mr-2" />}
              Send Broadcast
            </Button>
          </div>
        </div>
      </form>

      {/* NotificationPreviewModal component (assuming it's uncommented and available) */}
      {/* <NotificationPreviewModal
        open={isPreviewing}
          title: watchedValues.title || '',
          body: watchedValues.body || '',
        }}
      /> */}
    </>
  );
}
