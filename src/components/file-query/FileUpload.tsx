"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Upload, X, CheckCircle2, AlertCircle, Loader2, File } from "lucide-react";
import { fileService } from "@/lib/api/services/file-service";
import { toast } from "sonner";
import { useFileConfigContext } from "@/components/providers";

interface UploadedFile {
  id: string;
  file: File;
  status: "pending" | "uploading" | "processing" | "completed" | "failed";
  progress: number;
  bundleId?: string;
  error?: string;
}

export function FileUpload() {
  const { currentConfigId } = useFileConfigContext();
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      if (!currentConfigId) {
        toast.error("Please select a file config first");
        return;
      }

      setIsUploading(true);

      // Create initial file entries
      const newFiles: UploadedFile[] = acceptedFiles.map((file) => ({
        id: `${Date.now()}-${Math.random()}`,
        file,
        status: "pending",
        progress: 0,
      }));

      setUploadedFiles((prev) => [...prev, ...newFiles]);

      try {
        // Generate descriptions
        const fileDescriptions = acceptedFiles.map(
          (file) => `Uploaded file: ${file.name}`
        );

        // Upload files
        const uploadResponse = await fileService.uploadToSmartFileSystem({
          files: acceptedFiles,
          file_descriptions: fileDescriptions,
          table_names: [],
          config_ids: currentConfigId,
        });

        if (uploadResponse.success && uploadResponse.data) {
          const bundleId = uploadResponse.data.bundle_id;

          // Update files with bundle ID
          setUploadedFiles((prev) =>
            prev.map((uploadFile) => {
              const matchingFile = newFiles.find((f) => f.id === uploadFile.id);
              if (matchingFile) {
                return {
                  ...uploadFile,
                  bundleId,
                  status: "processing",
                  progress: 10,
                };
              }
              return uploadFile;
            })
          );

          // Start polling for status
          startPolling(bundleId, newFiles);

          toast.success(`Files uploaded successfully! Processing...`);
        } else {
          throw new Error(uploadResponse.error || "File upload failed");
        }
      } catch (error: any) {
        console.error("File upload error:", error);
        toast.error(error.message || "Failed to upload files");

        // Mark files as failed
        setUploadedFiles((prev) =>
          prev.map((uploadFile) => {
            const matchingFile = newFiles.find((f) => f.id === uploadFile.id);
            if (matchingFile) {
              return {
                ...uploadFile,
                status: "failed",
                error: error.message || "Upload failed",
              };
            }
            return uploadFile;
          })
        );
      } finally {
        setIsUploading(false);
      }
    },
    [currentConfigId]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
        ".docx",
      ],
      "application/vnd.ms-excel": [".xls"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
      "text/plain": [".txt"],
      "text/csv": [".csv"],
      "application/json": [".json"],
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    disabled: !currentConfigId || isUploading,
  });

  const startPolling = useCallback(
    (bundleId: string, files: UploadedFile[]) => {
      // Clear any existing polling
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }

      let pollCount = 0;
      const maxPolls = 300; // 5 minutes with 1 second intervals

      pollingIntervalRef.current = setInterval(async () => {
        pollCount++;

        try {
          const statusResponse = await fileService.getBundleTaskStatus(bundleId);

          if (statusResponse.success && statusResponse.data) {
            // Handle response structure - API returns data directly or nested
            const status = statusResponse.data?.data || statusResponse.data;
            
            // Check bundle-level status (case-insensitive)
            const bundleStatus = (status.status || "").toUpperCase();
            const isCompleted = bundleStatus === "COMPLETED";
            const isFailed = bundleStatus === "FAILED";

            // Update progress based on bundle status and individual tasks
            setUploadedFiles((prev) =>
              prev.map((uploadFile) => {
                const matchingFile = files.find((f) => f.id === uploadFile.id);
                if (matchingFile && uploadFile.bundleId === bundleId) {
                  // If bundle is completed, mark all files as completed
                  if (isCompleted) {
                    return {
                      ...uploadFile,
                      status: "completed",
                      progress: 100,
                    };
                  }
                  
                  // If bundle is failed, mark as failed
                  if (isFailed) {
                    return {
                      ...uploadFile,
                      status: "failed",
                      error: "Bundle processing failed",
                      progress: 0,
                    };
                  }

                  // Try to find corresponding task in individual_tasks
                  const tasks = status.individual_tasks || [];
                  const originalFileName = uploadFile.file.name;
                  const baseFileName = originalFileName.replace(/\.[^/.]+$/, ""); // Remove extension
                  
                  const task = tasks.find((t: any) => {
                    if (!t.filename) return false;
                    // Match by exact filename
                    if (t.filename === originalFileName) return true;
                    // Match by base name (filename might be modified by API)
                    if (t.filename.includes(baseFileName) || baseFileName.includes(t.filename.split('_')[0])) return true;
                    // Match by checking if original filename is contained in API filename
                    const apiBaseName = t.filename.split('_')[0];
                    return apiBaseName && originalFileName.includes(apiBaseName);
                  });

                  if (task) {
                    const taskStatus = (task.status || "").toLowerCase();
                    if (taskStatus === "completed") {
                      return {
                        ...uploadFile,
                        status: "completed",
                        progress: 100,
                      };
                    } else if (taskStatus === "failed") {
                      return {
                        ...uploadFile,
                        status: "failed",
                        error: task.error_message || "Processing failed",
                        progress: 0,
                      };
                    }
                  }
                  
                  // If no task found but bundle is processing, show processing status
                  return {
                    ...uploadFile,
                    status: "processing",
                    progress: Math.min(90, status.progress_percentage || 0),
                  };
                }
                return uploadFile;
              })
            );

            // Stop polling if bundle is completed or failed
            if (isCompleted || isFailed || pollCount >= maxPolls) {
              if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
              }

              if (isCompleted) {
                toast.success(`All files processed successfully! (${status.completed_files || 0} files)`);
              } else if (isFailed) {
                toast.error(`Some files failed to process (${status.failed_files || 0} failed)`);
              }
            }
          }
        } catch (error) {
          console.error("Error polling bundle status:", error);
          if (pollCount >= maxPolls) {
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
          }
        }
      }, 1000); // Poll every second
    },
    []
  );

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  const removeFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Files
          </CardTitle>
          <CardDescription>
            Upload files to query. Supported formats: PDF, Word, Excel, TXT, CSV, JSON (max 50MB)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? "border-primary bg-primary/10"
                : "border-muted-foreground/25 hover:border-muted-foreground/50"
            } ${!currentConfigId || isUploading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-4">
              {isDragActive ? (
                <>
                  <Upload className="h-12 w-12 text-primary" />
                  <p className="text-lg font-medium">Drop files here</p>
                </>
              ) : (
                <>
                  <Upload className="h-12 w-12 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">
                      Drag and drop files here, or click to select
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {!currentConfigId
                        ? "Please select a file config first"
                        : "Select one or more files to upload"}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {uploadedFiles.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Uploaded Files</h4>
              <div className="space-y-2">
                {uploadedFiles.map((uploadedFile) => (
                  <div
                    key={uploadedFile.id}
                    className="border rounded-lg p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <File className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm font-medium truncate">
                          {uploadedFile.file.name}
                        </span>
                        <span className="text-xs text-muted-foreground flex-shrink-0">
                          ({formatFileSize(uploadedFile.file.size)})
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {uploadedFile.status === "completed" && (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        )}
                        {uploadedFile.status === "failed" && (
                          <AlertCircle className="h-5 w-5 text-red-500" />
                        )}
                        {uploadedFile.status === "processing" && (
                          <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(uploadedFile.id)}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {(uploadedFile.status === "processing" ||
                      uploadedFile.status === "uploading") && (
                      <Progress value={uploadedFile.progress} className="h-2" />
                    )}
                    {uploadedFile.status === "failed" && uploadedFile.error && (
                      <p className="text-xs text-red-500">{uploadedFile.error}</p>
                    )}
                    {uploadedFile.status === "completed" && (
                      <p className="text-xs text-green-500">Processing completed</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

