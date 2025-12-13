"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export default function RegisterPage() {
    const router = useRouter();

    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [agree, setAgree] = useState(false);

    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError(null);

        const normalizedEmail = email.trim().toLowerCase();

        // basic validation
        if (!fullName.trim()) {
            setError("Please enter your full name.");
            return;
        }

        if (!normalizedEmail) {
            setError("Please enter your email.");
            return;
        }

        if (password.length < 8) {
            setError("Password must be at least 8 characters.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        if (!agree) {
            setError("Please agree to the terms and privacy policy.");
            return;
        }

        setSubmitting(true);

        try {
            // 🔹 For now: store a simple "fake" account locally
            if (typeof window !== "undefined") {
                const user = {
                    name: fullName.trim(),
                    email: normalizedEmail,
                    password, // NOTE: only for local fake auth – in real backend this must be hashed
                    createdAt: new Date().toISOString(),
                };
                localStorage.setItem("thaiba-tasks:user", JSON.stringify(user));
            }

            // Later we will call a real backend here:
            // await fetch('/api/auth/register', { ... })

            // go to dashboard
            router.push("/home");
        } catch (err) {
            console.error(err);
            setError("Something went wrong. Please try again.");
        } finally {
            setSubmitting(false);
        }
    }

    const isInvalid =
        !fullName.trim() ||
        !email.trim() ||
        password.length < 8 ||
        password !== confirmPassword ||
        !agree;

    return (
        <div className="flex flex-1 flex-col">
            {/* Brand header */}
            <header className="mb-10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-500/10">
                        <div className="h-6 w-6 rounded-full border-2 border-sky-500 border-t-transparent animate-spin" />
                    </div>
                    <span className="text-lg font-semibold tracking-tight text-slate-900">
                        Thaiba Tasks
                    </span>
                </div>

                <Link
                    href="/login"
                    className="text-sm font-medium text-sky-600 hover:text-sky-700"
                >
                    Log in
                </Link>
            </header>

            {/* Title + helper text */}
            <section className="mb-8">
                <h1 className="text-3xl font-bold leading-tight tracking-tight text-slate-900">
                    Create an account
                </h1>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">
                    Set up your Thaiba account so you can manage tasks, events and
                    reports across all Thaiba campuses in one place.
                </p>
            </section>

            {/* Form card */}
            <main className="rounded-3xl bg-white/95 p-5 shadow-lg shadow-sky-100/70 backdrop-blur">
                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div className="space-y-1.5">
                        <label
                            htmlFor="name"
                            className="text-sm font-medium text-slate-700"
                        >
                            Full name
                        </label>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            autoComplete="name"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Your full name"
                            className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-3 text-sm text-slate-900 outline-none ring-sky-500/10 transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/40"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label
                            htmlFor="email"
                            className="text-sm font-medium text-slate-700"
                        >
                            Email
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@thaiba.in"
                            className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-3 text-sm text-slate-900 outline-none ring-sky-500/10 transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/40"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label
                            htmlFor="password"
                            className="text-sm font-medium text-slate-700"
                        >
                            Password
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="new-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Create a strong password"
                            className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-3 text-sm text-slate-900 outline-none ring-sky-500/10 transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/40"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label
                            htmlFor="confirmPassword"
                            className="text-sm font-medium text-slate-700"
                        >
                            Confirm password
                        </label>
                        <input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            autoComplete="new-password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Re-enter password"
                            className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-3 text-sm text-slate-900 outline-none ring-sky-500/10 transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/40"
                        />
                    </div>

                    <div className="flex items-start gap-2 rounded-2xl bg-sky-50/60 px-3 py-2">
                        <input
                            id="terms"
                            name="terms"
                            type="checkbox"
                            checked={agree}
                            onChange={(e) => setAgree(e.target.checked)}
                            className="mt-1 h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                        />
                        <label
                            htmlFor="terms"
                            className="text-xs leading-relaxed text-slate-600"
                        >
                            By creating an account you agree to Thaiba’s{" "}
                            <span className="font-medium text-sky-600">terms</span> and{" "}
                            <span className="font-medium text-sky-600">privacy policy</span>.
                        </label>
                    </div>

                    {error && (
                        <p className="mt-3 text-sm text-red-500 text-center">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={submitting || isInvalid}
                        className="mt-2 inline-flex h-11 w-full items-center justify-center rounded-full bg-sky-500 text-sm font-semibold text-white shadow-lg shadow-sky-300/70 transition hover:bg-sky-600 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {submitting ? "Creating account…" : "Create account"}
                    </button>
                </form>
            </main>

            {/* Bottom helper */}
            <p className="mt-6 text-center text-sm text-slate-500">
                Already using Thaiba Tasks?{" "}
                <Link
                    href="/login"
                    className="font-semibold text-sky-600 hover:text-sky-700"
                >
                    Log in
                </Link>
            </p>
        </div>
    );
}

