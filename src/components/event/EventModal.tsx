import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useClientData } from "@/app/(shell)/ClientDataContext";
import { useRole } from "@/app/(shell)/RoleContext";
import { CalendarIcon, Clock, MapPin, AlignLeft } from "lucide-react";

interface EventModalProps {
    isOpen: boolean;
    onClose: () => void;
    defaultDate?: Date;
}

export function EventModal({ isOpen, onClose, defaultDate }: EventModalProps) {
    const { createEvent } = useClientData();
    const { user } = useRole();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        date: defaultDate ? defaultDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        startTime: "09:00",
        endTime: "10:00",
        location: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const startAt = new Date(`${formData.date}T${formData.startTime}`).toISOString();
            const endAt = formData.endTime ? new Date(`${formData.date}T${formData.endTime}`).toISOString() : null;

            await createEvent({
                title: formData.title,
                description: formData.description,
                startAt,
                endAt,
                location: formData.location,
            });
            onClose();
            // Reset form?
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const canCreate = user.role === 'admin' || user.role === 'team' || user.role === 'guest'; // Assuming guests can request events

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] bg-surface/95 backdrop-blur-xl border-white/10 text-text-primary">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">
                        {user.role === 'guest' ? 'Request Event' : 'Create Event'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <div className="space-y-2">
                        <Label htmlFor="title" className="text-xs font-medium text-text-muted uppercase tracking-wider">Event Title</Label>
                        <Input
                            id="title"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="e.g. Weekly Team Sync"
                            required
                            className="bg-background/50 border-white/10 focus:border-accent/50"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="date" className="text-xs font-medium text-text-muted uppercase tracking-wider">Date</Label>
                            <div className="relative">
                                <CalendarIcon className="absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
                                <Input
                                    id="date"
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    required
                                    className="pl-9 bg-background/50 border-white/10"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="startTime" className="text-xs font-medium text-text-muted uppercase tracking-wider">Start Time</Label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
                                <Input
                                    id="startTime"
                                    type="time"
                                    value={formData.startTime}
                                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                    required
                                    className="pl-9 bg-background/50 border-white/10"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="location" className="text-xs font-medium text-text-muted uppercase tracking-wider">Location</Label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
                            <Input
                                id="location"
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                placeholder="e.g. Conference Room A"
                                className="pl-9 bg-background/50 border-white/10"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description" className="text-xs font-medium text-text-muted uppercase tracking-wider">Description</Label>
                        <div className="relative">
                            <AlignLeft className="absolute left-3 top-3 h-4 w-4 text-text-muted" />
                            <textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Add details..."
                                className="flex min-h-[80px] w-full rounded-md border border-white/10 bg-background/50 px-3 py-2 pl-9 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            />
                        </div>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="ghost" onClick={onClose} className="hover:bg-white/5">Cancel</Button>
                        <Button type="submit" disabled={loading || !canCreate} className="bg-accent hover:bg-accent/90 text-white shadow-glow">
                            {loading ? "Creating..." : "Create Event"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
