"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoginForm } from './LoginForm';
import { useAuthContext } from '@/components/providers';
import { Spinner } from '@/components/ui/loading';
import { Card, CardContent } from '@/components/ui/card';

interface AuthPageProps {
  onAuthSuccess?: () => void;
}

export function AuthPage({ onAuthSuccess }: AuthPageProps) {
  const { isAuthenticated, user, isLoading } = useAuthContext();
  const router = useRouter();

  const handleAuthSuccess = () => {
    onAuthSuccess?.();
    // Redirect to dashboard after successful login
    router.push('/');
  };

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (isAuthenticated && user && !isLoading) {
      router.push('/');
    }
  }, [isAuthenticated, user, isLoading, router]);

  // Show loading state while checking authentication or redirecting
  if (isLoading || (isAuthenticated && user)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Spinner size="lg" className="mb-4" />
            <p className="text-muted-foreground">
              {isLoading ? 'Checking authentication...' : 'Redirecting to dashboard...'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <LoginForm onSuccess={handleAuthSuccess} />
      </div>
    </div>
  );
} 