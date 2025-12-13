"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import {
    signInWithEmailAndPassword,
    setPersistence,
    browserLocalPersistence,
    browserSessionPersistence,
} from "firebase/auth";
import { getFirebaseAuth } from "@/firebase/client";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [rememberMe, setRememberMe] = useState(true); // default: keep logged in
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSubmitting(true);

        try {
            const auth = await getFirebaseAuth();

            // Set Firebase persistence based on "remember me" checkbox
            await setPersistence(
                auth,
                rememberMe ? browserLocalPersistence : browserSessionPersistence
            );

            // Sign in with email and password
            await signInWithEmailAndPassword(auth, email.trim(), password);

            // Redirect to home page on successful login
            router.push("/home");
        } catch (err: any) {
            console.error(err);
            setError("Login failed. Please check your email and password.");
        } finally {
            setSubmitting(false);
        }
    };

    const isInvalid = !email.trim() || !password;

    return (
        <main className="flex flex-1 flex-col">
            {/* logo */}
            <div className="mb-10 mt-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-500/10">
                        <span className="h-4 w-4 rounded-full border-2 border-sky-500 border-t-transparent animate-spin-slow" />
                    </div>
                    <span className="text-lg font-semibold tracking-tight text-slate-900">
                        Thaiba Tasks
                    </span>
                </div>
            </div>

            <section className="mb-8">
                <h1 className="mb-1 text-2xl font-semibold text-slate-900">
                    Welcome back <span className="inline-block">👋</span>
                </h1>
                <p className="text-sm text-slate-500">
                    Login with your Thaiba account to manage tasks, events and reports.
                </p>
            </section>

            <form
                onSubmit={handleSubmit}
                className="flex flex-1 flex-col gap-4 rounded-3xl bg-white/95 p-5 shadow-xl shadow-sky-100/70"
            >
                <div className="space-y-2 text-sm">
                    <label htmlFor="email" className="font-medium text-slate-700">
                        Email
                    </label>
                    <input
                        id="email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none ring-0 focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100"
                        placeholder="you@thaiba.in"
                    />
                </div>

                <div className="space-y-2 text-sm">
                    <label htmlFor="password" className="font-medium text-slate-700">
                        Password
                    </label>
                    <input
                        id="password"
                        type="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none ring-0 focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100"
                        placeholder="Enter password"
                    />
                    <button
                        type="button"
                        className="ml-auto text-xs font-semibold text-sky-600"
                    >
                        Forgot password?
                    </button>
                </div>

                {/* Remember Me Checkbox */}
                <label className="flex items-center gap-2 text-sm text-slate-700 mt-2">
                    <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-500 bg-slate-900 text-sky-500 focus:ring-sky-500 opacity-100 appearance-none android-checkbox"
                        style={{ WebkitAppearance: 'checkbox' }} // Native fallback
                    />
                    <span>Keep me logged in</span>
                </label>

                {error && (
                    <p className="mt-1 text-center text-xs font-semibold text-red-500">
                        {error}
                    </p>
                )}

                <button
                    type="submit"
                    disabled={submitting || isInvalid}
                    className="mt-2 w-full rounded-full bg-sky-500 py-2.5 text-sm font-semibold text-white shadow-md shadow-sky-300/70 active:translate-y-0.5 transition-transform disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {submitting ? "Logging in…" : "Login"}
                </button>

                <p className="mt-2 text-center text-xs text-slate-500">
                    Don&apos;t have an account?{" "}
                    <Link
                        href="/register"
                        className="font-semibold text-sky-600 hover:text-sky-700"
                    >
                        Register
                    </Link>
                </p>
            </form>
        </main>
    );
}