import React, { useState, useEffect } from "react";
import { Database, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ServiceRegistry } from "@/lib/api";
import { useAuthContext } from "@/components/providers";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface FolderSelectorProps {
  configId?: number | null;
  onFolderSelect: (folderName: string) => void;
  className?: string;
}

export function FolderSelector({
  configId,
  onFolderSelect,
  className = "",
}: FolderSelectorProps) {
  const { user } = useAuthContext();
  const [availableFolders, setAvailableFolders] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string>("");

  // Get folders for the selected config
  const fetchFolders = async () => {
    if (!configId) {
      setAvailableFolders([]);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Use configId to get folder names
      const response = await ServiceRegistry.vectorDB.getUserTableNames(
        configId
      );

      if (response.success && response.data && Array.isArray(response.data)) {
        setAvailableFolders(response.data);
      } else {
        setAvailableFolders([]);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch folders";
      console.error("Failed to fetch folders:", error);
      setError(errorMessage);
      toast.error("Failed to load folders", {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch folders when configId changes
  useEffect(() => {
    if (configId) {
      fetchFolders();
    } else {
      setAvailableFolders([]);
      setError(null);
    }
  }, [configId]);

  // Handle folder selection
  const handleFolderSelect = (folderName: string) => {
    setSelectedFolder(folderName);
    onFolderSelect(folderName);
  };


  if (!configId) {
    return (
      <div className={className}>
        <div className="flex flex-col items-center justify-center h-16">
          <Database className="h-6 w-6 text-gray-400" />
          <p className="text-gray-400 text-xs mt-1">
            Please select a Vector DB configuration to view folders
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

        {/* Folders List */}
        {!isLoading && !error && (
          <>
            {availableFolders.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-16 w-full">
                <Database className="h-6 w-6 text-gray-400" />
                <p className="text-gray-400 text-sm font-medium mt-1">No folders found</p>
              </div>
            ) : (
              <div className="space-y-3 w-full">
                <Label className="text-sm font-medium text-gray-300">Select Folder</Label>
                <RadioGroup value={selectedFolder} onValueChange={handleFolderSelect} className="space-y-2 w-full">
                  <div className="max-h-60 overflow-y-auto space-y-2 w-full">
                    {availableFolders.map((folder, index) => (
                      <div key={folder} className="flex items-center space-x-2 p-2 hover:bg-gray-700/20 rounded-lg transition-colors w-full min-w-0">
                        <RadioGroupItem value={folder} id={folder} className="flex-shrink-0" />
                        <Label htmlFor={folder} className="text-sm text-gray-300 cursor-pointer flex-1 min-w-0 truncate">
                          {folder}
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

