import React, { useEffect, useState } from 'react';
import { AuthUser } from '@/contexts/AuthContextProvider';
import { Building2 } from 'lucide-react';
import { StructureService } from '@/services/structureService';

interface InstitutionContextCardProps {
    user: AuthUser | null;
}

export function InstitutionContextCard({ user }: InstitutionContextCardProps) {
    const [instName, setInstName] = useState<string | null>(null);

    useEffect(() => {
        const fetchName = async () => {
            let name: string | null = null;

            // 1. Try to get explicit Unit/Office from LocalStorage (Source of Truth during Reg)
            let localDeptId: string | null = null;
            try {
                const localData = localStorage.getItem("thaiba-tasks:user");
                if (localData) {
                    const parsed = JSON.parse(localData);
                    if (parsed.department_id) localDeptId = parsed.department_id;
                }
            } catch (e) {
                console.warn("Error reading local storage context:", e);
            }

            const targetDeptId = user?.department_id || localDeptId;

            try {
                // Priority 1: Department (Unit/Office) - Strict Resolution
                if (targetDeptId) {
                    const resolvedName = await StructureService.getDepartmentName(targetDeptId);

                    // Explicitly BLOCK "Thaiba Garden HQ" for Guests at Unit level
                    if (resolvedName && !resolvedName.includes("Thaiba Garden HQ")) {
                        if (resolvedName !== targetDeptId) {
                            name = `${resolvedName} (Dept / Inst)`;
                        } else {
                            // If ID itself is the name (failure to resolve but ID exists), use it
                            name = `${targetDeptId} (Dept / Inst)`;
                        }
                    }
                }

                // Priority 2: Institution - Only if NO Unit assigned yet
                if (!name && user?.institution_id) {
                    const resolvedName = await StructureService.getInstitutionName(user.institution_id);

                    // CRITICAL: Block HQ for Guests as per user request
                    if (resolvedName && !resolvedName.includes("Thaiba Garden HQ")) {
                        if (resolvedName !== user.institution_id) {
                            name = `${resolvedName} (Dept / Inst)`;
                        } else {
                            name = `${user.institution_id} (Dept / Inst)`;
                        }
                    } else {
                        // If it resolved to HQ, treat as invalid for Guest. 
                        // But we don't set error yet, we try the next fallback (official_name).
                        console.warn("Guest context resolved to HQ, ignoring Institution ID.");
                    }
                }

                // Priority 3: Official Name (Fallback for Member Accounts without linked Structure IDs)
                if (!name && user?.official_name) {
                    // Use the exact official name as the context
                    // We check if it looks like an Org name vs just a person name? 
                    // Usually safe to append context.
                    name = `${user.official_name} (Dept / Inst)`;
                }
 
                // If still !name, then it remains null -> Error State.
 
            } catch (error) {
                console.warn("Failed to resolve context name:", error);
            }
 
            setInstName(name);
        };
        fetchName();
    }, [user?.department_id, user?.institution_id]);
 
    if (!user || user.role !== 'member') return null;

    if (!instName) {
        return (
            <div className="bg-red-500/10 border border-red-500/20 border-l-2 border-l-red-500 rounded-2xl p-6 backdrop-blur-md">
                <h3 className="text-sm font-semibold text-red-400 mb-1">Context Error</h3>
                <p className="text-base font-medium text-white/90">
                    No Organization Context Found
                </p>
                <p className="text-sm text-red-300/60 mt-1">
                    Please contact support to assign your account to a Department / Institution.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-muted/30 border border-border border-l-2 border-l-blue-500 rounded-2xl p-6 backdrop-blur-md">
            <h3 className="text-sm font-semibold text-primary mb-1">Your Context</h3>
            <div className="flex items-start gap-4">
                <div className="flex-1">
                    <p className="text-base font-medium text-foreground">
                        You are submitting tasks on behalf of: <br />
                        <span className="text-primary text-lg">{instName}</span>
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                        This determines how your requests appear to the Media Team.
                    </p>
                </div>
            </div>
        </div>
    );
}
