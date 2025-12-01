"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoginForm } from './LoginForm';
import { ChangePasswordForm } from './ChangePasswordForm';
import { useAuthContext } from '@/components/providers';

type AuthTab = 'login' | 'change-password';

interface AuthPageProps {
  onAuthSuccess?: () => void;
}

export function AuthPage({ onAuthSuccess }: AuthPageProps) {
  const { isAuthenticated, user, logout } = useAuthContext();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AuthTab>('login');

  const handleAuthSuccess = () => {
    onAuthSuccess?.();
  };

  const handleLogout = () => {
    logout();
    setActiveTab('login');
  };

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (isAuthenticated && user) {
      router.push('/');
    }
  }, [isAuthenticated, user, router]);

  // Show loading state while redirecting
  if (isAuthenticated && user) {
    return (
      <div className="w-full mx-auto">
        <div className="text-center py-6 sm:py-8">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-base sm:text-lg font-medium text-foreground">
            Redirecting to dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {activeTab === 'login' && (
        <LoginForm
          onSuccess={handleAuthSuccess}
        />
      )}

      {activeTab === 'change-password' && (
        <ChangePasswordForm
          onSuccess={() => setActiveTab('login')}
          onCancel={() => setActiveTab('login')}
        />
      )}
    </div>
  );
} 