"use client";

import React from "react";
import { UserConfiguration } from "@/features/user-configuration";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuthenticatedRoute } from "@/components/auth";

export default function UserConfigurationPage() {
  return (
    <AuthenticatedRoute
      authRequiredMessage="Please log in to access user configuration settings."
    >
      <AppLayout title="User Configuration" description="Configure your user settings">
        <UserConfiguration />
      </AppLayout>
    </AuthenticatedRoute>
  );
}
