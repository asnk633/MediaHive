"use client";
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Building, School } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';

type Institution = {
  id: number;
  name: string;
  createdAt: string;
};

export default function InstitutionManagementPage() {
  const { user } = useAuth();
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: '' });

  useEffect(() => {
    fetchInstitutions();
  }, []);

  const fetchInstitutions = async () => {
    setLoading(true);
    try {
      const data = await apiClient('/api/institutions', {
        method: 'GET'
      });
      setInstitutions(data);
    } catch (e) {
      console.error("Failed to fetch institutions", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(-1); // -1 for new institution
    
    try {
      const url = editingId ? `/api/institutions?id=${editingId}` : '/api/institutions';
      const method = editingId ? 'PUT' : 'POST';
      
      await apiClient(url, {
        method,
        body: JSON.stringify({ name: formData.name })
      });
      
      // Reset form
      setFormData({ name: '' });
      setShowForm(false);
      setEditingId(null);
      
      // Refresh list
      fetchInstitutions();
    } catch (e) {
      console.error("Failed to save institution", e);
      alert("Failed to save institution: " + (e as Error).message);
    } finally {
      setSaving(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this institution?")) return;
    
    setSaving(id);
    try {
      await apiClient(`/api/institutions?id=${id}`, {
        method: 'DELETE'
      });
      
      // Refresh list
      fetchInstitutions();
    } catch (e) {
      console.error("Failed to delete institution", e);
      alert("Failed to delete institution: " + (e as Error).message);
    } finally {
      setSaving(null);
    }
  };

  const handleEdit = (inst: Institution) => {
    setFormData({ name: inst.name });
    setEditingId(inst.id);
    setShowForm(true);
  };

  if (user?.role !== 'admin') {
    return <div className="p-8 text-center text-white">Access Denied. Admins only.</div>;
  }

  return (
    <div className="flex flex-col min-h-screen app-body-padding px-4 pb-24 max-w-4xl mx-auto">
      <header className="mb-8 pt-6">
        <h1 className="text-3xl font-display font-bold text-white mb-2">Institution Management</h1>
        <p className="text-[var(--color-text-secondary)]">Manage institutions in your organization.</p>
      </header>

      <div className="mb-6">
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            setFormData({ name: '' });
          }}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={18} />
          {showForm ? 'Cancel' : 'Add Institution'}
        </button>
      </div>

      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-[20px] p-6"
        >
          <h2 className="text-xl font-semibold text-white mb-4">
            {editingId ? 'Edit Institution' : 'Add New Institution'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                Institution Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-[var(--color-bg-subtle)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter institution name"
                required
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
                className="px-4 py-2 border border-[var(--color-border)] rounded-lg text-white hover:bg-[var(--color-bg-subtle)] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving === -1}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {saving === -1 ? 'Saving...' : editingId ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="grid gap-4">
        {loading ? (
          <div className="text-white">Loading institutions...</div>
        ) : institutions.length === 0 ? (
          <div className="text-center py-12 text-[var(--color-text-secondary)]">
            <School className="mx-auto mb-4" size={48} />
            <p>No institutions found.</p>
            <p className="mt-2">Create your first institution to get started.</p>
          </div>
        ) : (
          institutions.map((inst) => (
            <motion.div
              key={inst.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-[20px] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
                  <Building size={20} />
                </div>
                <div>
                  <h3 className="text-white font-semibold">{inst.name}</h3>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    Created: {new Date(inst.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEdit(inst)}
                  className="p-2 text-[var(--color-text-secondary)] hover:text-white hover:bg-[var(--color-bg-subtle)] rounded-lg transition-colors"
                  title="Edit"
                >
                  <Edit size={18} />
                </button>
                <button
                  onClick={() => handleDelete(inst.id)}
                  disabled={saving === inst.id}
                  className="p-2 text-[var(--color-text-secondary)] hover:text-red-400 hover:bg-[var(--color-bg-subtle)] rounded-lg transition-colors disabled:opacity-50"
                  title="Delete"
                >
                  {saving === inst.id ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Trash2 size={18} />
                  )}
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}