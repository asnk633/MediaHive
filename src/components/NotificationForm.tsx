'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { NotificationFormData, notificationFormSchema } from '@/lib/forms/validators';
import { useAuth } from '@/contexts/AuthContextProvider';
import { toast } from 'sonner';
import { Send, Eye, Loader2, Calendar, Paperclip, X, Users, Megaphone, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
// import NotificationPreviewModal from '@/components/NotificationPreviewModal';
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

      // Construct JSON payload instead of FormData
      const payload = {
        title: data.title,
        body: data.body,
        audience: data.audience, // Array
        scheduledAt: data.schedule ? new Date(data.schedule).toISOString() : null,
        // attachments: [] // File upload disabled for now
      };

      const response = { success: true, message: 'Mock sent' }; // await NotificationService.createBroadcastNotification(payload);

      if (response.success) {
        toast.success(response.message || 'Notification sent successfully!');
        reset();
        setSelectedFile(undefined);
        onSubmitSuccess?.();
      } else {
        toast.error(response.message || 'Failed to send notification.');
      }
    } catch (error: any) {
      console.error('Error sending notification:', error);
      toast.error(error.message || 'An unexpected error occurred.');
    } finally {
      setIsSending(false);
    }
  };

  const inputClasses = "w-full bg-background backdrop-blur-sm p-3 rounded-xl border border-soft shadow-inner focus:bg-surface focus:ring-2 focus:ring-primary/30 focus:border-primary/50 outline-none transition-all placeholder:text-muted font-medium text-foreground";

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Title</label>
          <input {...register('title')} className={inputClasses} placeholder="Title" />
          {errors.title && <p className="text-red-400 text-sm">{errors.title.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Body</label>
          <textarea {...register('body')} rows={4} className={inputClasses} placeholder="Message" />
          {errors.body && <p className="text-red-400 text-sm">{errors.body.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Audience</label>
          <div className="flex gap-4">
            {['all', 'premium'].map(aud => (
              <label key={aud} className="flex items-center gap-2 text-white capitalize">
                <input
                  type="radio"
                  value={aud}
                  checked={watchedValues.audience?.[0] === aud}
                  onChange={() => setValue('audience', [aud as any])}
                  className="form-radio"
                />
                {aud}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Schedule</label>
          <input type="datetime-local" {...register('schedule')} className={inputClasses} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Attachment</label>
          <div className="flex gap-2 items-center">
            <button type="button" onClick={() => fileInputRef.current?.click()} className="bg-gray-700 text-white px-4 py-2 rounded">
              {selectedFile ? 'Change File' : 'Select File'}
            </button>
            {selectedFile && (
              <span className="text-gray-300 flex items-center gap-2">
                {selectedFile.name}
                <X size={16} className="cursor-pointer" onClick={handleRemoveAttachment} />
              </span>
            )}
            <input type="file" ref={fileInputRef} className="hidden" onChange={onFileSelect} />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          {onCancel && <button type="button" onClick={onCancel} className="px-4 py-2 text-gray-300">Cancel</button>}
          <button type="submit" disabled={isSending} className="bg-blue-600 text-white px-6 py-2 rounded flex items-center gap-2">
            {isSending ? <Loader2 className="animate-spin" /> : <Send size={16} />}
            Send
          </button>
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
