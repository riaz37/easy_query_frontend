"use client";

import React from "react";
import { TablesManager } from "@/components/tables/TablesManager";
import { PageLayout } from "@/components/layout/PageLayout";
import { AuthenticatedRoute } from "@/components/auth";

export default function TablesPage() {
  return (
    <AuthenticatedRoute
      authRequiredMessage="Please log in to access database table management features."
    >
      <PageLayout 
        background={["frame", "gridframe"]} 
        maxWidth="7xl" 
        className="min-h-screen py-6"
      >
        <TablesManager />
      </PageLayout>
    </AuthenticatedRoute>
  );
}
