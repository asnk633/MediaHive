'use client';

import { useState } from 'react';
import { AlertTriangle, Lock, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

interface SafetyConfirmationProps {
    title: string;
    description: string;
    onConfirm: () => void;
    onCancel: () => void;
}

/**
 * SafetyConfirmationOverlay: Implements "Dual Confirmation" safety controls.
 * Required for SOC 2 and regulated industry safety obligations.
 */
export function SafetyConfirmationOverlay({ title, description, onConfirm, onCancel }: SafetyConfirmationProps) {
    const [confirmed, setConfirmed] = useState(false);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <div className="max-w-md w-full bg-[#0a0c10] border border-orange-500/30 rounded-3xl p-8 space-y-6 shadow-2xl shadow-orange-500/10">
                <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto">
                    <AlertTriangle className="text-orange-500 w-8 h-8" />
                </div>

                <div className="text-center space-y-2">
                    <h2 className="text-xl font-bold text-white">{title}</h2>
                    <p className="text-sm text-gray-400">{description}</p>
                </div>

                <div className="flex items-start gap-3 p-4 bg-white/5 rounded-2xl border border-white/10 transition-all hover:bg-white/10 group cursor-pointer" onClick={() => setConfirmed(!confirmed)}>
                    <Checkbox
                        checked={confirmed}
                        onCheckedChange={(c) => setConfirmed(c === true)}
                        className="mt-1 border-orange-500/50 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                    />
                    <span className="text-xs text-gray-300 select-none">
                        I confirm that I have reviewed the operational impact of this action and take responsibility for the change.
                    </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <Button variant="ghost" onClick={onCancel} className="rounded-xl border border-white/5 hover:bg-white/5 text-gray-400">
                        Cancel
                    </Button>
                    <Button
                        disabled={!confirmed}
                        onClick={onConfirm}
                        className="rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold transition-all disabled:opacity-30 disabled:grayscale"
                    >
                        Authorize Action
                    </Button>
                </div>

                <div className="flex items-center justify-center gap-2 text-[9px] text-gray-600 uppercase tracking-widest font-bold">
                    <ShieldCheck size={10} />
                    SOC 2 Safety Control Active
                </div>
            </div>
        </div>
    );
}
