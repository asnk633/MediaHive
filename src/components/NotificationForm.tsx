'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { NotificationFormData, notificationFormSchema } from '@/lib/forms/validators';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Send, Eye, Loader2, Calendar, Paperclip, X, Users, Megaphone, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import NotificationPreviewModal from '@/components/NotificationPreviewModal';
import { apiClient } from '@/lib/apiClient';

interface NotificationFormProps {
  initialData?: Partial<NotificationFormData>;
  onSubmitSuccess?: () => void;
  onCancel?: () => void;
}

export function NotificationForm({ initialData, onSubmitSuccess, onCancel }: NotificationFormProps) {
  const { user, getIdToken } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedAudiences, setSelectedAudiences] = useState<string[]>(['all']);

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<NotificationFormData>({
    resolver: zodResolver(notificationFormSchema),
    defaultValues: {
      title: '',
      body: '',
      audience: ['all'],
      schedule: null,
      media: null,
      ...initialData,
    },
  });

  const watchedValues = watch();

  const onSubmit = async (data: NotificationFormData) => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      // TODO: Re-implement file upload without dynamic import
      // The dynamic import of @/services/fileService causes server-side build failures
      // File upload functionality temporarily disabled until proper implementation
      const attachments: Array<{ name: string; url: string; type: string }> = [];
      if (mediaFile) {
        toast.error("File upload temporarily disabled. Please remove attachment.");
        setMediaFile(null);
      }

      const payload = {
        title: data.title,
        body: data.body,
        audience: selectedAudiences,
        scheduledAt: data.schedule || null,
        attachments,
        // Add required fields expected by the API
      };

      await apiClient('/api/notifications/create', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      toast.success('Notification sent successfully');
      if (onSubmitSuccess) {
        onSubmitSuccess();
      } else {
        router.push('/updates');
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error('Error sending notification');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePreview = () => {
    setIsPreviewing(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type.startsWith('image/') || file.type === 'application/pdf') {
        setMediaFile(file);
      } else {
        toast.error('Only images and PDF files are allowed');
      }
    }
  };

  const removeMedia = () => {
    setMediaFile(null);
  };

  const toggleAudience = (audience: string) => {
    setSelectedAudiences(prev => {
      // If clicking 'all', clear others and set 'all'
      if (audience === 'all') return ['all'];

      // If clicking something else, remove 'all'
      let newSelection = prev.filter(a => a !== 'all');

      if (newSelection.includes(audience)) {
        newSelection = newSelection.filter(a => a !== audience);
      } else {
        newSelection = [...newSelection, audience];
      }

      // If nothing selected, revert to 'all' or empty? Let's default 'all' if empty
      return newSelection.length === 0 ? ['all'] : newSelection;
    });
  };

  const inputClasses = "w-full bg-black/20 backdrop-blur-sm p-3 rounded-xl border border-white/5 shadow-inner focus:bg-black/40 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 outline-none transition-all placeholder:text-gray-700 font-medium text-white";
  const labelClasses = "text-[10px] font-bold text-blue-300/70 uppercase tracking-widest ml-1";

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="title" className={labelClasses}>Title</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-500">
              <Megaphone size={16} />
            </div>
            <Controller
              name="title"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  id="title"
                  placeholder="Notification title"
                  className={`${inputClasses} pl-10 text-lg`}
                />
              )}
            />
          </div>
          {errors.title && <p className="text-xs text-red-400 ml-1">{errors.title.message}</p>}
        </div>

        <div className="space-y-2">
          <label htmlFor="body" className={labelClasses}>Message</label>
          <Controller
            name="body"
            control={control}
            render={({ field }) => (
              <textarea
                {...field}
                id="body"
                placeholder="Notification message..."
                rows={4}
                className={`${inputClasses} resize-none`}
              />
            )}
          />
          {errors.body && <p className="text-xs text-red-400 ml-1">{errors.body.message}</p>}
        </div>

        <div className="space-y-2">
          <label className={labelClasses}>Audience</label>
          <div className="flex flex-wrap gap-2">
            {['all', 'admins', 'team', 'guests'].map((audience) => (
              <button
                key={audience}
                type="button"
                onClick={() => toggleAudience(audience)}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 border",
                  selectedAudiences.includes(audience)
                    ? "bg-blue-500/20 border-blue-500/50 text-blue-100 shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                    : "bg-white/5 border-white/5 text-gray-500 hover:bg-white/10 hover:text-gray-300"
                )}
              >
                {audience}
              </button>
            ))}
          </div>
          <input type="hidden" {...control.register('audience')} value={selectedAudiences.join(',')} />
        </div>

        <div className="space-y-2">
          <label htmlFor="schedule" className={labelClasses}>Schedule (Optional)</label>
          <Controller
            name="schedule"
            control={control}
            render={({ field }) => (
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-500">
                  <Calendar size={16} />
                </div>
                <input
                  id="schedule"
                  type="datetime-local"
                  value={field.value ? new Date(field.value).toISOString().slice(0, 16) : ''}
                  onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                  className={`${inputClasses} pl-10 [color-scheme:dark]`}
                />
              </div>
            )}
          />
        </div>

        <div className="space-y-2">
          <label className={labelClasses}>Attach Media</label>
          <div className="flex flex-col gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-2 w-full py-3 border border-dashed border-[#ffffff1a] rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-gray-400 hover:text-gray-200 text-sm font-medium"
            >
              <Paperclip className="w-4 h-4" />
              {mediaFile ? 'Change File' : 'Choose Image or PDF'}
            </button>

            {mediaFile && (
              <div className="flex items-center justify-between bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3 text-blue-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <Paperclip className="w-4 h-4 text-blue-300" />
                  </div>
                  <span className="text-sm font-medium truncate max-w-[200px]">{mediaFile.name}</span>
                </div>
                <button
                  type="button"
                  onClick={removeMedia}
                  className="text-blue-300 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 pt-6 mt-6 border-t border-white/5">
          <button
            type="button"
            onClick={handlePreview}
            className="flex-1 py-4 text-gray-400 font-bold bg-white/5 hover:bg-white/10 hover:text-white rounded-xl transition-all border border-white/5 flex items-center justify-center gap-2"
          >
            <Eye className="w-4 h-4" />
            Preview
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-[2] py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-lg rounded-xl shadow-lg shadow-blue-900/20 hover:shadow-blue-900/40 hover-sheen active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send Notification
              </>
            )}
          </button>
        </div>
      </form>

      <NotificationPreviewModal
        open={isPreviewing}
        onClose={() => setIsPreviewing(false)}
        data={{
          title: watchedValues.title || '',
          body: watchedValues.body || '',
        }}
      />
    </>
  );
}
