import React, { useState, useEffect } from "react";
// Card components removed - now handled by parent component
import { Button } from "@/components/ui/button";
import { Database, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ServiceRegistry } from "@/lib/api";
import { useAuthContext } from "@/components/providers";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface TableSelectorProps {
  databaseId?: number | null;
  onTableSelect: (tableName: string) => void;
  className?: string;
}

export function TableSelector({
  databaseId,
  onTableSelect,
  className = "",
}: TableSelectorProps) {
  const { user } = useAuthContext();
  const [availableTables, setAvailableTables] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTable, setSelectedTable] = useState<string>("");

  // Get user tables from the API using authenticated service
  const fetchUserTables = async () => {
    if (!user?.user_id) {
      setError("Please log in to view tables");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Use endpoint that requires user ID parameter
      const response = await ServiceRegistry.vectorDB.getUserTableNames(
        user.user_id
      );

      if (response.success && response.data && Array.isArray(response.data)) {
        setAvailableTables(response.data);
      } else {
        setAvailableTables([]);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch tables";
      console.error("Failed to fetch user tables:", error);
      setError(errorMessage);
      toast.error("Failed to load tables", {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch tables on mount and when databaseId changes
  useEffect(() => {
    if (user?.user_id) {
      fetchUserTables();
    }
  }, [user?.user_id, databaseId]);

  // Handle table selection
  const handleTableSelect = (tableName: string) => {
    setSelectedTable(tableName);
    onTableSelect(tableName);
  };


  if (!user?.user_id) {
    return (
      <div className={className}>
        <div className="flex flex-col items-center justify-center h-16">
          <Database className="h-6 w-6 text-gray-400" />
          <p className="text-gray-400 text-xs mt-1">
            Please log in to view tables
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} w-full max-w-full`}>
      <div className="space-y-4 w-full">

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center h-16">
            <Loader2 className="h-6 w-6 text-green-400 animate-spin" />
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="text-center py-6">
            <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Tables List */}
        {!isLoading && !error && (
          <>
            {availableTables.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-16 w-full">
                <Database className="h-6 w-6 text-gray-400" />
                <p className="text-gray-400 text-sm font-medium mt-1">No tables found</p>
              </div>
            ) : (
              <div className="space-y-3 w-full">
                <Label className="text-sm font-medium text-gray-300">Select Table</Label>
                <RadioGroup value={selectedTable} onValueChange={handleTableSelect} className="space-y-2 w-full">
                  <div className="max-h-60 overflow-y-auto space-y-2 w-full">
                    {availableTables.map((table, index) => (
                      <div key={table} className="flex items-center space-x-2 p-2 hover:bg-gray-700/20 rounded-lg transition-colors w-full min-w-0">
                        <RadioGroupItem value={table} id={table} className="flex-shrink-0" />
                        <Label htmlFor={table} className="text-sm text-gray-300 cursor-pointer flex-1 min-w-0 truncate">
                          {table}
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
