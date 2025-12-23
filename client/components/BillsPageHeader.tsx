import React from "react";
import { cn } from "@/lib/utils";

export interface BillsPageHeaderAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary";
  loading?: boolean;
  loadingLabel?: string;
}

export interface BillsPageHeaderTab {
  id: string;
  label: string;
  count?: number;
}

interface BillsPageHeaderProps {
  title: string;
  description: string;
  tabs?: BillsPageHeaderTab[];
  selectedTab?: string;
  onTabChange?: (tabId: string) => void;
  actions?: BillsPageHeaderAction[];
}

export const BillsPageHeader: React.FC<BillsPageHeaderProps> = ({
  title,
  description,
  tabs = [],
  selectedTab,
  onTabChange,
  actions = [],
}) => {
  return (
    <div className="flex flex-col gap-6">
      {/* Title and Description */}
      <div className="flex flex-col gap-1">
        <h1
          className="font-semibold text-2xl leading-[30px]"
          style={{ color: "var(--color-text-primary)" }}
        >
          {title}
        </h1>
        <p
          className="font-medium text-base leading-4"
          style={{ marginTop: "-3px", color: "var(--color-text-muted)" }}
        >
          {description}
        </p>
      </div>

      {/* Segmented Tabs and Action Buttons */}
      <div className="flex items-center justify-between w-full bg-white gap-6">
        {tabs.length > 0 && (
          <div
            className="flex bg-gray-50 rounded-lg p-0.5"
            style={{ boxShadow: "0 0 0 0.5px var(--color-border-default)" }}
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange?.(tab.id)}
                className={cn(
                  "flex justify-center items-center gap-2 rounded-md py-1.5 px-4 transition-all whitespace-nowrap",
                  selectedTab === tab.id
                    ? "bg-white shadow-[0_1px_3px_0_rgba(11,19,36,0.1),0_1px_1px_0_rgba(11,19,36,0.1)]"
                    : "bg-gray-50 hover:bg-gray-100"
                )}
              >
                <span
                  className="text-center font-normal text-sm leading-5"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {tab.label}
                </span>
                {tab.count !== undefined && (
                  <span
                    className="text-xs font-medium"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    ({tab.count})
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        {actions.length > 0 && (
          <div className="flex flex-wrap gap-3 items-center">
            {actions.map((action) => (
              <button
                key={action.id}
                onClick={action.onClick}
                disabled={action.disabled || action.loading}
                className={cn(
                  "flex items-center gap-2 h-10 px-4 rounded-lg transition-colors disabled:opacity-50",
                  action.variant === "primary"
                    ? "border border-white text-white font-medium text-sm"
                    : "border border-gray-200 bg-white hover:bg-gray-50 shadow-[0_1px_3px_0_rgba(0,0,0,0.03)]"
                )}
                style={
                  action.variant === "primary"
                    ? {
                        backgroundColor: "var(--color-button-primary)",
                        boxShadow:
                          "0 0 0 1px var(--color-button-primary-shadow), 0 0 10px -5px rgba(0,0,0,0.2)",
                      }
                    : undefined
                }
                onMouseEnter={(e) => {
                  if (action.variant === "primary") {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                      "var(--color-button-primary-hover)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (action.variant === "primary") {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                      "var(--color-button-primary)";
                  }
                }}
              >
                {action.icon}
                <span
                  className="font-normal text-sm leading-[22.4px]"
                  style={{
                    color:
                      action.variant === "primary"
                        ? "white"
                        : "var(--color-text-primary)",
                  }}
                >
                  {action.loading && action.loadingLabel
                    ? action.loadingLabel
                    : action.label}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

BillsPageHeader.displayName = "BillsPageHeader";
