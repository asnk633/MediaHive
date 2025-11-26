'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TaskFormData, taskFormSchema } from '@/lib/forms/validators';
import { useAuth } from '@/contexts/AuthContext';
import { usePermission } from '@/hooks/usePermission';
import { User } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, Paperclip, X, Tag, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskFormProps {
  initialData?: Partial<TaskFormData>;
  onSubmitSuccess?: () => void;
  onCancel?: () => void;
}

export function TaskForm({ initialData, onSubmitSuccess, onCancel }: TaskFormProps) {
  const { user } = useAuth();
  const { can, role } = usePermission();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: '',
      description: null,
      dueDate: null,
      dueTime: null,
      priority: 'Medium',
      assignedToId: null,
      tags: [],
      attachments: [],
      ...initialData,
    },
  });

  // Watch form values for auto-save
  const formData = watch();

  // Auto-save draft to localStorage
  useEffect(() => {
    if (!user) return;
    
    // Clear existing timeout
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    
    // Set new timeout
    debounceTimeout.current = setTimeout(() => {
      const draft = {
        ...formData,
        tags,
        lastSaved: new Date().toISOString(),
      };
      localStorage.setItem(`taskDraft_${user.id}`, JSON.stringify(draft));
    }, 3000); // 3s debounce
    
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [formData, tags, user]);

  // Load draft from localStorage on mount
  useEffect(() => {
    if (!user) return;
    
    const savedDraft = localStorage.getItem(`taskDraft_${user.id}`);
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        Object.keys(draft).forEach(key => {
          if (key !== 'tags' && key !== 'lastSaved') {
            setValue(key as keyof TaskFormData, draft[key]);
          }
        });
        if (draft.tags) {
          setTags(draft.tags);
        }
      } catch (e) {
        console.error('Failed to parse draft', e);
      }
    }
  }, [setValue, user]);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    // Only fetch users if allowed to assign (Team/Admin)
    if (can('read:users')) {
      fetchUsers();
    }
  }, [user, router, can]);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`/api/users?institutionId=${user!.institutionId}&limit=100`, {
        headers: { 'x-user-id': String(user!.id) }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data.filter((u: User) => u.role !== 'guest'));
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    }
  };

  const onSubmit = async (data: TaskFormData) => {
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      // Prepare form data for submission
      const payload = {
        title: data.title,
        description: data.description || null,
        dueDate: data.dueDate ? `${data.dueDate}${data.dueTime ? `T${data.dueTime}` : 'T00:00'}` : null,
        priority: data.priority.toLowerCase() as 'urgent' | 'high' | 'medium' | 'low',
        assignedToId: data.assignedToId ? String(data.assignedToId) : null,
        attachments: attachments.map(file => ({
          name: file.name,
          url: '' // In a real implementation, you would upload the file and get the URL
        })),
        tags,
      };

      const response = await fetch('/api/tasks/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': String(user.id)
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        // Clear draft on successful submission
        localStorage.removeItem(`taskDraft_${user.id}`);
        toast.success('Task created successfully');
        if (onSubmitSuccess) {
          onSubmitSuccess();
        } else {
          router.push('/tasks');
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to create task');
      }
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Error creating task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      handleAddTag();
    } else if (e.key === 'Backspace' && tagInput === '' && tags.length > 0) {
      // Remove last tag when backspace is pressed on empty input
      setTags(tags.slice(0, -1));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      // Filter for images and PDFs only
      const validFiles = files.filter(file => 
        file.type.startsWith('image/') || file.type === 'application/pdf'
      );
      
      if (validFiles.length !== files.length) {
        toast.error('Only images and PDF files are allowed');
      }
      
      setAttachments(prev => [...prev, ...validFiles]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  // Permission Checks
  const canAssign = can('read:users');
  const canSetPriority = role !== 'guest';

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
              data-testid="task-title-input"
              placeholder="Enter task title"
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

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <Textarea
              {...field}
              id="description"
              placeholder="Enter task description"
              rows={4}
              className={cn(
                errors.description && 'border-red-500',
                'bg-[var(--panel)] border-[var(--glass-border)] text-[var(--text)]'
              )}
              aria-invalid={!!errors.description}
              aria-describedby={errors.description ? 'description-error' : undefined}
              value={field.value || ''}
              onChange={(e) => field.onChange(e.target.value || null)}
            />
          )}
        />
        {errors.description && (
          <p 
            id="description-error" 
            className="text-sm text-red-500" 
            role="alert"
            aria-live="assertive"
          >
            {errors.description.message}
          </p>
        )}
      </div>

      {/* Due Date and Time */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="dueDate">Due Date</Label>
          <Controller
            name="dueDate"
            control={control}
            render={({ field }) => (
              <div className="relative">
                <Input
                  {...field}
                  id="dueDate"
                  type="date"
                  value={field.value || ''}
                  onChange={(e) => field.onChange(e.target.value || null)}
                  className={cn(
                    errors.dueDate && 'border-red-500',
                    'bg-[var(--panel)] border-[var(--glass-border)] text-[var(--text)]'
                  )}
                  aria-invalid={!!errors.dueDate}
                  aria-describedby={errors.dueDate ? 'dueDate-error' : undefined}
                />
                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--icon)]" />
              </div>
            )}
          />
          {errors.dueDate && (
            <p 
              id="dueDate-error" 
              className="text-sm text-red-500" 
              role="alert"
              aria-live="assertive"
            >
              {errors.dueDate.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="dueTime">Due Time</Label>
          <Controller
            name="dueTime"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                id="dueTime"
                type="time"
                value={field.value || ''}
                onChange={(e) => field.onChange(e.target.value || null)}
                className={cn(
                  errors.dueTime && 'border-red-500',
                  'bg-[var(--panel)] border-[var(--glass-border)] text-[var(--text)]'
                )}
                aria-invalid={!!errors.dueTime}
                aria-describedby={errors.dueTime ? 'dueTime-error' : undefined}
              />
            )}
          />
          {errors.dueTime && (
            <p 
              id="dueTime-error" 
              className="text-sm text-red-500" 
              role="alert"
              aria-live="assertive"
            >
              {errors.dueTime.message}
            </p>
          )}
        </div>
      </div>

      {/* Priority and Assigned To */}
      <div className="grid gap-4 sm:grid-cols-2">
        {canSetPriority && (
          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Controller
              name="priority"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger 
                    id="priority"
                    data-testid="task-priority-select-trigger"
                    className={cn(
                      errors.priority && 'border-red-500',
                      'bg-[var(--panel)] border-[var(--glass-border)] text-[var(--text)]'
                    )}
                    aria-invalid={!!errors.priority}
                    aria-describedby={errors.priority ? 'priority-error' : undefined}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[var(--panel)] border-[var(--glass-border)]">
                    <SelectItem value="Urgent" className="text-[var(--text)]">Urgent</SelectItem>
                    <SelectItem value="High" className="text-[var(--text)]">High</SelectItem>
                    <SelectItem value="Medium" className="text-[var(--text)]">Medium</SelectItem>
                    <SelectItem value="Low" className="text-[var(--text)]">Low</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.priority && (
              <p 
                id="priority-error" 
                className="text-sm text-red-500" 
                role="alert"
                aria-live="assertive"
              >
                {errors.priority.message}
              </p>
            )}
          </div>
        )}

        {canAssign && (
          <div className="space-y-2">
            <Label htmlFor="assignedTo">Assign To</Label>
            <Controller
              name="assignedToId"
              control={control}
              render={({ field }) => (
                <Select 
                  value={field.value?.toString() || ''} 
                  onValueChange={(value) => field.onChange(value ? parseInt(value) : null)}
                >
                  <SelectTrigger 
                    id="assignedTo"
                    className={cn(
                      errors.assignedToId && 'border-red-500',
                      'bg-[var(--panel)] border-[var(--glass-border)] text-[var(--text)]'
                    )}
                    aria-invalid={!!errors.assignedToId}
                    aria-describedby={errors.assignedToId ? 'assignedTo-error' : undefined}
                  >
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent className="bg-[var(--panel)] border-[var(--glass-border)]">
                    <SelectItem value="" className="text-[var(--text)]">Unassigned</SelectItem>
                    {users.map(user => (
                      <SelectItem key={user.id} value={user.id.toString()} className="text-[var(--text)]">
                        {user.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.assignedToId && (
              <p 
                id="assignedTo-error" 
                className="text-sm text-red-500" 
                role="alert"
                aria-live="assertive"
              >
                {errors.assignedToId.message}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <Label htmlFor="tags">Tags</Label>
        <div className="flex flex-wrap gap-2 mb-2">
          {tags.map((tag, index) => (
            <div 
              key={index} 
              className="flex items-center gap-1 bg-[var(--panel)] border border-[var(--glass-border)] rounded-full px-3 py-1 text-sm text-[var(--text)]"
            >
              <Tag className="w-3 h-3 text-[var(--icon)]" />
              <span>{tag}</span>
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                className="text-[var(--icon-muted)] hover:text-[var(--danger)] focus:outline-none transition-all duration-200"
                aria-label={`Remove tag ${tag}`}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            id="tags"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a tag..."
            className={cn(
              errors.tags && 'border-red-500',
              'bg-[var(--panel)] border-[var(--glass-border)] text-[var(--text)]'
            )}
            aria-invalid={!!errors.tags}
            aria-describedby={errors.tags ? 'tags-error' : undefined}
          />
          <Button 
            type="button" 
            variant="outline"
            className="border-[var(--glass-border)] bg-[var(--panel)] text-[var(--text)] hover:bg-[var(--panel-strong)] transition-all duration-200"
            onClick={handleAddTag}
            aria-label="Add tag"
          >
            Add
          </Button>
        </div>
        {errors.tags && (
          <p 
            id="tags-error" 
            className="text-sm text-red-500" 
            role="alert"
            aria-live="assertive"
          >
            {errors.tags.message}
          </p>
        )}
      </div>

      {/* Attachments */}
      <div className="space-y-2">
        <Label htmlFor="attachments">Attachments</Label>
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,application/pdf"
              onChange={handleFileChange}
              className="hidden"
              id="attachments"
              aria-describedby={errors.attachments ? 'attachments-error' : undefined}
            />
            <Button
              type="button"
              variant="outline"
              className="border-[var(--glass-border)] bg-[var(--panel)] text-[var(--text)] hover:bg-[var(--panel-strong)] transition-all duration-200 flex items-center gap-2"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Add attachments"
            >
              <Paperclip className="w-4 h-4 text-[var(--icon)]" />
              Add Files
            </Button>
          </div>
          
          {attachments.length > 0 && (
            <div className="mt-2 space-y-2">
              {attachments.map((file, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between bg-[var(--panel)] border border-[var(--glass-border)] rounded-lg px-3 py-2 text-[var(--text)]"
                >
                  <div className="flex items-center gap-2">
                    <Paperclip className="w-4 h-4 text-[var(--icon)]" />
                    <span className="text-sm truncate max-w-xs">{file.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAttachment(index)}
                    className="text-[var(--icon-muted)] hover:text-[var(--danger)] focus:outline-none transition-all duration-200"
                    aria-label={`Remove attachment ${file.name}`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        {errors.attachments && (
          <p 
            id="attachments-error" 
            className="text-sm text-red-500" 
            role="alert"
            aria-live="assertive"
          >
            {errors.attachments.message}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <Button 
          type="submit" 
          disabled={isSubmitting} 
          className="flex-1 bg-[var(--accent)] text-white hover:bg-[var(--accent-2)] transition-all duration-200"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            'Create Task'
          )}
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