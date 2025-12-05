// src/components/TaskForm.tsx
'use client';
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function TaskForm({ onCancel, onSubmit }: { onCancel: () => void; onSubmit: (d: any) => Promise<void> }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const { user } = useAuth();
  const isGuest = user?.role === 'guest';

  return (
    <form className="p-4 bg-white rounded shadow" onSubmit={async (e) => { e.preventDefault(); await onSubmit({ title, description, priority }); }}>
      <div className="grid gap-2">
        <input
          className="input disabled:opacity-50 disabled:cursor-not-allowed"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          disabled={isGuest}
        />
        <textarea
          className="input disabled:opacity-50 disabled:cursor-not-allowed"
          placeholder="Description"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isGuest}
        />
        <select
          className="input disabled:opacity-50 disabled:cursor-not-allowed"
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          disabled={isGuest}
        >
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
          {!isGuest && <button type="submit" className="btn-primary">Create</button>}
          {isGuest && <button type="submit" className="btn-primary">Request Assignment</button>}
        </div>
      </div>
    </form>
  );
}