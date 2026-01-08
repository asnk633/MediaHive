import { apiClient } from '@/lib/apiClient';
import { Institution, Department, StructureStatus } from '@/types/structure';

const apiRequest = async <T>(endpoint: string, options: RequestInit = {}) => {
    return apiClient<T>(`/api${endpoint}`, options);
};

export const StructureService = {
    // Institutions
    getInstitutions: async (showArchived = false) => {
        const query = showArchived ? '?archived=true' : '';
        try {
            return await apiRequest<{ institutions: Institution[] }>(`/institutions${query}`);
        } catch (error: any) {
            if (process.env.NODE_ENV === 'development' && (error?.status === 403 || error?.status === 401)) {
                console.warn("[StructureService] Dev Mode: Returning Mock Institutions due to 403/401", error);
                return {
                    institutions: [
                        { id: 'inst_1', name: 'Thaiba Garden', status: 'active' as const, createdAt: new Date().toISOString() },
                        { id: 'inst_2', name: 'Orchids School', status: 'active' as const, createdAt: new Date().toISOString() }
                    ]
                };
            }
            throw error;
        }
    },

    createInstitution: async (name: string) => {
        return apiRequest<Institution>('/institutions', {
            method: 'POST',
            body: JSON.stringify({ name })
        });
    },

    updateInstitution: async (id: string, data: { name?: string; status?: StructureStatus }) => {
        return apiRequest<Institution>(`/institutions/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    },

    // Departments
    getDepartments: async (showArchived = false) => {
        const query = showArchived ? '?archived=true' : '';
        try {
            return await apiRequest<{ departments: Department[] }>(`/departments${query}`);
        } catch (error: any) {
            if (process.env.NODE_ENV === 'development' && (error?.status === 403 || error?.status === 401)) {
                console.warn("[StructureService] Dev Mode: Returning Mock Departments due to 403/401", error);
                return {
                    departments: [
                        { id: 'dept_1', name: 'Media Team', status: 'active' as const, createdAt: new Date().toISOString() },
                        { id: 'dept_2', name: 'IT Support', status: 'active' as const, createdAt: new Date().toISOString() }
                    ]
                };
            }
            throw error;
        }
    },

    createDepartment: async (name: string) => {
        return apiRequest<Department>('/departments', {
            method: 'POST',
            body: JSON.stringify({ name })
        });
    },

    updateDepartment: async (id: string, data: { name?: string; status?: StructureStatus }) => {
        return apiRequest<Department>(`/departments/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    }
};
