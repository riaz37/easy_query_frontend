"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { History } from "lucide-react";

interface FileQueryPageHeaderProps {
  onHistoryClick: () => void;
  userid?: string;
  className?: string;
}

export function FileQueryPageHeader({ 
  onHistoryClick, 
  userid = "",
  className = "" 
}: FileQueryPageHeaderProps) {
  return (
    <div className={`flex items-center justify-between mb-8 ${className}`}>
      <div>
        <h1 className="text-4xl font-bold mb-2 block gradient-text-primary">
          Hi there, {userid}
        </h1>
        <p className="text-xl block gradient-text-primary">
          What would you like to know?
        </p>
      </div>
      <Button
        onClick={onHistoryClick}
        className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center gap-2"
      >
        <History className="h-4 w-4" />
        History
      </Button>
    </div>
  );
}
