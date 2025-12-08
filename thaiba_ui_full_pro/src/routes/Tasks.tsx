import React, { useEffect, useState } from 'react';
import { useTasks } from '../context/TaskContext';
import TaskList from '../components/TaskList';
import TaskModal from '../components/TaskModal';
import TaskFilters from '../components/TaskFilters';

export default function Tasks() {
  const { tasks, loading } = useTasks();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [priority, setPriority] = useState('');

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener('open-task-modal', handler);
    return () => window.removeEventListener('open-task-modal', handler);
  }, []);

  let filtered = tasks;
  if (search) filtered = filtered.filter((t:any) => t.title.toLowerCase().includes(search.toLowerCase()));
  if (priority) filtered = filtered.filter((t:any) => t.priority === priority);

  return (
    <div>
      <h2 className='text-2xl font-bold mb-4'>Tasks</h2>

      <TaskFilters search={search} setSearch={setSearch} priority={priority} setPriority={setPriority} />

      {loading ? <p>Loading...</p> : <TaskList tasks={filtered} />}

      <TaskModal open={open} onClose={()=>setOpen(false)} edit={null} />

      <button className='fixed right-6 bottom-20 bg-indigo-600 px-4 py-2 rounded-full shadow-lg' onClick={()=>setOpen(true)}>+ New Task</button>
    </div>
  );
}
