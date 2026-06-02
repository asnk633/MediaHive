'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Trash2, Send, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface VoiceRecorderProps {
    onStop: (file: File, duration: number) => void;
    onCancel: () => void;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
    onStop,
    onCancel
}) => {
    const [isRecording, setIsRecording] = useState(false);
    const [duration, setDuration] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    useEffect(() => {
        startRecording();
        return () => cleanUp();
    }, []);

    const startRecording = async () => {
        chunksRef.current = [];
        setError(null);
        setDuration(0);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            const options = { mimeType: 'audio/webm' };
            let recorder: MediaRecorder;
            
            try {
                recorder = new MediaRecorder(stream, options);
            } catch (e) {
                // Fallback if audio/webm is not supported (like Safari)
                recorder = new MediaRecorder(stream);
            }

            mediaRecorderRef.current = recorder;

            recorder.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            recorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
                const file = new File([blob], `voice_note_${Date.now()}.webm`, { type: blob.type });
                onStop(file, duration);
            };

            recorder.start(200); // chunk size 200ms
            setIsRecording(true);

            // Timer
            timerRef.current = setInterval(() => {
                setDuration(prev => prev + 1);
            }, 1000);

        } catch (err: any) {
            if (err.name === 'NotFoundError' || err.message?.toLowerCase().includes('device not found') || err.message?.toLowerCase().includes('requested device not found')) {
                console.warn('Microphone hardware not detected:', err.message || err);
                setError('No microphone found. Please connect a recording device.');
                toast.error('Microphone device not found');
            } else {
                console.error('Error starting audio recording:', err);
                setError('Could not access microphone. Please check permissions.');
                toast.error('Microphone access denied');
            }
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
        cleanUp();
    };

    const handleCancel = () => {
        cleanUp();
        onCancel();
    };

    const cleanUp = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setIsRecording(false);
    };

    const formatDuration = (sec: number) => {
        const m = Math.floor(sec / 60).toString().padStart(2, '0');
        const s = (sec % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    if (error) {
        return (
            <div className="flex items-center gap-3 px-3 py-1.5 bg-rose-500/10 border border-rose-500/25 text-rose-400 rounded-xl w-full text-xs font-light">
                <AlertCircle className="w-4 h-4 text-rose-500 animate-pulse shrink-0" />
                <span className="flex-1 truncate">{error}</span>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleCancel}
                    className="h-6 px-2 hover:bg-rose-500/10 text-rose-400 font-medium text-[10px] rounded-lg border border-rose-500/20"
                >
                    Dismiss
                </Button>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-4 bg-[#090d1f]/60 border border-indigo-500/25 px-4 py-2.5 rounded-2xl w-full animate-in fade-in slide-in-from-bottom-2 duration-300 backdrop-blur-md">
            {/* Pulsing micro indicator */}
            <div className="flex items-center gap-2.5 shrink-0">
                <div className="relative">
                    <div className="absolute inset-0 bg-rose-500/30 rounded-full animate-ping scale-125" />
                    <div className="h-6 w-6 bg-rose-600 rounded-full flex items-center justify-center text-white relative shadow-md">
                        <Mic className="h-3.5 w-3.5 animate-pulse" />
                    </div>
                </div>
                <span className="text-xs font-mono text-white/90 tabular-nums">
                    {formatDuration(duration)}
                </span>
            </div>

            {/* Sound Wave Animation Mock */}
            <div className="flex-1 flex items-center gap-0.5 px-3 h-4 overflow-hidden opacity-60">
                {[1, 3, 5, 2, 4, 1, 3, 5, 2, 4, 1, 3, 5, 2, 4].map((h, i) => (
                    <div 
                        key={i} 
                        className="bg-indigo-400 rounded-full w-0.5 transition-all duration-300 animate-pulse"
                        style={{ 
                            height: isRecording ? `${h * 20}%` : '2px', 
                            animationDelay: `${i * 100}ms`,
                            animationDuration: '600ms'
                        }}
                    />
                ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleCancel}
                    className="h-8 w-8 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
                <Button
                    type="button"
                    onClick={stopRecording}
                    className="h-8 w-8 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center cursor-pointer p-0 shrink-0"
                >
                    <Send className="h-3.5 w-3.5" />
                </Button>
            </div>
        </div>
    );
};
