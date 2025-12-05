import React, { useState } from 'react';
import { auth } from '../../firebase/auth';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { setUserRole } from '../../firebase/roles';

export default function RegisterPage() {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const register = async () => { const u = await createUserWithEmailAndPassword(auth, email, password); await setUserRole(u.user.uid, 'guest'); alert('Registered! Please verify your email.'); };
  return (
    <div className='min-h-screen flex items-center justify-center p-6'>
      <div className='w-full max-w-sm bg-white/10 p-6 rounded shadow'>
        <h2 className='text-xl font-bold mb-4'>Register</h2>
        <input className='w-full mb-2 p-2 rounded bg-white/20' placeholder='Email' onChange={(e)=>setEmail(e.target.value)} />
        <input className='w-full mb-4 p-2 rounded bg-white/20' placeholder='Password' type='password' onChange={(e)=>setPassword(e.target.value)} />
        <button className='w-full py-2 bg-indigo-600 rounded' onClick={register}>Register</button>
      </div>
    </div>
  );
}
