import React from "react";
import { cn } from "@/lib/utils";

export interface SubPageHeaderV2Toggle {
  id: string;
  label: string;
  active: boolean;
  onClick: () => void;
}

export interface SubPageHeaderV2Button {
  id: string;
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  disabled?: boolean;
}

interface SubPageHeaderV2Props {
  toggles?: SubPageHeaderV2Toggle[];
  buttons?: SubPageHeaderV2Button[];
  children?: React.ReactNode;
}

/**
 * SubPageHeaderV2 - Simplified sub-section header with segmented toggle and secondary action buttons
 *
 * Provides a standardized layout for page sub-sections with:
 * - Left side: Segmented toggle buttons for filtering/switching views
 * - Right side: Secondary action buttons (Add Vendor, Sync, etc.)
 * - No primary action button (moved to PageHeader)
 *
 * @param toggles - Optional array of toggle buttons with state
 * @param buttons - Optional array of secondary action buttons
 * @param children - Optional custom content
 */
export const SubPageHeaderV2: React.FC<SubPageHeaderV2Props> = ({
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

      {/* Right side: Secondary action buttons */}
      {buttons.length > 0 && (
        <div className="flex flex-wrap gap-3 items-center">
          {buttons.map((button) => (
            <button
              key={button.id}
              onClick={button.onClick}
              disabled={button.disabled}
              className={cn(
                "flex items-center gap-2 h-10 px-4 rounded-lg font-normal text-sm transition-colors",
                "border border-gray-200 bg-white text-[#303030] hover:bg-gray-50 shadow-[0_1px_3px_0_rgba(0,0,0,0.03)]",
                button.disabled && "opacity-50 cursor-not-allowed"
              )}
              style={{ marginTop: "-1px" }}
            >
              {button.icon && (
                <span style={{ marginTop: "-2px" }}>
                  {button.icon}
                </span>
              )}
              <span style={{ marginTop: "-1px" }}>
                {button.label}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

SubPageHeaderV2.displayName = "SubPageHeaderV2";
