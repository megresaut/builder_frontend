import React from "react";

interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  showDivider?: boolean;
}

/**
 * FormSection - Section container for form groups
 *
 * Groups related form fields with a section title, optional divider, and spacing.
 * Useful for breaking up long forms into logical sections.
 *
 * @param title - Section title (e.g., "Contact Information")
 * @param description - Optional subtitle or description text
 * @param children - Form fields within this section
 * @param showDivider - Show divider line below title (default: true)
 *
 * Example:
 * ```tsx
 * <FormSection title="Contact Information" description="Primary contact details">
 *   <FieldRow columns={2}>
 *     <FieldRowItem>
 *       <ModalField label="Email">
 *         <Input type="email" />
 *       </ModalField>
 *     </FieldRowItem>
 *     <FieldRowItem>
 *       <ModalField label="Phone">
 *         <Input type="tel" />
 *       </ModalField>
 *     </FieldRowItem>
 *   </FieldRow>
 * </FormSection>
 * ```
 */
export const FormSection: React.FC<FormSectionProps> = ({
  title,
  description,
  children,
  showDivider = true,
}) => {
  return (
    <div>
      {/* Section Header */}
      <div style={{ marginBottom: showDivider ? "16px" : "20px" }}>
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
              fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
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

      {/* Divider */}
      {showDivider && (
        <div
          style={{
            width: "100%",
            height: "1px",
            backgroundColor: "var(--color-border-light)",
            marginBottom: "20px",
          }}
        />
      )}

      {/* Content */}
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {children}
      </div>
    </div>
  );
};

FormSection.displayName = "FormSection";
