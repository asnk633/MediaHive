'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContextProvider';
import { apiClient } from '@/lib/apiClient';
import { supabase } from '@/lib/supabaseClient';
import { SafeAvatar } from '@/components/ui/SafeAvatar';
import { MessageSquare, Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface Comment {
    id: string;
    type: 'comment';
    userId: string;
    userName: string;
    content: string;
    timestamp: { seconds: number; nanoseconds: number } | string;
}

interface TaskCommentsProps {
    taskId: string;
    activity: Comment[];
    onCommentAdded: () => void;
}

export function TaskComments({ taskId, activity, onCommentAdded }: TaskCommentsProps) {
    const { user } = useAuth();
    const [newComment, setNewComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Filter only comment-type activities
    const comments = activity.filter((a) => a.type === 'comment');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || !user) return;

        try {
            const newCommentObj = {
                id: Date.now().toString(),
                type: 'comment',
                userId: user.uid,
                userName: user.name || 'User',
                content: newComment,
                timestamp: new Date().toISOString()
            };

            const { data: taskData } = await supabase.from('tasks').select('activity').eq('id', taskId).single();
            const currentActivity = taskData?.activity || [];

            const { error } = await supabase.from('tasks').update({
                activity: [...currentActivity, newCommentObj]
            }).eq('id', taskId);

            if (error) throw error;

            setNewComment('');
            onCommentAdded();
            toast.success('Comment added');
        } catch (error) {
            console.error('Failed to add comment:', error);
            toast.error('Failed to add comment');
        } finally {
            setSubmitting(false);
        }
    };

    const formatTimestamp = (timestamp: Comment['timestamp']) => {
        if (typeof timestamp === 'string') {
            return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
        }
        return formatDistanceToNow(new Date(timestamp.seconds * 1000), { addSuffix: true });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-2">
                <MessageSquare size={18} className="text-primary" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                    Comments ({comments.length})
                </h3>
            </div>

            {/* Comment List */}
            <div className="space-y-4 max-h-96 overflow-y-auto">
                {comments.length === 0 ? (
                    <p className="text-sm text-muted-foreground/60 italic">No comments yet. Be the first to comment!</p>
                ) : (
                    comments.map((comment) => (
                        <div key={comment.id} className="flex gap-3 p-4 bg-surface/40 rounded-lg border border-soft">
                            <SafeAvatar
                                src={undefined}
                                name={comment.userName}
                                alt={comment.userName}
                                size={32}
                                className="shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-baseline gap-2 mb-1">
                                    <span className="text-sm font-semibold text-foreground">{comment.userName}</span>
                                    <span className="text-xs text-muted-foreground">
                                        {formatTimestamp(comment.timestamp)}
                                    </span>
                                </div>
                                <p className="text-sm text-foreground/90 whitespace-pre-wrap break-words">
                                    {comment.content}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Add Comment Form */}
            {user && (
                <form onSubmit={handleSubmit} className="space-y-3">
                    <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add a comment..."
                        className="w-full px-4 py-3 bg-surface border border-soft rounded-lg text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                        rows={3}
                        disabled={submitting}
                    />
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={!newComment.trim() || submitting}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <Send size={14} />
                            {submitting ? 'Posting...' : 'Post Comment'}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}
