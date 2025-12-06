import React, { useState } from 'react';
import { auth, createUserWithEmailAndPassword } from '../firebase/firebaseWrapper';
import { setUserRole } from '../firebase/roles';
import { Link, useNavigate } from 'react-router-dom';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');

  const register = async () => {
    try {
      setErr('');
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (cred.user) {
        // Default role: guest or team? Logic in backend or here?
        // Assuming guest per existing logic
        await setUserRole(cred.user.uid, { role: 'guest', tags: [] });
      }
      navigate('/');
    } catch (e: any) {
      setErr(e.message);
    }
  };

  return (
    <div className='min-h-screen flex items-center justify-center p-6'>
      <div className='w-full max-w-sm bg-white/10 p-6 rounded shadow'>
        <h2 className='text-xl font-bold mb-4'>Register</h2>
        {err && <p className='text-red-400 mb-3'>{err}</p>}
        <input className='w-full mb-2 p-2 rounded bg-white/20' name="email" placeholder='Email' onChange={(e) => setEmail(e.target.value)} />
        <input className='w-full mb-4 p-2 rounded bg-white/20' name="password" placeholder='Password' type='password' onChange={(e) => setPassword(e.target.value)} />
        <button className='w-full py-2 bg-green-600 rounded' onClick={register}>Register</button>
        <div className='flex justify-between mt-3 text-sm opacity-80'>
          <Link to='/login'>Login</Link>
        </div>
      </div>
    </div>
  );
}
