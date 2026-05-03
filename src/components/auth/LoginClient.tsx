'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RippleLogo } from '@/components/RippleLogo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContextProvider';
import { supabase } from '@/lib/supabaseClient';
import { Lock, Mail, AlertCircle, Loader2 } from 'lucide-react';

export default function LoginClient() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            if (!navigator.onLine) {
                setError('No internet connection. Please check your network.');
                setLoading(false);
                return;
            }
            console.log('[LOGIN] Attempting login for:', email);

            await login(email, password);

            console.log('[LOGIN] Supabase sign-in successful');
            // AuthContext will handle the state change and redirect/render via onAuthStateChange
        } catch (err: any) {
            console.error('[LOGIN] Error:', err);
            if (err.message && err.message.toLowerCase().includes('invalid login credentials')) {
                setError('Invalid email or password');
            } else if (err.message && err.message.toLowerCase().includes('network')) {
                setError('Network error. Please check your connection.');
            } else {
                setError(err.message || 'Failed to sign in. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[50] flex items-center justify-center p-4 bg-background overflow-hidden">
            {/* Subtle Texture/Divider for weight */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, var(--text-muted) 1px, transparent 0)', backgroundSize: '40px 40px' }} />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md relative z-10"
            >
                <div className="flex flex-col items-center mb-10">
                    <div className="scale-90 mb-6 grayscale brightness-200">
                        <RippleLogo />
                    </div>
                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-foreground tracking-tight">MediaHive</h1>
                        <p className="text-muted-foreground mt-2 font-medium">Secure Access Portal</p>
                    </div>
                </div>

                <div className="bg-card border border-border shadow-medium rounded-md overflow-hidden">
                    <div className="p-8">
                        <form onSubmit={handleLogin} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Email</label>
                                <div className="relative group">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <Input
                                        type="email"
                                        placeholder="Enter your email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="pl-10 h-11 bg-surface border-border focus:border-primary text-foreground placeholder:text-muted/40 rounded-sm transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Password</label>
                                <div className="relative group">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <Input
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="pl-10 h-11 bg-surface border-border focus:border-primary text-foreground placeholder:text-muted/40 rounded-sm transition-all"
                                    />
                                </div>
                            </div>

                            <AnimatePresence>
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="bg-destructive/10 border border-destructive/20 rounded-sm p-4 flex items-start gap-3"
                                    >
                                        <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                                        <p className="text-sm text-destructive-foreground font-medium">{error}</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-sm shadow-soft transition-all active:scale-[0.98] disabled:opacity-50"
                            >
                                {loading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    'Sign In'
                                )}
                            </Button>
                        </form>

                        <div className="mt-10 pt-6 border-t border-border flex flex-col items-center gap-4">
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50">
                                Protected by Thaiba Garden Security
                            </p>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

