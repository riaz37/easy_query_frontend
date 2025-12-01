"use client";

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
  isLoading?: boolean;
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  isLoading = false,
}: ConfirmationDialogProps) {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="toast-enhanced" style={{
        background: "linear-gradient(0deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.03)), linear-gradient(246.02deg, rgba(19, 245, 132, 0) 91.9%, rgba(19, 245, 132, 0.2) 114.38%), linear-gradient(59.16deg, rgba(19, 245, 132, 0) 71.78%, rgba(19, 245, 132, 0.2) 124.92%)",
        backdropFilter: "blur(20px) saturate(1.2)",
        border: "1px solid rgba(19, 245, 132, 0.2)",
        borderRadius: "16px",
        color: "white",
        boxShadow: "0 8px 25px rgba(0, 0, 0, 0.3), 0 0 20px rgba(19, 245, 132, 0.1)",
        padding: "16px 20px",
        minWidth: "300px",
        maxWidth: "400px",
        fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
        fontWeight: "500",
        lineHeight: "1.5",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
      }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-4 h-4 rounded-full flex items-center justify-center",
              variant === 'destructive' 
                ? "bg-red-500/20 text-red-400" 
                : "bg-primary/20 text-primary"
            )}>
              <AlertTriangle className="w-2.5 h-2.5" />
            </div>
            <h3 className="text-sm font-semibold text-white">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-md hover:bg-white/10 transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </div>

        {/* Content */}
        <div className="mb-4">
          <p className="text-sm text-white/80 leading-relaxed whitespace-pre-line">
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2">
          <Button
            onClick={onClose}
            disabled={isLoading}
            variant="outline"
            size="sm"
            className="modal-button-cancel"
            style={{
              borderRadius: "99px",
            }}
          >
            {cancelText}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading}
            variant={variant === 'destructive' ? 'destructive' : 'default'}
            size="sm"
            className="modal-button-confirm"
            style={variant === 'destructive' ? {
              background: "var(--error-8, rgba(255, 86, 48, 0.08))",
              color: "var(--error-main, rgba(255, 86, 48, 1))",
              border: "1px solid var(--error-16, rgba(255, 86, 48, 0.16))",
              borderRadius: "99px",
            } : undefined}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>Processing...</span>
              </div>
            ) : (
              confirmText
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
