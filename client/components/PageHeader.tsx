import React from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
    // "danger" (default) keeps the maroon outline used for destructive actions
    // like Deactivate; "neutral" is a clean grey outline for non-destructive
    // secondary actions that should sit quietly beside the primary button.
    variant?: "danger" | "neutral";
  };
}

/**
 * PageHeader - Reusable header template for pages
 *
 * Standardizes the page header layout with:
 * - Left side: Title and optional subtitle
 * - Right side: Optional action button
 *
 * @param title - Main page title
 * @param subtitle - Optional subtitle or description
 * @param action - Optional action button config with label, onClick, and optional icon
 *
 * Example:
 * ```tsx
 * <PageHeader
 *   title="Work Orders"
 *   subtitle="All your work orders, in one place"
 *   action={{
 *     label: "Create Work Order",
 *     onClick: () => setOpen(true),
 *     icon: <Plus className="w-5 h-5" />
 *   }}
 * />
 * ```
 */
export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  action,
  secondaryAction,
}) => {
  return (
    <div className="flex items-center gap-10 justify-between flex-wrap">
      {/* Title and Description */}
      <div className="flex flex-col gap-1 min-w-[240px]">
        <h1 className="text-[#303030] font-semibold text-2xl leading-[30px]">
          {title}
        </h1>
        {subtitle && (
          <span
            className="text-[#717179] font-medium text-base leading-4 block"
            style={{ marginTop: "4px" }}
          >
            {subtitle}
          </span>
        )}
      </div>

      {/* Action Buttons */}
      {(action || secondaryAction) && (
        <div className="flex items-center gap-4">
          {action && (
            <button
              onClick={action.onClick}
              className="flex h-9 items-center gap-2 px-3 rounded-lg border border-white bg-[#013764] shadow-[0_0_0_1px_#002D5A] hover:bg-[#003a73] transition-colors"
            >
              {action.icon && <div className="text-white">{action.icon}</div>}
              <span className="text-white font-medium text-base leading-normal">
                {action.label}
              </span>
            </button>
          )}
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className={
                secondaryAction.variant === "neutral"
                  ? "flex h-9 items-center gap-2 px-3 rounded-lg border border-[#DADADA] bg-white text-[#303030] hover:bg-[#F7F7F8] transition-colors"
                  : "flex h-9 items-center gap-2 px-3 rounded-lg border border-[#982740] bg-white text-[#982740] hover:bg-[#fef2f5] transition-colors"
              }
            >
              {secondaryAction.icon && (
                <div
                  className={
                    secondaryAction.variant === "neutral" ? "text-[#013764]" : "text-[#982740]"
                  }
                >
                  {secondaryAction.icon}
                </div>
              )}
              <span className="font-medium text-base leading-normal">
                {secondaryAction.label}
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

PageHeader.displayName = "PageHeader";

export default PageHeader;
