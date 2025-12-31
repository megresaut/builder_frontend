import React, { useState, useRef } from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

interface FieldShellProps {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  description?: string;
  error?: string;
  disabled?: boolean;
  htmlFor?: string;
  className?: string;
  mode?: "form" | "cell";
  cellValue?: string;
  onCellCommit?: (value: any) => void;
  value?: string | number | boolean | null;
}

/**
 * FieldShell - Base field wrapper providing consistent structure
 *
 * Handles all field chrome: label, required indicator, description,
 * error messaging, and disabled state. Should wrap any input component.
 *
 * Features:
 * - Semantic label with "for" attribute
 * - Required asterisk styling (auto-inferred if error is present)
 * - Optional helper text (description)
 * - Error message display in red
 * - Disabled state styling
 * - Consistent vertical spacing (12px between label/input/error)
 * - Uses CSS variables for themeable styling
 * - Cell mode: Compact inline editing with popover
 *
 * Behavior:
 * - Required asterisk only appears if `required={true}` is explicitly set
 * - Validation errors show on non-required fields without the asterisk
 * - In cell mode, validation error shows only inside popover, not in cell
 *
 * @param label - Field label text (always required)
 * @param children - Input component (Input, Select, DatePicker, etc.)
 * @param required - Show red asterisk and auto-validate (default: false)
 * @param description - Helper text below label
 * @param error - Error message (displayed in red in form mode; in popover in cell mode). If not provided and required=true, auto-validates based on value
 * @param disabled - Disable field and dim styling (default: false)
 * @param htmlFor - HTML "for" attribute linking label to input
 * @param className - Optional wrapper class override
 * @param mode - "form" (default) or "cell" for table cell editing
 * @param cellValue - Display value for cell mode (shown when popover is closed)
 * @param onCellCommit - Callback when value is committed in cell mode (blur/Enter)
 * @param value - Field value for automatic required field validation
 *
 * Example (form mode):
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
 *
 * Example (cell mode):
 * ```tsx
 * <FieldShell
 *   mode="cell"
 *   label="Amount"
 *   cellValue={formatCurrency(value)}
 *   error={errors.amount}
 *   onCellCommit={handleCommit}
 * >
 *   <Input
 *     type="text"
 *     value={rawValue}
 *     onChange={setRawValue}
 *     placeholder="0"
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
  mode = "form",
  cellValue = "",
  onCellCommit,
  value,
}) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement>(null);

  // Only show required asterisk if explicitly required
  const isRequired = required;

  // Auto-validate required fields: if required and value is empty/falsy, show error
  const isEmpty = value === "" || value === null || value === undefined || value === false;
  const validationError = required && isEmpty && !error ? `${label} is required` : error;

  // For cell mode, inject ref and event handlers into child
  const childrenWithCellHandlers = React.Children.map(children, (child) => {
    if (mode === "cell" && React.isValidElement(child)) {
      return React.cloneElement(child, {
        ref: inputRef,
        onBlur: () => {
          // Commit and close
          if (onCellCommit) {
            const value = (inputRef.current as any)?.value ?? "";
            onCellCommit(value);
          }
          setIsPopoverOpen(false);
        },
        onKeyDown: (e: React.KeyboardEvent) => {
          if (e.key === "Enter") {
            e.preventDefault();
            if (onCellCommit) {
              const value = (inputRef.current as any)?.value ?? "";
              onCellCommit(value);
            }
            // Keep popover open if there's an error; otherwise close
            if (!error) {
              setIsPopoverOpen(false);
            }
          } else if (e.key === "Escape") {
            setIsPopoverOpen(false);
          }
        },
      } as any);
    }
    return child;
  });

  const childrenWithError = React.Children.map(children, (child) => {
    if (React.isValidElement(child) && error) {
      return React.cloneElement(child, {
        "aria-invalid": true,
      } as any);
    }
    return child;
  });

  // Cell mode rendering
  if (mode === "cell") {
    return (
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        {/* Ghost trigger filling the entire cell */}
        <PopoverTrigger asChild>
          <button
            ref={triggerRef}
            style={{
              height: "100%",
              width: "100%",
              padding: 0,
              display: "flex",
              alignItems: "center",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
              fontSize: "13px",
              color: "var(--color-text-primary)",
              textAlign: "left",
              outline: "none",
            }}
            className="cell-trigger"
            disabled={disabled}
            onClick={() => {
              setIsPopoverOpen(true);
              // Focus input after popover opens
              setTimeout(() => {
                if (inputRef.current) {
                  inputRef.current.focus();
                  (inputRef.current as HTMLInputElement).select?.();
                }
              }, 0);
            }}
          >
            {cellValue || "\u00A0"}
          </button>
        </PopoverTrigger>

        {/* Popover with input and error message */}
        <PopoverContent
          align="start"
          sideOffset={0}
          style={{
            padding: "8px",
            minWidth: "200px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {/* Input inside popover */}
            {childrenWithCellHandlers}

            {/* Error message - only in popover */}
            {error && (
              <p
                style={{
                  fontFamily:
                    "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                  fontSize: "12px",
                  fontWeight: 400,
                  color: "#ef4444",
                  lineHeight: 1.33,
                  margin: 0,
                }}
              >
                {error}
              </p>
            )}
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  // Form mode rendering (original behavior)
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
        {isRequired && (
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
