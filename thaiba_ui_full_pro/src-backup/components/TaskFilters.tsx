import React from 'react';

export default function TaskFilters({ search, setSearch, priority, setPriority }: any) {
  return (
    <div className='flex flex-col md:flex-row gap-3 mb-4'>
      <input className='flex-1 p-2 bg-white/10 rounded' placeholder='Search tasks...' value={search} onChange={(e)=>setSearch(e.target.value)} />
      <select className='p-2 bg-white/10 rounded' value={priority} onChange={(e)=>setPriority(e.target.value)}>
        <option value=''>All</option>
        <option value='low'>Low</option>
        <option value='medium'>Medium</option>
        <option value='high'>High</option>
        <option value='urgent'>Urgent</option>
      </select>
    </div>
  );
}
