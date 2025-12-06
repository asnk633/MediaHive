import React, { useState } from 'react';
import { setUserRole } from '../firebase/roles';
import { useAuth } from '../context/AuthContext';

export default function RoleManager() {
  const { role } = useAuth();
  if (role?.role !== 'admin') return <div className='p-6'>Access denied â€” admin only.</div>;

  const [uid, setUid] = useState('');
  const [primary, setPrimary] = useState('team');
  const [tags, setTags] = useState<string[]>([]);

  const toggleTag = (t: string) => setTags(old => old.includes(t) ? old.filter(x => x !== t) : [...old, t]);

  const update = async () => {
    await setUserRole(uid, { role: primary as any, tags });
    alert('Updated');
  };

  return (
    <div className='max-w-lg mx-auto p-6'>
      <h2 className='text-2xl font-bold mb-4'>Role Manager</h2>
      <input className='w-full p-2 bg-white/20 mb-3' placeholder='User UID' onChange={(e)=>setUid(e.target.value)} />
      <label className='block mb-2 font-semibold'>Primary Role</label>
      <select className='w-full p-2 mb-3 bg-white/20' onChange={(e)=>setPrimary(e.target.value)}>
        <option value='admin'>admin</option><option value='team'>team</option><option value='guest'>guest</option>
      </select>

      <label className='block mb-2 font-semibold'>Tags</label>
      <div className='flex flex-wrap gap-2 mb-3'>
        {['media','academics','it','principal','teacher','coordinator','volunteer','student'].map(t=>(
          <button key={t} onClick={()=>toggleTag(t)} className={'px-2 py-1 rounded ' + (tags.includes(t) ? 'bg-indigo-600' : 'bg-white/20')}>{t}</button>
        ))}
      </div>

      <button className='px-4 py-2 bg-green-600 rounded' onClick={update}>Update Role</button>
    </div>
  );
}