import React, { useEffect, useState } from 'react';
import { StructureService } from '@/services/structureService';
import { Institution, Department } from '@/types/structure';

// Simple in-memory cache to avoid excessive API calls
// Key: 'inst:id' or 'dept:id', Value: Name
const nameCache: Record<string, string> = {};
const pendingRequests: Record<string, Promise<any>> = {};

interface ResolvedStructureNameProps {
    id?: string | number;
    type: 'institution' | 'department';
    fallback?: string | React.ReactNode;
    className?: string;
}

export const ResolvedStructureName: React.FC<ResolvedStructureNameProps> = ({ id, type, fallback, className }) => {
    const [name, setName] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;

        const stringId = String(id);
        const cacheKey = `${type}:${stringId}`;

        // Check cache first
        if (nameCache[cacheKey]) {
            setName(nameCache[cacheKey]);
            return;
        }

        // Fetch if not cached
        const fetchName = async () => {
            try {
                // Deduplicate requests
                if (!pendingRequests[type]) {
                    pendingRequests[type] = type === 'institution'
                        ? StructureService.getInstitutions(true).then(res => res.institutions)
                        : StructureService.getDepartments(true).then(res => res.departments);
                }

                const list = await pendingRequests[type];

                // Populate cache for all items to optimize future lookups
                list.forEach((item: Institution | Department) => {
                    nameCache[`${type}:${item.id}`] = item.name;
                });

                if (nameCache[cacheKey]) {
                    setName(nameCache[cacheKey]);
                }
            } catch (error) {
                console.error(`Failed to resolve ${type} name`, error);
            }
        };

        fetchName();
    }, [id, type]);

    // Strict Resolution Rule:
    // If ID exists, we MUST resolve it (or show loading/error).
    // We NEVER fallback to legacy string if ID is present.

    if (id) {
        if (name) {
            return <span className={className}>{name}</span>;
        }
        // While loading or if failed to resolve after load
        // We show a placeholder to avoid flashing legacy text
        return <span className="text-foreground/80 text-xs animate-pulse">Loading...</span>;
    }

    // Only if ID is missing do we use the fallback
    if (fallback) {
        return <>{fallback}</>;
    }

    return <span className="text-foreground/80 italic">Not specified</span>;
};
