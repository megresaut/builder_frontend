import React from "react";
import { Button } from "@/components/ui/button";

interface InlineEditWrapperProps {
  mode: "view" | "edit";
  onSave: () => void;
  onCancel: () => void;
  children: React.ReactNode; // View mode content
  editChildren: React.ReactNode; // Edit mode content
  editTitle?: string; // Optional title for edit mode
  showCloseButton?: boolean; // Show X button in edit mode
}

/**
 * InlineEditWrapper - Inline edit layout wrapper
 *
 * Provides consistent inline edit layout that matches the Figma design.
 * No overlay/modal, stays inline within section container.
 *
 * Features:
 * - Conditional view/edit mode rendering
 * - Maintains exact padding from section (p-4 / 16px)
 * - White background, border, rounded corners
 * - Bottom-right aligned Save/Cancel buttons with 10px gap
 * - Optional title bar with close X button
 *
 * @param mode - "view" or "edit" mode
 * @param onSave - Save button handler
 * @param onCancel - Cancel button handler
 * @param children - View mode content
 * @param editChildren - Edit mode content
 * @param editTitle - Optional title shown in edit mode
 * @param showCloseButton - Show X button in edit mode header
 */
export const InlineEditWrapper: React.FC<InlineEditWrapperProps> = ({
  mode,
  onSave,
  onCancel,
  children,
  editChildren,
  editTitle,
  showCloseButton = true,
}) => {
  if (mode === "view") {
    return <>{children}</>;
  }

  // Edit mode
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        padding: "16px",
        backgroundColor: "rgba(255, 255, 255, 1)",
        border: "1px solid rgba(218, 218, 218, 1)",
        borderRadius: "8px",
        gap: "16px",
      }}
    >
      {/* Optional title bar */}
      {editTitle && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
          }}
        >
          <div
            style={{
              fontSize: "14px",
              fontWeight: 600,
              color: "rgba(48, 48, 48, 1)",
              lineHeight: 1.57,
              fontFamily:
                "Geist, -apple-system, Roboto, Helvetica, sans-serif",
            }}
          >
            {editTitle}
          </div>
          {showCloseButton && (
            <button
              onClick={onCancel}
              style={{
                width: "18px",
                height: "18px",
                padding: 0,
                border: "none",
                backgroundColor: "transparent",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
              aria-label="Close edit mode"
            >
              <img
                loading="lazy"
                src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/2a270b52419cae9104b1782181d0a66d1f416309?placeholderIfAbsent=true"
                alt="Close"
                style={{
                  width: "18px",
                  height: "18px",
                  objectFit: "contain",
                  objectPosition: "center",
                }}
              />
            </button>
          )}
        </div>
      )}

      {/* Edit form content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
        }}
      >
        {editChildren}
      </div>

      {/* Bottom buttons */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: "10px",
          marginTop: "8px",
        }}
      >
        {/* Cancel button */}
        <Button
          variant="outline"
          onClick={onCancel}
        >
          Cancel
        </Button>

        {/* Save button - use primary variant from Button component */}
        <Button
          variant="default"
          onClick={onSave}
        >
          Save
        </Button>
      </div>
    </div>
  );
};

InlineEditWrapper.displayName = "InlineEditWrapper";
