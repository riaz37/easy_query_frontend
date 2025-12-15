"use client";

import React from "react";
import Image from "next/image";

interface ReportGenerationHeaderProps {
  className?: string;
}

export function ReportGenerationHeader({ className = "" }: ReportGenerationHeaderProps) {
  return (
    <div className={`flex items-start ${className}`}>
      <Image
        src="/file-query/filerobot.svg"
        alt="Report Robot"
        width={120}
        height={120}
        className="flex-shrink-0 -ml-2"
      />
      <div className="flex flex-col justify-start pt-5 -ml-4 z-10">
        <h3 className="text-white font-semibold text-xl">
          Report Generation
        </h3>
      </div>
    </div>
  );
}
