"use client";

import React from "react";
import { TablesManager } from "@/components/tables/TablesManager";
import { PageLayout } from "@/components/layout/PageLayout";
import { AuthenticatedRoute } from "@/components/auth";

export default function TablesPage() {
  return (
    <AuthenticatedRoute
      authRequiredMessage="Please log in to access database table management features."
      className="h-screen w-full overflow-hidden"
    >
      <PageLayout 
        background={["frame", "gridframe"]} 
        container={false} 
        maxWidth="full"
        className="h-screen w-full overflow-hidden"
      >
        <TablesManager />
      </PageLayout>
    </AuthenticatedRoute>
  );
}
