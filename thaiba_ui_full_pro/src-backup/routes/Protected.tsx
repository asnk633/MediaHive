import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Protected() {
  const { user, loading } = useAuth();
  if (loading) return <div className='p-6'>Loading...</div>;
  if (!user) return <Navigate to='/login' replace />;
  return <Outlet />;
}
