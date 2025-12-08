import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { createTask, updateTask } from '../services/taskService';
import { useAuth } from '../context/AuthContext';

export default function TaskModal({ open, onClose, edit }: any) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('medium');
  const [desc, setDesc] = useState('');

  useEffect(() => {
    if (edit) {
      setTitle(edit.title);
      setPriority(edit.priority || 'medium');
      setDesc(edit.description || '');
    } else {
      setTitle('');
      setPriority('medium');
      setDesc('');
    }
  }, [edit]);

  if (!open) return null;

  const save = async () => {
    const data: any = { title, priority, description: desc, status: 'pending', createdBy: user.uid, assignedTo: [] };
    if (edit) await updateTask(edit.id, data);
    else await createTask(data);
    onClose();
  };

  return (
    <div className='fixed inset-0 bg-black/40 backdrop-blur flex items-center justify-center z-[100]'>
      <motion.div initial={{ scale: .95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className='bg-slate-900 p-6 rounded-lg w-full max-w-md'>
        <h2 className='text-xl font-bold mb-4'>{edit ? 'Edit Task' : 'New Task'}</h2>

        <input className='w-full p-2 bg-white/20 rounded mb-3' placeholder='Task title' value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea className='w-full p-2 bg-white/20 rounded mb-3' rows={3} placeholder='Description' value={desc} onChange={(e) => setDesc(e.target.value)} />
        <label className='block mb-2 font-semibold'>Priority</label>
        <select className='w-full p-2 bg-white/20 rounded mb-4' value={priority} onChange={(e) => setPriority(e.target.value)}><option>low</option><option>medium</option><option>high</option><option>urgent</option></select>

        <div className='flex justify-end gap-3'>
          <button className='px-4 py-2 bg-white/10 rounded' onClick={onClose}>Cancel</button>
          <button className='px-4 py-2 bg-indigo-600 rounded' onClick={save}>Save</button>
        </div>
      </motion.div>
    </div>
  );
}
