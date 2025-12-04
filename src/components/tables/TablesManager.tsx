"use client";

import React, { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageLayout";
import {
  Database,
  Settings,
  FileSpreadsheet,
  Table,
  FileText,
  ArrowRight,
} from "lucide-react";
import {
  CreateTableModal,
  BusinessRulesModal,
  YourTablesModal,
  ExcelImportModal,
} from "./modals";
import { ServiceRegistry } from "@/lib/api/services/service-registry";
import { useAuthContext } from "@/components/providers/AuthContextProvider";
import { useNewTable } from "@/lib/hooks/use-new-table";
import { safeString, safeTrim, isNonEmptyString } from "@/utils/stringUtils";


export function TablesManager() {
  const { user, isLoading: authLoading } = useAuthContext();
  
  // Business rules hook
  const { updateUserBusinessRule, getUserBusinessRule, loading: businessRuleLoading } = useNewTable();

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedTableForViewing, setSelectedTableForViewing] = useState<string>("");
  
  // Separate modal states
  const [showCreateTableModal, setShowCreateTableModal] = useState(false);
  const [showBusinessRulesModal, setShowBusinessRulesModal] = useState(false);
  const [showYourTablesModal, setShowYourTablesModal] = useState(false);
  const [showExcelImportModal, setShowExcelImportModal] = useState(false);
  
  // Table creation state
  const [tableName, setTableName] = useState("");
  const [schema, setSchema] = useState("dbo");
  const [columns, setColumns] = useState([
    {
      name:"id",
      data_type: "INT",
      nullable: false,
      is_primary: true,
      is_identity: true,
    },
  ]);
  const [businessRule, setBusinessRule] = useState("");
  const [currentBusinessRule, setCurrentBusinessRule] = useState<string>("");
  const [businessRuleError, setBusinessRuleError] = useState<string | null>(null);
  const [businessRuleSuccess, setBusinessRuleSuccess] = useState<string | null>(null);
  const [loadingBusinessRule, setLoadingBusinessRule] = useState(false);

  // Load business rule handler
  const handleLoadBusinessRule = async () => {
    if (!user?.user_id) {
      setBusinessRuleError("Please log in to load business rules");
      return;
    }

    setLoadingBusinessRule(true);
    setBusinessRuleError(null);
    setBusinessRuleSuccess(null);

    try {
      const result = await getUserBusinessRule(user?.user_id);
      
      if (result) {
        // Extract business rule from response and ensure it's a string
        const businessRuleText = safeString(result);
        setBusinessRule(businessRuleText);
        setCurrentBusinessRule(businessRuleText);
      } else {
        // No business rule found, start with empty
        setBusinessRule("");
        setCurrentBusinessRule("");
      }
    } catch (error: any) {
      console.error("Failed to load business rule:", error);
      setBusinessRuleError(error.message || "Failed to load business rule. Please try again.");
    } finally {
      setLoadingBusinessRule(false);
    }
  };

  // Business rule save handler
  const handleBusinessRuleSave = async () => {
    if (!user?.user_id) {
      setBusinessRuleError("Please log in to save business rules");
      return;
    }

    if (!isNonEmptyString(businessRule)) {
      setBusinessRuleError("Business rule cannot be empty");
      return;
    }

    setBusinessRuleError(null);
    setBusinessRuleSuccess(null);

    try {
      const result = await updateUserBusinessRule(user?.user_id, safeTrim(businessRule));

      if (result) {
        setBusinessRuleSuccess("Business rule saved successfully!");
        setCurrentBusinessRule(safeString(businessRule));
        setShowBusinessRulesModal(false);
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setBusinessRuleSuccess(null);
        }, 3000);
      } else {
        setBusinessRuleError("Failed to save business rule. Please try again.");
      }
    } catch (error: any) {
      console.error("Failed to save business rule:", error);
      setBusinessRuleError(error.message || "Failed to save business rule. Please try again.");
    }
  };


  return (
    <div className="tables-manager-container">
      <PageHeader 
        title="Table Management" 
        description="Manage your database tables, import Excel files, and configure business rules"
        icon={<Database className="w-6 h-6 text-emerald-400" />}
        enhancedTitle
      />

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
              <Card 
                className="border backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] cursor-pointer group bg-emerald-500/10 border-emerald-500/20"
                onClick={() => setShowCreateTableModal(true)}
              >
                <CardHeader className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors">
                      <Table className="w-6 h-6 text-emerald-400" />
                    </div>
                    <Button variant="ghost" size="icon" className="text-gray-400 group-hover:text-white">
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                  <CardTitle className="text-lg font-semibold text-white mb-1 font-barlow">Create Tables</CardTitle>
                  <CardDescription className="text-sm text-gray-400 mb-3 font-public-sans line-clamp-2">
                    Design and create new database tables
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card 
                className="border backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] cursor-pointer group bg-emerald-500/10 border-emerald-500/20"
                onClick={() => setShowExcelImportModal(true)}
              >
                <CardHeader className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors">
                      <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
                    </div>
                    <Button variant="ghost" size="icon" className="text-gray-400 group-hover:text-white">
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                  <CardTitle className="text-lg font-semibold text-white mb-1 font-barlow">Excel Import</CardTitle>
                  <CardDescription className="text-sm text-gray-400 mb-3 font-public-sans line-clamp-2">
                    Import data from Excel files to your tables
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card 
                className="border backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] cursor-pointer group bg-emerald-500/10 border-emerald-500/20"
                onClick={() => {
                  setShowBusinessRulesModal(true);
                  handleLoadBusinessRule();
                }}
              >
                <CardHeader className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors">
                      <FileText className="w-6 h-6 text-emerald-400" />
                    </div>
                    <Button variant="ghost" size="icon" className="text-gray-400 group-hover:text-white">
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                  <CardTitle className="text-lg font-semibold text-white mb-1 font-barlow">Business Rules</CardTitle>
                  <CardDescription className="text-sm text-gray-400 mb-3 font-public-sans line-clamp-2">
                    Define and manage business rules
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card 
                className="border backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] cursor-pointer group bg-emerald-500/10 border-emerald-500/20"
                onClick={() => setShowYourTablesModal(true)}
              >
                <CardHeader className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors">
                      <Settings className="w-6 h-6 text-emerald-400" />
                    </div>
                    <Button variant="ghost" size="icon" className="text-gray-400 group-hover:text-white">
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                  <CardTitle className="text-lg font-semibold text-white mb-1 font-barlow">Your Tables</CardTitle>
                  <CardDescription className="text-sm text-gray-400 mb-3 font-public-sans line-clamp-2">
                    View and manage all your tables
                  </CardDescription>
                </CardHeader>
              </Card>
      </div>

      {/* Error/Success Messages */}
      {(error || success) && (
        <div className="fixed top-4 right-4 z-50 max-w-md">
          <Alert variant={error ? "destructive" : "default"} className="bg-slate-800/90 border-slate-600">
            <AlertDescription className="text-white">
              {error || success}
            </AlertDescription>
          </Alert>
        </div>
      )}


      {/* Separate Modals */}
      <CreateTableModal
        open={showCreateTableModal}
        onOpenChange={setShowCreateTableModal}
        tableName={tableName}
        setTableName={setTableName}
        schema={schema}
        setSchema={setSchema}
        columns={columns}
        dataTypes={null}
        loading={false}
        onAddColumn={() => {
          setColumns([
            ...columns,
            {
              name: "",
              data_type: "VARCHAR",
              nullable: true,
              is_primary: false,
              is_identity: false,
            },
          ]);
        }}
        onUpdateColumn={(index, field, value) => {
          setColumns((prevColumns) => {
            const newColumns = [...prevColumns];
            newColumns[index] = { ...newColumns[index], [field]: value };
            return newColumns;
          });
        }}
        onRemoveColumn={(index) => {
          if (columns.length > 1) {
            setColumns(columns.filter((_, i) => i !== index));
          }
        }}
        onGetDataTypeOptions={() => []}
        onSubmit={async (modalData) => {
          try {
            setError(null);
            
            // Validate input
            if (!modalData.tableName.trim()) {
              setError("Table name is required");
              return;
            }
            
            if (!modalData.schema.trim()) {
              setError("Schema is required");
              return;
            }
            
            if (modalData.columns.some(col => !col.name.trim())) {
              setError("All columns must have names");
              return;
            }
            
            // Create table request
            const request = {
              user_id: user?.user_id || "",
              table_name: modalData.tableName,
              schema: modalData.schema,
              columns: modalData.columns,
            };
            
            console.log("Creating table with request:", request);
            
            // Call the create table API using ServiceRegistry
            const result = await ServiceRegistry.newTable.createTable(request);
            
            if (result.success) {
              setSuccess("Table created successfully!");
              setShowCreateTableModal(false);
              // Reset form
              setTableName("");
              setSchema("dbo");
              setColumns([{
                name: "id",
                data_type: "INT",
                nullable: false,
                is_primary: true,
                is_identity: true,
              }]);
            } else {
              setError(result.error || "Failed to create table");
            }
          } catch (error) {
            console.error("Failed to create table:", error);
            setError("Failed to create table. Please try again.");
          }
        }}
      />

      <BusinessRulesModal
        open={showBusinessRulesModal}
        onOpenChange={(open) => {
          setShowBusinessRulesModal(open);
          if (!open) {
            // Clear error/success messages when closing modal
            setBusinessRuleError(null);
            setBusinessRuleSuccess(null);
          }
        }}
        businessRule={businessRule}
        setBusinessRule={setBusinessRule}
        contentLoading={loadingBusinessRule}
        saving={businessRuleLoading}
        onSubmit={handleBusinessRuleSave}
        error={businessRuleError}
        success={businessRuleSuccess}
      />


      <ExcelImportModal
        open={showExcelImportModal}
        onOpenChange={setShowExcelImportModal}
        userId={user?.user_id || ""}
        availableTables={[]}
        onViewTableData={(tableName) => {
          setSelectedTableForViewing(tableName);
          setShowExcelImportModal(false);
        }}
      />

      <YourTablesModal
        open={showYourTablesModal}
        onOpenChange={setShowYourTablesModal}
        userId={user?.user_id}
        onRefresh={() => {
          console.log("Refresh tables");
        }}
        onCreateTable={() => {
          setShowYourTablesModal(false);
          setShowCreateTableModal(true);
        }}
      />

    </div>
  );
}
