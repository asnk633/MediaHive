import { apiClient } from '@/lib/apiClient';
import { Institution, Department, StructureStatus } from '@/types/structure';

const apiRequest = async <T>(endpoint: string, options: RequestInit = {}) => {
    return apiClient<T>(`/api${endpoint}`, options);
};

export const StructureService = {
    // Institutions
    getInstitutions: async (showArchived = false) => {
        const query = showArchived ? '?archived=true' : '';
        return apiRequest<{ institutions: Institution[] }>(`/institutions${query}`);
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
        return apiRequest<{ departments: Department[] }>(`/departments${query}`);
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
