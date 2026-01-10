"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { getFirebaseAuth } from "@/firebase/client";
import { apiClient } from '@/lib/apiClient';
import { Institution, Department } from "@/types/structure";
import { StructureService } from "@/services/structureService";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";


export default function RegisterPage() {
    const router = useRouter();

    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [agree, setAgree] = useState(false);

    // Structure State
    const [institutions, setInstitutions] = useState<Institution[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [selectedInstitution, setSelectedInstitution] = useState("");
    const [selectedDepartment, setSelectedDepartment] = useState("");

    // Fetch Structure on Mount
    useState(() => {
        const fetchStructure = async () => {
            try {
                const [instData, deptData] = await Promise.all([
                    StructureService.getInstitutions(),
                    StructureService.getDepartments()
                ]);
                setInstitutions(instData.institutions);
                setDepartments(deptData.departments);
            } catch (err) {
                console.error("Failed to load registration options", err);
            }
        };
        fetchStructure();
    });

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
            // Get Firebase Auth instance
            const auth = await getFirebaseAuth();

            // Create user with email and password
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                normalizedEmail,
                password
            );

            const userId = userCredential.user.uid;

            // Update the user's profile with their display name
            await updateProfile(userCredential.user, {
                displayName: fullName.trim()
            });

            // NOTE: Role document creation has been deprecated.
            // Roles are now stored only in the user document for consistency.

            // Get the ID token to send to the server-side API
            const idToken = await userCredential.user.getIdToken();

            // Create user profile document via server-side API route
            const result = await apiClient('/api/registerUser', {
                method: 'POST',
                body: JSON.stringify({
                    idToken,
                    fullName,
                    email: normalizedEmail,
                    institutionId: selectedInstitution,
                    departmentId: selectedDepartment
                })
            });

            if (result.skipped) {
                console.warn('User profile already existed, creation was skipped');
            }

            // Store user info in localStorage for quick access
            if (typeof window !== "undefined") {
                const user = {
                    name: fullName.trim(),
                    email: normalizedEmail,
                    uid: userId,
                    role: "team",
                    institutionId: selectedInstitution,
                    departmentId: selectedDepartment,
                    createdAt: new Date().toISOString(),
                };
                localStorage.setItem("thaiba-tasks:user", JSON.stringify(user));
            }

            // Redirect to home page
            router.push("/home");
        } catch (err: any) {
            console.error(err);

            // Handle specific Firebase errors
            if (err.code === 'auth/email-already-in-use') {
                setError("This email is already registered. Please log in instead.");
            } else if (err.code === 'auth/weak-password') {
                setError("Password is too weak. Please use a stronger password.");
            } else if (err.code === 'auth/invalid-email') {
                setError("Invalid email address.");
            } else {
                setError("Something went wrong. Please try again.");
            }
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
        <main className="flex flex-1 flex-col min-h-screen relative overflow-hidden justify-center items-center p-4">
            {/* Background is handled by globals.css body style (Midnight Gradient) */}

            {/* Decorative Background Elements */}
            <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[50%] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-purple-500/10 blur-[120px] rounded-full pointer-events-none" />

            {/* Logo Header */}
            <div className="flex flex-col items-center mb-8 relative z-10 w-full max-w-md">
                <div className="w-16 h-16 flex items-center justify-center mb-4">
                    <img src="/logo-app.png" alt="Logo" className="w-full h-full object-contain brightness-0 invert drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]" />
                </div>
                <h1 className="text-2xl font-bold text-white tracking-wide mb-2 text-center drop-shadow-sm font-display">Thaiba MediaHive</h1>
                <p className="text-blue-100/70 text-sm font-medium">Create your account</p>
            </div>

            {/* Glass Card */}
            <form
                onSubmit={handleSubmit}
                className="glass-card w-full max-w-md p-8 flex flex-col gap-5 relative z-10 border border-[#ffffff1a]"
            >
                <div className="space-y-1">
                    <label className="text-xs font-bold text-blue-100/80 uppercase tracking-wider pl-1">Full Name</label>
                    <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full h-11 rounded-xl bg-white/5 border border-[#ffffff1a] px-4 text-white placeholder-white/20 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all font-medium"
                        placeholder="Your full name"
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-bold text-blue-100/80 uppercase tracking-wider pl-1">Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full h-11 rounded-xl bg-white/5 border border-[#ffffff1a] px-4 text-white placeholder-white/20 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all font-medium"
                        placeholder="you@thaiba.in"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className={`text-xs font-bold uppercase tracking-wider pl-1 transition-colors ${selectedDepartment ? 'text-slate-500' : 'text-blue-100/80'}`}>Institution</label>
                        <Select
                            value={selectedInstitution}
                            onValueChange={(val) => {
                                setSelectedInstitution(val);
                                if (val) setSelectedDepartment("");
                            }}
                        >
                            <SelectTrigger className={`w-full h-11 rounded-xl bg-white/5 border border-[#ffffff1a] px-4 text-white placeholder-white/20 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all font-medium ${selectedDepartment ? 'opacity-50' : ''}`}>
                                <SelectValue placeholder="Select Institution" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#0b1220]/90 border border-white/10 backdrop-blur-xl text-white">
                                {institutions.map(inst => (
                                    <SelectItem key={inst.id} value={inst.id} className="focus:bg-white/10 focus:text-white text-slate-300">
                                        {inst.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1">
                        <label className={`text-xs font-bold uppercase tracking-wider pl-1 transition-colors ${selectedInstitution ? 'text-slate-500' : 'text-blue-100/80'}`}>Office / Unit</label>
                        <Select
                            value={selectedDepartment}
                            onValueChange={(val) => {
                                setSelectedDepartment(val);
                                if (val) setSelectedInstitution("");
                            }}
                        >
                            <SelectTrigger className={`w-full h-11 rounded-xl bg-white/5 border border-[#ffffff1a] px-4 text-white placeholder-white/20 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all font-medium ${selectedInstitution ? 'opacity-50' : ''}`}>
                                <SelectValue placeholder="Select Office / Unit" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#0b1220]/90 border border-white/10 backdrop-blur-xl text-white">
                                {departments.map(dept => (
                                    <SelectItem key={dept.id} value={dept.id} className="focus:bg-white/10 focus:text-white text-slate-300">
                                        {dept.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-blue-100/80 uppercase tracking-wider pl-1">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full h-11 rounded-xl bg-white/5 border border-[#ffffff1a] px-4 text-white placeholder-white/20 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all font-medium"
                            placeholder="At least 8 chars"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-blue-100/80 uppercase tracking-wider pl-1">Confirm</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full h-11 rounded-xl bg-white/5 border border-[#ffffff1a] px-4 text-white placeholder-white/20 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all font-medium"
                            placeholder="Re-enter"
                        />
                    </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                    <input
                        id="terms"
                        type="checkbox"
                        checked={agree}
                        onChange={(e) => setAgree(e.target.checked)}
                        className="mt-1 w-4 h-4 rounded border-gray-500 text-blue-600 focus:ring-blue-500 bg-gray-700"
                    />
                    <label htmlFor="terms" className="text-xs leading-relaxed text-blue-100/70">
                        By creating an account you agree to Thaiba’s{" "}
                        <span className="font-medium text-blue-300 hover:text-white transition-colors cursor-pointer">terms</span> and{" "}
                        <span className="font-medium text-blue-300 hover:text-white transition-colors cursor-pointer">privacy policy</span>.
                    </label>
                </div>

                {error && (
                    <div className="p-3 rounded-xl bg-red-500/10 text-red-200 text-xs font-semibold text-center border border-red-500/20 backdrop-blur-sm">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={submitting || isInvalid}
                    className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold text-base shadow-lg shadow-blue-900/40 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed mt-2 border border-[#ffffff1a]"
                >
                    {submitting ? "Creating account..." : "Create Account"}
                </button>

                <div className="text-center pt-2">
                    <span className="text-sm text-blue-100/60">Already have an account? </span>
                    <Link href="/login" className="text-sm font-bold text-blue-300 hover:text-white hover:underline transition-colors ml-1">
                        Log in
                    </Link>
                </div>
            </form>

            <p className="mt-8 text-center text-blue-100/30 text-xs font-medium tracking-wide">
                © 2026 Thaiba Garden - Media
            </p>
        </main>
    );
}

