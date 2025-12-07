"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { XIcon } from "lucide-react";

export interface VectorDBConfigFormData {
  DB_HOST: string;
  DB_PORT: number;
  DB_NAME: string;
  DB_USER: string;
  DB_PASSWORD: string;
  schema: string;
}

interface VectorDBConfigFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isEditMode?: boolean;
  initialData?: Partial<VectorDBConfigFormData>;
  onSubmit: (data: VectorDBConfigFormData) => Promise<void>;
  isSubmitting?: boolean;
}

export function VectorDBConfigFormModal({
  open,
  onOpenChange,
  isEditMode = false,
  initialData,
  onSubmit,
  isSubmitting = false,
}: VectorDBConfigFormModalProps) {
  const [formData, setFormData] = React.useState<Partial<VectorDBConfigFormData>>({
    DB_HOST: "",
    DB_PORT: 5432,
    DB_NAME: "",
    DB_USER: "",
    DB_PASSWORD: "",
    schema: "public",
    ...initialData,
  });

  // Reset form when dialog opens/closes or initialData changes
  React.useEffect(() => {
    if (open) {
      setFormData({
        DB_HOST: "",
        DB_PORT: 5432,
        DB_NAME: "",
        DB_USER: "",
        DB_PASSWORD: "",
        schema: "public",
        ...initialData,
      });
    }
  }, [open, initialData]);

  const handleSubmit = async () => {
    if (
      !formData.DB_NAME ||
      !formData.DB_HOST ||
      !formData.DB_USER ||
      !formData.DB_PASSWORD ||
      !formData.schema
    ) {
      return;
    }

    if (!formData.DB_PORT || formData.DB_PORT <= 0 || formData.DB_PORT > 65535) {
      return;
    }

    await onSubmit(formData as VectorDBConfigFormData);
  };

  const isValid =
    formData.DB_NAME &&
    formData.DB_HOST &&
    formData.DB_USER &&
    formData.DB_PASSWORD &&
    formData.schema &&
    formData.DB_PORT &&
    formData.DB_PORT > 0 &&
    formData.DB_PORT <= 65535;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 border-0 bg-transparent modal-lg" showCloseButton={false}>
        <div className="modal-enhanced">
          <div className="modal-content-enhanced">
            <DialogHeader className="modal-header-enhanced px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-2 sm:pb-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <DialogTitle className="modal-title-enhanced text-lg sm:text-xl flex items-center gap-3 font-barlow">
                    {isEditMode ? "Edit Vector DB Config" : "Add New Vector DB Config"}
                  </DialogTitle>
                  <p className="modal-description-enhanced text-xs sm:text-sm font-public-sans">
                    Configure vector database connection settings.
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
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="dbName" className="text-white font-public-sans">
                    Database Name *
                  </Label>
                  <Input
                    id="dbName"
                    value={formData.DB_NAME || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, DB_NAME: e.target.value })
                    }
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 font-public-sans"
                    placeholder="e.g. vector_db"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="dbHost" className="text-white font-public-sans">
                      Host *
                    </Label>
                    <Input
                      id="dbHost"
                      value={formData.DB_HOST || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, DB_HOST: e.target.value })
                      }
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 font-public-sans"
                      placeholder="localhost"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="dbPort" className="text-white font-public-sans">Port *</Label>
                    <Input
                      id="dbPort"
                      type="number"
                      value={formData.DB_PORT || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          DB_PORT: parseInt(e.target.value) || 0,
                        })
                      }
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 font-public-sans"
                      placeholder="5432"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="dbUser" className="text-white font-public-sans">
                    Username *
                  </Label>
                  <Input
                    id="dbUser"
                    value={formData.DB_USER || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, DB_USER: e.target.value })
                    }
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 font-public-sans"
                    placeholder="postgres"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="dbPassword" className="text-white font-public-sans">
                    Password *
                  </Label>
                  <Input
                    id="dbPassword"
                    type="password"
                    value={formData.DB_PASSWORD || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, DB_PASSWORD: e.target.value })
                    }
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 font-public-sans"
                    placeholder="********"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="schema" className="text-white font-public-sans">
                    Schema *
                  </Label>
                  <Input
                    id="schema"
                    value={formData.schema || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, schema: e.target.value })
                    }
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 font-public-sans"
                    placeholder="public"
                  />
                </div>
              </div>
              <DialogFooter className="px-0 pb-0 pt-4">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="border-white/10 text-white hover:bg-white/5 font-barlow"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !isValid}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-barlow"
                >
                  {isSubmitting
                    ? "Saving..."
                    : isEditMode
                      ? "Update Config"
                      : "Create Config"}
                </Button>
              </DialogFooter>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

