"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoginForm } from './LoginForm';
import { useAuthContext } from '@/components/providers';

interface AuthPageProps {
  onAuthSuccess?: () => void;
}

export function AuthPage({ onAuthSuccess }: AuthPageProps) {
  const { isAuthenticated, user } = useAuthContext();
  const router = useRouter();

  const handleAuthSuccess = () => {
    onAuthSuccess?.();
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
        <div className="card-enhanced">
          <div className="card-content-enhanced">
            <div className="text-center py-6 sm:py-8">
              <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-emerald-400 mx-auto mb-4" />
              <p className="text-base sm:text-lg font-medium text-white">
                Redirecting to dashboard...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <LoginForm onSuccess={handleAuthSuccess} />
    </div>
  );
}
 