"use client";

import React, { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Database,
  Settings,
  FileSpreadsheet,
  Table,
  FileText,
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
      {/* Main Content Area - Clean workspace */}
      <div className="flex h-full">
        {/* Content Container - Centered welcome/instructions */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-2xl text-center">
            <div className="bg-white/10 dark:bg-gray-800/20 backdrop-blur-sm border border-emerald-200/20 dark:border-emerald-800/20 rounded-xl p-8 sm:p-12">
              <Database className="h-16 w-16 text-emerald-400 mx-auto mb-6" />
              <h2 className="text-2xl sm:text-3xl font-semibold text-white mb-4">
                Table Management
              </h2>
              <p className="text-slate-400 mb-8 text-lg">
                Manage your database tables, import Excel files, and configure business rules
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
                <button
                  onClick={() => setShowCreateTableModal(true)}
                  className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50 hover:border-emerald-400/50 hover:bg-slate-800/70 transition-all duration-200 text-left cursor-pointer group"
                >
                  <Table className="h-8 w-8 text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
                  <h3 className="text-white font-medium mb-1">Create Tables</h3>
                  <p className="text-slate-400 text-sm">Design and create new database tables</p>
                </button>
                <button
                  onClick={() => setShowExcelImportModal(true)}
                  className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50 hover:border-emerald-400/50 hover:bg-slate-800/70 transition-all duration-200 text-left cursor-pointer group"
                >
                  <FileSpreadsheet className="h-8 w-8 text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
                  <h3 className="text-white font-medium mb-1">Excel Import</h3>
                  <p className="text-slate-400 text-sm">Import data from Excel files to your tables</p>
                </button>
                <button
                  onClick={() => {
                    setShowBusinessRulesModal(true);
                    handleLoadBusinessRule();
                  }}
                  className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50 hover:border-emerald-400/50 hover:bg-slate-800/70 transition-all duration-200 text-left cursor-pointer group"
                >
                  <FileText className="h-8 w-8 text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
                  <h3 className="text-white font-medium mb-1">Business Rules</h3>
                  <p className="text-slate-400 text-sm">Define and manage business rules</p>
                </button>
                <button
                  onClick={() => setShowYourTablesModal(true)}
                  className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50 hover:border-emerald-400/50 hover:bg-slate-800/70 transition-all duration-200 text-left cursor-pointer group"
                >
                  <Settings className="h-8 w-8 text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
                  <h3 className="text-white font-medium mb-1">Your Tables</h3>
                  <p className="text-slate-400 text-sm">View and manage all your tables</p>
                </button>
              </div>
            </div>
          </div>
        </div>
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
