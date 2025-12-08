import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function VerifyEmail() {
  const { requestVerification } = useAuth();
  return (
    <div className='p-6 text-center'>
      <h2 className='text-2xl font-bold mb-3'>Email not verified</h2>
      <p className='mb-4'>Please verify your email to continue.</p>
      <button onClick={requestVerification} className='px-6 py-2 bg-indigo-600 rounded text-white'>Send verification email</button>
    </div>
  );
}
