'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HaloLogo } from '@/components/HaloLogo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContextProvider';
import { supabase } from '@/lib/supabaseClient';
import { Lock, Mail, AlertCircle, Loader2, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { nativeNavigate, cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemeToggle } from '@/components/auth/ThemeToggle';

export default function LoginClient() {
    const router = useRouter();
    const { theme } = useTheme();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [resetLoading, setResetLoading] = useState(false);
    const [showResetModal, setShowResetModal] = useState(false);
    const [resetSuccess, setResetSuccess] = useState(false);
    const [isRecoveryMode, setIsRecoveryMode] = useState(false);
    const [resetError, setResetError] = useState<string | null>(null);
    const { user, loading: authLoading, login } = useAuth();

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

    // Redirect to /home if already authenticated (handles playwright_test_auth bypass and normal auth)
    React.useEffect(() => {
        if (!authLoading && user) {
            console.log('[LOGIN] User already authenticated, redirecting to /home');
            nativeNavigate('/home', router, 'LoginClient-AlreadyAuthed');
        }
    }, [user, authLoading, router]);


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
        
        // Final safety check for session
        if (!user) {
            toast.error('Auth session missing! Your link may have expired.');
            setError('Auth session missing! Your link may have expired. Please request a new one.');
            return;
        }

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

    const bgGradient = theme === 'luminous'
        ? "bg-gradient-to-br from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0] text-slate-800"
        : theme === 'golden'
        ? "bg-gradient-to-br from-[#02040a] via-[#0a0a05] to-[#151100]"
        : "bg-gradient-to-br from-[#050816] via-[#0B1026] to-[#1A1443]";

    const hazeGlow1 = theme === 'luminous'
        ? "bg-sky-400/15"
        : theme === 'golden'
        ? "bg-amber-500/10"
        : "bg-indigo-500/20";

    const hazeGlow2 = theme === 'luminous'
        ? "bg-indigo-400/15"
        : theme === 'golden'
        ? "bg-amber-600/5"
        : "bg-purple-500/20";

    return (
        <div suppressHydrationWarning className={cn("relative min-h-screen flex items-center justify-center overflow-hidden transition-all duration-500", bgGradient)}>
            <ThemeToggle />
            
            {/* Animated color haze */}
            <div className={cn("absolute w-[900px] h-[900px] blur-[180px] rounded-full top-[-200px] left-[-200px] animate-[float_12s_ease-in-out_infinite] transition-colors duration-500", hazeGlow1)} />
            <div className={cn("absolute w-[700px] h-[700px] blur-[160px] rounded-full bottom-[-200px] right-[-200px] animate-[float_16s_ease-in-out_infinite_reverse] transition-colors duration-500", hazeGlow2)} />

            <div className="w-full max-w-md relative z-10 flex flex-col items-center p-4">
                {/* Logo Section */}
                <div className="relative -mb-10 flex items-center justify-center">
                    <HaloLogo size={140} />
                </div>

                <div className="text-center mb-8 space-y-0.5 px-4">
                    <img 
                        src={theme === 'luminous' ? '/brand-name-dark.png' : '/brand-name-light.png'}
                        alt="MediaHive"
                        className="w-72 md:w-96 h-auto object-contain drop-shadow-md mx-auto -mt-20 md:-mt-32 -mb-[80px] md:-mb-[120px]"
                    />
                    <p className="text-xs md:text-sm text-foreground font-bold uppercase tracking-wider max-w-md mx-auto">
                        The Central Hub for Thaiba Garden Media & IT
                    </p>
                </div>

                {/* Main Card */}
                <div className="w-full glass-card rounded-2xl overflow-hidden mb-8">
                    <div className="p-10">
                        {!isRecoveryMode && (
                            <div className="mb-8 space-y-2">
                                <h2 className="text-2xl font-bold text-foreground">Welcome</h2>
                                <p className="text-xs text-foreground/60 leading-relaxed">
                                    A unified control center to Request tasks, access assets, schedule events, and collaborate with our teams at Thaiba Garden Media and IT department.
                                </p>
                            </div>
                        )}
                        {isRecoveryMode ? (
                            <div className="space-y-6">
                                <AnimatePresence mode="wait">
                                    {(!user && !authLoading) ? (
                                        <motion.div
                                            key="recovery-error"
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="text-center space-y-6"
                                        >
                                            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
                                                <AlertCircle className="w-8 h-8 text-red-500" />
                                            </div>
                                            <div className="space-y-2">
                                                <h3 className="text-xl font-bold text-foreground">Link Invalid or Expired</h3>
                                                <p className="text-foreground/60 text-sm">
                                                    Your recovery session could not be verified. This happens if the link was already used or has expired.
                                                </p>
                                            </div>
                                            <Button 
                                                onClick={() => {
                                                    setIsRecoveryMode(false);
                                                    setShowResetModal(true);
                                                }}
                                                className="w-full h-11 bg-primary text-foreground font-bold rounded-full"
                                            >
                                                Request New Link
                                            </Button>
                                            <button 
                                                type="button"
                                                onClick={() => setIsRecoveryMode(false)}
                                                className="text-sm font-medium text-foreground/50 hover:text-foreground transition-colors"
                                            >
                                                Back to Login
                                            </button>
                                        </motion.div>
                                    ) : (
                                        <motion.form
                                            key="recovery-form"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            onSubmit={handleUpdatePassword}
                                            className="space-y-6"
                                        >
                                            {error && (
                                                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-200 text-sm flex items-center gap-2">
                                                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                                                    {error}
                                                </div>
                                            )}

                                            <div className="space-y-2">
                                                <label className="text-[11px] font-bold text-foreground/60 uppercase tracking-widest ml-1">
                                                    New Password
                                                </label>
                                                <div className="relative group">
                                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/50 group-focus-within:text-primary transition-colors" />
                                                    <input
                                                        type={showNewPassword ? "text" : "password"}
                                                        required
                                                        value={newPassword}
                                                        onChange={(e) => setNewPassword(e.target.value)}
                                                        placeholder="••••••••••••"
                                                        className="w-full h-12 bg-foreground/5 border border-foreground/10 rounded-full pl-11 pr-12 text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-foreground/10 transition-all text-sm"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-foreground/60 hover:text-foreground transition-all z-50 cursor-pointer flex items-center justify-center"
                                                        title={showNewPassword ? "Hide password" : "Show password"}
                                                    >
                                                        {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[11px] font-bold text-foreground/60 uppercase tracking-widest ml-1">
                                                    Confirm New Password
                                                </label>
                                                <div className="relative group">
                                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/50 group-focus-within:text-primary transition-colors" />
                                                    <input
                                                        type={showConfirmNewPassword ? "text" : "password"}
                                                        required
                                                        value={confirmNewPassword}
                                                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                                                        placeholder="••••••••••••"
                                                        className="w-full h-12 bg-foreground/5 border border-foreground/10 rounded-full pl-11 pr-12 text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-foreground/10 transition-all text-sm"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-foreground/60 hover:text-foreground transition-all z-50 cursor-pointer flex items-center justify-center"
                                                        title={showConfirmNewPassword ? "Hide password" : "Show password"}
                                                    >
                                                        {showConfirmNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                                    </button>
                                                </div>
                                            </div>

                                            <button
                                                type="submit"
                                                disabled={loading || authLoading}
                                                className="w-full h-12 bg-primary hover:bg-primary/90 text-foreground font-bold rounded-full shadow-lg transition-all flex items-center justify-center text-sm"
                                            >
                                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Password'}
                                            </button>
                                            
                                            <div className="text-center">
                                                <button 
                                                    type="button"
                                                    onClick={() => setIsRecoveryMode(false)}
                                                    className="text-sm font-medium text-foreground/50 hover:text-foreground transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </motion.form>
                                    )}
                                </AnimatePresence>
                            </div>
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
                                    <label className="text-[11px] font-bold text-foreground/60 uppercase tracking-widest ml-1">
                                        Email
                                    </label>
                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/50 group-focus-within:text-primary transition-colors" />
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="media@thaibagarden.com"
                                            className="w-full h-12 bg-foreground/5 border border-foreground/10 rounded-full pl-11 pr-6 text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-foreground/10 transition-all text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2 relative">
                                    <label className="text-[11px] font-bold text-foreground/60 uppercase tracking-widest ml-1">
                                        Password
                                    </label>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/50 group-focus-within:text-primary transition-colors" />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••••••"
                                            className="w-full h-12 bg-foreground/5 border border-foreground/10 rounded-full pl-11 pr-12 text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-foreground/10 transition-all text-sm"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-foreground/60 hover:text-foreground transition-all z-50 cursor-pointer flex items-center justify-center"
                                            title={showPassword ? "Hide password" : "Show password"}
                                        >
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
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
                                            className="h-4 w-4 rounded border-foreground/10 bg-foreground/5 text-primary focus:ring-primary/40 transition-all cursor-pointer"
                                        />
                                    </div>
                                    <label htmlFor="remember" className="text-sm font-medium text-foreground/60 cursor-pointer select-none">
                                        Keep me logged in
                                    </label>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full h-12 bg-primary hover:bg-primary/90 text-foreground font-bold rounded-full shadow-lg transition-all flex items-center justify-center text-sm"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Login'}
                                </button>

                                <div className="text-center pt-2">
                                    <p className="text-sm text-foreground/60 font-medium">
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

                <p className="text-[11px] font-bold text-foreground/50/60 uppercase tracking-[0.2em] text-center">
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
                            className="relative w-full max-w-sm bg-slate-900 border border-foreground/10 rounded-2xl shadow-2xl p-8 overflow-hidden"
                        >
                            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />
                            
                            {resetSuccess ? (
                                <div className="text-center space-y-6">
                                    <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto border border-green-500/20">
                                        <CheckCircle2 className="w-8 h-8 text-green-500" />
                                    </div>
                                    <h3 className="text-xl font-bold text-foreground">Check Your Inbox</h3>
                                    <p className="text-foreground/60 text-sm">
                                        If an account exists for <span className="text-foreground font-medium">{email}</span>, you will receive a reset link shortly.
                                    </p>
                                    <Button 
                                        onClick={() => setShowResetModal(false)}
                                        className="w-full h-11 bg-primary text-foreground font-bold rounded-full"
                                    >
                                        Close
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="space-y-2 text-center">
                                        <h3 className="text-xl font-bold text-foreground">Reset Password</h3>
                                        <p className="text-foreground/60 text-sm">Enter your email to receive a recovery link.</p>
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
                                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/50 group-focus-within:text-primary" />
                                                <input
                                                    type="email"
                                                    required
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    placeholder="media@thaibagarden.com"
                                                    className="w-full h-11 bg-foreground/5 border border-foreground/10 rounded-full pl-11 pr-6 text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all text-sm"
                                                />
                                            </div>
                                        </div>
                                        
                                        <div className="flex flex-col gap-3">
                                            <Button 
                                                type="submit"
                                                disabled={resetLoading || !email}
                                                className="w-full h-11 bg-primary hover:bg-primary/90 text-foreground font-bold rounded-full transition-all"
                                            >
                                                {resetLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Reset Link'}
                                            </Button>
                                            <button 
                                                type="button"
                                                onClick={() => setShowResetModal(false)}
                                                className="text-sm font-medium text-foreground/50 hover:text-foreground transition-colors py-1"
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

