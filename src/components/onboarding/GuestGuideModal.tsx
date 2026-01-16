"use client";

import React from "react";
import { X } from "lucide-react";

interface GuestGuideModalProps {
    open: boolean;
    onClose: () => void;
}

export function GuestGuideModal({ open, onClose }: GuestGuideModalProps) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-strong flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-4 border-b border-border flex items-center justify-between">
                    <h2 className="text-lg font-bold text-foreground">Guest User Guide</h2>
                    <button onClick={onClose} aria-label="Close guide" className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 text-foreground space-y-6">
                    <div className="prose prose-invert prose-sm max-w-none">
                        <h1>Welcome to Thaiba MediaHive!</h1>
                        <p className="text-muted-foreground">This app is designed to streamline how you request media tasks and events for your Office, Unit, or Institution. This guide will help you get started.</p>

                        <hr className="border-border my-6" />

                        <div className="space-y-6">
                            <section>
                                <h3 className="text-primary font-bold text-lg mb-2">1. First-Time Access & Registration</h3>
                                <div className="bg-yellow-500/10 border-l-4 border-yellow-500 p-3 mb-4 rounded-r-lg">
                                    <p className="text-yellow-200 text-xs font-semibold">🚧 Important: You must register to use this app. There is no "guest login" or anonymous access.</p>
                                </div>
                                <ol className="list-decimal pl-5 space-y-2 text-muted-foreground">
                                    <li><strong>Open the App Link</strong> provided to you.</li>
                                    <li>Tap <strong>Create Account</strong> (do not try to log in yet).</li>
                                    <li><strong>Fill in your details:</strong> Full Name, Email, Password.</li>
                                    <li><strong>Select Your Context (Crucial):</strong>
                                        <ul className="list-disc pl-5 mt-1 space-y-1">
                                            <li><strong>Institution:</strong> Select your main institution.</li>
                                            <li><strong>Office / Unit:</strong> Select the specific department or unit you represent (e.g., "Office", "Primary Section").</li>
                                            <li><em className="text-foreground/80">Note: All tasks you submit will be officially recorded in the system under the selected Unit.</em></li>
                                        </ul>
                                    </li>
                                    <li>Tap <strong>Create Account</strong> to finish.</li>
                                </ol>
                            </section>

                            <section>
                                <h3 className="text-primary font-bold text-lg mb-2">2. Guest Role Limitations</h3>
                                <p className="text-muted-foreground mb-3">As a Guest user, your account has limited permissions to ensure an organized workflow.</p>
                                <ul className="space-y-2 text-sm">
                                    <li className="flex gap-2">❌ <span className="text-muted-foreground"><strong>You Cannot Assign Tasks:</strong> You cannot choose which team member works on your request. Admins will handle this.</span></li>
                                    <li className="flex gap-2">❌ <span className="text-muted-foreground"><strong>You Cannot Change Status:</strong> You cannot mark a task as "Done". The production team will update the status as they work.</span></li>
                                    <li className="flex gap-2">❌ <span className="text-muted-foreground"><strong>You Cannot Set Priority:</strong> Guest users cannot set priority. Admin manages priority internally.</span></li>
                                    <li className="flex gap-2">✅ <span className="text-foreground"><strong>Default Status:</strong> All your new requests will appear as <strong>"Pending"</strong> initially.</span></li>
                                </ul>
                            </section>

                            <section>
                                <h3 className="text-primary font-bold text-lg mb-2">3. Creating a New Task (Work Request)</h3>
                                <p className="text-muted-foreground mb-3">Use this for specific media requirements (e.g., "Design a poster," "Edit a video").</p>
                                <ol className="list-decimal pl-5 space-y-2 text-muted-foreground">
                                    <li>Tap the <strong>(+) Plus Button</strong> at the bottom center of the screen.</li>
                                    <li>Select <strong>New Task</strong>.</li>
                                    <li><strong>Fill in the Request Details:</strong>
                                        <ul className="list-disc pl-5 mt-1 space-y-1">
                                            <li><strong>Title:</strong> Be specific (e.g., "Independence Day Poster Design" instead of just "Poster").</li>
                                            <li><strong>Description:</strong> Provide all necessary details (text to include, size, color preferences).</li>
                                            <li><strong>Due Date:</strong> Select a realistic date when you need this delivered.</li>
                                        </ul>
                                    </li>
                                    <li><strong>Confirm Context:</strong> Ensure it shows "Requesting as [Your Unit Name]".</li>
                                    <li>Tap <strong>Submit Task</strong>.</li>
                                </ol>
                            </section>

                            <section>
                                <h3 className="text-primary font-bold text-lg mb-2">4. Creating an Event</h3>
                                <p className="text-muted-foreground mb-3">Use this for advance planning, media coverage preparation, and internal coordination of upcoming programs.</p>
                                <ol className="list-decimal pl-5 space-y-2 text-muted-foreground">
                                    <li>Tap the <strong>(+) Plus Button</strong> at the bottom center of the screen.</li>
                                    <li>Select <strong>New Event</strong>.</li>
                                    <li><strong>Enter Event Details:</strong> Event Name, Date & Time, Location.</li>
                                    <li>Tap <strong>Create Event</strong>.</li>
                                </ol>
                                <p className="text-sm italic text-blue-300 mt-2">*Tip: Submit events at least 48 hours in advance to ensure team availability.*</p>
                            </section>

                            <section>
                                <h3 className="text-primary font-bold text-lg mb-2">5. Viewing Your Requests</h3>
                                <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                                    <li>Go to the <strong>Profile Tab</strong> (bottom right icon).</li>
                                    <li>Look at the <strong>"Tasks Requested"</strong> counter.</li>
                                    <li>You can also see your recent activity on the <strong>Home Screen</strong> (Pending / In Progress / Done).</li>
                                </ul>
                            </section>

                            <section>
                                <h3 className="text-primary font-bold text-lg mb-2">6. Usage Etiquette & Guidelines</h3>
                                <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                                    <li><strong>Submit Early:</strong> Do not wait until the last minute.</li>
                                    <li><strong>One Thing, One Task:</strong> Do not combine multiple requests. Create separate tasks.</li>
                                    <li><strong>Be Clear:</strong> Avoid vague requests. Details prevent delays.</li>
                                    <li><strong>Urgency:</strong> Only set deadlines for today/tomorrow if it is a genuine emergency.</li>
                                </ul>
                            </section>

                            <hr className="border-border my-6" />

                            <section className="bg-muted/30 p-4 rounded-xl border border-border">
                                <h3 className="text-sm font-bold text-foreground mb-1">⚠️ Test Version Disclaimer</h3>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    This application is currently in a <strong>Testing / Beta Stage</strong>. You may encounter occasional bugs.
                                    Data might be reset during major updates. If something doesn't work, please report it to the admin team via WhatsApp.
                                </p>
                            </section>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-border bg-muted/10">
                    <button onClick={onClose} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm">
                        Got it
                    </button>
                </div>
            </div>
        </div>
    );
}
