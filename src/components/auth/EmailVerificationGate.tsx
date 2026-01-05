'use client';

import { useState, useEffect, ReactNode } from 'react';
import { getAuth, sendEmailVerification, reload } from 'firebase/auth';
import { useAuth } from '@/contexts/AuthContext';

interface EmailVerificationGateProps {
  children: ReactNode;
  requireVerified?: boolean; // If true, blocks access until email is verified
  actionDescription?: string; // Description of the action being gated
  onVerificationComplete?: () => void; // Callback when verification is complete
}

const EmailVerificationGate = ({
  children,
  requireVerified = false,
  actionDescription = 'perform this action',
  onVerificationComplete
}: EmailVerificationGateProps) => {
  const { user, loading } = useAuth();
  const [isResending, setIsResending] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!loading && user) {
      const isEmailVerified = user.email ? user.email.includes('@') && user.email !== 'unverified' : false;
      // In Firebase Auth, user.emailVerified is the actual property
      // But since we're using the AuthContext, we need to check the auth user directly
      const auth = getAuth();
      const authUser = auth.currentUser;
      const emailVerified = authUser?.emailVerified || false;
      
      if (requireVerified && !emailVerified) {
        setShowWarning(true);
        setMessage(`Email verification required to ${actionDescription}. Please verify your email to continue.`);
      } else if (!emailVerified) {
        // Show warning but don't block for non-required actions
        setMessage('For security, please verify your email address.');
      } else {
        setShowWarning(false);
        setMessage('');
        if (onVerificationComplete) {
          onVerificationComplete();
        }
      }
    }
  }, [user, loading, requireVerified, actionDescription, onVerificationComplete]);

  const handleResendVerification = async () => {
    setIsResending(true);
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      
      if (currentUser) {
        await sendEmailVerification(currentUser);
        setMessage('Verification email sent. Please check your inbox.');
      } else {
        setMessage('No user is currently logged in.');
      }
    } catch (error) {
      console.error('Error sending verification email:', error);
      setMessage('Failed to send verification email. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const handleRefresh = async () => {
    try {
      const auth = getAuth();
      await reload(auth.currentUser!);
      // This will refresh the user's verification status
      window.location.reload();
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  // If verification is required and user hasn't verified, show the warning
  if (requireVerified && user && !getAuth().currentUser?.emailVerified) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="mt-3 text-lg font-medium text-gray-900">Email Verification Required</h3>
          <div className="mt-2 text-sm text-gray-500">
            <p>{message}</p>
          </div>
          <div className="mt-4 flex flex-col space-y-3">
            <button
              onClick={handleResendVerification}
              disabled={isResending}
              className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isResending ? 'Sending...' : 'Resend Verification Email'}
            </button>
            <button
              onClick={handleRefresh}
              className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              I've Verified - Refresh
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show warning but allow proceeding for non-required actions
  if (!requireVerified && user && !getAuth().currentUser?.emailVerified && message) {
    return (
      <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm text-yellow-700">
              <span className="font-medium">Email not verified:</span> {message}
            </p>
            <div className="mt-2 flex space-x-3">
              <button
                onClick={handleResendVerification}
                disabled={isResending}
                className="text-sm font-medium text-yellow-700 hover:text-yellow-900 disabled:opacity-50"
              >
                {isResending ? 'Sending...' : 'Resend verification email'}
              </button>
              <button
                onClick={handleRefresh}
                className="text-sm font-medium text-yellow-700 hover:text-yellow-900"
              >
                Refresh status
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default EmailVerificationGate;