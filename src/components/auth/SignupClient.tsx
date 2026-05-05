import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HaloLogo } from '@/components/HaloLogo';
import { useAuth } from '@/contexts/AuthContextProvider';
import { Lock, Mail, AlertCircle, Loader2, User, CheckCircle2, Building2, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { nativeNavigate } from '@/lib/utils';

const INSTITUTIONS = [
    { id: "0f8a1ca7-eb0a-4444-b8df-97888b47f751", name: "Media & IT Department" },
    { id: "ca528e7d-ab96-4988-aeb1-107751379429", name: "CIS Boys - Majhikhanda" },
    { id: "624ca804-4d75-4bc4-80f9-5b28b850157f", name: "CIS Banath - Baghait" },
    { id: "a05eebd3-3f56-442c-86c8-716dc3113852", name: "CIS Da'awra - Majhikhanda" },
    { id: "1a3b0a6f-5d6d-4243-b4bd-f4e198e205d9", name: "School Of Quran - Baghait" },
    { id: "70ee497f-9f3d-405c-a8ab-d6ce417c96e3", name: "School Of Quran - Mallikpur" },
    { id: "09388055-5f75-4026-8def-36b64a7828ea", name: "CIS Junior Boys - Choumini" },
    { id: "bd84d0c5-d992-42b5-9076-f60e0d34023b", name: "CIS Junior Boys - Bisfi" },
    { id: "e95757e6-1170-40fd-9c7f-9ee515010de1", name: "Model Academy - Samsi" },
    { id: "4bcc7df5-9f37-44dd-b4aa-9f0d8a9fb48b", name: "Model Academy - Konar" },
    { id: "8dfe6640-8f51-423b-8e87-cf79b19784c6", name: "Model Academy - Chakolia" },
    { id: "1cc857c8-e22b-414e-ab1b-51476ffca125", name: "TPS - Majhikhanda" },
    { id: "a48ff7b6-1881-4569-9edd-9a0d350b83a1", name: "TPS - Godda" },
    { id: "66810cc4-5285-4d3b-93c9-bd583194d3f6", name: "TPS - Antla" },
    { id: "38c79971-9a87-4967-a4ff-6bb8690c627f", name: "TPS - Baleshwar" },
    { id: "f42af53f-44e7-44cf-9b33-3cd05347d1ce", name: "TPS - Kosbagolla" },
    { id: "2db97c34-c1c7-4c03-9485-8e8e2721cb06", name: "TPS – Mallikpur" },
    { id: "b53118ed-04f6-4182-8b09-d92240c869d1", name: "TPS – Raiganj" },
    { id: "81b41a8e-3eba-477b-8b06-b7293e54d39b", name: "TPS – Manipur" },
    { id: "5071af26-032e-4a0e-9208-ca642db76127", name: "New Katak Public School" },
    { id: "ccdf224d-69d9-46ee-a9d9-31aa1c1d709d", name: "Model School – Baghait" },
    { id: "020c43b1-04ba-41e5-80ec-89e21037b063", name: "Orphan Home - Baghait" },
    { id: "ce27fa05-e940-4bdd-9859-e124c453181a", name: "Spark Academy" },
    { id: "42535c63-0553-4ad3-a4c5-8dd495d1218b", name: "Thaiba Sweet Water" },
    { id: "7d6b7d59-af69-4d2c-abfd-545d53be5e31", name: "Thaiba Cultural Center" }
];

const ROLES = [
    { id: 'guest', name: 'Guest (View Only)' },
    { id: 'team', name: 'Team Member (Production)' },
    { id: 'admin', name: 'Administrator (Full Access)' }
];

export default function SignupClient() {
    const router = useRouter();
    const [fullName, setFullName] = useState('');
    const [institutionId, setInstitutionId] = useState('');
    const [role, setRole] = useState('guest');
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
        
        if (!fullName) {
            setError('Please enter your full name');
            return;
        }

        if (!institutionId) {
            setError('Please select your institution');
            return;
        }

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

            const metadata = {
                full_name: fullName,
                institution_id: institutionId,
                role: role
            };

            console.log('[SIGNUP] Attempting signup with metadata:', metadata);
            await signup(email, password, metadata);
            
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

            <div className="w-full max-w-lg relative z-10 flex flex-col items-center p-4">
                {/* Logo Section */}
                <div className="relative mb-6 flex items-center justify-center">
                    <HaloLogo size={60} />
                </div>

                <div className="text-center mb-6 space-y-2">
                    <h1 className="text-3xl font-extrabold tracking-tight text-white">
                        Join MediaHive
                    </h1>
                    <p className="text-slate-400 font-medium">
                        Create your production account.
                    </p>
                </div>

                <div className="w-full backdrop-blur-xl bg-gradient-to-b from-white/10 to-white/5 border border-white/10 shadow-2xl rounded-2xl overflow-hidden mb-8">
                    <div className="p-8">
                        <form onSubmit={handleSignup} className="space-y-5">
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

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                                        Full Name
                                    </label>
                                    <div className="relative group">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-primary transition-colors" />
                                        <input
                                            type="text"
                                            required
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            placeholder="John Doe"
                                            className="w-full h-11 bg-white/5 border border-white/10 rounded-full pl-11 pr-6 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-white/10 transition-all text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
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
                                            className="w-full h-11 bg-white/5 border border-white/10 rounded-full pl-11 pr-6 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-white/10 transition-all text-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                                        Institution
                                    </label>
                                    <div className="relative group">
                                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-primary transition-colors" />
                                        <select
                                            required
                                            value={institutionId}
                                            onChange={(e) => setInstitutionId(e.target.value)}
                                            className="w-full h-11 bg-white/5 border border-white/10 rounded-full pl-11 pr-6 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-[#0f172a] transition-all text-sm cursor-pointer"
                                        >
                                            <option value="" disabled className="bg-[#0f172a]">Select Institution</option>
                                            {INSTITUTIONS.map(inst => (
                                                <option key={inst.id} value={inst.id} className="bg-[#0f172a]">
                                                    {inst.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                                        Requested Role
                                    </label>
                                    <div className="relative group">
                                        <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-primary transition-colors" />
                                        <select
                                            required
                                            value={role}
                                            onChange={(e) => setRole(e.target.value)}
                                            className="w-full h-11 bg-white/5 border border-white/10 rounded-full pl-11 pr-6 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-[#0f172a] transition-all text-sm cursor-pointer"
                                        >
                                            {ROLES.map(r => (
                                                <option key={r.id} value={r.id} className="bg-[#0f172a]">
                                                    {r.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
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
                                            className="w-full h-11 bg-white/5 border border-white/10 rounded-full pl-11 pr-6 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-white/10 transition-all text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
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
                                            className="w-full h-11 bg-white/5 border border-white/10 rounded-full pl-11 pr-6 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-white/10 transition-all text-sm"
                                        />
                                    </div>
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
