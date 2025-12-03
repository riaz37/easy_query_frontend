"use client";
import { Dashboard } from "@/components/dashboard";
import { OpeningAnimation } from "@/components/ui/opening-animation";
import { useEffect, useState } from "react";
import { useDatabaseOperations } from "@/lib/hooks";
import { useAuthContext } from "@/components/providers/AuthContextProvider";
import { useRouter } from "next/navigation";
import { PageLayout } from "@/components/layout/PageLayout";
import { ESAPBrandLoader } from "@/components/ui/loading";

function DashboardPageContent() {
  const [showOpeningAnimation, setShowOpeningAnimation] = useState(false);

  const databaseOps = useDatabaseOperations();
  const { user, isAuthenticated } = useAuthContext();

  // Initialize component
  useEffect(() => {
    const hasSeen =
      typeof window !== "undefined" &&
      localStorage.getItem("welcome-animation-shown");
    if (!hasSeen) {
      setShowOpeningAnimation(true);
    }
  }, [isAuthenticated, databaseOps]);

  const handleOpeningComplete = () => {
    setShowOpeningAnimation(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("welcome-animation-shown", "true");
    }
  };

  return (
    <>
      {showOpeningAnimation ? (
        <OpeningAnimation duration={4000} onComplete={handleOpeningComplete}>
          <div />
        </OpeningAnimation>
      ) : (
        <main className="flex-1 animate-[fadeIn_0.5s_ease-out_forwards]">
          <Dashboard />
        </main>
      )}
    </>
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
      <PageLayout
        background={["frame", "gridframe"]}
        maxWidth="6xl"
        className="min-h-screen flex items-center justify-center"
      >
        <div className="w-full max-w-4xl mx-auto">
          <div className="text-center py-6 sm:py-8">
            <ESAPBrandLoader size="xl" className="mx-auto mb-4" />
            <p className="text-base sm:text-lg font-medium text-white">
              Loading...
            </p>
          </div>
        </div>
      </PageLayout>
    );
  }

  // Show redirecting message for unauthenticated users (only after initialization)
  if (isInitialized && !isLoading && (!isAuthenticated || !user)) {
    return (
      <PageLayout
        background={["frame", "gridframe"]}
        maxWidth="6xl"
        className="min-h-screen flex items-center justify-center"
      >
        <div className="w-full max-w-4xl mx-auto">
          <div className="text-center py-6 sm:py-8">
            <ESAPBrandLoader size="xl" className="mx-auto mb-4" />
            <p className="text-base sm:text-lg font-medium text-white">
              Redirecting to signin...
            </p>
          </div>
        </div>
      </PageLayout>
    );
  }

  // User is authenticated, render dashboard
  return <DashboardPageContent />;
}
