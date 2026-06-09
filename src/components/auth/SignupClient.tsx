'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HaloLogo } from '@/components/HaloLogo';
import { useAuth } from '@/contexts/AuthContextProvider';
import { Lock, Mail, AlertCircle, Loader2, User, CheckCircle2, Building2, Shield, Eye, EyeOff, LayoutGrid } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { nativeNavigate, cn } from '@/lib/utils';
import { supabase } from '@/lib/supabaseClient';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemeToggle } from '@/components/auth/ThemeToggle';
import { StructureService } from '@/services/structureService';

// Institutions and Departments are now fetched dynamically from the database

export default function SignupClient() {
    const router = useRouter();
    const { theme } = useTheme();
    const [fullName, setFullName] = useState('');
    const [institutionId, setInstitutionId] = useState('');
    const [departmentId, setDepartmentId] = useState('');
    const [institutions, setInstitutions] = useState<{ id: string, name: string }[]>([]);
    const [departments, setDepartments] = useState<{ id: string, name: string }[]>([]);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [mounted, setMounted] = useState(false);
    const { signup } = useAuth();

    useEffect(() => {
        setMounted(true);
        const fetchData = async () => {
            try {
                const [instRes, deptRes] = await Promise.all([
                    StructureService.getInstitutions(),
                    StructureService.getDepartments()
                ]);
                
                if (instRes.institutions) setInstitutions(instRes.institutions);
                if (deptRes.departments) setDepartments(deptRes.departments);
            } catch (err) {
                console.error('[SIGNUP] Failed to fetch organization structure:', err);
            }
        };
        fetchData();
    }, []);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        
        if (!fullName) {
            setError('Please enter your display name');
            return;
        }

        if (!institutionId && !departmentId) {
            setError('Please select either an institution or a department');
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

            const metadata: any = {
                full_name: fullName,
            };

            if (institutionId) metadata.institution_id = institutionId;
            if (departmentId) metadata.department_id = parseInt(departmentId);

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

    if (success) {
        return (
            <div suppressHydrationWarning className={cn("relative min-h-screen flex items-center justify-center overflow-hidden transition-all duration-500", bgGradient)}>
                <ThemeToggle />
                {/* Animated color haze */}
                <div className={cn("absolute w-[900px] h-[900px] blur-[180px] rounded-full top-[-200px] left-[-200px] animate-[float_12s_ease-in-out_infinite] transition-colors duration-500", hazeGlow1)} />
                <div className={cn("absolute w-[700px] h-[700px] blur-[160px] rounded-full bottom-[-200px] right-[-200px] animate-[float_16s_ease-in-out_infinite_reverse] transition-colors duration-500", hazeGlow2)} />

                <div className="w-full max-w-md relative z-10 flex flex-col items-center p-4">
                    <div className="w-full glass-card rounded-2xl p-10 text-center space-y-6">
                        <div className="flex justify-center">
                            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center border border-green-500/30">
                                <CheckCircle2 className="w-10 h-10 text-green-500" />
                            </div>
                        </div>
                        <h2 className="text-3xl font-bold text-foreground">Check Your Email</h2>
                        <p className="text-foreground/60">
                            We've sent a confirmation link to <span className="text-foreground font-medium">{email}</span>. Please verify your email to activate your account.
                        </p>
                        <button
                            onClick={() => nativeNavigate('/login', router, 'Signup-Success')}
                            className="w-full h-12 bg-primary hover:bg-primary/90 text-foreground font-bold rounded-full transition-all"
                        >
                            Return to Login
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!mounted) return null;

    return (
        <div suppressHydrationWarning className={cn("relative min-h-screen flex items-center justify-center overflow-hidden transition-all duration-500", bgGradient)}>
            <ThemeToggle />
            {/* Animated color haze */}
            <div className={cn("absolute w-[900px] h-[900px] blur-[180px] rounded-full top-[-200px] left-[-200px] animate-[float_12s_ease-in-out_infinite] transition-colors duration-500", hazeGlow1)} />
            <div className={cn("absolute w-[700px] h-[700px] blur-[160px] rounded-full bottom-[-200px] right-[-200px] animate-[float_16s_ease-in-out_infinite_reverse] transition-colors duration-500", hazeGlow2)} />

            <div className="w-full max-w-lg relative z-10 flex flex-col items-center p-4">
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

                <div className="w-full glass-card rounded-2xl overflow-hidden mb-8">
                    <div className="p-8">
                        <div className="mb-6 space-y-2">
                            <h2 className="text-2xl font-bold text-foreground">Create Account</h2>
                            <p className="text-xs text-foreground/60 leading-relaxed">
                                Join the unified control center to request tasks, access assets, schedule events, and collaborate with our teams at Thaiba Garden Media and IT department.
                            </p>
                        </div>
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

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-foreground/60 uppercase tracking-widest ml-1">
                                        Display Name
                                    </label>
                                    <div className="relative group">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/50 group-focus-within:text-primary transition-colors" />
                                        <input
                                            type="text"
                                            required
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            placeholder="Your Name"
                                            className="w-full h-11 bg-foreground/5 border border-foreground/10 rounded-full pl-11 pr-6 text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-foreground/10 transition-all text-sm"
                                            suppressHydrationWarning
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-foreground/60 uppercase tracking-widest ml-1">
                                        Institution
                                    </label>
                                    <div className="relative group">
                                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/50 group-focus-within:text-primary transition-colors" />
                                        <select
                                            value={institutionId}
                                            onChange={(e) => setInstitutionId(e.target.value)}
                                            className="w-full h-11 bg-foreground/5 border border-foreground/10 rounded-full pl-11 pr-6 text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-[var(--glass-liquid-bg)] transition-all text-sm cursor-pointer"
                                            suppressHydrationWarning
                                        >
                                            <option value="" className="bg-[var(--glass-liquid-bg)]">None / Select Institution</option>
                                            {institutions.map(inst => (
                                                <option key={inst.id} value={inst.id} className="bg-[var(--glass-liquid-bg)]">
                                                    {inst.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-foreground/60 uppercase tracking-widest ml-1">
                                        Department
                                    </label>
                                    <div className="relative group">
                                        <LayoutGrid className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/50 group-focus-within:text-primary transition-colors" />
                                        <select
                                            value={departmentId}
                                            onChange={(e) => setDepartmentId(e.target.value)}
                                            className="w-full h-11 bg-foreground/5 border border-foreground/10 rounded-full pl-11 pr-6 text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-[var(--glass-liquid-bg)] transition-all text-sm cursor-pointer"
                                            suppressHydrationWarning
                                        >
                                            <option value="" className="bg-[var(--glass-liquid-bg)]">None / Select Department</option>
                                            {departments.map(dept => (
                                                <option key={dept.id} value={dept.id} className="bg-[var(--glass-liquid-bg)]">
                                                    {dept.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-foreground/60 uppercase tracking-widest ml-1">
                                    Email Address
                                </label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/50 group-focus-within:text-primary transition-colors" />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="your@email.com"
                                        className="w-full h-11 bg-foreground/5 border border-foreground/10 rounded-full pl-11 pr-6 text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-foreground/10 transition-all text-sm"
                                        suppressHydrationWarning
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-foreground/60 uppercase tracking-widest ml-1">
                                        Create Password
                                    </label>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/50 group-focus-within:text-primary transition-colors" />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••••••"
                                            className="w-full h-11 bg-foreground/5 border border-foreground/10 rounded-full pl-11 pr-12 text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-foreground/10 transition-all text-sm"
                                            suppressHydrationWarning
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
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-foreground/60 uppercase tracking-widest ml-1">
                                        Confirm Password
                                    </label>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/50 group-focus-within:text-primary transition-colors" />
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            required
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="••••••••••••"
                                            className="w-full h-11 bg-foreground/5 border border-foreground/10 rounded-full pl-11 pr-12 text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-foreground/10 transition-all text-sm"
                                            suppressHydrationWarning
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-foreground/60 hover:text-foreground transition-all z-50 cursor-pointer flex items-center justify-center"
                                            title={showConfirmPassword ? "Hide password" : "Show password"}
                                        >
                                            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full h-12 bg-primary hover:bg-primary/90 text-foreground font-bold rounded-full shadow-lg shadow-primary/20 transition-all duration-300 hover:shadow-[0_0_25px_rgba(99,102,241,0.6)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center text-sm"
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
                                <p className="text-sm text-foreground/60 font-medium">
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

                <p className="text-[11px] font-bold text-foreground/50/60 uppercase tracking-[0.2em] text-center">
                    © 2026 Thaiba Garden - Media
                </p>
            </div>
        </div>
    );
}
