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
            const data = await apiRequest<{ institutions: Institution[] }>(`/institutions${query}`);
            // Sort alphabetical
            return {
                institutions: (data.institutions || []).sort((a, b) => a.name.localeCompare(b.name))
            };
        } catch (error: any) {
            console.error("[StructureService] Failed to fetch institutions", error);
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
            const data = await apiRequest<{ departments: Department[] }>(`/departments${query}`);
            return {
                departments: (data.departments || []).sort((a, b) => a.name.localeCompare(b.name))
            };
        } catch (error: any) {
            console.error("[StructureService] Failed to fetch departments", error);
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
    },

    // Resolvers
    getInstitutionName: async (id: string): Promise<string> => {
        try {
            const { institutions } = await StructureService.getInstitutions();
            const match = institutions.find(i => i.id === id);
            return match ? match.name : id;
        } catch {
            return id;
        }
    },

    getDepartmentName: async (id: string): Promise<string> => {
        try {
            const { departments } = await StructureService.getDepartments();
            const match = departments.find(d => d.id === id);
            return match ? match.name : id;
        } catch {
            return id;
        }
    }
};
