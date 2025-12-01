"use client";
import { useEffect } from "react";
import { useAuthContext } from "@/components/providers/AuthContextProvider";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { EasyQueryBrandLoader } from "@/components/ui/loading";
import { Dashboard } from "@/components/dashboard";

function DashboardPageContent() {
  return (
    <AppLayout title="Dashboard" description="Overview of your databases and recent activity">
      <Dashboard />
    </AppLayout>
  );
}

export default function DashboardPage() {
  const { isAuthenticated, user, isLoading, isInitialized } = useAuthContext();
  const router = useRouter();

  // Handle redirect on client side only
  useEffect(() => {
    if (isInitialized && !isLoading && (!isAuthenticated || !user)) {
      router.push('/auth');
    }
  }, [isAuthenticated, user, isLoading, isInitialized, router]);

  // Show loading state while checking authentication or during initialization
  if (isLoading || !isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <EasyQueryBrandLoader size="xl" className="mx-auto mb-4" />
          <p className="text-base sm:text-lg font-medium text-foreground">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  // Show redirecting message for unauthenticated users (only after initialization)
  if (isInitialized && !isLoading && (!isAuthenticated || !user)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <EasyQueryBrandLoader size="xl" className="mx-auto mb-4" />
          <p className="text-base sm:text-lg font-medium text-foreground">
            Redirecting to signin...
          </p>
        </div>
      </div>
    );
  }

  // User is authenticated, render dashboard
  return <DashboardPageContent />;
}
