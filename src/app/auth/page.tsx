"use client";

import { AuthPage } from '@/components/auth';

export default function AuthPageRoute() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <AuthPage />
      </div>
    </div>
  );
} 