import React from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string | React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  actionButton?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  moreOptions?: {
    onView?: () => void;
    onDelete?: () => void;
  };
}

/**
 * PageHeader - Reusable header template for pages
 *
 * Standardizes the page header layout with:
 * - Left side: Title and optional subtitle
 * - Right side: Optional action button or actionButton
 *
 * @param title - Main page title
 * @param subtitle - Optional subtitle or description (can be ReactNode)
 * @param action - Optional action button config (deprecated, use actionButton)
 * @param actionButton - Optional primary action button on the right
 * @param moreOptions - Optional menu options
 *
 * Example:
 * ```tsx
 * <PageHeader
 *   title="Work Orders"
 *   subtitle="All your work orders, in one place"
 *   actionButton={{
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
  actionButton,
  moreOptions,
  onBack,
}) => {
  return (
    <div className="flex items-center gap-10 justify-between flex-wrap">
      {/* Back button and Title Container */}
      <div className="flex items-start gap-3 min-w-0">
        {onBack && (
          <button
            onClick={onBack}
            className="flex-shrink-0 p-2 hover:bg-gray-100 rounded-lg transition-colors mt-1"
            aria-label="Go back"
            type="button"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12.5 15.8334L4.16667 7.50008L12.5 -0.833251"
                stroke="#303030"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
        {/* Title and Description */}
        <div className="flex flex-col gap-1 min-w-0">
          <h1 className="text-[#303030] font-semibold text-2xl leading-[30px] truncate">
            {title}
          </h1>
          {subtitle && (
            typeof subtitle === 'string' ? (
              <span
                className="text-[#717179] font-medium text-base leading-4 block"
                style={{ marginTop: "4px" }}
              >
                {subtitle}
              </span>
            ) : (
              <div style={{ marginTop: "4px" }}>
                {subtitle}
              </div>
            )
          )}
        </div>
      </div>

      {/* Action Button */}
      {(actionButton || action) && (
        <div className="flex items-center gap-4">
          <button
            onClick={(actionButton || action)!.onClick}
            className={`flex h-9 items-center gap-2 px-3 rounded-lg border border-white transition-colors ${
              actionButton
                ? "bg-[#2463eb] shadow-[0_0_0_1px_#1e4fb0] hover:bg-[#1a52c4]"
                : "bg-[#013764] shadow-[0_0_0_1px_#002D5A] hover:bg-[#003a73]"
            }`}
          >
            {(actionButton || action)!.icon && <div className="text-white">{(actionButton || action)!.icon}</div>}
            <span className="text-white font-medium text-base leading-normal">
              {(actionButton || action)!.label}
            </span>
          </button>
        </div>
      )}
    </div>
  );
};

PageHeader.displayName = "PageHeader";

export default PageHeader;
