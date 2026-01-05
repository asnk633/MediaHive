import React, { useState, useEffect } from 'react';
import { Star, Send, Check } from 'lucide-react';
import { Task } from '@/types/task';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { TaskRatingService } from '@/services/taskRatingService';

interface TaskRatingProps {
    task: Task;
    onRatingSubmitted?: () => void;
}

export const TaskRatingComponent = ({ task, onRatingSubmitted }: TaskRatingProps) => {
    const { user } = useAuth();
    const [hoverStars, setHoverStars] = useState(0);
    const [selectedStars, setSelectedStars] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [canRate, setCanRate] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    // Check if user can rate this task
    useEffect(() => {
        const checkPermission = async () => {
            if (user && task) {
                const allowed = await TaskRatingService.canRateTask(task, user);
                setCanRate(allowed);
            }
        };
        checkPermission();
    }, [task, user]);

    const existingRating = task.rating;

    // View Mode (Already Rated)
    if (existingRating) {
        return (
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 mt-4">
                <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider">Feedback</h4>
                    <span className="text-xs text-white/40">
                        by {existingRating.ratedBy.name}
                    </span>
                </div>
                <div className="flex items-center gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                            key={star}
                            size={18}
                            className={`${star <= existingRating.stars ? 'max-w-fit fill-yellow-400 text-yellow-400' : 'text-white/20'}`}
                        />
                    ))}
                </div>
                {existingRating.comment && (
                    <p className="text-sm text-white/70 italic">"{existingRating.comment}"</p>
                )}
            </div>
        );
    }

    // Only show input if user can rate
    if (!canRate || task.status !== 'done') return null;

    // Success state
    if (submitted) {
        return (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6 mt-6 text-center">
                <div className="flex items-center justify-center gap-2 text-emerald-400 mb-2">
                    <Check size={24} />
                    <span className="font-bold text-lg">Rating Submitted!</span>
                </div>
                <p className="text-sm text-white/60">Thank you for your feedback.</p>
            </div>
        );
    }

    const handleSubmit = async () => {
        if (selectedStars === 0) {
            toast.error('Please select a rating');
            return;
        }
        if (!user) {
            toast.error('You must be logged in');
            return;
        }

        setIsSubmitting(true);
        try {
            await TaskRatingService.rateTask(
                task.id,
                selectedStars,
                comment || undefined,
                {
                    uid: user.uid,
                    name: user.name || 'Unknown',
                    role: user.role || 'guest'
                }
            );
            setSubmitted(true);
            toast.success("Rating submitted! Thank you for your feedback.");

            if (onRatingSubmitted) {
                setTimeout(() => {
                    onRatingSubmitted();
                }, 500);
            }
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Failed to submit rating");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-6 mt-6 animate-fade-in">
            <h4 className="text-base font-bold text-white mb-1">Task Completed</h4>
            <p className="text-sm text-white/50 mb-4">How was the work delivered?</p>

            <div className="flex items-center gap-2 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setHoverStars(star)}
                        onMouseLeave={() => setHoverStars(0)}
                        onClick={() => {
                            setSelectedStars(star);
                            setIsExpanded(true);
                        }}
                        className="transition-transform hover:scale-110 focus:outline-none"
                    >
                        <Star
                            size={28}
                            className={`transition-colors ${star <= (hoverStars || selectedStars)
                                ? 'fill-yellow-400 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.4)]'
                                : 'text-white/20'
                                }`}
                        />
                    </button>
                ))}
            </div>

            {isExpanded && (
                <div className="space-y-3 animate-slide-down">
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Add a comment (optional)..."
                        rows={2}
                        className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm text-white placeholder:text-white/30 focus:border-blue-500/50 outline-none resize-none"
                    />
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={() => setIsExpanded(false)}
                            className="px-3 py-1.5 text-xs font-medium text-white/50 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting || selectedStars === 0}
                            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit Rating'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
