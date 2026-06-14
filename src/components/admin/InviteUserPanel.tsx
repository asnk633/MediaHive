'use client';
import { API_BASE } from '@/lib/api-utils';

import React, { useState, useEffect } from 'react';
import { isFeatureEnabled } from '@/app/featureFlags';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { AlertCircle, UserPlus, Send, Trash2, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/apiClient';

interface InviteUserPanelProps {
  institution_id: string | number;
}

export const InviteUserPanel: React.FC<InviteUserPanelProps> = ({ institution_id }) => {
  const [isFeatureEnabledFlag, setIsFeatureEnabledFlag] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'manager' | 'team' | 'member'>('member');
  const [isLoading, setIsLoading] = useState(false);
  const [invites, setInvites] = useState<any[]>([]);
  const [loadingInvites, setLoadingInvites] = useState(true);
  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null);

  useEffect(() => {
    const checkFeature = async () => {
      const enabled = isFeatureEnabled('inviteAccessLayer');
      setIsFeatureEnabledFlag(enabled);
      if (enabled) {
        fetchInvites();
      }
    };

    checkFeature();
  }, []);

  const fetchInvites = async () => {
    setLoadingInvites(true);
    try {
      const data = await apiClient(`${API_BASE}/invites`, {
        method: 'GET'
      });

      if (data.success) {
        setInvites(data.invites);
      } else {
        toast.error(data.error || 'Failed to fetch invites');
      }
    } catch (error) {
      console.error('Error fetching invites:', error);
      toast.error('Failed to fetch invites');
    } finally {
      setLoadingInvites(false);
    }
  };

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error('Please enter an email address');
      return;
    }

    setIsLoading(true);
    try {
      const result = await apiClient(`${API_BASE}/invites`, {
        method: 'POST',
        body: JSON.stringify({ email, role }),
      });

      if (result.success) {
        toast.success(result.message);
        setEmail('');
        fetchInvites(); // Refresh the list
      } else {
        toast.error(result.error || 'Failed to create invite');
      }
    } catch (error) {
      console.error('Error creating invite:', error);
      toast.error('Failed to create invite');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteInvite = async (inviteId: string) => {
    if (!window.confirm('Are you sure you want to delete this invite? This action cannot be undone.')) {
      return;
    }

    try {
      const result = await apiClient(`${API_BASE}/invites?id=${inviteId}`, {
        method: 'DELETE',
      });

      if (result.success) {
        toast.success('Invite deleted successfully');
        fetchInvites(); // Refresh the list
      } else {
        toast.error(result.error || 'Failed to delete invite');
      }
    } catch (error) {
      console.error('Error deleting invite:', error);
      toast.error('Failed to delete invite');
    }
  };

  const copyInviteLink = (inviteId: string) => {
    const inviteLink = `${window.location.origin}/invite/${inviteId}`;
    navigator.clipboard.writeText(inviteLink);
    setCopiedInviteId(inviteId);
    setTimeout(() => setCopiedInviteId(null), 2000);
    toast.success('Invite link copied to clipboard');
  };

  // If feature is disabled, don't render the panel
  if (!isFeatureEnabledFlag) {
    return null;
  }

  return (
    <Card className="bg-foreground/5 backdrop-blur-md border border-[#ffffff1a]">
      <CardHeader>
        <div className="flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-blue-400" />
          <CardTitle className="text-foreground">Invite Users</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleCreateInvite} className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <Input
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-black/20 border-foreground/20 text-foreground placeholder:text-foreground/60"
              />
            </div>
            <div>
              <Select value={role} onValueChange={(value: 'admin' | 'manager' | 'team' | 'member') => setRole(value)}>
                <SelectTrigger className="bg-black/20 border-foreground/20 text-foreground">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-foreground/20 text-foreground">
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="team">Team</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-foreground"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Invite
                  </>
                )}
              </Button>
            </div>
          </div>
          <p className="text-sm text-foreground/60 mt-2">
            Invites expire in 7 days and can only be used once.
          </p>
        </form>

        <div className="border-t border-[#ffffff1a] pt-6">
          <h3 className="text-lg font-medium text-foreground mb-4">Pending Invites</h3>

          {loadingInvites ? (
            <div className="flex items-center justify-center h-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : invites.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-foreground/60">No pending invites</div>
            </div>
          ) : (
            <div className="space-y-3">
              {invites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg border border-gray-700"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{invite.email}</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${invite.role === 'admin'
                        ? 'bg-red-500/20 text-red-300'
                        : (invite.role === 'manager' || invite.role === 'member')
                          ? 'bg-blue-500/20 text-blue-300'
                          : 'bg-green-500/20 text-green-300'
                        }`}>
                        {invite.role}
                      </span>
                    </div>
                    <div className="text-xs text-foreground/60 mt-1">
                      Created: {new Date(invite.created_at).toLocaleString()} |
                      Expires: {new Date(invite.expiresAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyInviteLink(invite.id)}
                      className="bg-gray-700/50 border-gray-600 text-foreground hover:bg-gray-600/50"
                    >
                      {copiedInviteId === invite.id ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy Link
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteInvite(invite.id)}
                      className="bg-red-900/30 border-red-800 text-red-300 hover:bg-red-800/30"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
