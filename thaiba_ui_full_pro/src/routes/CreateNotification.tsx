import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { pushNotification } from '../services/notificationService';

export default function CreateNotification(){
  const { role } = useAuth();
  if (role?.role !== 'admin') return <div className='p-6'>Admin only.</div>;
  const [title, setTitle] = useState(''); const [body, setBody] = useState('');
  const send = async () => { await pushNotification({ title, body, readBy: [] }); setTitle(''); setBody(''); alert('Sent'); };
  return (<div className='max-w-lg mx-auto p-6'><h2 className='text-2xl font-bold mb-4'>Send Notification</h2><input className='w-full p-2 bg-white/20 mb-3' placeholder='Title' value={title} onChange={e=>setTitle(e.target.value)} /><textarea className='w-full p-2 bg-white/20 mb-3' rows={3} value={body} onChange={e=>setBody(e.target.value)} /><button className='px-4 py-2 bg-indigo-600 rounded' onClick={send}>Send</button></div>);
}
