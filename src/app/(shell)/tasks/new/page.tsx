"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, User, Briefcase, Flag } from 'lucide-react';
import { useRole } from '@/app/(shell)/RoleContext';
import { Timestamp } from 'firebase/firestore';
import { TaskService } from '@/services/tasks';

export default function NewTaskPage() {
  const router = useRouter();
  const { user } = useRole();
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [department, setDepartment] = useState('Operations'); // Default
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  // For Admin to assign to others. For now simple text or dropdown if we had users list. 
  // Requirement says "Assign to is to be filled by admin only". "Select members".
  // Since we don't have a full users list fetched here yet, I'll mock a simple select or text input.
  // I will use a simple select with some dummy users + 'Self' option logic.
  const [assignedToId, setAssignedToId] = useState<string>('');

  const isGuest = user?.role === 'guest';
  const isAdmin = user?.role === 'admin';
  const isTeam = user?.role === 'team';

  const mockMembers = [
    { id: 'u2', name: 'KMS Pallikkunnu' },
    { id: 'u3', name: 'Shukoor Rahman' },
    { id: 'u4', name: 'Sarah Designer' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !dueDate) {
      alert('Please fill all required fields');
      return;
    }
    setLoading(true);

    try {
      let finalAssignedTo = null;

      if (isAdmin) {
        // Admin selected someone
        const selectedUser = mockMembers.find(m => m.id === assignedToId);
        if (selectedUser) {
          finalAssignedTo = { uid: selectedUser.id, name: selectedUser.name };
        } else if (assignedToId === user?.id) {
          finalAssignedTo = { uid: user.id, name: user.name };
        }
      } else if (isTeam) {
        // Team assigns self
        finalAssignedTo = { uid: user.id, name: user.name };
      }
      // Guest: finalAssignedTo remains null (Admin assigns later)

      await TaskService.addTask({
        title,
        description,
        status: 'todo', // Default status
        priority: isGuest ? 'low' : priority, // Guest defaults to Low or hidden? Plan: "Task created by guests will be assigned to team members by Admin only".
        dueDate: Timestamp.fromDate(new Date(dueDate)),
        department,
        assignedBy: {
          uid: user.id,
          name: user.name,
          role: user.role
        },
        assignedTo: finalAssignedTo || undefined
      });

      router.push('/tasks');
    } catch (err) {
      console.error(err);
      alert('Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full bg-gray-50/50 pb-20">
      <div className="max-w-xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => router.back()}
            className="text-blue-600 font-medium hover:text-blue-700 transition-colors flex items-center gap-1"
          >
            Cancel
          </button>
          <h1 className="text-lg font-bold text-gray-900">New Task</h1>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="text-blue-600 font-bold hover:text-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Done'}
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Title & Desc Group */}
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Title</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Social Media Campaign"
                className="w-full bg-white p-4 rounded-2xl border border-gray-200 shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400 font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Description</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Enter task description..."
                rows={5}
                className="w-full bg-white p-4 rounded-2xl border border-gray-200 shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400 resize-none"
              />
            </div>
          </div>

          {/* Date & Department Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1 flex items-center gap-1">
                <Calendar size={12} /> Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full bg-white p-3 rounded-xl border border-gray-200 shadow-sm focus:border-blue-500 outline-none text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1 flex items-center gap-1">
                <Briefcase size={12} /> Department
              </label>
              <input
                type="text"
                value={department}
                onChange={e => setDepartment(e.target.value)}
                className="w-full bg-white p-3 rounded-xl border border-gray-200 shadow-sm focus:border-blue-500 outline-none text-sm"
              />
            </div>
          </div>

          {/* Priority - Admin Only */}
          {isAdmin && (
            <div className="space-y-3 pt-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1 flex items-center gap-1">
                <Flag size={12} /> Priority
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['low', 'medium', 'high'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`py-3 rounded-xl text-sm font-medium transition-all border ${priority === p
                      ? p === 'high' ? 'bg-red-500 border-red-500 text-white' :
                        p === 'medium' ? 'bg-orange-500 border-orange-500 text-white' :
                          'bg-blue-500 border-blue-500 text-white'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                  >
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Assigned To - Admin Only */}
          {isAdmin && (
            <div className="space-y-3 pt-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1 flex items-center gap-1">
                <User size={12} /> Assigned To
              </label>
              <div className="relative">
                <select
                  value={assignedToId}
                  onChange={e => setAssignedToId(e.target.value)}
                  className="w-full bg-white p-4 rounded-2xl border border-gray-200 shadow-sm focus:border-blue-500 outline-none appearance-none text-sm"
                >
                  <option value="">Select Member</option>
                  <option value={user.id}>Myself ({user.name})</option>
                  {mockMembers.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  ▼
                </div>
              </div>
            </div>
          )}

          {/* Read Only Info */}
          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold overflow-hidden">
                {/* Placeholder for user avatar if available, or Initials */}
                {user.name.charAt(0)}
              </div>
              <div>
                <div className="text-xs text-gray-500">Assigned By</div>
                <div className="font-medium text-gray-900">{user.name} <span className="text-xs font-normal text-gray-400">({user.role})</span></div>
              </div>
            </div>
          </div>

          {/* Submit Button - Mobile/Form Footer Action */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg py-4 rounded-2xl shadow-lg shadow-blue-200 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-8"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                Saving...
              </>
            ) : (
              'Create Task'
            )}
          </button>

        </form>
      </div>
    </div>
  );
}