"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BarChart3, XIcon } from "lucide-react";

interface AnalyticsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tableData: any;
}

export function AnalyticsModal({
  open,
  onOpenChange,
  tableData,
}: AnalyticsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 border-0 bg-transparent modal-lg" showCloseButton={false}>
        <div className="modal-enhanced">
          <div className="modal-content-enhanced">
            <DialogHeader className="modal-header-enhanced px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-2 sm:pb-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <DialogTitle className="modal-title-enhanced text-lg sm:text-xl flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-green-400" />
                    Table Analytics
                  </DialogTitle>
                  <p className="modal-description-enhanced text-xs sm:text-sm">
                    View analytics and statistics for your tables
                  </p>
                </div>
                <button
                  onClick={() => onOpenChange(false)}
                  className="modal-close-button cursor-pointer flex-shrink-0 ml-2"
                >
                  <XIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              </div>
            </DialogHeader>

            <div className="flex-1 px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6 overflow-y-auto">
              <div className="space-y-4">
                {tableData && (
                  <div className="modal-grid-responsive">
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg">
                      <h4 className="font-semibold text-emerald-800 dark:text-emerald-200">Total Tables</h4>
                      <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                        {tableData.table_info?.metadata?.total_tables || 0}
                      </p>
                    </div>
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg">
                      <h4 className="font-semibold text-emerald-800 dark:text-emerald-200">Processed Tables</h4>
                      <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                        {tableData.table_info?.metadata?.processed_tables || 0}
                      </p>
                    </div>
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg">
                      <h4 className="font-semibold text-emerald-800 dark:text-emerald-200">Connected Tables</h4>
                      <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                        {tableData.table_info?.tables?.filter(t => t.relationships && t.relationships.length > 0).length || 0}
                      </p>
                    </div>
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg">
                      <h4 className="font-semibold text-emerald-800 dark:text-emerald-200">Isolated Tables</h4>
                      <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                        {tableData.table_info?.tables?.filter(t => !t.relationships || t.relationships.length === 0).length || 0}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}