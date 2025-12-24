import React from "react";

interface FieldRowProps {
  children: React.ReactNode;
  columns?: 2 | 3;
}

/**
 * FieldRow - Multi-column field layout
 *
 * Arranges multiple form fields horizontally on desktop, stacking vertically on mobile.
 * Uses the .ra-field-row CSS class for responsive grid layout.
 *
 * @param columns - Number of columns on desktop (2 or 3, default: 2)
 * @param children - Form fields to arrange (should be FieldRowItem components)
 *
 * Example:
 * ```tsx
 * <FieldRow columns={2}>
 *   <FieldRowItem>
 *     <ModalField label="First Name">
 *       <Input placeholder="First Name" />
 *     </ModalField>
 *   </FieldRowItem>
 *   <FieldRowItem>
 *     <ModalField label="Last Name">
 *       <Input placeholder="Last Name" />
 *     </ModalField>
 *   </FieldRowItem>
 * </FieldRow>
 * ```
 */
export const FieldRow: React.FC<FieldRowProps> = ({ children, columns = 2 }) => {
  return (
    <div
      className="ra-field-row"
      style={{ "--field-row-columns": columns } as React.CSSProperties}
    >
      {children}
    </div>
  );
};

FieldRow.displayName = "FieldRow";

interface FieldRowItemProps {
  children: React.ReactNode;
}

/**
 * FieldRowItem - Individual field container within a FieldRow
 *
 * Wraps a form field to ensure consistent sizing and spacing within a row.
 * Automatically stacks to full width on mobile via .ra-field-row-item CSS.
 */
export const FieldRowItem: React.FC<FieldRowItemProps> = ({ children }) => {
  return <div className="ra-field-row-item">{children}</div>;
};

FieldRowItem.displayName = "FieldRowItem";
