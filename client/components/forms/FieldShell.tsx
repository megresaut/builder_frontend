import React from "react";

interface FieldShellProps {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  description?: string;
  error?: string;
  disabled?: boolean;
  htmlFor?: string;
  className?: string;
}

/**
 * FieldShell - Base field wrapper providing consistent structure
 *
 * Handles all field chrome: label, required indicator, description,
 * error messaging, and disabled state. Should wrap any input component.
 *
 * Features:
 * - Semantic label with "for" attribute
 * - Required asterisk styling
 * - Optional helper text (description)
 * - Error message display in red
 * - Disabled state styling
 * - Consistent vertical spacing (12px between label/input/error)
 * - Uses CSS variables for themeable styling
 *
 * @param label - Field label text (always required)
 * @param children - Input component (Input, Select, DatePicker, etc.)
 * @param required - Show red asterisk (default: false)
 * @param description - Helper text below label
 * @param error - Error message (displayed in red)
 * @param disabled - Disable field and dim styling (default: false)
 * @param htmlFor - HTML "for" attribute linking label to input
 * @param className - Optional wrapper class override
 *
 * Example:
 * ```tsx
 * <FieldShell
 *   label="Email Address"
 *   required
 *   description="We'll never share your email"
 *   error={errors.email}
 *   htmlFor="email-input"
 * >
 *   <Input
 *     id="email-input"
 *     type="email"
 *     placeholder="you@example.com"
 *   />
 * </FieldShell>
 * ```
 */
export const FieldShell: React.FC<FieldShellProps> = ({
  label,
  children,
  required = false,
  description,
  error,
  disabled = false,
  htmlFor,
  className,
}) => {
  const childrenWithError = React.Children.map(children, (child) => {
    if (React.isValidElement(child) && error) {
      return React.cloneElement(child, {
        "aria-invalid": true,
      } as any);
    }
    return child;
  });

  return (
    <div
      className={`ra-field-shell ${className || ""}`}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {/* Label with required indicator */}
      <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
        <label
          htmlFor={htmlFor}
          style={{
            fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
            fontSize: "14px",
            fontWeight: 500,
            color: "var(--color-text-primary)",
            lineHeight: 1.43,
            userSelect: "none",
          }}
        >
          {label}
        </label>
        {required && (
          <span
            style={{
              color: "#ef4444",
              fontWeight: 600,
              lineHeight: 1,
            }}
          >
            *
          </span>
        )}
      </div>

      {/* Description / helper text */}
      {description && (
        <p
          style={{
            fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
            fontSize: "13px",
            fontWeight: 400,
            color: "var(--color-text-muted)",
            lineHeight: 1.38,
            margin: "-4px 0 0 0",
          }}
        >
          {description}
        </p>
      )}

      {/* Input / control - with error styling applied */}
      {childrenWithError}

      {/* Error message */}
      {error && (
        <p
          style={{
            fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
            fontSize: "13px",
            fontWeight: 400,
            color: "#ef4444",
            lineHeight: 1.38,
            margin: "-4px 0 0 0",
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
};

FieldShell.displayName = "FieldShell";
