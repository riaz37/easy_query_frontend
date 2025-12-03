"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export interface EmptyStateProps {
  /** Icon to display (can be a Lucide icon or any React node) */
  icon?: React.ReactNode | LucideIcon;
  /** Main title text */
  title: string;
  /** Descriptive text below the title */
  description?: string;
  /** Text for the action button */
  actionLabel?: string;
  /** Function to call when action button is clicked */
  onAction?: () => void;
  /** Additional CSS classes for the container */
  className?: string;
  /** Size variant for the empty state */
  size?: "sm" | "md" | "lg";
  /** Style variant */
  variant?: "default" | "card" | "minimal" | "dashed";
  /** Whether to show the action button */
  showAction?: boolean;
  /** Custom icon size */
  iconSize?: "sm" | "md" | "lg";
  /** Whether to center the content */
  centered?: boolean;
}

const sizeConfig = {
  sm: {
    container: "py-8",
    icon: "w-12 h-12",
    title: "text-base font-semibold",
    description: "text-sm",
    button: "text-sm px-4 py-2",
    spacing: "mb-3"
  },
  md: {
    container: "py-12",
    icon: "w-16 h-16",
    title: "text-lg font-semibold",
    description: "text-base",
    button: "text-sm px-6 py-2",
    spacing: "mb-4"
  },
  lg: {
    container: "py-16",
    icon: "w-20 h-20",
    title: "text-xl font-semibold",
    description: "text-lg",
    button: "text-base px-8 py-3",
    spacing: "mb-6"
  }
};

const iconSizeConfig = {
  sm: "w-6 h-6",
  md: "w-8 h-8",
  lg: "w-10 h-10"
};

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
  size = "md",
  variant = "default",
  showAction = true,
  iconSize = "md",
  centered = true
}: EmptyStateProps) {
  const config = sizeConfig[size];
  const iconConfig = iconSizeConfig[iconSize];

  const renderIcon = () => {
    if (!icon) return null;

    // If icon is a LucideIcon component, render it with proper props
    if (typeof icon === "function") {
      const IconComponent = icon as LucideIcon;
      return (
        <div className={cn(
          "flex justify-center items-center rounded-full",
          config.icon,
          "bg-emerald-500/10 text-emerald-400"
        )}>
          <IconComponent className={iconConfig} />
        </div>
      );
    }

    // If icon is a React element, render it directly
    if (React.isValidElement(icon)) {
      return (
        <div className={cn(
          "flex justify-center items-center",
          config.icon
        )}>
          {icon}
        </div>
      );
    }

    // If icon is neither a function nor a valid element, return null
    return null;
  };

  const renderContent = () => (
    <>
      {renderIcon()}
      <h3 className={cn(
        config.title,
        config.spacing,
        "text-white"
      )}>
        {title}
      </h3>
      {description && (
        <p className={cn(
          config.description,
          "mb-4 max-w-md",
          "text-gray-300"
        )}>
          {description}
        </p>
      )}
      {showAction && actionLabel && onAction && (
        <Button 
          onClick={onAction} 
          className={cn(
            config.button,
            "card-button-enhanced"
          )}
        >
          {actionLabel}
        </Button>
      )}
    </>
  );

  if (variant === "minimal") {
    return (
      <div className={cn(
        "text-center",
        config.container,
        centered && "flex items-center justify-center min-h-[200px]",
        className
      )}>
        {renderContent()}
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div className={cn(
        "flex items-center justify-center",
        centered && "min-h-[300px]",
        className
      )}>
        <Card className={cn(
          "w-full max-w-md",
          "bg-gray-500/10 border-gray-500/20"
        )}>
          <CardContent className={cn(
            "text-center",
            config.container
          )}>
            {renderContent()}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (variant === "dashed") {
    return (
      <div className={cn(
        "flex items-center justify-center",
        centered && "min-h-[400px]",
        className
      )}>
        <Card className={cn(
          "w-96 border-dashed border-2 bg-transparent transition-all duration-300",
          "border-emerald-400/30 hover:border-emerald-400/50"
        )}>
          <CardContent className={cn(
            "flex flex-col items-center justify-center text-center",
            config.container
          )}>
            {renderContent()}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Default variant
  return (
    <div className={cn(
      "text-center",
      config.container,
      centered && "flex items-center justify-center min-h-[200px]",
      className
    )}>
      {renderContent()}
    </div>
  );
}

// Convenience components for common use cases
export function EmptyStateMinimal(props: Omit<EmptyStateProps, "variant">) {
  return <EmptyState {...props} variant="minimal" />;
}

export function EmptyStateCard(props: Omit<EmptyStateProps, "variant">) {
  return <EmptyState {...props} variant="card" />;
}

export function EmptyStateDashed(props: Omit<EmptyStateProps, "variant">) {
  return <EmptyState {...props} variant="dashed" />;
}

// Preset components for common scenarios
export function EmptyStateWithAction({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  ...props
}: Omit<EmptyStateProps, "showAction">) {
  return (
    <EmptyState
      {...props}
      icon={icon}
      title={title}
      description={description}
      actionLabel={actionLabel}
      onAction={onAction}
      showAction={true}
    />
  );
}

export function EmptyStateReadOnly({
  icon,
  title,
  description,
  ...props
}: Omit<EmptyStateProps, "showAction" | "actionLabel" | "onAction">) {
  return (
    <EmptyState
      {...props}
      icon={icon}
      title={title}
      description={description}
      showAction={false}
    />
  );
}
