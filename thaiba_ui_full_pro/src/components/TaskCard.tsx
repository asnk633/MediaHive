import React, { useState } from 'react';
import { deleteTask } from '../services/taskService';
import TaskModal from './TaskModal';
import { useAuth } from '../context/AuthContext';

export default function TaskCard({ task }: any) {
  const { user, role } = useAuth();
  const [open, setOpen] = useState(false);

  const canEdit = role?.role === 'admin' || task.createdBy === user?.uid;
  const canDelete = role?.role === 'admin';

  const color = { low: 'bg-green-800', medium: 'bg-yellow-700', high: 'bg-orange-700', urgent: 'bg-red-700' }[task.priority];

  return (
    <>
      <div className='p-4 bg-slate-800 rounded-lg border border-white/10 mb-3'>
        <div className='flex justify-between'>
          <h3 className='font-semibold text-lg'>{task.title}</h3>
          <span className={`px-2 py-1 text-xs rounded ${color}`}>{task.priority}</span>
        </div>

        {task.description && <p className='opacity-80 mt-1'>{task.description}</p>}

        <div className='flex gap-3 mt-3 text-sm'>
          {canEdit && <button className='px-3 py-1 rounded bg-white/10' onClick={() => setOpen(true)}>Edit</button>}
          {canDelete && <button className='px-3 py-1 rounded bg-red-600' onClick={() => deleteTask(task.id)}>Delete</button>}
        </div>
      </div>

      <TaskModal open={open} edit={task} onClose={() => setOpen(false)} />
    </>
  );
}
