"use client";

import React from "react";
import { DatabaseQueryContent } from "@/components/database-query/DatabaseQueryContent";
import { AuthenticatedRoute } from "@/components/auth";

export default function DatabaseQueryPage() {
  return (
    <AuthenticatedRoute
      authRequiredMessage="Please log in to access database query features."
    >
      <DatabaseQueryContent />
    </AuthenticatedRoute>
  );
}