import React from "react";
import { cn } from "@/lib/utils";

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
  disabled?: boolean;
}

interface SubPageHeaderProps {
  toggles?: SubPageHeaderToggle[];
  buttons?: SubPageHeaderButton[];
  children?: React.ReactNode;
}

/**
 * SubPageHeader - Sub-section header with segmented toggle and action buttons
 *
 * Provides a standardized layout for page sub-sections with:
 * - Left side: Segmented toggle buttons for filtering/switching views
 * - Right side: Action buttons (Add Vendor, Sync, Record Bill, etc.)
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
 *     { id: "approved", label: "Approved", active: true, onClick: () => {} },
 *     { id: "draft", label: "Drafts", active: false, onClick: () => {} },
 *   ]}
 *   buttons={[
 *     { id: "sync", label: "Sync", onClick: () => {}, icon: <RefreshCw /> },
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
    <div className="flex items-center justify-between w-full bg-white gap-6 flex-wrap">
      {/* Left side: Segmented Toggles */}
      {toggles.length > 0 && (
        <div className="flex bg-gray-50 rounded-lg shadow-[0_0_0_0.5px_#D2D1CF] p-0.5">
          {toggles.map((toggle) => (
            <button
              key={toggle.id}
              onClick={toggle.onClick}
              className={cn(
                "flex justify-center items-center gap-2 rounded-md py-1.5 px-4 transition-all",
                toggle.active
                  ? "bg-white shadow-[0_1px_3px_0_rgba(11,19,36,0.1),0_1px_1px_0_rgba(11,19,36,0.1)]"
                  : "bg-gray-50 hover:bg-gray-100"
              )}
            >
              <span className={cn(
                "text-center font-normal text-sm leading-5",
                toggle.active ? "text-[#282828] font-normal" : "text-[#282828]"
              )}>
                {toggle.label}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Custom content */}
      {children}

      {/* Right side: Action buttons */}
      {buttons.length > 0 && (
        <div className="flex flex-wrap gap-3 items-center">
          {buttons.map((button) => (
            <button
              key={button.id}
              onClick={button.onClick}
              disabled={button.disabled}
              className={cn(
                "flex items-center gap-2 h-10 px-4 rounded-lg font-normal text-sm transition-colors",
                button.variant === "primary"
                  ? "border border-white bg-[#013764] text-white hover:bg-[#0a2e4d] shadow-[0_0_0_1px_rgb(0,45,90),0_0_10px_-5px_rgba(0,0,0,0.2)]"
                  : "border border-gray-200 bg-white text-[#303030] hover:bg-gray-50 shadow-[0_1px_3px_0_rgba(0,0,0,0.03)]",
                button.disabled && "opacity-50"
              )}
              style={button.variant === "primary" ? { marginTop: "-1px" } : {}}
            >
              {button.icon && (
                <span style={{ marginTop: button.variant === "primary" ? "-1px" : "-2px" }}>
                  {button.icon}
                </span>
              )}
              <span style={{ marginTop: button.variant === "primary" ? "0px" : "-1px" }}>
                {button.label}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

SubPageHeader.displayName = "SubPageHeader";
