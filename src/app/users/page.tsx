"use client";

import React from "react";
import { UsersManager } from "@/components/users/UsersManager";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuthenticatedRoute } from "@/components/auth";

export default function UsersPage() {
  return (
    <AuthenticatedRoute
      authRequiredMessage="Please log in to access user management features."
    >
      <AppLayout title="Users" description="Manage user access and permissions">
        <UsersManager />
      </AppLayout>
    </AuthenticatedRoute>
  );
}
