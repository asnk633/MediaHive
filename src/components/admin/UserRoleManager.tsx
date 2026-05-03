'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/apiClient';
import { updateRole } from '@/services/roleService';

interface User {
  uid: string;
  email: string;
  role: string;
  displayName?: string;
}

const UserRoleManager = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const loadUsers = async () => {
      try {
        // Fetch all users via API route
        const usersData = await apiClient('/api/users', {
          method: 'GET',
        });
        
        setUsers(usersData);
      } catch (error) {
        console.error('Error loading users:', error);
      } finally {
        setLoading(false);
      }
    };

    // Load current user's role
    const loadCurrentUserRole = async () => {
      try {
        const userData = await apiClient('/api/users/me', {
          method: 'GET',
        });
        setCurrentUserRole(userData?.role || null);
      } catch (error) {
        console.error('Error loading current user role:', error);
      }
    };

    loadUsers();
    loadCurrentUserRole();
  }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (currentUserRole !== 'admin') {
      alert('Only admins can change roles');
      return;
    }

    setUpdating(prev => ({ ...prev, [userId]: true }));

    try {
      // Use Cloud Function to update role securely
      await updateRole(userId, newRole);

      // Update local state
      setUsers(prev => prev.map(user => 
        user.uid === userId ? { ...user, role: newRole } : user
      ));

      alert(`Role updated to ${newRole} for user ${userId}`);
    } catch (error) {
      console.error('Error updating role:', error);
      alert('Failed to update role');
    } finally {
      setUpdating(prev => ({ ...prev, [userId]: false }));
    }
  };

  if (loading) {
    return <div>Loading users...</div>;
  }

  if (currentUserRole !== 'admin') {
    return <div>Only admins can manage user roles</div>;
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">User Role Management</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b">User ID</th>
              <th className="py-2 px-4 border-b">Email</th>
              <th className="py-2 px-4 border-b">Display Name</th>
              <th className="py-2 px-4 border-b">Current Role</th>
              <th className="py-2 px-4 border-b">Change Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.uid}>
                <td className="py-2 px-4 border-b text-sm">{user.uid}</td>
                <td className="py-2 px-4 border-b">{user.email}</td>
                <td className="py-2 px-4 border-b">{user.displayName || 'N/A'}</td>
                <td className="py-2 px-4 border-b">
                  <span className={`px-2 py-1 rounded text-xs ${
                    user.role === 'admin' ? 'bg-red-200 text-red-800' :
                    user.role === 'team' ? 'bg-blue-200 text-blue-800' :
                    'bg-gray-200 text-gray-800'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="py-2 px-4 border-b">
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.uid, e.target.value)}
                    disabled={updating[user.uid]}
                    className="border rounded px-2 py-1 text-sm"
                  >
                    <option value="guest">guest</option>
                    <option value="team">team</option>
                    <option value="admin">admin</option>
                  </select>
                  {updating[user.uid] && <span className="ml-2 text-xs">Updating...</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserRoleManager;
