'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isFeatureEnabled } from '@/app/featureFlags';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Shield, Eye, FileText, Home, ListTodo, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContextProvider';
import { nativeNavigate } from '@/lib/utils';

interface FirstLoginWelcomeProps {
  userRole: 'admin' | 'manager' | 'team' | 'member';
  userId: string;
}

export const FirstLoginWelcome: React.FC<FirstLoginWelcomeProps> = ({ userRole, userId }) => {
  const [isFeatureEnabledFlag, setIsFeatureEnabledFlag] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    const checkFeatureAndStatus = async () => {
      const enabled = isFeatureEnabled('inviteAccessLayer');
      setIsFeatureEnabledFlag(enabled);

      if (enabled && user) {
        // Check if this is the user's first login
        try {
          // In a real implementation, you would check a flag in the user's profile
          // For now, we'll simulate by checking localStorage
          const hasSeenWelcome = localStorage.getItem(`welcome-seen-${userId}`);
          if (!hasSeenWelcome) {
            setShowWelcome(true);
          }
        } catch (error) {
          console.error('Error checking first login status:', error);
        }
      }
      setLoading(false);
    };

    checkFeatureAndStatus();
  }, [user, userId]);

  const handleContinue = () => {
    // Mark as seen in localStorage
    localStorage.setItem(`welcome-seen-${userId}`, 'true');
    setShowWelcome(false);

    // Redirect based on role
    if (userRole === 'admin') {
      nativeNavigate('/admin', router);
    } else if ((userRole === 'manager' || userRole === 'member')) {
      nativeNavigate('/tasks', router);
    } else { // team or other
      nativeNavigate('/tasks', router);
    }
  };

  const handleDismiss = () => {
    // Mark as seen in localStorage
    localStorage.setItem(`welcome-seen-${userId}`, 'true');
    setShowWelcome(false);
  };

  // If feature is disabled or not first login, don't show the component
  if (!isFeatureEnabledFlag || !showWelcome || loading) {
    return null;
  }

  // Role-specific welcome messages
  const getWelcomeContent = () => {
    switch (userRole) {
      case 'admin':
        return {
          title: 'Welcome, Admin!',
          icon: <Shield className="w-8 h-8 text-red-400" />,
          message: 'You have full administrative privileges.',
          hints: [
            'You can manage users, workflows, and system health',
            'Access the Admin panel to invite new users',
            'Monitor system health and manage all aspects of the platform'
          ]
        };
      case 'manager':
      case 'member':
        return {
          title: 'Welcome to the Team!',
          icon: <User className="w-8 h-8 text-blue-400" />,
          message: 'You have team member privileges.',
          hints: [
            'You can manage tasks and media assigned to you',
            'Collaborate with your team on projects',
            'Upload and review media files as needed'
          ]
        };
      case 'member':
        return {
          title: 'Welcome!',
          icon: <Eye className="w-8 h-8 text-green-400" />,
          message: 'You have member privileges.',
          hints: [
            'You can view and create tasks',
            'Communicate with the media team',
            'Track progress of your requests'
          ]
        };
      default:
        return {
          title: 'Welcome!',
          icon: <User className="w-8 h-8 text-foreground/60" />,
          message: 'Welcome to Thaiba Garden Media Manager.',
          hints: ['Your role has been assigned by an administrator']
        };
    }
  };

  const welcomeContent = getWelcomeContent();

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-gradient-to-br from-gray-800 to-gray-900 border border-[#ffffff1a]">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-2">
            {welcomeContent.icon}
          </div>
          <CardTitle className="text-xl font-bold text-foreground">
            {welcomeContent.title}
          </CardTitle>
          <div className="mt-2">
            <Badge
              variant="neutral"
              className={
                userRole === 'admin'
                  ? 'border-red-500/30 text-red-300'
                  : (userRole === 'manager' || userRole === 'team')
                    ? 'border-blue-500/30 text-blue-300'
                    : 'border-green-500/30 text-green-300'
              }
            >
              {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-foreground mb-4">{welcomeContent.message}</p>

          <div className="space-y-2 mb-6">
            {welcomeContent.hints.map((hint, index) => (
              <div key={index} className="flex items-start gap-2">
                <FileText className="w-4 h-4 text-foreground/60 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-foreground">{hint}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleDismiss}
              className="flex-1 bg-gray-700/50 border-gray-600 text-foreground hover:bg-gray-600/50"
            >
              Dismiss
            </Button>
            <Button
              onClick={handleContinue}
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-foreground"
            >
              Continue to Dashboard
            </Button>
          </div>

          <div className="mt-4 text-center text-xs text-foreground/50">
            {userRole === 'admin' && (
              <div className="flex items-center justify-center gap-1">
                <Users className="w-3 h-3" />
                <span>Manage users via Admin panel</span>
              </div>
            )}
            {(userRole === 'manager' || userRole === 'member') && (
              <div className="flex items-center justify-center gap-1">
                <ListTodo className="w-3 h-3" />
                <span>View your tasks in the Tasks section</span>
              </div>
            )}
            {userRole === 'member' && (
              <div className="flex items-center justify-center gap-1">
                <Home className="w-3 h-3" />
                <span>Assigned items will appear on your dashboard</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
