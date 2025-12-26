import React from "react";

/**
 * FormLayout - Root container for forms that enforces hierarchical spacing
 *
 * Automatically applies:
 * - 28px gap between FormSection components
 * - Sections and fields manage their own internal spacing (12px)
 *
 * Usage:
 * ```tsx
 * <FormLayout>
 *   <FormSection title="Section 1">
 *     <FormField label="Field 1">
 *       <input />
 *     </FormField>
 *     <FormField label="Field 2">
 *       <input />
 *     </FormField>
 *   </FormSection>
 *   <FormSection title="Section 2">
 *     <FormField label="Field 3">
 *       <input />
 *     </FormField>
 *   </FormSection>
 * </FormLayout>
 * ```
 */
export const FormLayout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "28px",
      }}
    >
      {children}
    </div>
  );
};

FormLayout.displayName = "FormLayout";

/**
 * FormSection - Section container with optional title and divider
 *
 * Automatically applies:
 * - 12px spacing between section header and divider
 * - 12px spacing between divider and first field
 * - 12px gap between all fields within this section
 *
 * Parent FormLayout adds 28px between sections.
 */
interface FormSectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  showDivider?: boolean;
}

export const FormSection: React.FC<FormSectionProps> = ({
  title,
  description,
  children,
  showDivider = true,
}) => {
  return (
    <div>
      {/* Section Header */}
      {title && (
        <div style={{ marginBottom: "12px" }}>
          <h3
            style={{
              fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
              fontSize: "16px",
              fontWeight: 600,
              color: "var(--color-text-primary)",
              lineHeight: 1.5,
              margin: 0,
              marginBottom: description ? "4px" : "0",
            }}
          >
            {title}
          </h3>
          {description && (
            <p
              style={{
                fontFamily:
                  "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                fontSize: "14px",
                fontWeight: 400,
                color: "var(--color-text-muted)",
                lineHeight: 1.43,
                margin: 0,
              }}
            >
              {description}
            </p>
          )}
        </div>
      )}

      {/* Divider */}
      {showDivider && title && (
        <div
          style={{
            width: "100%",
            height: "1px",
            backgroundColor: "var(--color-border-light)",
            marginBottom: "12px",
          }}
        />
      )}

      {/* Content - Fields with 12px gap between them */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        {children}
      </div>
    </div>
  );
};

FormSection.displayName = "FormSection";

/**
 * FormField - Individual field wrapper
 *
 * Provides consistent label + input styling.
 * Parent FormSection automatically adds 12px gap between fields.
 */
interface FormFieldProps {
  label?: string;
  children: React.ReactNode;
  error?: string;
  helperText?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  children,
  error,
  helperText,
}) => {
  return (
    <div className="flex w-full flex-col">
      {label && (
        <label
          style={{
            fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
            fontSize: "14px",
            color: "rgba(48, 48, 48, 1)",
            fontWeight: 500,
            lineHeight: 1.43,
            marginBottom: "8px",
          }}
        >
          {label}
        </label>
      )}
      {children}
      {error && (
        <div
          style={{
            marginTop: "4px",
            fontSize: "12px",
            color: "var(--color-error)",
            fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
          }}
        >
          {error}
        </div>
      )}
      {helperText && (
        <div
          style={{
            marginTop: "4px",
            fontSize: "12px",
            color: "var(--color-text-muted)",
            fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
          }}
        >
          {helperText}
        </div>
      )}
    </div>
  );
};

FormField.displayName = "FormField";

/**
 * FormFieldRow - Multi-column field layout
 *
 * Arranges multiple fields horizontally (if space allows).
 * Maintains 12px gap between fields in the row.
 */
interface FormFieldRowProps {
  children: React.ReactNode;
  columns?: number;
}

export const FormFieldRow: React.FC<FormFieldRowProps> = ({
  children,
  columns = 2,
}) => {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: "12px",
      }}
    >
      {children}
    </div>
  );
};

FormFieldRow.displayName = "FormFieldRow";

export type { FormSectionProps, FormFieldProps, FormFieldRowProps };
