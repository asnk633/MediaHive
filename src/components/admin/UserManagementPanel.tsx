'use client';

import React, { useState, useEffect } from 'react';
import { isFeatureEnabled } from '@/app/featureFlags';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { AlertCircle, User, UserX, UserCheck, Users, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { apiClient } from '@/lib/apiClient';
import { UserService } from '@/services/userService';
import { StructureService } from '@/services/structureService';
import { useAuth } from '@/contexts/AuthContextProvider';
import { updateUserStatus, getUsersByStatus, reassignTasks, reassignEvents, reassignMedia, getOrphanedItems } from '@/services/userLifecycleService';
import { getRoleBadgeColors } from '@/lib/roleStyles';

interface UserManagementPanelProps {
  institution_id: string | number;
}

export const UserManagementPanel: React.FC<UserManagementPanelProps> = ({ institution_id }) => {
  const [isFeatureEnabledFlag, setIsFeatureEnabledFlag] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [targetUser, setTargetUser] = useState<string>('');
  const [showReassignment, setShowReassignment] = useState(false);
  const [orphanedItems, setOrphanedItems] = useState<{ tasks: any[], events: any[], media: any[] }>({ tasks: [], events: [], media: [] });
  const { user: currentUser } = useAuth();

  // New State for Edit Mode
  const [departments, setDepartments] = useState<any[]>([]);
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [editingUser, setEditingUser] = useState<any>(null);

  // Confirmation state
  const [confirmConfig, setConfirmConfig] = useState<{
    open: boolean;
    title: string;
    description: string;
    action: () => void | Promise<void>;
    variant?: 'danger' | 'primary';
  }>({
    open: false,
    title: '',
    description: '',
    action: () => { },
  });

  useEffect(() => {
    const checkFeature = async () => {
      const enabled = isFeatureEnabled('inviteAccessLayer');
      setIsFeatureEnabledFlag(enabled);
      if (enabled && currentUser) {
        fetchUsers();
        fetchMetaData();
      }
    };

    checkFeature();
  }, [currentUser]);


  const fetchMetaData = async () => {
    try {
      const [deptRes, instRes] = await Promise.all([
        StructureService.getDepartments(),
        StructureService.getInstitutions()
      ]);
      setDepartments(deptRes.departments || []);
      setInstitutions(instRes.institutions || []);
    } catch (error) {
      console.error('Failed to load metadata', error);
    }
  };

  const fetchUsers = async () => {
    if (!currentUser) return;
    setLoadingUsers(true);
    try {
      if (currentUser.role === 'admin') {
        const allUsers = await getUsersByStatus(institution_id);
        setUsers(allUsers);
      } else {
        const teamUsers = await UserService.getAllUsers();
        setUsers(teamUsers);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleUpdateUserStatus = async (userId: string, status: 'active' | 'disabled') => {
    if (!currentUser) {
      toast.error('User not authenticated');
      return;
    }

    const user = users.find(u => u.uid === userId);

    setConfirmConfig({
      open: true,
      title: status === 'disabled' ? "Disable User Access" : "Enable User Access",
      description: `Are you sure you want to ${status === 'disabled' ? 'disable' : 'enable'} access for ${user?.name || user?.email || 'this user'}?`,
      variant: status === 'disabled' ? 'danger' : 'primary',
      action: async () => {
        try {
          await updateUserStatus(userId, status, currentUser.uid);
          toast.success(`User status updated to ${status}`);
          fetchUsers();
        } catch (error) {
          console.error('Error updating user status:', error);
          toast.error('Failed to update user status');
        }
      }
    });
  };

  const handleShowReassignment = async (user: any) => {
    setSelectedUser(user);
    try {
      const items = await getOrphanedItems(user.uid);
      setOrphanedItems(items);
      setTargetUser('');
      setShowReassignment(true);
    } catch (error) {
      console.error('Error fetching orphaned items:', error);
      toast.error('Failed to fetch orphaned items');
    }
  };

  const handleEditUser = (user: any) => {
    setEditingUser({
      ...user,
      official_name: user.official_name || user.name || '',
      role: user.role || 'team',
      department_id: user.department_id || '',
      institution_id: user.institution_id || ''
    });
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;
    try {
      await UserService.updateUser(editingUser.uid, {
        name: editingUser.official_name, // Mapping official_name back to name/official_name
        official_name: editingUser.official_name,
        role: editingUser.role,
        department_id: editingUser.department_id,
        institution_id: editingUser.institution_id
      });
      toast.success("User updated successfully");
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      console.error("Failed to update user", error);
      toast.error("Failed to update user");
    }
  };

  const handleReassignItems = async () => {
    if (!selectedUser || !targetUser || !currentUser) {
      toast.error('Please select both users and ensure you are authenticated');
      return;
    }

    try {
      // Reassign tasks, events, and media
      await reassignTasks(selectedUser.uid, targetUser, currentUser.uid);
      await reassignEvents(selectedUser.uid, targetUser, currentUser.uid);
      await reassignMedia(selectedUser.uid, targetUser, currentUser.uid);

      toast.success('Items reassigned successfully');
      setShowReassignment(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Error reassigning items:', error);
      toast.error('Failed to reassign items');
    }
  };

  // If feature is disabled, don't render the panel
  if (!isFeatureEnabledFlag) {
    return null;
  }

  return (
    <Card className="bg-white/5 backdrop-blur-md border border-[#ffffff1a]">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-400" />
          <CardTitle className="text-white">User Management</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {loadingUsers ? (
          <div className="flex items-center justify-center h-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400">No users found</div>
          </div>
        ) : (
          <div className="space-y-3">
            {users.map((user, index) => (
              <div
                key={user.uid || `user-${index}`}
                className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg border border-gray-700"
              >
                <div className="flex items-center gap-3">
                  {/* Avatar or Initials */}
                  {user.photoURL || user.avatar_url ? (
                    <img
                      src={user.photoURL || user.avatar_url}
                      alt={user.name}
                      className="w-10 h-10 rounded-full object-cover border border-[#ffffff1a]"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-400" />
                    </div>
                  )}

                  <div>
                    <div className="font-medium text-white">{user.name || user.email}</div>
                    <div className="text-sm text-gray-400">{user.email}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        variant="neutral"
                        className={getRoleBadgeColors(user.role)}
                      >
                        {user.role}
                      </Badge>
                      {/* Show Office / Unit / Institution if available */}
                      <Badge variant="neutral" className="bg-white/5 text-white/60">
                        {departments.find(d => d.id === user.department_id || d.name === user.department_id)?.name || user.department_id}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Actions - ADMIN ONLY */}
                {currentUser?.role === 'admin' && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditUser(user)}
                      className="text-white/60 hover:text-white"
                    >
                      Edit
                    </Button>

                    {user.status === 'active' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateUserStatus(user.uid, 'disabled')}
                        className="bg-red-900/30 border-red-800 text-red-300 hover:bg-red-800/30"
                      >
                        <UserX className="w-4 h-4 mr-2" />
                        Disable
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateUserStatus(user.uid, 'active')}
                        className="bg-green-900/30 border-green-800 text-green-300 hover:bg-green-800/30"
                      >
                        <UserCheck className="w-4 h-4 mr-2" />
                        Enable
                      </Button>
                    )}
                    {user.status === 'disabled' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleShowReassignment(user)}
                        className="bg-yellow-900/30 border-yellow-800 text-yellow-300 hover:bg-yellow-800/30"
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Reassign
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Edit User Modal */}
        {editingUser && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 border border-gray-700 rounded-xl w-full max-w-md p-6 space-y-4">
              <h3 className="text-xl font-bold text-white">Edit User</h3>

              <div className="space-y-2">
                <label className="text-xs text-gray-400">Full Name</label>
                <input
                  value={editingUser.official_name}
                  onChange={e => setEditingUser({ ...editingUser, official_name: e.target.value })}
                  className="w-full bg-black/20 border border-[#ffffff1a] rounded-md p-2 text-white"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs text-gray-400">Role</label>
                <Select value={editingUser.role} onValueChange={v => setEditingUser({ ...editingUser, role: v })}>
                  <SelectTrigger className="bg-black/20 border-[#ffffff1a] text-white">
                    <SelectValue placeholder="Select Role" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-[#ffffff1a] text-white">
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="team">Team</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-gray-400">Office / Unit</label>
                <Select value={editingUser.department_id} onValueChange={v => setEditingUser({ ...editingUser, department_id: v })}>
                  <SelectTrigger className="bg-black/20 border-[#ffffff1a] text-white">
                    <SelectValue placeholder="Select Office / Unit" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-[#ffffff1a] text-white">
                    {departments.map(d => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-gray-400">Institution</label>
                <Select value={editingUser.institution_id} onValueChange={v => setEditingUser({ ...editingUser, institution_id: v })}>
                  <SelectTrigger className="bg-black/20 border-[#ffffff1a] text-white">
                    <SelectValue placeholder="Select Institution" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-[#ffffff1a] text-white">
                    {institutions.map(i => (
                      <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="ghost" className="flex-1 text-white/50" onClick={() => setEditingUser(null)}>Cancel</Button>
                <Button className="flex-1 bg-blue-600 hover:bg-blue-500" onClick={handleSaveUser}>Save Changes</Button>
              </div>
            </div>
          </div>
        )}

        {/* Reassignment Modal */}
        {showReassignment && selectedUser && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 border border-gray-700 rounded-xl w-full max-w-md p-6">
              <h3 className="text-xl font-bold text-white mb-4">
                Reassign Items from {selectedUser.name || selectedUser.email}
              </h3>

              <div className="mb-4">
                <p className="text-gray-300 mb-2">Items to reassign:</p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Tasks:</span>
                    <span className="font-medium">{orphanedItems.tasks.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Events:</span>
                    <span className="font-medium">{orphanedItems.events.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Media:</span>
                    <span className="font-medium">{orphanedItems.media.length}</span>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Reassign to user:
                </label>
                <Select value={targetUser} onValueChange={setTargetUser}>
                  <SelectTrigger className="bg-black/20 border-white/20 text-white">
                    <SelectValue placeholder="Select a user" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-white/20 text-white">
                    {users
                      .filter(u => u.uid !== selectedUser.uid && u.status === 'active')
                      .map((user, index) => (
                        <SelectItem key={user.uid || `select-${index}`} value={user.uid || ''}>
                          {user.name || user.email} ({user.role})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowReassignment(false)}
                  className="flex-1 bg-gray-700/50 border-gray-600 text-gray-300 hover:bg-gray-600/50"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleReassignItems}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white"
                  disabled={!targetUser}
                >
                  Reassign Items
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>

      <ConfirmationDialog 
        open={confirmConfig.open}
        onOpenChange={(open) => setConfirmConfig(prev => ({ ...prev, open }))}
        title={confirmConfig.title}
        description={confirmConfig.description}
        variant={confirmConfig.variant}
        onConfirm={confirmConfig.action}
      />
    </Card>
  );
};
