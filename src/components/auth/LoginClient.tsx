'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HaloLogo } from '@/components/HaloLogo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContextProvider';
import { supabase } from '@/lib/supabaseClient';
import { Lock, Mail, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { nativeNavigate } from '@/lib/utils';
import { toast } from 'sonner';

export default function LoginClient() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [resetLoading, setResetLoading] = useState(false);
    const [showResetModal, setShowResetModal] = useState(false);
    const [resetSuccess, setResetSuccess] = useState(false);
    const [isRecoveryMode, setIsRecoveryMode] = useState(false);
    const [resetError, setResetError] = useState<string | null>(null);
    const { login } = useAuth();

    // Check for recovery mode on mount
    React.useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const hashParams = new URLSearchParams(window.location.hash.substring(1));
            
            // Check for explicit recovery flag or Supabase session tokens in hash/search
            if (params.get('recovery') === 'true' || 
                params.get('type') === 'recovery' || 
                hashParams.get('type') === 'recovery' ||
                params.get('code') || // PKCE flow
                hashParams.get('access_token')) { // Implicit flow
                setIsRecoveryMode(true);
                console.log('[LOGIN] Recovery mode detected');
            }
        }
    }, []);

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
            await login(email, password);
        } catch (err: any) {
            console.error('[LOGIN] Error:', err);
            setError(err.message || 'Failed to sign in.');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmNewPassword) {
            setError('Passwords do not match');
            return;
        }
        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { error: updateError } = await supabase.auth.updateUser({ 
                password: newPassword 
            });

            if (updateError) throw updateError;
            
            toast.success('Password updated successfully!');
            setIsRecoveryMode(false);
            // Clear URL params
            window.history.replaceState({}, document.title, window.location.pathname);
        } catch (err: any) {
            console.error('[UPDATE_PWD] Error:', err);
            setError(err.message || 'Failed to update password.');
            toast.error(err.message || 'Failed to update password.');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) {
            toast.error('Please enter your email address.');
            return;
        }

        setResetLoading(true);
        setResetError(null);
        console.log('[RESET] Attempting to send reset link to:', email);

        try {
            // Force the redirect URL to match the current origin (Vercel URL in prod)
            const redirectUrl = `${window.location.origin}/login?recovery=true`;
            console.log('[RESET] Using redirect URL:', redirectUrl);
            
            const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: redirectUrl,
            });

            if (resetError) {
                console.error('[RESET] Supabase Error:', resetError);
                throw resetError;
            }
            
            console.log('[RESET] Link sent successfully');
            setResetSuccess(true);
            toast.success('Reset link sent! Please check your inbox.');
        } catch (err: any) {
            console.error('[RESET] Caught Exception:', err);
            const msg = err.message || 'Failed to send reset link.';
            setResetError(msg);
            toast.error(msg);
        } finally {
            setResetLoading(false);
        }
    };

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

                {/* Branding Section */}
                <div className="text-center mb-8 space-y-2">
                    <h1 className="text-3xl font-extrabold tracking-tight text-white drop-shadow-sm">
                        Thaiba MediaHive
                    </h1>
                    <p className="text-slate-400 font-medium">
                        {isRecoveryMode ? 'Set your new password' : 'Welcome back, please login.'}
                    </p>
                </div>

                {/* Main Card */}
                <div className="w-full backdrop-blur-xl bg-gradient-to-b from-white/10 to-white/5 border border-white/10 shadow-2xl rounded-2xl overflow-hidden mb-8">
                    <div className="p-10">
                        {isRecoveryMode ? (
                            <form onSubmit={handleUpdatePassword} className="space-y-6">
                                <AnimatePresence>
                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-200 text-sm flex items-center gap-2"
                                        >
                                            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                                            {error}
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                                        New Password
                                    </label>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-primary transition-colors" />
                                        <input
                                            type="password"
                                            required
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="••••••••••••"
                                            className="w-full h-12 bg-white/5 border border-white/10 rounded-full pl-11 pr-6 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-white/10 transition-all text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                                        Confirm New Password
                                    </label>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-primary transition-colors" />
                                        <input
                                            type="password"
                                            required
                                            value={confirmNewPassword}
                                            onChange={(e) => setConfirmNewPassword(e.target.value)}
                                            placeholder="••••••••••••"
                                            className="w-full h-12 bg-white/5 border border-white/10 rounded-full pl-11 pr-6 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-white/10 transition-all text-sm"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-bold rounded-full shadow-lg transition-all flex items-center justify-center text-sm"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Password'}
                                </button>
                                
                                <div className="text-center">
                                    <button 
                                        type="button"
                                        onClick={() => setIsRecoveryMode(false)}
                                        className="text-sm font-medium text-slate-500 hover:text-white transition-colors"
                                    >
                                        Back to Login
                                    </button>
                                </div>
                            </form>
                        ) : (
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
                                        <button 
                                            type="button" 
                                            onClick={() => setShowResetModal(true)}
                                            className="text-[11px] font-bold text-primary hover:text-primary/80 transition-colors uppercase tracking-widest"
                                        >
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
                                    className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-bold rounded-full shadow-lg transition-all flex items-center justify-center text-sm"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Login'}
                                </button>

                                <div className="text-center pt-2">
                                    <p className="text-sm text-slate-400 font-medium">
                                        New here? <button 
                                            type="button" 
                                            onClick={() => nativeNavigate('/signup', router, 'LoginClient-Signup')}
                                            className="text-primary hover:text-primary/80 transition-colors font-bold"
                                        >
                                            Create Account
                                        </button>
                                    </p>
                                </div>
                            </form>
                        )}
                    </div>
                </div>

                <p className="text-[11px] font-bold text-slate-500/60 uppercase tracking-[0.2em] text-center">
                    © 2026 Thaiba Garden - Media
                </p>
            </div>

            {/* Reset Password Modal */}
            <AnimatePresence>
                {showResetModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => setShowResetModal(false)}
                        />
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-sm bg-slate-900 border border-white/10 rounded-2xl shadow-2xl p-8 overflow-hidden"
                        >
                            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />
                            
                            {resetSuccess ? (
                                <div className="text-center space-y-6">
                                    <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto border border-green-500/20">
                                        <CheckCircle2 className="w-8 h-8 text-green-500" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white">Check Your Inbox</h3>
                                    <p className="text-slate-400 text-sm">
                                        If an account exists for <span className="text-white font-medium">{email}</span>, you will receive a reset link shortly.
                                    </p>
                                    <Button 
                                        onClick={() => setShowResetModal(false)}
                                        className="w-full h-11 bg-primary text-white font-bold rounded-full"
                                    >
                                        Close
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="space-y-2 text-center">
                                        <h3 className="text-xl font-bold text-white">Reset Password</h3>
                                        <p className="text-slate-400 text-sm">Enter your email to receive a recovery link.</p>
                                    </div>
                                    
                                    <form onSubmit={handleResetPassword} className="space-y-6">
                                        <AnimatePresence>
                                            {resetError && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-200 text-xs flex items-center gap-2"
                                                >
                                                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                                                    {resetError}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        <div className="space-y-2">
                                            <div className="relative group">
                                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-primary" />
                                                <input
                                                    type="email"
                                                    required
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    placeholder="media@thaibagarden.com"
                                                    className="w-full h-11 bg-white/5 border border-white/10 rounded-full pl-11 pr-6 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all text-sm"
                                                />
                                            </div>
                                        </div>
                                        
                                        <div className="flex flex-col gap-3">
                                            <Button 
                                                type="submit"
                                                disabled={resetLoading || !email}
                                                className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-bold rounded-full transition-all"
                                            >
                                                {resetLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Reset Link'}
                                            </Button>
                                            <button 
                                                type="button"
                                                onClick={() => setShowResetModal(false)}
                                                className="text-sm font-medium text-slate-500 hover:text-white transition-colors py-1"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

