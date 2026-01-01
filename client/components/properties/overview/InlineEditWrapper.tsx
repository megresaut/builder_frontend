import React from "react";

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
        <button
          onClick={onCancel}
          style={{
            borderRadius: "8px",
            backgroundColor: "rgba(251, 251, 251, 1)",
            boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.03)",
            borderColor: "rgba(218, 218, 218, 1)",
            borderStyle: "solid",
            borderWidth: "1px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            paddingLeft: "12px",
            paddingRight: "12px",
            paddingTop: "7px",
            paddingBottom: "7px",
            minHeight: "36px",
            color: "rgba(48, 48, 48, 1)",
            fontWeight: 400,
            letterSpacing: "-0.32px",
            lineHeight: 1.4,
            justifyContent: "center",
            cursor: "pointer",
            fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
            fontSize: "16px",
            whiteSpace: "nowrap",
            transition: "opacity 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          Cancel
        </button>

        {/* Save button */}
        <button
          onClick={onSave}
          style={{
            borderRadius: "8px",
            backgroundColor: "var(--color-button-primary)",
            boxShadow:
              "0px 0px 0px 1px var(--color-button-primary-shadow)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            paddingLeft: "12px",
            paddingRight: "12px",
            paddingTop: "8px",
            paddingBottom: "8px",
            minHeight: "36px",
            color: "rgba(255, 255, 255, 1)",
            fontWeight: 500,
            letterSpacing: "-0.32px",
            lineHeight: 1.4,
            justifyContent: "center",
            cursor: "pointer",
            fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
            fontSize: "16px",
            whiteSpace: "nowrap",
            border: "none",
            transition: "background-color 0.2s",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor =
              "var(--color-button-primary-hover)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor =
              "var(--color-button-primary)")
          }
        >
          Save
        </button>
      </div>
    </div>
  );
};

InlineEditWrapper.displayName = "InlineEditWrapper";
