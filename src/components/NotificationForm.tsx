'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { NotificationFormData, notificationFormSchema } from '@/lib/forms/validators';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Send, Eye, Loader2, Calendar, Paperclip, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NotificationFormProps {
  initialData?: Partial<NotificationFormData>;
  onSubmitSuccess?: () => void;
  onCancel?: () => void;
}

export function NotificationForm({ initialData, onSubmitSuccess, onCancel }: NotificationFormProps) {
  const { user } = useAuth();
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

  // Watch form values for preview
  const formData = watch();

  const onSubmit = async (data: NotificationFormData) => {
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      // Prepare payload
      const payload = {
        title: data.title,
        body: data.body,
        audience: selectedAudiences,
        scheduledAt: data.schedule || null,
        attachments: mediaFile ? [{
          name: mediaFile.name,
          url: '' // In a real implementation, you would upload the file and get the URL
        }] : [],
      };

      const response = await fetch('/api/notifications/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': String(user.id)
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success('Notification sent successfully');
        if (onSubmitSuccess) {
          onSubmitSuccess();
        } else {
          router.push('/updates');
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to send notification');
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
    // In a real implementation, you might show a modal with the preview
    toast.info('Preview feature: Shows how the notification will appear to recipients');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Filter for images and PDFs only
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
      if (prev.includes(audience)) {
        return prev.filter(a => a !== audience);
      } else {
        return [...prev, audience];
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Controller
          name="title"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              id="title"
              placeholder="Notification title"
              className={cn(
                errors.title && 'border-red-500',
                'bg-[var(--panel)] border-[var(--glass-border)] text-[var(--text)]'
              )}
              aria-invalid={!!errors.title}
              aria-describedby={errors.title ? 'title-error' : undefined}
            />
          )}
        />
        {errors.title && (
          <p 
            id="title-error" 
            className="text-sm text-red-500" 
            role="alert"
            aria-live="assertive"
          >
            {errors.title.message}
          </p>
        )}
      </div>

      {/* Message/Body */}
      <div className="space-y-2">
        <Label htmlFor="body">Message *</Label>
        <Controller
          name="body"
          control={control}
          render={({ field }) => (
            <Textarea
              {...field}
              id="body"
              placeholder="Notification message"
              rows={4}
              className={cn(
                errors.body && 'border-red-500',
                'bg-[var(--panel)] border-[var(--glass-border)] text-[var(--text)]'
              )}
              aria-invalid={!!errors.body}
              aria-describedby={errors.body ? 'body-error' : undefined}
            />
          )}
        />
        {errors.body && (
          <p 
            id="body-error" 
            className="text-sm text-red-500" 
            role="alert"
            aria-live="assertive"
          >
            {errors.body.message}
          </p>
        )}
      </div>

      {/* Audience - Multi-select */}
      <div className="space-y-2">
        <Label htmlFor="audience">Audience *</Label>
        <div className="flex flex-wrap gap-2">
          {['all', 'admins', 'team', 'guests'].map((audience) => (
            <button
              key={audience}
              type="button"
              onClick={() => toggleAudience(audience)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm transition-all duration-200",
                selectedAudiences.includes(audience)
                  ? "bg-[var(--accent)] text-white"
                  : "bg-[var(--panel)] border border-[var(--glass-border)] text-[var(--muted)] hover:bg-[var(--panel-strong)] hover:text-[var(--text)]"
              )}
              aria-pressed={selectedAudiences.includes(audience)}
            >
              {audience}
            </button>
          ))}
        </div>
        <input 
          type="hidden" 
          {...control.register('audience')} 
          value={selectedAudiences.join(',')} 
        />
        {errors.audience && (
          <p 
            id="audience-error" 
            className="text-sm text-red-500" 
            role="alert"
            aria-live="assertive"
          >
            {errors.audience.message}
          </p>
        )}
      </div>

      {/* Schedule */}
      <div className="space-y-2">
        <Label htmlFor="schedule">Schedule</Label>
        <Controller
          name="schedule"
          control={control}
          render={({ field }) => (
            <div className="relative">
              <Input
                {...field}
                id="schedule"
                type="datetime-local"
                value={field.value || ''}
                onChange={(e) => field.onChange(e.target.value || null)}
                className={cn(
                  errors.schedule && 'border-red-500',
                  'bg-[var(--panel)] border-[var(--glass-border)] text-[var(--text)]'
                )}
                aria-invalid={!!errors.schedule}
                aria-describedby={errors.schedule ? 'schedule-error' : undefined}
              />
              <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--icon)]" />
            </div>
          )}
        />
        {errors.schedule && (
          <p 
            id="schedule-error" 
            className="text-sm text-red-500" 
            role="alert"
            aria-live="assertive"
          >
            {errors.schedule.message}
          </p>
        )}
      </div>

      {/* Media Attachment */}
      <div className="space-y-2">
        <Label htmlFor="media">Attach Media</Label>
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              onChange={handleFileChange}
              className="hidden"
              id="media"
              aria-describedby={errors.media ? 'media-error' : undefined}
            />
            <Button
              type="button"
              variant="outline"
              className="border-[var(--glass-border)] bg-[var(--panel)] text-[var(--text)] hover:bg-[var(--panel-strong)] transition-all duration-200 flex items-center gap-2"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Attach media"
            >
              <Paperclip className="w-4 h-4 text-[var(--icon)]" />
              Choose File
            </Button>
          </div>
          
          {mediaFile && (
            <div className="mt-2 flex items-center justify-between bg-[var(--panel)] border border-[var(--glass-border)] rounded-lg px-3 py-2 text-[var(--text)]">
              <div className="flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-[var(--icon)]" />
                <span className="text-sm truncate max-w-xs">{mediaFile.name}</span>
              </div>
              <button
                type="button"
                onClick={removeMedia}
                className="text-[var(--icon-muted)] hover:text-[var(--danger)] focus:outline-none transition-all duration-200"
                aria-label={`Remove media ${mediaFile.name}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
        {errors.media && (
          <p 
            id="media-error" 
            className="text-sm text-red-500" 
            role="alert"
            aria-live="assertive"
          >
            {errors.media.message}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <Button type="submit" disabled={isSubmitting} className="flex-1 bg-[var(--accent)] text-white hover:bg-[var(--accent-2)] transition-all duration-200">
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
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          className="border-[var(--glass-border)] bg-transparent text-[var(--text)] hover:bg-[var(--panel-strong)] transition-all duration-200"
          onClick={handlePreview}
          disabled={isSubmitting}
        >
          <Eye className="mr-2 h-4 w-4" />
          Preview
        </Button>
        <Button
          type="button"
          variant="outline"
          className="border-[var(--glass-border)] bg-transparent text-[var(--text)] hover:bg-[var(--panel-strong)] transition-all duration-200"
          onClick={onCancel || (() => router.back())}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}