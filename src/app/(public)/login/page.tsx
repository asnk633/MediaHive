"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import {
    signInWithEmailAndPassword,
    setPersistence,
    browserLocalPersistence,
    browserSessionPersistence,
    sendPasswordResetEmail,
} from "firebase/auth";
import { getFirebaseAuth } from "@/firebase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [rememberMe, setRememberMe] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [showResetModal, setShowResetModal] = useState(false);
    const [resetEmail, setResetEmail] = useState("");
    const [resetSubmitting, setResetSubmitting] = useState(false);
    const [resetSuccess, setResetSuccess] = useState(false);
    const { user, loading } = useAuth();

    // Auto-redirect if already logged in
    useEffect(() => {
        if (!loading && user) {
            router.push("/home");
        }
    }, [user, loading, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSubmitting(true);

        try {
            console.log('[Login] Starting login process...');
            const auth = await getFirebaseAuth();
            console.log('[Login] Firebase Auth initialized');

            await setPersistence(
                auth,
                rememberMe ? browserLocalPersistence : browserSessionPersistence
            );
            console.log('[Login] Persistence set, attempting sign in...');

            await signInWithEmailAndPassword(auth, email.trim(), password);
            console.log('[Login] Sign in successful!');

            // Redirect handles by useEffect
        } catch (err: any) {
            console.error('[Login] Error details:', {
                code: err.code,
                message: err.message,
                name: err.name,
                stack: err.stack
            });

            // More specific error messages
            if (err.code === 'auth/network-request-failed') {
                setError('Network error: Cannot connect to Firebase. Check your internet connection or firewall settings.');
            } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
                setError('Invalid email or password. Please try again.');
            } else if (err.code === 'auth/user-not-found') {
                setError('No account found with this email.');
            } else if (err.code === 'auth/too-many-requests') {
                setError('Too many failed attempts. Please try again later.');
            } else {
                setError(`Login failed: ${err.message || 'Please try again.'}`);
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handlePasswordReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setResetSubmitting(true);
        setResetSuccess(false);

        try {
            const auth = await getFirebaseAuth();
            await sendPasswordResetEmail(auth, resetEmail.trim());
            console.log('[Password Reset] Email sent successfully to:', resetEmail);
            setResetSuccess(true);
            setResetEmail("");
            // Auto-close modal after 3 seconds
            setTimeout(() => {
                setShowResetModal(false);
                setResetSuccess(false);
            }, 3000);
        } catch (err: any) {
            console.error('[Password Reset] Error:', err);
            if (err.code === 'auth/user-not-found') {
                setError('No account found with this email address.');
            } else if (err.code === 'auth/invalid-email') {
                setError('Invalid email address.');
            } else {
                setError(`Failed to send reset email: ${err.message || 'Please try again.'}`);
            }
        } finally {
            setResetSubmitting(false);
        }
    };

    return (
        <main className="flex flex-1 flex-col min-h-screen relative overflow-hidden justify-center items-center p-4">
            {/* Background is handled by globals.css body style (Midnight Gradient) */}

            {/* Decorative Background Elements */}
            <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[50%] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-purple-500/10 blur-[120px] rounded-full pointer-events-none" />

            {/* Logo Header */}
            <div className="flex flex-col items-center mb-8 relative z-10 w-full max-w-md">
                <div className="w-20 h-20 flex items-center justify-center mb-6">
                    <img src="/logo-app.png" alt="Logo" className="w-full h-full object-contain brightness-0 invert drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]" />
                </div>
                <h1 className="text-3xl font-bold text-white tracking-wide mb-2 text-center drop-shadow-sm font-display">Thaiba MediaHive</h1>
                <p className="text-blue-100/70 text-sm font-medium">Welcome back, please login.</p>
            </div>

            {/* Glass Card */}
            <form
                onSubmit={handleSubmit}
                className="glass-card w-full max-w-md p-8 flex flex-col gap-6 relative z-10 border border-[#ffffff1a]"
            >
                <div className="space-y-2">
                    <label className="text-xs font-bold text-blue-100/80 uppercase tracking-wider pl-1">Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full h-12 rounded-xl bg-white/5 border border-[#ffffff1a] px-4 text-white placeholder-white/20 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all font-medium"
                        placeholder="user@thaiba.in"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-blue-100/80 uppercase tracking-wider pl-1">Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full h-12 rounded-xl bg-white/5 border border-[#ffffff1a] px-4 text-white placeholder-white/20 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all font-medium"
                        placeholder="••••••••"
                    />
                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={() => {
                                setShowResetModal(true);
                                setResetEmail(email); // Pre-fill with current email
                                setError(null);
                            }}
                            className="text-xs font-semibold text-blue-300 hover:text-blue-200 hover:underline transition-colors"
                        >
                            Forgot?
                        </button>
                    </div>
                </div>

                {/* Remember Me */}
                <label className="flex items-center gap-3 px-1 cursor-pointer group">
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${rememberMe ? 'bg-blue-600 border-blue-600' : 'border-white/30 bg-white/5 group-hover:border-white/50'}`}>
                        {rememberMe && <span className="text-white text-xs font-bold">✓</span>}
                    </div>
                    <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="hidden"
                    />
                    <span className="text-sm text-blue-100/80 font-medium group-hover:text-white transition-colors">Keep me logged in</span>
                </label>

                {error && (
                    <div className="p-3 rounded-xl bg-red-500/10 text-red-200 text-xs font-semibold text-center border border-red-500/20 backdrop-blur-sm">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={submitting}
                    className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold text-base shadow-lg shadow-blue-900/40 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-2 border border-white/10"
                >
                    {submitting ? "Signing in..." : "Login"}
                </button>

                <div className="text-center pt-2">
                    <span className="text-sm text-blue-100/60">New here? </span>
                    <Link href="/register" className="text-sm font-bold text-blue-300 hover:text-white hover:underline transition-colors ml-1">
                        Create Account
                    </Link>
                </div>
            </form>

            <p className="mt-8 text-center text-blue-100/30 text-xs font-medium tracking-wide">
                © 2026 Thaiba Garden - Media
            </p>

            {/* Password Reset Modal */}
            {showResetModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                    <div className="glass-card w-full max-w-md p-6 relative bg-[#0f172a]/90 border border-white/10">
                        <button
                            onClick={() => {
                                setShowResetModal(false);
                                setError(null);
                                setResetSuccess(false);
                            }}
                            className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors text-2xl font-bold leading-none"
                        >
                            ×
                        </button>

                        <h2 className="text-xl font-bold text-white mb-2 font-display">Reset Password</h2>
                        <p className="text-sm text-blue-100/60 mb-6">
                            Enter your email address and we'll send you a link to reset your password.
                        </p>

                        {resetSuccess ? (
                            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-center">
                                <div className="text-4xl mb-2">✓</div>
                                <p className="text-green-300 font-semibold">Password reset email sent!</p>
                                <p className="text-sm text-green-200/70 mt-1">Check your inbox for the reset link.</p>
                            </div>
                        ) : (
                            <form onSubmit={handlePasswordReset} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-blue-100/80 uppercase tracking-wider pl-1">
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        value={resetEmail}
                                        onChange={(e) => setResetEmail(e.target.value)}
                                        className="w-full h-12 rounded-xl bg-white/5 border border-[#ffffff1a] px-4 text-white placeholder-white/20 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all font-medium"
                                        placeholder="your@email.com"
                                        required
                                        disabled={resetSubmitting}
                                    />
                                </div>

                                {error && (
                                    <div className="p-3 rounded-xl bg-red-500/10 text-red-200 text-xs font-semibold text-center border border-red-500/20">
                                        {error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={resetSubmitting}
                                    className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-base shadow-lg shadow-blue-900/20 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {resetSubmitting ? "Sending..." : "Send Reset Link"}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </main>
    );
}