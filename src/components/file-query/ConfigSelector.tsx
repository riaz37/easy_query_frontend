"use client";

import React from "react";
import { useFileConfigContext } from "@/components/providers";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { FileText } from "lucide-react";

export function ConfigSelector() {
  const {
    availableConfigs,
    currentConfigId,
    setCurrentConfig,
    isLoading,
  } = useFileConfigContext();

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          File Config
        </Label>
        <Select disabled>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Loading configs..." />
          </SelectTrigger>
        </Select>
      </div>
    );
  }

  if (availableConfigs.length === 0) {
    return (
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          File Config
        </Label>
        <Select disabled>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="No configs available" />
          </SelectTrigger>
        </Select>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        <FileText className="h-4 w-4" />
        File Config
      </Label>
      <Select
        value={currentConfigId?.toString() || ""}
        onValueChange={(value) => {
          const configId = parseInt(value, 10);
          const config = availableConfigs.find((c) => c.config_id === configId);
          setCurrentConfig(configId, config?.config_name);
        }}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a config" />
        </SelectTrigger>
        <SelectContent>
          {availableConfigs.map((config) => (
            <SelectItem
              key={config.config_id}
              value={config.config_id.toString()}
            >
              {config.config_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}


