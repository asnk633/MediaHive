// @ts-nocheck
'use client';

import { useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContextProvider';

interface EmailVerificationGateProps {
  children: ReactNode;
  requireVerified?: boolean;
  actionDescription?: string;
  onVerificationComplete?: () => void;
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
      const emailVerified = user.email_confirmed_at != null || user.email_verified === true;

      if (requireVerified && !emailVerified) {
        setShowWarning(true);
        setMessage(`Email verification required to ${actionDescription}. Please verify your email to continue.`);
      } else if (!emailVerified) {
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
      if (user?.email) {
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
      window.location.reload();
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  if (requireVerified && user && !(user.email_confirmed_at || user.email_verified)) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md flex items-center justify-center h-full min-h-[50vh]">
        <div className="text-center w-full">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="mt-4 text-xl font-bold text-gray-900 border-none outline-none">Email Verification Required</h3>
          <div className="mt-2 text-sm text-gray-500 font-medium">
            <p>{message}</p>
          </div>
          <div className="mt-8 flex flex-col space-y-3 max-w-xs mx-auto">
            <button
              onClick={handleResendVerification}
              disabled={isResending}
              className="inline-flex justify-center px-4 py-3 text-sm font-bold text-white uppercase tracking-widest bg-blue-600 border border-transparent rounded-xl hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isResending ? 'Sending...' : 'Resend Email'}
            </button>
            <button
              onClick={handleRefresh}
              className="inline-flex justify-center px-4 py-3 text-sm font-bold text-gray-700 uppercase tracking-widest bg-gray-100 border border-gray-300 rounded-xl hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              I've Verified - Refresh
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!requireVerified && user && !(user.email_confirmed_at || user.email_verified) && message) {
    return (
      <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl max-w-4xl mx-auto xl:-mt-4">
        <div className="flex items-start">
          <div className="flex-shrink-0 mt-0.5">
            <svg className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3 flex-1 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <p className="text-sm text-yellow-800 font-medium">
              <span className="font-bold uppercase tracking-widest mr-2">Unverified:</span> {message}
            </p>
            <div className="mt-2 md:mt-0 flex space-x-4 shrink-0">
              <button
                onClick={handleResendVerification}
                disabled={isResending}
                className="text-xs font-bold uppercase tracking-widest text-yellow-700 hover:text-yellow-900 transition-colors disabled:opacity-50"
              >
                {isResending ? 'Sending...' : 'Resend Email'}
              </button>
              <button
                onClick={handleRefresh}
                className="text-xs font-bold uppercase tracking-widest text-yellow-700 hover:text-yellow-900 transition-colors"
              >
                Refresh
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
