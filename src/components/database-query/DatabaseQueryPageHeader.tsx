"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface DatabaseQueryPageHeaderProps {
  onHistoryClick: () => void;
  username?: string;
  className?: string;
}

export function DatabaseQueryPageHeader({ 
  onHistoryClick, 
  username = "",
  className = "" 
}: DatabaseQueryPageHeaderProps) {
  return (
    <div className={`flex items-center justify-between mb-8 ${className}`}>
      <div>
        <h1 className="text-4xl font-bold mb-2 block gradient-text-primary">
          Hi there, {username}
        </h1>
        <p className="text-xl block gradient-text-primary">
          What would you like to know?
        </p>
      </div>
      {/* <Button
        variant="outline"
        className="text-white flex items-center gap-2 custom-button-outline"
        onClick={onHistoryClick}
      >
        <Image
          src="/file-query/history.svg"
          alt="History"
          width={16}
          height={16}
          className="h-4 w-4"
        />
        <span className="hidden sm:inline">History</span>
      </Button> */}
    </div>
  );
}
