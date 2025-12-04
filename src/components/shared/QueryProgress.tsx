import React from "react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface QueryProgressProps {
  progress: number;
  currentStep: string;
  className?: string;
}

export function QueryProgress({
  progress,
  currentStep,
  className,
}: QueryProgressProps) {
  return (
    <div className={cn("w-full space-y-2", className)}>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{currentStep}</span>
        <span>{Math.round(progress)}%</span>
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  );
}
