// src/components/TaskForm.tsx
'use client';
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContextProvider';
import { DropdownSelector } from '@/components/ui/selectors/DropdownSelector';
import { Flag } from 'lucide-react';

export default function TaskForm({ onCancel, onSubmit }: { onCancel: () => void; onSubmit: (d: any) => Promise<void> }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const { user } = useAuth();
  const isMember = user?.role === 'member';

  return (
    <form className="p-4 bg-white rounded shadow" onSubmit={async (e) => { e.preventDefault(); await onSubmit({ title, description, priority }); }}>
      <div className="grid gap-2">
        <input
          className="input disabled:opacity-50 disabled:cursor-not-allowed"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          disabled={isMember}
        />
        <textarea
          className="input disabled:opacity-50 disabled:cursor-not-allowed"
          placeholder="Description"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isMember}
        />
        <div className="space-y-0.5">
          <DropdownSelector 
            label="Task Priority"
            value={priority}
            onChange={(val) => setPriority(val)}
            disabled={isMember}
            options={[
              { id: 'urgent', label: 'Urgent', icon: <Flag className="text-red-500" size={14} /> },
              { id: 'high', label: 'High', icon: <Flag className="text-orange-500" size={14} /> },
              { id: 'medium', label: 'Medium', icon: <Flag className="text-yellow-500" size={14} /> },
              { id: 'low', label: 'Low', icon: <Flag className="text-blue-500" size={14} /> },
            ]}
          />
        </div>
 
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
          {!isMember && <button type="submit" className="btn-primary">Create</button>}
          {isMember && <button type="submit" className="btn-primary">Request Assignment</button>}
        </div>
      </div>
    </form>
  );
}
