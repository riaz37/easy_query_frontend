"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, RefreshCw } from "lucide-react";

interface SearchBarProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onRefresh?: () => void;
}

export function SearchBar({
  placeholder = "Search...",
  value,
  onChange,
  onRefresh,
}: SearchBarProps) {
  return (
    <div className="flex items-center mb-6">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-gray-500 font-public-sans"
        />
      </div>
      {onRefresh && (
        <Button
          variant="outline"
          size="icon"
          onClick={onRefresh}
          className="ml-2 border-white/10 text-gray-400 hover:text-white hover:bg-white/5"
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}

