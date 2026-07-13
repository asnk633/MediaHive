'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HaloLogo } from '@/components/HaloLogo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContextProvider';
import { supabase } from '@/lib/supabaseClient';
import { Lock, Mail, AlertCircle, Loader2, CheckCircle2, Eye, EyeOff, Terminal, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { nativeNavigate, cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemeToggle } from '@/components/auth/ThemeToggle';
import { TelemetrySettingsView } from '@/components/settings/views/TelemetrySettingsView';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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
    const [showTelemetryModal, setShowTelemetryModal] = useState(false);
    const [resetSuccess, setResetSuccess] = useState(false);
    const [isRecoveryMode, setIsRecoveryMode] = useState(false);
    const [resetError, setResetError] = useState<string | null>(null);
    const [otpCode, setOtpCode] = useState('');
    const [resetNewPassword, setResetNewPassword] = useState('');
    const [resetConfirmNewPassword, setResetConfirmNewPassword] = useState('');
    const [resetOtpError, setResetOtpError] = useState<string | null>(null);
    const [resetPasswordError, setResetPasswordError] = useState<string | null>(null);
    const { user, loading: authLoading, login, loginWithGoogle } = useAuth();

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

    // Auto-trigger Google Sign-in if source=tauri and trigger=google
    React.useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            if (params.get('source') === 'tauri' && params.get('trigger') === 'google') {
                console.log('[LOGIN] Auto-triggering Google Sign-in for Tauri...');
                loginWithGoogle().catch(err => {
                    console.error('[LOGIN] Auto-trigger Google Sign-in failed:', err);
                    setError(err.message || 'Auto-login failed.');
                });
            }
        }
    }, [loginWithGoogle]);

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

    const handleResetWithOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setResetOtpError(null);
        setResetPasswordError(null);

        if (!otpCode || !resetNewPassword || !resetConfirmNewPassword) {
            toast.error('Please fill in all fields.');
            return;
        }

        if (!/^\d{8}$/.test(otpCode)) {
            setResetOtpError('Verification code must be exactly 8 digits.');
            return;
        }

        if (resetNewPassword !== resetConfirmNewPassword) {
            setResetPasswordError('Passwords do not match.');
            return;
        }

        if (resetNewPassword.length < 6) {
            setResetPasswordError('Password must be at least 6 characters.');
            return;
        }

        setResetLoading(true);

        // Try Block 1: Verify OTP code
        try {
            const { error: verifyError } = await supabase.auth.verifyOtp({
                email,
                token: otpCode,
                type: 'recovery',
            });

            if (verifyError) {
                console.error('[RESET_OTP] Verify OTP Error:', verifyError);
                if (verifyError.message?.toLowerCase().includes('expired') || verifyError.status === 422) {
                    setResetOtpError('Invalid or expired verification code. If you have retried multiple times, please request a new code.');
                } else {
                    setResetOtpError(verifyError.message || 'Verification failed. Please check the code and try again.');
                }
                setResetLoading(false);
                return;
            }
        } catch (err: any) {
            console.error('[RESET_OTP] Verify OTP Catch:', err);
            setResetOtpError(err.message || 'Verification failed. Please check the code and try again.');
            setResetLoading(false);
            return;
        }

        // Try Block 2: Update password using the established session
        try {
            const { error: updateError } = await supabase.auth.updateUser({
                password: resetNewPassword,
            });

            if (updateError) {
                console.error('[RESET_OTP] Update User Error:', updateError);
                setResetPasswordError(updateError.message || 'Failed to update password.');
                await supabase.auth.signOut().catch(() => {});
                setResetLoading(false);
                return;
            }
            
            await supabase.auth.signOut();
            toast.success('Password updated successfully! Please log in.');
            handleCancelReset();
        } catch (err: any) {
            console.error('[RESET_OTP] Update User Catch:', err);
            setResetPasswordError(err.message || 'Failed to update password.');
            await supabase.auth.signOut().catch(() => {});
            setResetLoading(false);
        }
    };

    const handleResendCode = async () => {
        if (!email) return;
        setResetLoading(true);
        setResetOtpError(null);
        setResetPasswordError(null);
        try {
            const { error: resendError } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/login?recovery=true`,
            });
            if (resendError) throw resendError;
            toast.success('A new verification code has been sent!');
        } catch (err: any) {
            console.error('[RESET_RESEND] Error:', err);
            setResetOtpError(err.message || 'Failed to resend code.');
        } finally {
            setResetLoading(false);
        }
    };

    const handleCancelReset = () => {
        setShowResetModal(false);
        setResetSuccess(false);
        setOtpCode('');
        setResetNewPassword('');
        setResetConfirmNewPassword('');
        setResetOtpError(null);
        setResetPasswordError(null);
        setResetError(null);
    };

    const bgGradient = theme === 'light'
        ? "bg-slate-50 text-slate-900"
        : "bg-slate-950 text-slate-50";

    const hazeGlow1 = theme === 'light'
        ? "bg-blue-500/5"
        : "bg-blue-500/10";

    const hazeGlow2 = theme === 'light'
        ? "bg-indigo-500/5"
        : "bg-indigo-500/10";

    return (
        <main suppressHydrationWarning className={cn("relative min-h-screen flex items-center justify-center overflow-hidden transition-all duration-500", bgGradient)}>
            <ThemeToggle />
            
            {/* Telemetry Trigger */}
            <div className="absolute top-6 left-6 z-50">
                <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    className="border-black/5 dark:border-white/5 bg-black/10 dark:bg-white/10 backdrop-blur-md text-foreground/75 hover:text-foreground hover:bg-black/20 dark:hover:bg-white/20 h-9 text-xs px-3.5 rounded-full flex items-center gap-1.5 shadow-lg select-none cursor-pointer"
                    onClick={() => setShowTelemetryModal(true)}
                >
                    <Terminal size={14} />
                    <span>Telemetry & Logs</span>
                </Button>
            </div>
            
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
                        src={theme === 'light' ? '/brand-name-dark.png' : '/brand-name-light.png'}
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
                                                <label htmlFor="recovery-new-password" className="text-[11px] font-bold text-foreground/60 uppercase tracking-widest ml-1">
                                                    New Password
                                                </label>
                                                <div className="relative group">
                                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/50 group-focus-within:text-primary transition-colors" />
                                                    <input
                                                        id="recovery-new-password"
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
                                                <label htmlFor="recovery-confirm-password" className="text-[11px] font-bold text-foreground/60 uppercase tracking-widest ml-1">
                                                    Confirm New Password
                                                </label>
                                                <div className="relative group">
                                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/50 group-focus-within:text-primary transition-colors" />
                                                    <input
                                                        id="recovery-confirm-password"
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
                                    <label htmlFor="login-email" className="text-[11px] font-bold text-foreground/60 uppercase tracking-widest ml-1">
                                        Email
                                    </label>
                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/50 group-focus-within:text-primary transition-colors" />
                                        <input
                                            id="login-email"
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
                                    <label htmlFor="login-password" className="text-[11px] font-bold text-foreground/60 uppercase tracking-widest ml-1">
                                        Password
                                    </label>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/50 group-focus-within:text-primary transition-colors" />
                                        <input
                                            id="login-password"
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

                                <div className="relative flex py-2 items-center">
                                    <div className="flex-grow border-t border-foreground/10"></div>
                                    <span className="flex-shrink mx-4 text-[10px] font-bold text-foreground/40 uppercase tracking-widest">Or continue with</span>
                                    <div className="flex-grow border-t border-foreground/10"></div>
                                </div>

                                <button
                                    type="button"
                                    onClick={loginWithGoogle}
                                    className="w-full h-12 bg-foreground/5 hover:bg-foreground/10 border border-foreground/10 text-foreground font-bold rounded-full transition-all flex items-center justify-center gap-3 text-sm"
                                >
                                    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path
                                            fill="#ea4335"
                                            d="M12 5.04c1.64 0 3.12.56 4.28 1.67l3.2-3.2C17.52 1.58 14.94 1 12 1 7.6 1 3.8 3.55 1.9 7.28l3.77 2.92C6.55 7.42 9.04 5.04 12 5.04z"
                                        />
                                        <path
                                            fill="#4285f4"
                                            d="M23.49 12.27c0-.82-.07-1.6-.22-2.36H12v4.51h6.44c-.28 1.48-1.11 2.73-2.36 3.58l3.66 2.84c2.14-1.98 3.39-4.89 3.39-8.57z"
                                        />
                                        <path
                                            fill="#fbbc05"
                                            d="M5.67 14.72c-.24-.72-.37-1.48-.37-2.27s.13-1.55.37-2.27L1.9 7.26C1.04 8.97.55 10.92.55 12.45s.49 3.48 1.35 5.19l3.77-2.92z"
                                        />
                                        <path
                                            fill="#34a853"
                                            d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.66-2.84c-1.01.68-2.31 1.09-3.9 1.09-3.06 0-5.65-2.08-6.58-4.88L1.05 16.3C3.04 20.25 7.18 23 12 23z"
                                        />
                                    </svg>
                                    <span>Sign in with Google</span>
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
            <Dialog open={showResetModal} onOpenChange={(open) => { if (!open) handleCancelReset(); }}>
                <DialogContent showCloseButton={false} className="w-full max-w-sm bg-slate-900 border border-foreground/10 rounded-2xl shadow-2xl p-8 overflow-hidden">
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />
                    
                    {resetSuccess ? (
                        <div className="space-y-6 text-left">
                            <DialogHeader className="space-y-2 text-center">
                                <DialogTitle className="text-xl font-bold text-foreground text-center">Verify Code</DialogTitle>
                                <DialogDescription className="text-foreground/60 text-sm text-center">
                                    Enter the 8-digit code sent to <span className="text-foreground font-medium">{email}</span> and your new password.
                                </DialogDescription>
                            </DialogHeader>

                            <form onSubmit={handleResetWithOtp} className="space-y-5">
                                <div className="space-y-1.5">
                                    <label htmlFor="reset-otp-code" className="text-[11px] font-bold text-foreground/60 uppercase tracking-widest ml-1">
                                        Verification Code
                                    </label>
                                    <input
                                        id="reset-otp-code"
                                        type="text"
                                        required
                                        maxLength={8}
                                        autoComplete="one-time-code"
                                        value={otpCode}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, '');
                                            setOtpCode(val);
                                        }}
                                        placeholder="93263500"
                                        className="w-full h-11 bg-foreground/5 border border-foreground/10 rounded-full px-5 text-center font-mono text-lg tracking-wider text-foreground placeholder:text-foreground/20 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                                    />
                                    {resetOtpError && (
                                        <p className="text-xs text-red-400 mt-1 ml-1 flex items-start gap-1">
                                            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                            <span>{resetOtpError}</span>
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <label htmlFor="reset-new-password" className="text-[11px] font-bold text-foreground/60 uppercase tracking-widest ml-1">
                                        New Password
                                    </label>
                                    <input
                                        id="reset-new-password"
                                        type="password"
                                        required
                                        value={resetNewPassword}
                                        onChange={(e) => setResetNewPassword(e.target.value)}
                                        placeholder="••••••••••••"
                                        className="w-full h-11 bg-foreground/5 border border-foreground/10 rounded-full px-5 text-sm text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label htmlFor="reset-confirm-password" className="text-[11px] font-bold text-foreground/60 uppercase tracking-widest ml-1">
                                        Confirm New Password
                                    </label>
                                    <input
                                        id="reset-confirm-password"
                                        type="password"
                                        required
                                        value={resetConfirmNewPassword}
                                        onChange={(e) => setResetConfirmNewPassword(e.target.value)}
                                        placeholder="••••••••••••"
                                        className="w-full h-11 bg-foreground/5 border border-foreground/10 rounded-full px-5 text-sm text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                                    />
                                    {resetPasswordError && (
                                        <p className="text-xs text-red-400 mt-1 ml-1 flex items-start gap-1">
                                            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                            <span>{resetPasswordError}</span>
                                        </p>
                                    )}
                                </div>

                                <div className="flex flex-col gap-3 pt-2">
                                    <Button
                                        type="submit"
                                        disabled={resetLoading}
                                        className="w-full h-11 bg-primary hover:bg-primary/90 text-foreground font-bold rounded-full transition-all flex items-center justify-center"
                                    >
                                        {resetLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Password'}
                                    </Button>

                                    <div className="flex justify-between items-center px-2 pt-1 text-xs">
                                        <button
                                            type="button"
                                            disabled={resetLoading}
                                            onClick={handleResendCode}
                                            className="font-bold text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
                                        >
                                            Resend Code
                                        </button>
                                        <button
                                            type="button"
                                            disabled={resetLoading}
                                            onClick={handleCancelReset}
                                            className="font-medium text-foreground/50 hover:text-foreground transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <DialogHeader className="space-y-2 text-center">
                                <DialogTitle className="text-xl font-bold text-foreground text-center">Reset Password</DialogTitle>
                                <DialogDescription className="text-foreground/60 text-sm text-center">Enter your email to receive a recovery link.</DialogDescription>
                            </DialogHeader>
                            
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
                                    <label htmlFor="reset-email" className="sr-only">Email Address</label>
                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/50 group-focus-within:text-primary" />
                                        <input
                                            id="reset-email"
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
                                        onClick={handleCancelReset}
                                        className="text-sm font-medium text-foreground/50 hover:text-foreground transition-colors py-1"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Telemetry Settings Modal */}
            <Dialog open={showTelemetryModal} onOpenChange={setShowTelemetryModal}>
                <DialogContent showCloseButton={true} className="w-full max-w-2xl bg-slate-950 border border-white/10 rounded-2xl shadow-2xl p-6 overflow-hidden max-h-[90vh] flex flex-col z-[101]">
                    <div className="overflow-y-auto pr-1">
                        <TelemetrySettingsView />
                    </div>
                </DialogContent>
            </Dialog>
        </main>
    );
}

