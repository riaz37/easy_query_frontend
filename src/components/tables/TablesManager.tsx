"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
import { useAuthContext } from "@/components/providers/AuthContextProvider";
import { useNewTable } from "@/lib/hooks/use-new-table";
import { useDatabases } from "@/lib/hooks/use-databases";
import { safeString, safeTrim, isNonEmptyString } from "@/utils/stringUtils";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";


export function TablesManager() {
  const { user, isLoading: authLoading } = useAuthContext();
  const searchParams = useSearchParams();
  const { databases, currentDatabaseId, setCurrentDatabase, isLoading: databasesLoading, refetch: fetchDatabases } = useDatabases();
  
  // Business rules hook
  const { 
    updateUserBusinessRule, 
    getUserBusinessRule, 
    loading: businessRuleLoading,
    createTable: createTableHook,
    loading: createTableLoading
  } = useNewTable();
  
  // Get db_id from URL params or use first available database
  const [dbId, setDbId] = useState<number | null>(null);
  
  useEffect(() => {
    if (user?.user_id && databases.length === 0) {
      fetchDatabases();
    }
  }, [user?.user_id, databases.length, fetchDatabases]);
  
  useEffect(() => {
    // Get db_id from URL params first, then from currentDatabaseId, then first database
    const urlDbId = searchParams.get('db_id');
    if (urlDbId) {
      const parsed = parseInt(urlDbId, 10);
      if (!isNaN(parsed)) {
        setDbId(parsed);
        return;
      }
    }
    
    if (currentDatabaseId) {
      setDbId(currentDatabaseId);
      return;
    }
    
    if (databases.length > 0) {
      const firstDbId = databases[0].db_id;
      setDbId(firstDbId);
      setCurrentDatabase(firstDbId);
    }
  }, [searchParams, currentDatabaseId, databases, setCurrentDatabase]);
  
  // Handle database selection change
  const handleDatabaseChange = (selectedDbId: string) => {
    const dbIdNum = parseInt(selectedDbId, 10);
    if (!isNaN(dbIdNum)) {
      setDbId(dbIdNum);
      setCurrentDatabase(dbIdNum);
    }
  };

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
    if (!dbId) {
      setBusinessRuleError("Please select a database first");
      return;
    }

    setLoadingBusinessRule(true);
    setBusinessRuleError(null);
    setBusinessRuleSuccess(null);

    try {
      const result = await getUserBusinessRule(user!.user_id, dbId);
      
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
    if (!dbId) {
      setBusinessRuleError("Please select a database first");
      return;
    }

    if (!isNonEmptyString(businessRule)) {
      setBusinessRuleError("Business rule cannot be empty");
      return;
    }

    setBusinessRuleError(null);
    setBusinessRuleSuccess(null);

    try {
      const result = await updateUserBusinessRule(user!.user_id, dbId, safeTrim(businessRule));

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

      {/* Database Selector */}
      <div className="mb-6">
        <div className="flex items-center gap-4">
          <Label className="text-sm font-medium text-white whitespace-nowrap">Select Database:</Label>
          <Select
            value={dbId?.toString() || ""}
            onValueChange={handleDatabaseChange}
            disabled={databasesLoading || databases.length === 0}
          >
            <SelectTrigger className="w-[300px] bg-slate-800/50 border-slate-600 text-white">
              {databasesLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Loading databases...</span>
                </div>
              ) : databases.length === 0 ? (
                <SelectValue placeholder="No databases available" />
              ) : (
                <SelectValue placeholder="Select a database">
                  {databases.find(db => db.db_id === dbId)?.db_name || "Select a database"}
                </SelectValue>
              )}
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-600">
              {databases.map((database) => (
                <SelectItem
                  key={database.db_id}
                  value={database.db_id.toString()}
                  className="text-white hover:bg-slate-700 focus:bg-slate-700"
                >
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-emerald-400" />
                    <span>{database.db_name}</span>
                    {database.db_id === dbId && (
                      <span className="ml-auto text-xs text-emerald-400">(Current)</span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!dbId && databases.length > 0 && (
            <span className="text-sm text-yellow-400">Please select a database to continue</span>
          )}
        </div>
      </div>

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

      {/* Error Messages - Only show errors, success uses toast */}
      {error && (
        <div className="fixed top-4 right-4 z-50 max-w-md">
          <Alert variant="destructive" className="bg-slate-800/90 border-slate-600">
            <AlertDescription className="text-white">
              {error}
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
        loading={createTableLoading}
        onAddColumn={() => {
          setColumns([
            ...columns,
            {
              name: "",
              data_type: "VARCHAR(50)",
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
            setSuccess(null);
            
            if (!dbId) {
              setError("Please select a database first");
              return;
            }
            
            // Create table request
            const request = {
              user_id: user!.user_id,
              db_id: dbId,
              table_name: modalData.tableName,
              schema: modalData.schema,
              columns: modalData.columns,
            };
            
            // Use the hook which already handles toasts
            await createTableHook(request);
            
            // Show success toast with green theme
            toast.success(`Table "${modalData.tableName}" created successfully!`);
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
            // Refresh tables list if YourTablesModal is open
            if (showYourTablesModal) {
              setShowYourTablesModal(false);
              setTimeout(() => setShowYourTablesModal(true), 100);
            }
          } catch (error: any) {
            console.error("Failed to create table:", error);
            const errorMessage = error?.message || error?.error || "Failed to create table. Please try again.";
            // Show error toast with green theme
            toast.error(errorMessage);
            setError(errorMessage);
          }
        }}
      />

      <BusinessRulesModal
        open={showBusinessRulesModal}
        onOpenChange={(open) => {
          setShowBusinessRulesModal(open);
          if (open) {
            // Load business rule when modal opens (in case it wasn't loaded from card click)
            if (!loadingBusinessRule && !businessRule) {
              handleLoadBusinessRule();
            }
          } else {
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
        dbId={dbId}
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
        dbId={dbId}
        onRefresh={async () => {
          // Refresh will be handled by YourTablesModal's useEffect when it reopens
          if (showYourTablesModal) {
            // Force refresh by closing and reopening, or trigger refresh in modal
            setShowYourTablesModal(false);
            setTimeout(() => setShowYourTablesModal(true), 100);
          }
        }}
        onCreateTable={() => {
          setShowYourTablesModal(false);
          setShowCreateTableModal(true);
        }}
      />

    </div>
  );
}
