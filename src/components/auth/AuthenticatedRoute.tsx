"use client";

import React from 'react';
import { useAuthContext } from '@/components/providers/AuthContextProvider';
import { Spinner } from '@/components/ui/loading';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { PageLayout } from '@/components/layout/PageLayout';

interface AuthenticatedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
  showLoadingSpinner?: boolean;
  loadingMessage?: string;
  authRequiredMessage?: string;
  className?: string;
}

/**
 * Unified authentication wrapper component that handles authentication checks
 * and redirects consistently across all pages
 */
export function AuthenticatedRoute({ 
  children, 
  fallback,
  redirectTo = "/auth",
  showLoadingSpinner = true,
  loadingMessage = "Checking authentication...",
  authRequiredMessage = "Please log in to access this feature.",
  className = ""
}: AuthenticatedRouteProps) {
  const { isAuthenticated, user, isLoading, isInitialized } = useAuthContext();
  const router = useRouter();

  // Show loading state while checking authentication or during initialization
  if ((isLoading || !isInitialized) && showLoadingSpinner) {
    return (
      <PageLayout
        background={["frame", "gridframe"]}
        maxWidth="6xl"
        className="min-h-screen flex items-center justify-center"
      >
        <div className="w-full max-w-4xl mx-auto">
          <div className="card-enhanced">
            <div className="card-content-enhanced">
              <div className="text-center py-6 sm:py-8">
                <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-emerald-400 mx-auto mb-4" />
                <p className="text-base sm:text-lg font-medium text-white">
                  {loadingMessage}
                </p>
              </div>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  // If authentication is not required, render children
  if (isAuthenticated && user) {
    return <>{children}</>;
  }

  // If user is not authenticated, show auth required message or fallback
  if (!isAuthenticated || !user) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    return (
      <PageLayout
        background={["frame", "gridframe"]}
        maxWidth="6xl"
        className="min-h-screen flex items-center justify-center"
      >
        <div className="w-full max-w-4xl mx-auto">
          <div className="card-enhanced">
            <div className="card-content-enhanced">
              <div className="text-center py-6 sm:py-8">
                <div className="flex items-center justify-center gap-2 text-yellow-600 dark:text-yellow-400 mb-4">
                  <AlertCircle className="w-6 h-6" />
                  <h2 className="text-xl font-semibold">Authentication Required</h2>
                </div>
                <p className="text-gray-300 dark:text-gray-400 mb-6 text-base">
                  {authRequiredMessage}
                </p>
                <Button
                  onClick={() => router.push(redirectTo)}
                  className="w-full text-sm sm:text-base font-semibold transition-colors duration-200 text-white bg-white/4 hover:bg-white/10"
                  style={{
                    borderRadius: '99px',
                    height: '48px'
                  }}
                >
                  Go to Login
                </Button>
              </div>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  // Fallback: render children (should not reach here in normal flow)
  return <>{children}</>;
}

/**
 * Higher-order component for protecting routes
 */
export function withAuthentication<P extends object>(
  Component: React.ComponentType<P>,
  options?: Omit<AuthenticatedRouteProps, 'children'>
) {
  return function AuthenticatedComponent(props: P) {
    return (
      <AuthenticatedRoute {...options}>
        <Component {...props} />
      </AuthenticatedRoute>
    );
  };
}

/**
 * Hook for checking authentication status in components
 */
export function useAuthentication() {
  const { isAuthenticated, user, isLoading, isInitialized } = useAuthContext();
  
  return {
    isAuthenticated,
    user,
    isLoading,
    isInitialized,
    isAuthenticatedAndReady: isAuthenticated && user && !isLoading && isInitialized,
  };
}
