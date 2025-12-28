import React from "react";
import { AlertCircle } from "lucide-react";
import { CloseIcon } from "@/components/icons";

interface InlineErrorProps {
  message?: string;
  title?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
}

/**
 * InlineError - Form-level error message block
 *
 * Displays error messages prominently within a form.
 * Use for general form errors (not field-specific errors).
 * Field-specific errors should use the ErrorMessage component from ModalTemplate.
 *
 * @param message - Error message text (required)
 * @param title - Optional error title/heading
 * @param dismissible - Allow user to dismiss the error (default: false)
 * @param onDismiss - Callback when error is dismissed
 *
 * Example:
 * ```tsx
 * {errors.form && (
 *   <InlineError
 *     title="Submission Failed"
 *     message="Please check your entries and try again."
 *     dismissible
 *     onDismiss={() => setErrors({})}
 *   />
 * )}
 * ```
 */
export const InlineError: React.FC<InlineErrorProps> = ({
  message,
  title,
  dismissible = false,
  onDismiss,
}) => {
  if (!message) return null;

  return (
    <div
      style={{
        backgroundColor: "#fef2f2",
        borderColor: "#ef4444",
        borderWidth: "1px",
        borderStyle: "solid",
        borderRadius: "8px",
        padding: "12px 16px",
        display: "flex",
        alignItems: "flex-start",
        gap: "12px",
      }}
    >
      {/* Icon */}
      <AlertCircle
        width={20}
        height={20}
        style={{ color: "#ef4444", flexShrink: 0, marginTop: "2px" }}
      />

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {title && (
          <div
            style={{
              fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
              fontSize: "14px",
              fontWeight: 600,
              color: "#991b1b",
              marginBottom: "4px",
            }}
          >
            {title}
          </div>
        )}
        <div
          style={{
            fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
            fontSize: "14px",
            fontWeight: 400,
            color: "#7f1d1d",
            lineHeight: 1.43,
          }}
        >
          {message}
        </div>
      </div>

      {/* Dismiss Button */}
      {dismissible && (
        <button
          onClick={onDismiss}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "4px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#ef4444",
            flexShrink: 0,
          }}
          aria-label="Dismiss error"
        >
          <CloseIcon width={18} height={18} />
        </button>
      )}
    </div>
  );
};

InlineError.displayName = "InlineError";
