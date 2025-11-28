import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminOnly({ children }: any) {
  const { role, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (role?.role !== 'admin') return <Navigate to='/' />;
  return children;
}
