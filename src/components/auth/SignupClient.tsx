'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HaloLogo } from '@/components/HaloLogo';
import { useAuth } from '@/contexts/AuthContextProvider';
import { Lock, Mail, AlertCircle, Loader2, User, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { nativeNavigate } from '@/lib/utils';

export default function SignupClient() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const { signup } = useAuth();

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        try {
            if (!navigator.onLine) {
                setError('No internet connection. Please check your network.');
                setLoading(false);
                return;
            }

            console.log('[SIGNUP] Attempting signup for:', email);
            await signup(email, password);
            
            console.log('[SIGNUP] Success');
            setSuccess(true);
        } catch (err: any) {
            console.error('[SIGNUP] Error:', err);
            setError(err.message || 'Failed to create account. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#050816] via-[#0B1026] to-[#1A1443]">
                <div className="w-full max-w-md relative z-10 flex flex-col items-center p-4">
                    <div className="w-full backdrop-blur-xl bg-gradient-to-b from-white/10 to-white/5 border border-white/10 shadow-[0_20px_80px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.05)] rounded-2xl p-10 text-center space-y-6">
                        <div className="flex justify-center">
                            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center border border-green-500/30">
                                <CheckCircle2 className="w-10 h-10 text-green-500" />
                            </div>
                        </div>
                        <h2 className="text-3xl font-bold text-white">Check Your Email</h2>
                        <p className="text-slate-400">
                            We've sent a confirmation link to <span className="text-white font-medium">{email}</span>. Please verify your email to activate your account.
                        </p>
                        <button
                            onClick={() => nativeNavigate('/login', router, 'Signup-Success')}
                            className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-bold rounded-full transition-all"
                        >
                            Return to Login
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#050816] via-[#0B1026] to-[#1A1443]">
            {/* Animated color haze */}
            <div className="absolute w-[900px] h-[900px] bg-indigo-500/20 blur-[180px] rounded-full top-[-200px] left-[-200px] animate-[float_12s_ease-in-out_infinite]" />
            <div className="absolute w-[700px] h-[700px] bg-purple-500/20 blur-[160px] rounded-full bottom-[-200px] right-[-200px] animate-[float_16s_ease-in-out_infinite_reverse]" />

            <div className="w-full max-w-md relative z-10 flex flex-col items-center p-4">
                {/* Logo Section */}
                <div className="relative mb-8 flex items-center justify-center">
                    <HaloLogo size={80} />
                </div>

                <div className="text-center mb-8 space-y-2">
                    <h1 className="text-3xl font-extrabold tracking-tight text-white">
                        Create Account
                    </h1>
                    <p className="text-slate-400 font-medium">
                        Join the MediaHive production team.
                    </p>
                </div>

                <div className="w-full backdrop-blur-xl bg-gradient-to-b from-white/10 to-white/5 border border-white/10 shadow-2xl rounded-2xl overflow-hidden mb-8">
                    <div className="p-10">
                        <form onSubmit={handleSignup} className="space-y-6">
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
                                    Email Address
                                </label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-primary transition-colors" />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="your@email.com"
                                        className="w-full h-12 bg-white/5 border border-white/10 rounded-full pl-11 pr-6 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-white/10 transition-all text-sm"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                                    Create Password
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
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                                    Confirm Password
                                </label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-primary transition-colors" />
                                    <input
                                        type="password"
                                        required
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="••••••••••••"
                                        className="w-full h-12 bg-white/5 border border-white/10 rounded-full pl-11 pr-6 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-white/10 transition-all text-sm"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-bold rounded-full shadow-lg shadow-primary/20 transition-all duration-300 hover:shadow-[0_0_25px_rgba(99,102,241,0.6)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center text-sm"
                            >
                                {loading ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Creating Account...</span>
                                    </div>
                                ) : (
                                    'Create Account'
                                )}
                            </button>

                            <div className="text-center pt-2">
                                <p className="text-sm text-slate-400 font-medium">
                                    Already have an account? <button 
                                        type="button" 
                                        onClick={() => nativeNavigate('/login', router, 'Signup-Login')}
                                        className="text-primary hover:text-primary/80 transition-colors font-bold"
                                    >
                                        Login
                                    </button>
                                </p>
                            </div>
                        </form>
                    </div>
                </div>

                <p className="text-[11px] font-bold text-slate-500/60 uppercase tracking-[0.2em] text-center">
                    © 2026 Thaiba Garden - Media
                </p>
            </div>
        </div>
    );
}
