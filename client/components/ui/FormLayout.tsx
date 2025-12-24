import * as React from "react";

/**
 * FormLayout Component
 *
 * Standardizes vertical spacing for modal form content based on the Figma design system.
 *
 * Spacing Rules (from Figma):
 * - 12px: Between subheader/divider and first content element
 * - 20px: Between standard form fields
 * - 28px: Between major sections (new subheader blocks)
 *
 * Usage:
 * Wrap the modal body content (children of ModalTemplate) in FormLayout.
 * Use FormLayout.Section for major section breaks (28px spacing).
 * Use FormLayout.Field for individual form fields (20px spacing).
 * Use FormLayout.FieldGroup for tightly grouped fields (12px spacing).
 *
 * Example:
 * ```tsx
 * <ModalTemplate ...>
 *   <FormLayout>
 *     <ModalSubheader>Task</ModalSubheader>
 *     <FormLayout.Field>
 *       <SelectField ... />
 *     </FormLayout.Field>
 *     <FormLayout.Field>
 *       <TextField ... />
 *     </FormLayout.Field>
 *
 *     <FormLayout.Section>
 *       <ModalSubheader>Work Order Details</ModalSubheader>
 *       <FormLayout.Field>
 *         <DateField ... />
 *       </FormLayout.Field>
 *     </FormLayout.Section>
 *   </FormLayout>
 * </ModalTemplate>
 * ```
 */

interface FormLayoutProps {
  children: React.ReactNode;
}

interface FormLayoutSectionProps {
  children: React.ReactNode;
}

interface FormLayoutFieldProps {
  children: React.ReactNode;
}

interface FormLayoutFieldGroupProps {
  children: React.ReactNode;
}

/**
 * Main FormLayout container
 * Wraps all modal body content to provide consistent spacing structure
 */
export const FormLayout: React.FC<FormLayoutProps> & {
  Section: React.FC<FormLayoutSectionProps>;
  Field: React.FC<FormLayoutFieldProps>;
  FieldGroup: React.FC<FormLayoutFieldGroupProps>;
} = ({ children }) => {
  return <div className="ra-form-layout">{children}</div>;
};

/**
 * FormLayout.Section - Major section break
 *
 * Use this to wrap each major section (starting with a ModalSubheader).
 * Adds 28px top margin for visual separation between sections.
 *
 * Example:
 * ```tsx
 * <FormLayout.Section>
 *   <ModalSubheader>Vendor Agreement</ModalSubheader>
 *   <FormLayout.Field>...</FormLayout.Field>
 * </FormLayout.Section>
 * ```
 */
FormLayout.Section = ({ children }) => {
  return <div className="ra-form-section">{children}</div>;
};

/**
 * FormLayout.Field - Standard form field spacing
 *
 * Wraps individual form fields with 20px bottom spacing.
 * Use for most fields in the form.
 *
 * Example:
 * ```tsx
 * <FormLayout.Field>
 *   <SelectField label="Property" ... />
 * </FormLayout.Field>
 * ```
 */
FormLayout.Field = ({ children }) => {
  return <div className="ra-form-field">{children}</div>;
};

/**
 * FormLayout.FieldGroup - Tight field grouping
 *
 * For fields that should be grouped tightly with 12px spacing.
 * Use when multiple fields are conceptually related and should appear closer together.
 *
 * Example:
 * ```tsx
 * <FormLayout.FieldGroup>
 *   <DateField label="HVAC Start" ... />
 * </FormLayout.FieldGroup>
 * <FormLayout.FieldGroup>
 *   <DateField label="HVAC End" ... />
 * </FormLayout.FieldGroup>
 * ```
 */
FormLayout.FieldGroup = ({ children }) => {
  return <div className="ra-form-field-group">{children}</div>;
};

FormLayout.Section.displayName = "FormLayout.Section";
FormLayout.Field.displayName = "FormLayout.Field";
FormLayout.FieldGroup.displayName = "FormLayout.FieldGroup";
