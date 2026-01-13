import * as React from "react";
import { cn } from "@/lib/utils";

interface DrawerTemplateProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  hideCloseButton?: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  showDivider?: boolean;
  width?: number;
  contentRef?: React.RefObject<HTMLDivElement>;
}

interface DrawerSubheaderProps {
  children: React.ReactNode;
}

interface DrawerTextProps {
  children: React.ReactNode;
  className?: string;
}

interface DrawerFieldProps {
  label: string;
  children: React.ReactNode;
  spacing?: "default" | "tight";
}

/**
 * DrawerTemplate Component
 *
 * Provides a standardized drawer structure with:
 * - Header (title + optional subtitle + close button)
 * - Optional divider
 * - Scrollable content area
 * - Optional footer with actions
 *
 * Similar structure to ModalTemplate but optimized for side drawers.
 *
 * Behavior:
 * - The drawer slides in from the right (fixed positioning)
 * - Content area is scrollable if it exceeds viewport height
 * - Close button is always visible in header
 *
 * State Reset Pattern (REQUIRED):
 * - Every drawer component must clear ALL state when closing/reopening
 * - Use useEffect with `open` dependency to reset state
 */
export const DrawerTemplate = React.forwardRef<
  HTMLDivElement,
  DrawerTemplateProps
>(
  (
    {
      open,
      onOpenChange,
      title,
      subtitle,
      hideCloseButton = false,
      onClose,
      children,
      footer,
      showDivider = true,
      width = 384,
      contentRef,
    },
    ref,
  ) => {
    const handleClose = () => {
      if (onClose) onClose();
      onOpenChange(false);
    };

    if (!open) return null;

    return (
      <>
        {/* Overlay */}
        <div
          className="fixed inset-0 z-40 bg-black/10 transition-opacity duration-200"
          onClick={handleClose}
          style={{
            opacity: open ? 1 : 0,
            pointerEvents: open ? "auto" : "none",
          }}
        />

        {/* Drawer */}
        <div
          className="fixed top-0 right-0 h-screen bg-white shadow-xl z-50 overflow-hidden flex flex-col"
          style={{
            width: `${width}px`,
            borderLeft: "1px solid var(--color-border-light)",
            animation: open ? "slideInRight 0.3s ease-out" : "slideOutRight 0.3s ease-in",
          }}
        >
          {/* Header */}
          <div
            className="flex-shrink-0 border-b px-6 py-5"
            style={{ borderColor: "var(--color-border-light)" }}
          >
            <div className="flex items-start justify-between gap-4 mb-2">
              <h2
                className="text-2xl font-semibold"
                style={{ color: "var(--color-text-primary)", lineHeight: 1.08 }}
              >
                {title}
              </h2>
              {!hideCloseButton && (
                <button
                  onClick={handleClose}
                  className="flex-shrink-0 p-1 rounded hover:bg-gray-100 transition-colors"
                  style={{ color: "var(--color-text-muted)" }}
                  aria-label="Close drawer"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M15 5L5 15M5 5L15 15"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              )}
            </div>

            {/* Subtitle */}
            {subtitle && (
              <p
                className="text-xs leading-relaxed"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {subtitle}
              </p>
            )}

            {/* Divider */}
            {showDivider && (
              <div
                style={{
                  width: "100%",
                  height: "1px",
                  backgroundColor: "var(--color-border-light)",
                  marginTop: subtitle ? "12px" : "0px",
                }}
              />
            )}
          </div>

          {/* Content */}
          <div
            ref={contentRef || ref}
            className="flex-1 overflow-y-auto px-6 py-6"
            style={{
              overflowY: "auto",
              overflowX: "hidden",
              overscrollBehavior: "contain",
              WebkitOverflowScrolling: "touch",
            }}
          >
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div
              className="flex-shrink-0 border-t px-6 py-4"
              style={{ borderColor: "var(--color-border-light)" }}
            >
              {footer}
            </div>
          )}
        </div>
      </>
    );
  },
);

DrawerTemplate.displayName = "DrawerTemplate";

/**
 * DrawerSubheader - Optional subheader section with divider
 *
 * Use this to add section headers within drawer content.
 * Automatically adds proper spacing and divider.
 */
export const DrawerSubheader: React.FC<DrawerSubheaderProps> = ({ children }) => {
  return (
    <div className="flex w-full flex-col mb-4">
      <div
        style={{
          fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
          fontSize: "20px",
          color: "var(--color-text-primary)",
          fontWeight: 600,
          lineHeight: 1.3,
        }}
      >
        {children}
      </div>
      <div
        style={{
          width: "100%",
          height: "1px",
          backgroundColor: "var(--color-border-light)",
          marginTop: "12px",
        }}
      />
    </div>
  );
};

DrawerSubheader.displayName = "DrawerSubheader";

/**
 * DrawerText - Plain text content with proper spacing
 *
 * Use this for text-only content without form fields.
 * Maintains consistent spacing.
 */
export const DrawerText: React.FC<DrawerTextProps> = ({
  children,
  className = "",
}) => {
  return (
    <div
      className={className}
      style={{
        fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
        fontSize: "13px",
        color: "var(--color-text-secondary)",
        fontWeight: 400,
        lineHeight: 1.38,
      }}
    >
      {children}
    </div>
  );
};

DrawerText.displayName = "DrawerText";

/**
 * DrawerField - Form field with label
 *
 * Consistent field layout matching the design system.
 * Supports custom spacing between fields.
 */
export const DrawerField: React.FC<DrawerFieldProps> = ({
  label,
  children,
  spacing = "default",
}) => {
  const marginBottom = spacing === "tight" ? "12px" : "16px";

  return (
    <div className="flex w-full flex-col" style={{ marginBottom }}>
      <label
        style={{
          fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
          fontSize: "13px",
          color: "var(--color-text-primary)",
          fontWeight: 500,
          lineHeight: 1.38,
          marginBottom: "6px",
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
};

DrawerField.displayName = "DrawerField";

/**
 * DrawerSection - Container for grouping related content
 *
 * Use this to add spacing between major sections in the drawer.
 * Default spacing is 24px top margin.
 */
export const DrawerSection: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return <div style={{ marginTop: "24px" }}>{children}</div>;
};

DrawerSection.displayName = "DrawerSection";
