"use client";

import React, { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Trash2, Save, Database, XIcon } from "lucide-react";

// Define local interface to match API payload structure
interface TableColumn {
  name: string;
  data_type: string;
  nullable: boolean;
  is_primary: boolean;
  is_identity: boolean;
}

interface CreateTableModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tableName: string;
  setTableName: (name: string) => void;
  schema: string;
  setSchema: (schema: string) => void;
  columns: TableColumn[];
  dataTypes: any;
  loading: boolean;
  onAddColumn: () => void;
  onUpdateColumn: (index: number, field: keyof TableColumn, value: any) => void;
  onRemoveColumn: (index: number) => void;
  onGetDataTypeOptions: () => React.ReactNode;
  onSubmit: (modalData: {
    tableName: string;
    schema: string;
    columns: TableColumn[];
  }) => void;
}

export function CreateTableModal({
  open,
  onOpenChange,
  tableName,
  setTableName,
  schema,
  setSchema,
  columns,
  dataTypes,
  loading,
  onAddColumn,
  onUpdateColumn,
  onRemoveColumn,
  onGetDataTypeOptions,
  onSubmit,
}: CreateTableModalProps) {
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = () => {
    setLocalError(null);
    
    // Validate table name
    if (!tableName.trim()) {
      setLocalError("Table name is required");
      return;
    }
    
    // Validate schema
    if (!schema.trim()) {
      setLocalError("Schema is required");
      return;
    }
    
    // Validate columns
    const columnErrors: string[] = [];
    columns.forEach((column, index) => {
      if (!column.name.trim()) {
        columnErrors.push(`Column ${index + 1}: name is required`);
      }
      if (!column.data_type.trim()) {
        columnErrors.push(`Column ${index + 1}: data type is required`);
      }
      const validationError = validateColumnData(column);
      if (validationError) {
        columnErrors.push(`Column ${index + 1}: ${validationError}`);
      }
    });
    
    if (columnErrors.length > 0) {
      setLocalError(columnErrors[0]); // Show first error
      return;
    }
    
    onSubmit({ tableName, schema, columns });
  };

  const validateColumnName = (name: string): string | null => {
    if (!name.trim()) {
      return "Column name is required";
    }

    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
      return "Column name must start with a letter or underscore and contain only letters, numbers, and underscores";
    }

    return null;
  };

  const validateColumnData = (column: TableColumn): string | null => {
    // Check if data type requires length but doesn't have it
    const requiresLength = ['VARCHAR', 'NVARCHAR', 'CHAR', 'NCHAR', 'BINARY', 'VARBINARY'];
    const dataTypeUpper = column.data_type.toUpperCase();
    const needsLength = requiresLength.some(type => dataTypeUpper.startsWith(type));
    
    if (needsLength && !column.data_type.includes('(')) {
      return `${column.data_type} requires a length specification (e.g., ${column.data_type}(50))`;
    }

    // Check identity column compatibility
    if (
      column.is_identity &&
      !dataTypeUpper.match(/^(INT|BIGINT|SMALLINT|TINYINT|DECIMAL|NUMERIC|FLOAT|REAL)/)
    ) {
      return `Identity columns can only be used with numeric data types (INT, BIGINT, DECIMAL, etc.), not with ${column.data_type}`;
    }

    return null;
  };

  const handleColumnValidation = (
    index: number,
    field: keyof TableColumn,
    value: any
  ) => {
    onUpdateColumn(index, field, value);

    if (field === "name") {
      const nameError = validateColumnName(value);
      if (nameError) {
        setLocalError(`Column ${index + 1}: ${nameError}`);
      } else {
        setLocalError(null);
      }
    } else if (field === "data_type" || field === "is_identity") {
      const column = { ...columns[index], [field]: value };
      const dataError = validateColumnData(column);
      if (dataError) {
        setLocalError(`Column ${index + 1}: ${dataError}`);
      } else {
        setLocalError(null);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="p-0 border-0 bg-transparent modal-lg"
        showCloseButton={false}
      >
        <div className="modal-enhanced">
          <div className="modal-content-enhanced">
            <DialogHeader className="modal-header-enhanced px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-2 sm:pb-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <DialogTitle className="modal-title-enhanced text-lg sm:text-xl flex items-center gap-2">
                    Create New Table
                  </DialogTitle>
                  <p className="modal-description-enhanced text-xs sm:text-sm">
                    Define your table structure with columns and data types
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
              {/* Error Alert */}
              {localError && (
                <Alert variant="destructive" className="mb-6">
                  <AlertDescription>{localError}</AlertDescription>
                </Alert>
              )}

              {/* Table Basic Info */}
              <div className="modal-form-group">
                <div className="modal-form-grid-responsive">
                  <div>
                    <Label className="modal-form-label">Table Name</Label>
                    <Input
                      className="modal-input-enhanced"
                      value={tableName}
                      onChange={(e) => setTableName(e.target.value)}
                      placeholder="Enter table name"
                    />
                  </div>
                  <div>
                    <Label className="modal-form-label">Schema</Label>
                    <Input
                      className="modal-input-enhanced"
                      value={schema}
                      onChange={(e) => setSchema(e.target.value)}
                      placeholder="Enter schema name"
                    />
                  </div>
                </div>
              </div>

              {/* Column Management Section */}
              <div className="mb-6">
                <div className="mb-4">
                  <h3 className="modal-title-enhanced">Column List</h3>
                </div>

                <div className="modal-table-responsive">
                  <div className="rounded-t-xl overflow-hidden">
                    <Table className="w-full">
                      <TableHeader className="[&>tr]:border-b-0">
                        <TableRow className="bg-slate-700/8">
                          <TableHead className="px-4 py-4 text-left rounded-tl-xl w-[30%] min-w-[200px]">
                            <span className="text-white font-medium text-sm">
                              Column Name
                            </span>
                          </TableHead>
                          <TableHead className="px-4 py-4 text-left w-[20%] min-w-[150px]">
                            <span className="text-white font-medium text-sm">
                              Data Type
                            </span>
                          </TableHead>
                          <TableHead className="px-3 py-4 text-center w-[12%] min-w-[100px]">
                            <span className="text-white font-medium text-sm">
                              Nullable
                            </span>
                          </TableHead>
                          <TableHead className="px-3 py-4 text-center w-[12%] min-w-[100px]">
                            <span className="text-white font-medium text-sm">
                              Primary Key
                            </span>
                          </TableHead>
                          <TableHead className="px-3 py-4 text-center w-[12%] min-w-[100px]">
                            <span className="text-white font-medium text-sm">
                              Identity
                            </span>
                          </TableHead>
                          <TableHead className="px-3 py-4 text-center rounded-tr-xl w-[14%] min-w-[120px]">
                            <span className="text-white font-medium text-sm">
                              Actions
                            </span>
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {columns.map((column, index) => (
                          <TableRow key={index} className="border-slate-600/30">
                            <TableCell className="text-white py-3 px-4 w-[30%] min-w-[200px]">
                              <Input
                                className="tables-modal-input text-sm text-white placeholder-slate-400 focus:border-green-400/50 focus:ring-green-400/20 rounded-lg w-full"
                                value={column.name}
                                onChange={(e) =>
                                  handleColumnValidation(
                                    index,
                                    "name",
                                    e.target.value
                                  )
                                }
                                placeholder="Column Name"
                              />
                            </TableCell>
                            <TableCell className="text-white py-3 px-4 w-[20%] min-w-[150px]">
                              <Select
                                value={column.data_type}
                                onValueChange={(value) =>
                                  handleColumnValidation(
                                    index,
                                    "data_type",
                                    value
                                  )
                                }
                              >
                                <SelectTrigger
                                  className="modal-select-enhanced text-sm text-white w-full h-10 tables-modal-input"
                                >
                                  <SelectValue placeholder="Select data type" />
                                </SelectTrigger>
                                <SelectContent className="modal-select-content-enhanced">
                                  {/* String Types */}
                                  <SelectItem
                                    value="VARCHAR(50)"
                                    className="dropdown-item"
                                  >
                                    VARCHAR(50)
                                  </SelectItem>
                                  <SelectItem
                                    value="VARCHAR(100)"
                                    className="dropdown-item"
                                  >
                                    VARCHAR(100)
                                  </SelectItem>
                                  <SelectItem
                                    value="VARCHAR(255)"
                                    className="dropdown-item"
                                  >
                                    VARCHAR(255)
                                  </SelectItem>
                                  <SelectItem
                                    value="NVARCHAR(50)"
                                    className="dropdown-item"
                                  >
                                    NVARCHAR(50)
                                  </SelectItem>
                                  <SelectItem
                                    value="NVARCHAR(100)"
                                    className="dropdown-item"
                                  >
                                    NVARCHAR(100)
                                  </SelectItem>
                                  <SelectItem
                                    value="NVARCHAR(255)"
                                    className="dropdown-item"
                                  >
                                    NVARCHAR(255)
                                  </SelectItem>
                                  <SelectItem
                                    value="CHAR(10)"
                                    className="dropdown-item"
                                  >
                                    CHAR(10)
                                  </SelectItem>
                                  <SelectItem
                                    value="NCHAR(10)"
                                    className="dropdown-item"
                                  >
                                    NCHAR(10)
                                  </SelectItem>
                                  <SelectItem
                                    value="TEXT"
                                    className="dropdown-item"
                                  >
                                    TEXT
                                  </SelectItem>
                                  <SelectItem
                                    value="NTEXT"
                                    className="dropdown-item"
                                  >
                                    NTEXT
                                  </SelectItem>
                                  {/* Numeric Types */}
                                  <SelectItem
                                    value="BIT"
                                    className="dropdown-item"
                                  >
                                    BIT
                                  </SelectItem>
                                  <SelectItem
                                    value="TINYINT"
                                    className="dropdown-item"
                                  >
                                    TINYINT
                                  </SelectItem>
                                  <SelectItem
                                    value="SMALLINT"
                                    className="dropdown-item"
                                  >
                                    SMALLINT
                                  </SelectItem>
                                  <SelectItem
                                    value="INT"
                                    className="dropdown-item"
                                  >
                                    INT
                                  </SelectItem>
                                  <SelectItem
                                    value="BIGINT"
                                    className="dropdown-item"
                                  >
                                    BIGINT
                                  </SelectItem>
                                  <SelectItem
                                    value="DECIMAL(18,2)"
                                    className="dropdown-item"
                                  >
                                    DECIMAL(18,2)
                                  </SelectItem>
                                  <SelectItem
                                    value="NUMERIC(18,2)"
                                    className="dropdown-item"
                                  >
                                    NUMERIC(18,2)
                                  </SelectItem>
                                  <SelectItem
                                    value="FLOAT"
                                    className="dropdown-item"
                                  >
                                    FLOAT
                                  </SelectItem>
                                  <SelectItem
                                    value="REAL"
                                    className="dropdown-item"
                                  >
                                    REAL
                                  </SelectItem>
                                  <SelectItem
                                    value="MONEY"
                                    className="dropdown-item"
                                  >
                                    MONEY
                                  </SelectItem>
                                  <SelectItem
                                    value="SMALLMONEY"
                                    className="dropdown-item"
                                  >
                                    SMALLMONEY
                                  </SelectItem>
                                  {/* Date/Time Types */}
                                  <SelectItem
                                    value="DATE"
                                    className="dropdown-item"
                                  >
                                    DATE
                                  </SelectItem>
                                  <SelectItem
                                    value="TIME"
                                    className="dropdown-item"
                                  >
                                    TIME
                                  </SelectItem>
                                  <SelectItem
                                    value="SMALLDATETIME"
                                    className="dropdown-item"
                                  >
                                    SMALLDATETIME
                                  </SelectItem>
                                  <SelectItem
                                    value="DATETIME"
                                    className="dropdown-item"
                                  >
                                    DATETIME
                                  </SelectItem>
                                  <SelectItem
                                    value="DATETIME2"
                                    className="dropdown-item"
                                  >
                                    DATETIME2
                                  </SelectItem>
                                  <SelectItem
                                    value="DATETIMEOFFSET"
                                    className="dropdown-item"
                                  >
                                    DATETIMEOFFSET
                                  </SelectItem>
                                  {/* Binary Types */}
                                  <SelectItem
                                    value="BINARY(50)"
                                    className="dropdown-item"
                                  >
                                    BINARY(50)
                                  </SelectItem>
                                  <SelectItem
                                    value="VARBINARY(50)"
                                    className="dropdown-item"
                                  >
                                    VARBINARY(50)
                                  </SelectItem>
                                  <SelectItem
                                    value="IMAGE"
                                    className="dropdown-item"
                                  >
                                    IMAGE
                                  </SelectItem>
                                  {/* Other Types */}
                                  <SelectItem
                                    value="UNIQUEIDENTIFIER"
                                    className="dropdown-item"
                                  >
                                    UNIQUEIDENTIFIER
                                  </SelectItem>
                                  <SelectItem
                                    value="XML"
                                    className="dropdown-item"
                                  >
                                    XML
                                  </SelectItem>
                                  <SelectItem
                                    value="SQL_VARIANT"
                                    className="dropdown-item"
                                  >
                                    SQL_VARIANT
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell className="text-white py-3 px-3 text-center w-[12%] min-w-[100px]">
                              <div className="flex items-center justify-center space-x-1">
                                <Checkbox
                                  id={`nullable-${index}`}
                                  checked={column.nullable}
                                  onCheckedChange={(checked) =>
                                    onUpdateColumn(index, "nullable", checked)
                                  }
                                  className={`${
                                    column.nullable
                                      ? "bg-green-400 border-green-400"
                                      : "bg-transparent border-slate-500"
                                  } border`}
                                />
                                <Label
                                  htmlFor={`nullable-${index}`}
                                  className="text-xs font-medium text-white cursor-pointer"
                                >
                                  {column.nullable ? "Yes" : "No"}
                                </Label>
                              </div>
                            </TableCell>
                            <TableCell className="text-white py-3 px-3 text-center w-[12%] min-w-[100px]">
                              <div className="flex items-center justify-center space-x-1">
                                <Checkbox
                                  id={`primary-${index}`}
                                  checked={column.is_primary}
                                  onCheckedChange={(checked) =>
                                    onUpdateColumn(index, "is_primary", checked)
                                  }
                                  className={`${
                                    column.is_primary
                                      ? "bg-green-400 border-green-400"
                                      : "bg-transparent border-slate-500"
                                  } border`}
                                />
                                <Label
                                  htmlFor={`primary-${index}`}
                                  className="text-xs font-medium text-white cursor-pointer"
                                >
                                  {column.is_primary ? "Yes" : "No"}
                                </Label>
                              </div>
                            </TableCell>
                            <TableCell className="text-white py-3 px-3 text-center w-[12%] min-w-[100px]">
                              <div className="flex items-center justify-center space-x-1">
                                <Checkbox
                                  id={`identity-${index}`}
                                  checked={column.is_identity}
                                  onCheckedChange={(checked) =>
                                    handleColumnValidation(
                                      index,
                                      "is_identity",
                                      checked
                                    )
                                  }
                                  className={`${
                                    column.is_identity
                                      ? "bg-green-400 border-green-400"
                                      : "bg-transparent border-slate-500"
                                  } border`}
                                />
                                <Label
                                  htmlFor={`identity-${index}`}
                                  className="text-xs font-medium text-white cursor-pointer"
                                >
                                  {column.is_identity ? "Yes" : "No"}
                                </Label>
                              </div>
                            </TableCell>
                            <TableCell className="text-white py-3 px-3 text-center w-[14%] min-w-[120px]">
                              <Button
                                onClick={() => onRemoveColumn(index)}
                                size="sm"
                                disabled={columns.length === 1}
                                className="modal-button-primary h-8 px-3 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Remove
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Add Column Button */}
                <div className="mt-4 flex justify-start">
                  <Button
                    onClick={onAddColumn}
                    className="modal-button-primary"
                  >
                    Add Column
                  </Button>
                </div>
              </div>

              {/* Submit Button */}
              <div className="modal-button-group-responsive">
                <Button
                  onClick={handleSubmit}
                  disabled={loading || !tableName.trim()}
                  className="modal-button-primary"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Creating Table...
                    </>
                  ) : (
                    <>Create Table</>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
