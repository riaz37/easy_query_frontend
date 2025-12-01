"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface ToggleProps {
  checked: boolean;
  onToggle: (checked: boolean) => void;
  label?: string;
  labelPosition?: "left" | "right";
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  labelClassName?: string;
  id?: string;
}

export function Toggle({
  checked,
  onToggle,
  label,
  labelPosition = "left",
  disabled = false,
  size = "md",
  className = "",
  labelClassName = "",
  id,
}: ToggleProps) {
  const toggleId = id || `toggle-${Math.random().toString(36).substr(2, 9)}`;

  const sizeClasses = {
    sm: "h-5 w-9",
    md: "h-6 w-11", 
    lg: "h-7 w-12"
  };

  const thumbSizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5"
  };

  const translateClasses = {
    sm: checked ? "translate-x-5" : "translate-x-1",
    md: checked ? "translate-x-6" : "translate-x-1", 
    lg: checked ? "translate-x-6" : "translate-x-1"
  };

  const toggleElement = (
    <button
      id={toggleId}
      onClick={() => !disabled && onToggle(!checked)}
      disabled={disabled}
      className={cn(
        "relative inline-flex items-center transition-colors rounded-full disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer",
        sizeClasses[size],
        className
      )}
      style={{
        backgroundColor: checked
          ? "rgba(19, 245, 132, 0.3)"
          : "var(--white-12, rgba(255, 255, 255, 0.12))",
        backdropFilter: "blur(29.09090805053711px)",
      }}
    >
      <span
        className={cn(
          "inline-block transform transition-transform rounded-full",
          thumbSizeClasses[size],
          translateClasses[size]
        )}
        style={{
          backgroundColor: "var(--primary-light, rgba(158, 251, 205, 1))",
        }}
      />
    </button>
  );

  if (!label) {
    return toggleElement;
  }

  return (
    <div className={cn("flex items-center gap-3", labelPosition === "right" && "flex-row-reverse")}>
      {labelPosition === "left" && (
        <Label 
          htmlFor={toggleId} 
          className={cn("text-white font-medium text-sm cursor-pointer", labelClassName)}
        >
          {label}
        </Label>
      )}
      {toggleElement}
      {labelPosition === "right" && (
        <Label 
          htmlFor={toggleId} 
          className={cn("text-white font-medium text-sm cursor-pointer", labelClassName)}
        >
          {label}
        </Label>
      )}
    </div>
  );
}

// Export a specialized version for the user configuration page
export function UserConfigToggle({
  checked,
  onToggle,
  label,
  disabled = false,
  className = "",
}: Omit<ToggleProps, "size" | "labelPosition">) {
  return (
    <div className={cn("flex items-center justify-center gap-3", className)}>
      <span className="text-white font-medium text-sm lg:text-base">{label}</span>
      <Toggle
        checked={checked}
        onToggle={onToggle}
        disabled={disabled}
        size="md"
      />
    </div>
  );
}

// Export a specialized version for query pages
export function QueryToggle({
  checked,
  onToggle,
  label,
  disabled = false,
  className = "",
}: Omit<ToggleProps, "size" | "labelPosition">) {
  return (
    <div className={cn("flex items-center gap-3 max-sm:gap-2 sm:gap-3 mb-6", className)}>
      <Toggle
        checked={checked}
        onToggle={onToggle}
        label={label}
        disabled={disabled}
        size="md"
        labelPosition="left"
      />
    </div>
  );
}

// Export a specialized version for activity section toggles
export function ActivityToggle({
  checked,
  onToggle,
  label,
  disabled = false,
  className = "",
}: Omit<ToggleProps, "size" | "labelPosition">) {
  return (
    <div className={cn("flex items-center justify-between gap-4", className)}>
      <span className="text-white text-sm lg:text-base">{label}</span>
      <Toggle
        checked={checked}
        onToggle={onToggle}
        disabled={disabled}
        size="md"
      />
    </div>
  );
}
