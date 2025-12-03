"use client";

import { AuthPage } from '@/components/auth';
import { PageLayout } from '@/components/layout/PageLayout';

export default function AuthPageRoute() {
  return (
    <PageLayout
      background={["frame"]}
      maxWidth="6xl"
      className="auth-page min-h-screen flex items-center justify-center"
    >
      <div className="w-full max-w-4xl mx-auto">
        <AuthPage />
      </div>
    </PageLayout>
  );
} 