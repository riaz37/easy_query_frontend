import React, { useState, Suspense, lazy } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  User,
  Phone,
  MapPin,
  Mail,
  Lock,
  Database,
  Shield,
  CheckCircle,
  X,
} from "lucide-react";
import { TabSkeleton } from "@/components/ui/loading";
import { UserConfigToggle } from "@/components/ui/toggle";
import { useUserConfiguration } from "./hooks/useUserConfiguration";
import { useBusinessRulesEditor } from "./hooks/useBusinessRulesEditor";
import type { UserConfigurationProps } from "./types";

// Lazy load tab components for code splitting
const OverviewTab = lazy(() =>
  import("./tabs/overview/OverviewTab").then((module) => ({
    default: module.OverviewTab,
  }))
);
const DatabaseTab = lazy(() =>
  import("./tabs/database/DatabaseTab").then((module) => ({
    default: module.DatabaseTab,
  }))
);
const BusinessRulesTab = lazy(() =>
  import("./tabs/business-rules/BusinessRulesTab").then((module) => ({
    default: module.BusinessRulesTab,
  }))
);
const ReportStructureTab = lazy(() =>
  import("./tabs/report-structure/ReportStructureTab").then((module) => ({
    default: module.ReportStructureTab,
  }))
);

// Loading component for Suspense fallback
const TabLoadingFallback = () => <TabSkeleton />;

export const UserConfiguration = React.memo<UserConfigurationProps>(
  ({ className }) => {
    const [activeTab, setActiveTab] = useState("overview");
    const [blockProfile, setBlockProfile] = useState(false);

    const {
      loading,
      databases,
      user,
      isAuthenticated,
      currentDatabaseId,
      currentDatabaseName,
      businessRules,
      businessRulesLoading,
      hasBusinessRules,
      businessRulesCount,
      reportStructure,
      reportStructureLoading,
      reportStructureError,
      handleManualRefresh,
      handleDatabaseChange,
      handleBusinessRulesRefresh,
      handleReportStructureRefresh,
      updateBusinessRules,
    } = useUserConfiguration();

    const {
      editorState,
      handleRulesEdit,
      handleRulesSave,
      handleRulesCancel,
      handleRulesContentChange,
    } = useBusinessRulesEditor({
      currentDatabaseId,
      businessRulesContent: businessRules,
      onRefresh: handleManualRefresh,
      onUpdate: updateBusinessRules,
    });

    if (!isAuthenticated) {
      return (
        <div className="max-w-4xl mx-auto">
          <div className="card-enhanced">
            <div className="card-content-enhanced">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2 text-white">
                  Authentication Required
                </h2>
                <p className="text-gray-300">
                  Please log in to access your configuration.
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    const renderTabContent = () => {
      switch (activeTab) {
        case "overview":
          return (
            <Suspense fallback={<TabLoadingFallback />}>
              <OverviewTab
                user={user}
                currentDatabaseName={currentDatabaseName}
                businessRules={businessRules}
                businessRulesCount={businessRulesCount}
                hasBusinessRules={hasBusinessRules}
                onNavigateToTab={setActiveTab}
              />
            </Suspense>
          );
        case "database":
          return (
            <Suspense fallback={<TabLoadingFallback />}>
              <DatabaseTab
                databases={databases}
                loading={loading}
                onDatabaseChange={handleDatabaseChange}
              />
            </Suspense>
          );
        case "business-rules":
          return (
            <Suspense fallback={<TabLoadingFallback />}>
              <BusinessRulesTab
                currentDatabaseId={currentDatabaseId}
                currentDatabaseName={currentDatabaseName}
                businessRules={businessRules}
                businessRulesCount={businessRulesCount}
                hasBusinessRules={hasBusinessRules}
                editorState={editorState}
                loading={businessRulesLoading}
                onRefresh={handleBusinessRulesRefresh}
                onEdit={handleRulesEdit}
                onSave={handleRulesSave}
                onCancel={handleRulesCancel}
                onContentChange={handleRulesContentChange}
              />
            </Suspense>
          );
        case "report-structure":
          return (
            <Suspense fallback={<TabLoadingFallback />}>
              <ReportStructureTab
                reportStructure={reportStructure}
                loading={reportStructureLoading}
                reportStructureError={reportStructureError}
                onRefresh={handleReportStructureRefresh}
              />
            </Suspense>
          );
        default:
          return null;
      }
    };

    return (
      <div className={className}>
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Side - Profile Management Section */}
          <div className="w-full lg:w-80 flex-shrink-0">
            <div className="query-content-gradient rounded-[32px] p-6">
              {/* User Profile Section */}
              <div className="flex flex-col items-center mb-4">
                <div className="relative w-24 h-24 mb-4">
                  <div
                    className="w-full h-full rounded-full flex items-center justify-center"
                    style={{
                      background: "var(--primary-8, rgba(19, 245, 132, 0.08))",
                      color: "var(--primary-main, rgba(19, 245, 132, 1))",
                      border:
                        "1px solid var(--primary-16, rgba(19, 245, 132, 0.5))",
                      borderRadius: "99px",
                    }}
                  >
                    <User className="w-12 h-12 text-current" />
                  </div>
                </div>
                <p className="text-gray-400 text-base lg:text-lg font-semibold text-center mb-1">
                  {user?.username || "User"}
                </p>
              </div>
            </div>
          </div>

          {/* Right Side - Main Content */}
          <div className="flex-1 space-y-6">
            {/* Tab Navigation Section */}
            <div className="query-content-gradient rounded-[32px] p-4 lg:p-6 min-h-24 flex items-center">
              <div className="flex gap-4 lg:gap-8 overflow-x-auto pb-2">
                {[
                  { id: "overview", label: "Overview" },
                  { id: "database", label: "Database Settings" },
                  { id: "business-rules", label: "Business Rules" },
                  { id: "report-structure", label: "Report Structure" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`text-sm font-medium pb-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                      activeTab === tab.id
                        ? ""
                        : "text-gray-400 border-transparent hover:text-white"
                    }`}
                    style={
                      activeTab === tab.id
                        ? {
                            color: "var(--primary-main, rgba(19, 245, 132, 1))",
                            borderBottomColor:
                              "var(--primary-main, rgba(19, 245, 132, 1))",
                          }
                        : {}
                    }
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="space-y-4 lg:space-y-6">
              {activeTab === "overview" && (
                <>
                  {/* User Information Section */}
                  <div className="query-content-gradient rounded-[32px] p-4 lg:p-6">
                    <div className="space-y-4">
                      <h2 className="modal-title-enhanced text-lg lg:text-xl font-semibold">
                        User Information
                      </h2>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
                        <div className="space-y-2">
                          <Label className="text-gray-400">Name</Label>
                          <Input
                            value={user?.name || ""}
                            className="modal-input-enhanced"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-gray-400">Phone number</Label>
                          <Input
                            value={user?.phone_number || ""}
                            className="modal-input-enhanced"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-gray-400">Address</Label>
                        <Input
                          value={user?.address || ""}
                          className="modal-input-enhanced"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-gray-400">About</Label>
                        <Textarea
                          value={user?.about || ""}
                          className="modal-input-enhanced min-h-[100px] resize-none"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {activeTab !== "overview" && renderTabContent()}
            </div>
          </div>
        </div>
      </div>
    );
  }
);

UserConfiguration.displayName = "UserConfiguration";
