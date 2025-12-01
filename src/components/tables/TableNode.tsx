"use client";

import React, { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { Database, Users, FileText, DollarSign, Calendar, Settings, Folder, Link } from "lucide-react";

interface TableNodeData {
  table: {
    name: string;
    full_name: string;
    columns?: any[];
    relationships?: any[];
  };
  label: string;
}

// Get appropriate icon based on table name
const getTableIcon = (tableName: string) => {
  const name = tableName.toLowerCase();
  if (name.includes('user') || name.includes('employee') || name.includes('person')) {
    return Users;
  }
  if (name.includes('transaction') || name.includes('payment') || name.includes('salary') || name.includes('expense')) {
    return DollarSign;
  }
  if (name.includes('report') || name.includes('document') || name.includes('file')) {
    return FileText;
  }
  if (name.includes('attendance') || name.includes('time') || name.includes('date')) {
    return Calendar;
  }
  if (name.includes('config') || name.includes('setting') || name.includes('permission')) {
    return Settings;
  }
  if (name.includes('project') || name.includes('department') || name.includes('company')) {
    return Folder;
  }
  return Database;
};

// Unified color scheme for all tables with query-content-gradient
const getTableColors = () => {
  return {
    icon: 'text-emerald-400',
    title: 'text-white',
    subtitle: 'text-gray-300',
    relationships: 'text-gray-300',
    dots: 'bg-emerald-400'
  };
};

export const TableNode = memo(({ data }: NodeProps<TableNodeData>) => {
  const { table, label } = data;
  const Icon = getTableIcon(table.name);
  const colors = getTableColors();

  return (
    <div className="relative group">
      {/* Connection handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-emerald-400 border-2 border-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-emerald-400 border-2 border-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity"
      />

      {/* Enhanced table card */}
      <div className="table-node-container">
        {/* Corner border effect */}
        <div className="table-node-border"></div>
        {/* Header with icon and title */}
        <div className="table-node-header">
          <div className="table-node-icon">
            <Icon />
          </div>
          <div className="table-node-content">
            <h3 className="table-node-title">
              {label}
            </h3>
            <p className="table-node-subtitle">
              {table.full_name}
            </p>
          </div>
        </div>

        {/* Column indicators */}
        <div className="table-node-relationships">
          <div className="table-node-dots">
            {Array.from({ length: Math.min(table.columns?.length || 0, 10) }).map((_, i) => (
              <div key={i} className="table-node-dot" />
            ))}
          </div>
          <span>
            {table.columns?.length || 0} columns
          </span>
        </div>

        {/* Relationship indicator */}
        {table.relationships && table.relationships.length > 0 && (
          <div className="table-node-relationships">
            <Link className="h-4 w-4 text-emerald-400" />
            <span>
              {table.relationships.length} relationship{table.relationships.length > 1 ? 's' : ''}
            </span>
          </div>
        )}

        {/* No relationships indicator */}
        {(!table.relationships || table.relationships.length === 0) && (
          <div className="table-node-relationships">
            <div className="w-4 h-4 bg-gray-500/60 rounded-full" />
            <span>
              Isolated table
            </span>
          </div>
        )}
      </div>
    </div>
  );
});

TableNode.displayName = "TableNode";