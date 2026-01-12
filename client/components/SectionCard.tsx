import React, { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionCardProps {
  title?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  padding?: "default" | "compact" | "none";
  variant?: "default" | "gray" | "white";
}

/**
 * SectionCard
 *
 * Reusable card wrapper for task detail sections.
 * Provides consistent styling: padding, border, radius, and header layout.
 *
 * Props:
 * - title?: Optional section heading (left-aligned). Omit to render content only.
 * - actions?: Optional action buttons/elements (right-aligned)
 * - children: Card content
 * - className?: Additional Tailwind classes
 * - padding?: Control padding: "default" (px-4 py-4), "compact" (none), "none" (p-0)
 */
export const SectionCard: React.FC<SectionCardProps> = ({
  title,
  actions,
  children,
  className,
  padding = "default",
  variant = "default",
}) => {
  const paddingClass = {
    default: "p-4",
    compact: "p-0",
    none: "p-0",
  }[padding];

  const variantClasses = {
    default: "bg-[#f9f9f9] border border-[#e5e5e5]",
    gray: "bg-[#f3f3f3] border border-[#e5e5e5]",
    white: "bg-white border border-[#e5e5e5]",
  }[variant];

  return (
    <div
      className={cn(
        "flex flex-col w-full rounded-lg shadow-sm font-['Geist',sans-serif]",
        variantClasses,
        paddingClass,
        className,
      )}
    >
      {/* Header (optional) */}
      {(title || actions) && (
        <div className={cn("flex items-center justify-between gap-10 w-full flex-wrap", padding === "compact" && "px-4 pt-4")}>
          {title && (
            <div className="text-base text-[#303030] font-medium">{title}</div>
          )}
          {actions && <div className="flex items-center gap-3">{actions}</div>}
        </div>
      )}

      {/* Content */}
      <div className={cn(title || actions ? "mt-4 w-full" : "w-full", padding === "compact" && "mt-0")}>
        {children}
      </div>
    </div>
  );
};

export default SectionCard;
