"use client";

import React from "react";
import { Database, Users } from "lucide-react";

interface VectorDBTabsProps {
  activeTab: "configs" | "user-configs";
  onTabChange: (tab: "configs" | "user-configs") => void;
}

export function VectorDBTabs({ activeTab, onTabChange }: VectorDBTabsProps) {
  return (
    <div className="flex gap-2 mb-6 border-b border-white/10">
      <button
        onClick={() => onTabChange("configs")}
        className={`px-4 py-2 font-barlow transition-colors ${
          activeTab === "configs"
            ? "text-emerald-400 border-b-2 border-emerald-400"
            : "text-gray-400 hover:text-white"
        }`}
      >
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4" />
          Vector DB Configs
        </div>
      </button>
      <button
        onClick={() => onTabChange("user-configs")}
        className={`px-4 py-2 font-barlow transition-colors ${
          activeTab === "user-configs"
            ? "text-emerald-400 border-b-2 border-emerald-400"
            : "text-gray-400 hover:text-white"
        }`}
      >
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4" />
          User Configurations
        </div>
      </button>
    </div>
  );
}

