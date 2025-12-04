"use client";

import React, { useState, useCallback, useRef } from "react";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { X, Upload, CheckCircle, AlertCircle, File } from "lucide-react";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/loading";
import { ServiceRegistry } from "@/lib/api/services/service-registry";
import { useAuthContext } from "@/components/providers/AuthContextProvider";

interface UploadedFile {
  id: string;
  file: File;
  status: "pending" | "uploading" | "processing" | "completed" | "failed";
  bundleId?: string;
  error?: string;
  taskId?: string;
}

interface EnhancedFileUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFilesUploaded: (fileIds: string[]) => void;
  onUploadStatusChange: (files: UploadedFile[]) => void;
  disabled?: boolean;
}

export function EnhancedFileUploadModal({
  open,
  onOpenChange,
  onFilesUploaded,
  onUploadStatusChange,
  disabled = false,
}: EnhancedFileUploadModalProps) {
  const { user } = useAuthContext();
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [pollingIntervals, setPollingIntervals] = useState<Record<string, NodeJS.Timeout>>({});

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (disabled || isUploading) return;

      const newFiles: UploadedFile[] = acceptedFiles.map((file) => ({
        id: Math.random().toString(36).substr(2, 9),
        file,
        status: "pending",
      }));

      setUploadedFiles((prev) => [...prev, ...newFiles]);
      onUploadStatusChange([...uploadedFiles, ...newFiles]);
    },
    [disabled, isUploading, uploadedFiles, onUploadStatusChange]
  );

  // Upload files to the API
  const uploadFiles = useCallback(async (files: UploadedFile[]) => {
    if (files.length === 0) return;

    setIsUploading(true);
    
    try {
      // Generate descriptions and table names
      const fileDescriptions = files.map(uploadFile => `Uploaded file: ${uploadFile.file.name}`);
      const tableNames = files.map(uploadFile => `file_${uploadFile.file.name.replace(/[^a-zA-Z0-9]/g, '_')}`);

      // Check if user is authenticated
      if (!user?.user_id) {
        throw new Error('User not authenticated. Please log in again.');
      }

      // Upload files using the smart file system API
      const uploadResponse = await ServiceRegistry.file.uploadToSmartFileSystem({
        files: files.map(uploadFile => uploadFile.file),
        file_descriptions: fileDescriptions,
        table_names: tableNames,
        user_ids: user.user_id,
      });

      if (uploadResponse.success && uploadResponse.data) {
        const bundleId = uploadResponse.data.bundle_id;
        
        // Validate bundleId before proceeding
        if (!bundleId || typeof bundleId !== 'string' || bundleId.trim().length === 0) {
          throw new Error('Invalid bundle ID received from server');
        }
        
        // Update files with bundle ID
        setUploadedFiles((prev) => {
          const updated = prev.map(uploadFile => {
            const matchingFile = files.find(f => f.id === uploadFile.id);
            if (matchingFile) {
              return {
                ...uploadFile,
                bundleId,
                status: 'processing' as const,
              };
            }
            return uploadFile;
          });
          return updated;
        });

        // Start progress polling
        startProgressPolling(bundleId);
      } else {
        throw new Error(uploadResponse.error || 'File upload failed');
      }
    } catch (error) {
      console.error('File upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'File upload failed';
      toast.error(`Upload failed: ${errorMessage}`);
      
      // Mark files as failed
      setUploadedFiles((prev) => prev.map(uploadFile => {
        const matchingFile = files.find(f => f.id === uploadFile.id);
        if (matchingFile) {
          return {
            ...uploadFile,
            status: 'failed' as const,
            error: errorMessage,
          };
        }
        return uploadFile;
      }));
    } finally {
      setIsUploading(false);
    }
  }, [user?.user_id]);

  // Start progress polling for a bundle
  const startProgressPolling = useCallback((bundleId: string) => {
    // Validate bundleId before starting polling
    if (!bundleId || typeof bundleId !== 'string' || bundleId.trim().length === 0) {
      console.error('Invalid bundleId provided to startProgressPolling:', bundleId);
      return;
    }

    const pollInterval = setInterval(async () => {
      try {
        // Double-check bundleId is still valid
        if (!bundleId || bundleId.trim().length === 0) {
          clearInterval(pollInterval);
          return;
        }

        const statusResponse = await ServiceRegistry.file.getBundleTaskStatus(bundleId);
        
        if (statusResponse.success && statusResponse.data) {
          // The API returns BundleTaskStatusResponse directly
          const bundle = statusResponse.data;
          
          console.log('Progress update for bundle:', bundleId, 'status:', bundle);
          
          // Calculate overall progress
          const overallProgress = bundle.progress_percentage || 0;
          
          // Update status for each file using current state
          setUploadedFiles((prev) => prev.map(uploadFile => {
            if (uploadFile.bundleId !== bundleId) return uploadFile;
            
            let newStatus: UploadedFile['status'] = 'processing';
            let error: string | undefined;
            
            // Handle different status values from API (case-insensitive)
            const bundleStatus = bundle.status?.toLowerCase();
            
            if (bundleStatus === 'completed') {
              newStatus = 'completed';
            } else if (bundleStatus === 'failed') {
              newStatus = 'failed';
              error = `Processing failed. Completed: ${bundle.completed_files}, Failed: ${bundle.failed_files}`;
            } else if (bundleStatus === 'pending' || bundleStatus === 'processing') {
              newStatus = 'processing';
            }
            
            return {
              ...uploadFile,
              status: newStatus,
              error,
            };
          }));
          
          // Check if all files are completed
          const bundleStatus = bundle.status?.toLowerCase();
          if (bundleStatus === 'completed' || bundleStatus === 'failed') {
            clearInterval(pollInterval);
            
            // Clean up interval
            setPollingIntervals(prev => {
              const newIntervals = { ...prev };
              delete newIntervals[bundleId];
              return newIntervals;
            });
            
            // Update parent component with current state
            setUploadedFiles(currentFiles => {
              const updatedFiles = currentFiles.map(uploadFile => {
                if (uploadFile.bundleId === bundleId) {
                  const isCompleted = bundleStatus === 'completed' || bundleStatus === 'success';
                  return {
                    ...uploadFile,
                    status: isCompleted ? 'completed' : 'failed',
                  };
                }
                return uploadFile;
              });
              
              // Extract completed file IDs for callback
              const completedFiles = updatedFiles
                .filter((file) => file.status === "completed")
                .map((file) => file.id);

              if (completedFiles.length > 0) {
                onFilesUploaded(completedFiles);
              }
              
              // Show success/error toast when processing is finished
              if (bundleStatus === 'completed') {
                toast.success(`All files processed successfully! Total: ${bundle.completed_files}`);
              } else {
                toast.error(`Some files failed to process. Completed: ${bundle.completed_files}, Failed: ${bundle.failed_files}`);
              }
              
              return updatedFiles;
            });
          }
        } else {
          console.error('Failed to get bundle status:', statusResponse.error);
        }
      } catch (error) {
        console.error('Progress polling error:', error);
        // Don't stop polling on error, just log it
      }
    }, 2000); // Poll every 2 seconds
    
    // Store interval for cleanup
    setPollingIntervals(prev => ({
      ...prev,
      [bundleId]: pollInterval
    }));
  }, [onFilesUploaded]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/plain": [".txt"],
      "application/pdf": [".pdf"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
      "text/csv": [".csv"],
      "application/vnd.ms-excel": [".xls"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
    },
    maxFiles: 10,
    maxSize: 50 * 1024 * 1024, // 50MB
    disabled: disabled || isUploading,
  });

  const handleRemoveFile = (fileId: string) => {
    setUploadedFiles((prev) => prev.filter((file) => file.id !== fileId));
    
    // Clean up any polling intervals for this file
    const file = uploadedFiles.find(f => f.id === fileId);
    if (file?.bundleId && pollingIntervals[file.bundleId]) {
      clearInterval(pollingIntervals[file.bundleId]);
      setPollingIntervals(prev => {
        const newIntervals = { ...prev };
        delete newIntervals[file.bundleId!];
        return newIntervals;
      });
    }
  };

  const handleClearAll = () => {
    // Clear all polling intervals
    Object.values(pollingIntervals).forEach(interval => clearInterval(interval));
    setPollingIntervals({});
    setUploadedFiles([]);
    onUploadStatusChange([]);
    toast.info("All files cleared");
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Cleanup effect to clear intervals on unmount
  React.useEffect(() => {
    return () => {
      // Clear all polling intervals when component unmounts
      Object.values(pollingIntervals).forEach(interval => clearInterval(interval));
    };
  }, [pollingIntervals]);

  // Sync with parent component when uploadedFiles changes
  React.useEffect(() => {
    if (uploadedFiles.length > 0) {
      onUploadStatusChange(uploadedFiles);
    }
  }, [uploadedFiles, onUploadStatusChange]);

  // Get status icon
  const getStatusIcon = (status: UploadedFile['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'processing':
        return <Spinner size="sm" variant="accent-green" />;
      case 'uploading':
        return <Spinner size="sm" variant="accent-green" />;
      default:
        return <File className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="p-0 border-0 bg-transparent modal-lg"
        showCloseButton={false}
      >
        <div className="modal-enhanced">
          <div className="modal-content-enhanced">
            <DialogHeader className="modal-header-enhanced px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-2 sm:pb-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <DialogTitle className="modal-title-enhanced text-lg sm:text-xl">
                    File Upload
                  </DialogTitle>
                  <p className="modal-description-enhanced text-xs sm:text-sm">
                    Upload files to query and analyze their content
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  className="modal-close-button cursor-pointer flex-shrink-0 ml-2"
                >
                  <X className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              </div>
            </DialogHeader>

            <div className="flex-1 px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6 overflow-y-auto">
              {/* File Drop Zone */}
              <div
                {...getRootProps()}
                className={`border rounded-2xl cursor-pointer transition-all duration-300 relative overflow-hidden w-full ${
                  isDragActive
                    ? "border-green-400 bg-green-400/10 scale-105"
                    : ""
                }`}
              >
                <input {...getInputProps()} />

                <div className="flex flex-col sm:flex-row h-48 sm:h-64">
                  {/* Upload Icon - Top on mobile, Left on desktop */}
                  <div className="flex-shrink-0 w-full sm:w-1/2 h-32 sm:h-full relative overflow-hidden">
                    <img
                      src="/tables/uploadXL.svg"
                      alt="Upload Files"
                      className={`w-full h-full object-cover transition-all duration-300 ${
                        isDragActive ? "scale-110" : ""
                      }`}
                      style={{
                        objectPosition: "center center",
                      }}
                    />
                  </div>

                  {/* Text Content - Bottom on mobile, Right on desktop */}
                  <div className="flex-1 flex flex-col justify-center p-4 sm:p-6">
                    {isDragActive ? (
                      <div className="space-y-1 text-center sm:text-left">
                        <p className="text-base sm:text-lg font-semibold text-green-400">
                          Drop the files here...
                        </p>
                        <p className="text-xs text-green-300">Release to upload</p>
                      </div>
                    ) : (
                      <div className="space-y-2 text-center sm:text-left">
                        <p className="text-base sm:text-lg font-semibold text-white">
                          Drop or select files
                        </p>
                        <p className="text-xs text-slate-400">
                          Drop files here or{" "}
                          <span className="text-green-400 font-medium">
                            click
                          </span>{" "}
                          to browse through your machine
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Authentication Warning */}
              {!user?.user_id && (
                <div className="p-3 bg-yellow-500/20 border border-yellow-400/30 rounded-lg mb-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-yellow-400" />
                    <span className="text-yellow-400 text-sm font-medium">Authentication Required</span>
                  </div>
                  <p className="text-yellow-300 text-xs mt-1">Please log in to upload files</p>
                </div>
              )}

              {/* Selected Files List */}
              {uploadedFiles.length > 0 && (
                <div className="w-full mt-6">
                  <div className="mb-4">
                    <h3 className="text-white font-medium text-sm sm:text-base">Selected Files</h3>
                  </div>

                  <div className="space-y-2 max-h-32 sm:max-h-40 overflow-y-auto">
                    {uploadedFiles.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between w-full p-3 sm:p-4"
                      >
                        {/* Left Side - File Icon and File Name */}
                        <div className="flex items-center flex-1 min-w-0">
                          <div className="flex-shrink-0">
                            <img
                              src="/tables/excelfile.svg"
                              alt="File"
                              className="h-6 w-6 sm:h-8 sm:w-8"
                            />
                          </div>
                          <div className="min-w-0 flex-1 ml-2 sm:ml-3">
                            <p className="text-white font-medium truncate text-sm sm:text-base">
                              {file.file.name}
                            </p>
                            <p className="text-slate-400 text-xs sm:text-sm mt-1">
                              {formatFileSize(file.file.size)}
                            </p>
                          </div>
                        </div>

                        {/* Right Side - Status and Actions */}
                        <div className="flex items-center flex-shrink-0 ml-2 sm:ml-4">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(file.status)}
                          </div>

                          <button
                            onClick={() => handleRemoveFile(file.id)}
                            className="p-1.5 sm:p-2 hover:bg-red-500/20 rounded-lg transition-all duration-200 cursor-pointer group"
                            title="Remove file"
                            disabled={isUploading}
                          >
                            <img
                              src="/tables/cross.svg"
                              alt="Remove"
                              className="h-4 w-4 sm:h-5 sm:w-5 opacity-70 group-hover:opacity-100 transition-opacity"
                            />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="modal-button-group-responsive mt-6">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="modal-button-secondary"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    const pendingFiles = uploadedFiles.filter(f => f.status === 'pending');
                    if (pendingFiles.length > 0) {
                      uploadFiles(pendingFiles);
                    } else {
                      handleClose();
                    }
                  }}
                  disabled={uploadedFiles.length === 0 || isUploading || !user?.user_id}
                  className="modal-button-primary"
                >
                  {isUploading ? "Uploading..." : "Upload Files"}
                </Button>
                {uploadedFiles.length > 0 && (
                  <Button
                    onClick={handleClearAll}
                    variant="destructive"
                    className="modal-button-secondary"
                    style={{
                      background: "var(--error-8, rgba(255, 86, 48, 0.08))",
                      color: "var(--error-main, rgba(255, 86, 48, 1))",
                      border: "1px solid var(--error-16, rgba(255, 86, 48, 0.16))",
                      borderRadius: "99px",
                    }}
                  >
                    Clear All
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}