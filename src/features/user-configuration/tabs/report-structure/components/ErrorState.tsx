"use client";

import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ErrorStateProps {
  title?: string;
  error: string;
  onRetry?: () => void;
  retryText?: string;
  className?: string;
}

export const ErrorState = React.memo<ErrorStateProps>(
  ({
    title = "Error Loading Report Structure",
    error,
    onRetry,
    retryText = "Retry",
    className,
  }) => {
    return (
      <div className={className}>
        <Card className="bg-red-900/20 border-red-500/30">
          <CardContent className="pt-12 pb-12 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-red-400 text-lg font-medium mb-2">
              {title}
            </h3>
            <p className="text-red-300 mb-4">{error}</p>
            {onRetry && (
              <Button onClick={onRetry} className="bg-red-600 hover:bg-red-700">
                <RefreshCw className="w-4 h-4 mr-2" />
                {retryText}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }
);

ErrorState.displayName = "ErrorState";
