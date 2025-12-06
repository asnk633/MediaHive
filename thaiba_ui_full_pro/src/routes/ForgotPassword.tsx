import React, { useState } from 'react';
import { auth, sendPasswordResetEmail } from '../firebase/firebaseWrapper';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');

    const reset = async () => {
        try {
            await sendPasswordResetEmail(auth, email);
            alert('Reset email sent');
        } catch (e: any) {
            alert('Error: ' + e.message);
        }
    };

    return (
        <div className='min-h-screen flex items-center justify-center p-6'>
            <div className='w-full max-w-sm bg-white/10 p-6 rounded shadow'>
                <h2 className='text-xl font-bold mb-4'>Reset Password</h2>
                <input className='w-full mb-3 p-2 rounded bg-white/20' placeholder='Email' onChange={(e) => setEmail(e.target.value)} />
                <button className='w-full py-2 bg-indigo-600 rounded' onClick={reset}>Send Reset Email</button>
            </div>
        </div>
    );
}
