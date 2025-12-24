import React from "react";

export interface SubPageHeaderToggle {
  id: string;
  label: string;
  active: boolean;
  onClick: () => void;
}

export interface SubPageHeaderButton {
  id: string;
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  variant?: "primary" | "secondary";
}

interface SubPageHeaderProps {
  toggles?: SubPageHeaderToggle[];
  buttons?: SubPageHeaderButton[];
  children?: React.ReactNode;
}

/**
 * SubPageHeader - Sub-section header with toggles and action buttons
 *
 * Provides a standardized layout for page sub-sections with:
 * - Left side: Optional toggle buttons for filtering/switching views
 * - Right side: Optional action buttons
 * - Can be customized with any number of toggles and buttons
 *
 * @param toggles - Optional array of toggle buttons with state
 * @param buttons - Optional array of action buttons
 * @param children - Optional custom content
 *
 * Example:
 * ```tsx
 * <SubPageHeader
 *   toggles={[
 *     { id: "approved", label: "Approved & Exported Bills", active: true, onClick: () => {} },
 *     { id: "draft", label: "Draft Bills", active: false, onClick: () => {} },
 *   ]}
 *   buttons={[
 *     { id: "sync", label: "Sync", onClick: () => {}, icon: <Sync /> },
 *     { id: "vendor", label: "Add Vendor", onClick: () => {}, icon: <Plus /> },
 *   ]}
 * />
 * ```
 */
export const SubPageHeader: React.FC<SubPageHeaderProps> = ({
  toggles = [],
  buttons = [],
  children,
}) => {
  return (
    <div className="flex items-center gap-4 justify-between flex-wrap">
      {/* Left side: Toggles */}
      {toggles.length > 0 && (
        <div className="flex items-center gap-3">
          {toggles.map((toggle) => (
            <button
              key={toggle.id}
              onClick={toggle.onClick}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                toggle.active
                  ? "bg-[#013764] text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {toggle.label}
            </button>
          ))}
        </div>
      )}

      {/* Custom content */}
      {children}

      {/* Right side: Action buttons */}
      {buttons.length > 0 && (
        <div className="flex items-center gap-3">
          {buttons.map((button) => (
            <button
              key={button.id}
              onClick={button.onClick}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
                button.variant === "primary"
                  ? "bg-[#013764] text-white hover:bg-[#003a73]"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {button.icon && <span>{button.icon}</span>}
              {button.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

SubPageHeader.displayName = "SubPageHeader";
