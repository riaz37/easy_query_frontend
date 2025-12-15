"use client";

import React from "react";
import { ReportGenerationContent } from "@/components/report-generation/ReportGenerationContent";
import { AuthenticatedRoute } from "@/components/auth";

export default function ReportGenerationPage() {
  return (
    <AuthenticatedRoute
      authRequiredMessage="Please log in to access report generation features."
    >
      <ReportGenerationContent />
    </AuthenticatedRoute>
  );
}
