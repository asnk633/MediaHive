'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/apiClient';

interface Tenant {
    id: number;
    name: string;
    domain: string;
    settings?: any;
    created_at: string;
    updated_at: string;
}

export default function TenantsClient() {
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);

    // Form state
    const [tenantForm, setTenantForm] = useState({
        name: '',
        domain: '',
        settings: ''
    });

    // Fetch tenants
    useEffect(() => {
        // Skip during SSG
        if (typeof window === 'undefined') return;

        const fetchTenants = async () => {
            try {
                const data = await apiClient('/api/tenants', {
                    method: 'GET'
                });
                setTenants(data.tenants);
            } catch (error) {
                console.error('Failed to fetch tenants:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchTenants();
    }, []);

    // Create or update a tenant
    const handleSaveTenant = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const url = editingTenant ? `/api/tenants/${editingTenant.id}` : '/api/tenants';
            const method = editingTenant ? 'PUT' : 'POST';

            const data = await apiClient(url, {
                method,
                body: JSON.stringify({
                    name: tenantForm.name,
                    domain: tenantForm.domain,
                    settings: tenantForm.settings ? JSON.parse(tenantForm.settings) : {}
                }),
            });

            if (editingTenant) {
                setTenants(tenants.map(tenant => tenant.id === editingTenant.id ? data.tenant : tenant));
            } else {
                setTenants([...tenants, data.tenant]);
            }
            resetForm();
        } catch (error) {
            console.error('Failed to save tenant:', error);
        }
    };

    // Edit a tenant
    const editTenant = (tenant: Tenant) => {
        setEditingTenant(tenant);
        setTenantForm({
            name: tenant.name,
            domain: tenant.domain,
            settings: tenant.settings ? JSON.stringify(tenant.settings, null, 2) : ''
        });
        setShowCreateForm(true);
    };

    // Delete a tenant
    const deleteTenant = async (tenantId: number) => {
        if (!confirm('Are you sure you want to delete this tenant? This action cannot be undone.')) {
            return;
        }

        try {
            await apiClient(`/api/tenants/${tenantId}`, {
                method: 'DELETE',
            });

            setTenants(tenants.filter(tenant => tenant.id !== tenantId));
        } catch (error) {
            console.error('Failed to delete tenant:', error);
        }
    };

    // Reset form
    const resetForm = () => {
        setTenantForm({
            name: '',
            domain: '',
            settings: ''
        });
        setEditingTenant(null);
        setShowCreateForm(false);
    };

    if (loading) {
        return <div>Loading tenants...</div>;
    }

    return (
        <div className="tenants-page p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Tenant Management</h1>
                <button
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                    {showCreateForm ? 'Cancel' : 'Create New Tenant'}
                </button>
            </div>

            {showCreateForm && (
                <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
                    <h2 className="text-xl font-bold mb-4">
                        {editingTenant ? 'Edit Tenant' : 'Create New Tenant'}
                    </h2>
                    <form onSubmit={handleSaveTenant}>
                        <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                                Tenant Name
                            </label>
                            <input
                                id="name"
                                type="text"
                                value={tenantForm.name}
                                onChange={(e) => setTenantForm({ ...tenantForm, name: e.target.value })}
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                required
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="domain">
                                Domain
                            </label>
                            <input
                                id="domain"
                                type="text"
                                value={tenantForm.domain}
                                onChange={(e) => setTenantForm({ ...tenantForm, domain: e.target.value })}
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                required
                            />
                            <p className="text-gray-600 text-xs mt-1">The unique domain for this tenant (e.g., campus1.thaibagarden.edu)</p>
                        </div>

                        <div className="mb-6">
                            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="settings">
                                Settings (JSON)
                            </label>
                            <textarea
                                id="settings"
                                value={tenantForm.settings}
                                onChange={(e) => setTenantForm({ ...tenantForm, settings: e.target.value })}
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                rows={4}
                                placeholder='{"branding": {"primaryColor": "#007bff"}, "features": {"notifications": true}}'
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <button
                                type="button"
                                onClick={resetForm}
                                className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                            >
                                {editingTenant ? 'Update Tenant' : 'Create Tenant'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white shadow-md rounded">
                <table className="min-w-full">
                    <thead>
                        <tr>
                            <th className="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                                Name
                            </th>
                            <th className="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                                Domain
                            </th>
                            <th className="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                                Created
                            </th>
                            <th className="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {tenants.map((tenant) => (
                            <tr key={tenant.id}>
                                <td className="px-6 py-4 whitespace-no-wrap border-b border-gray-200">
                                    <div className="text-sm leading-5 font-medium text-gray-900">{tenant.name}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-no-wrap border-b border-gray-200">
                                    <div className="text-sm leading-5 text-gray-900">{tenant.domain}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-no-wrap border-b border-gray-200 text-sm leading-5 text-gray-500">
                                    {new Date(tenant.created_at).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-no-wrap border-b border-gray-200 text-sm leading-5 font-medium">
                                    <button
                                        onClick={() => editTenant(tenant)}
                                        className="text-blue-600 hover:text-blue-900 mr-3"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => deleteTenant(tenant.id)}
                                        className="text-red-600 hover:text-red-900"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {tenants.length === 0 && (
                    <div className="text-center py-8">
                        <p className="text-gray-500">No tenants found.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
