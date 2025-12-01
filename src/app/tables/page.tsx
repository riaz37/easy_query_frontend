"use client";

import React from "react";
import { TablesManager } from "@/components/tables/TablesManager";
import { AuthenticatedRoute } from "@/components/auth";
import { AppLayout } from "@/components/layout/AppLayout";

export default function TablesPage() {
  return (
    <AuthenticatedRoute
      authRequiredMessage="Please log in to access database table management features."
    >
      <AppLayout 
        title="Tables" 
        description="Browse and manage database tables"
        showHeader={true}
      >
        <div className="h-[calc(100vh-8rem)] overflow-hidden">
          <TablesManager />
        </div>
      </AppLayout>
    </AuthenticatedRoute>
  );
}
