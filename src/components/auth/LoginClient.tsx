'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HaloLogo } from '@/components/HaloLogo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContextProvider';
import { supabase } from '@/lib/supabaseClient';
import { Lock, Mail, AlertCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { nativeNavigate } from '@/lib/utils';

export default function LoginClient() {
    const router = useRouter();
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
        <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#050816] via-[#0B1026] to-[#1A1443]">
            {/* Animated color haze */}
            <div className="absolute w-[900px] h-[900px] bg-indigo-500/20 blur-[180px] rounded-full top-[-200px] left-[-200px] animate-[float_12s_ease-in-out_infinite]" />
            <div className="absolute w-[700px] h-[700px] bg-purple-500/20 blur-[160px] rounded-full bottom-[-200px] right-[-200px] animate-[float_16s_ease-in-out_infinite_reverse]" />

            <div className="w-full max-w-md relative z-10 flex flex-col items-center p-4">
                {/* Logo Section with Premium Halo */}
                <div className="relative mb-12 flex items-center justify-center">
                    <HaloLogo size={100} />
                </div>

                {/* Branding Section */}
                <div className="text-center mb-10 space-y-2">
                    <h1 className="text-4xl font-extrabold tracking-tight text-white drop-shadow-sm">
                        Thaiba MediaHive
                    </h1>
                    <p className="text-slate-400 text-lg font-medium">
                        Welcome back, please login.
                    </p>
                </div>

                {/* Login Card with Glassmorphism */}
                <div className="w-full backdrop-blur-xl bg-gradient-to-b from-white/10 to-white/5 border border-white/10 shadow-[0_20px_80px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.05)] rounded-2xl overflow-hidden mb-8">
                    <div className="p-10">
                        <form onSubmit={handleLogin} className="space-y-8">
                            <AnimatePresence>
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-200 text-sm flex items-center gap-2"
                                    >
                                        <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                                        {error}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                                    Email
                                </label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-primary transition-colors" />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="media@thaibagarden.com"
                                        className="w-full h-12 bg-white/5 border border-white/10 rounded-full pl-11 pr-6 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-white/10 transition-all text-sm"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2 relative">
                                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                                    Password
                                </label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-primary transition-colors" />
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••••••"
                                        className="w-full h-12 bg-white/5 border border-white/10 rounded-full pl-11 pr-6 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-white/10 transition-all text-sm"
                                    />
                                </div>
                                <div className="flex justify-end mt-1">
                                    <button type="button" className="text-[11px] font-bold text-primary hover:text-primary/80 transition-colors uppercase tracking-widest">
                                        Forgot?
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center space-x-3 ml-1">
                                <div className="relative flex items-center">
                                    <input
                                        type="checkbox"
                                        id="remember"
                                        className="h-4 w-4 rounded border-white/10 bg-white/5 text-primary focus:ring-primary/40 transition-all cursor-pointer"
                                    />
                                </div>
                                <label htmlFor="remember" className="text-sm font-medium text-slate-400 cursor-pointer select-none">
                                    Keep me logged in
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-bold rounded-full shadow-lg shadow-primary/20 transition-all duration-300 hover:shadow-[0_0_25px_rgba(99,102,241,0.6)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center text-sm"
                            >
                                {loading ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Signing in...</span>
                                    </div>
                                ) : (
                                    'Login'
                                )}
                            </button>

                            <div className="text-center pt-2">
                                <p className="text-sm text-slate-400 font-medium">
                                    New here? <button 
                                        type="button" 
                                        onClick={() => nativeNavigate('/welcome', router, 'LoginClient-Signup')}
                                        className="text-primary hover:text-primary/80 transition-colors font-bold"
                                    >
                                        Create Account
                                    </button>
                                </p>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Dual Footer Credits */}
                <div className="flex flex-col items-center gap-3 mt-4">
                    <p className="text-[11px] font-bold text-slate-500/60 uppercase tracking-[0.2em] text-center">
                        © 2026 Thaiba Garden - Media
                    </p>
                    <p className="text-[11px] font-bold text-slate-500/40 uppercase tracking-[0.2em] text-center px-4 py-1 border border-white/5 rounded-full backdrop-blur-sm">
                        Protected by Thaiba Garden Media Security
                    </p>
                </div>
            </div>
        </div>
    );
}

