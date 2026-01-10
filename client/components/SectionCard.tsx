import React, { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionCardProps {
  title?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
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
 */
export const SectionCard: React.FC<SectionCardProps> = ({
  title,
  actions,
  children,
  className,
}) => {
  return (
    <div
      className={cn(
        "flex flex-col w-full px-4 py-4 bg-[#f9f9f9] border border-[#e5e5e5] rounded-lg shadow-sm font-['Geist',sans-serif]",
        className,
      )}
    >
      {/* Header (optional) */}
      {(title || actions) && (
        <div className="flex items-center justify-between gap-10 w-full flex-wrap">
          {title && (
            <div className="text-base text-[#303030] font-medium">{title}</div>
          )}
          {actions && <div className="flex items-center gap-3">{actions}</div>}
        </div>
      )}

      {/* Content */}
      <div className={title || actions ? "mt-4 w-full" : "w-full"}>
        {children}
      </div>
    </div>
  );
};

export default SectionCard;
