import React from "react";

interface FieldCellShellProps {
  children: React.ReactNode;
  error?: boolean;
}

/**
 * FieldCellShell - Minimal wrapper for table cell form controls
 *
 * Provides a clean cell experience with:
 * - No visible border or chrome
 * - Simple text display
 * - Popover dropdown support
 * - Error state styling only
 *
 * Designed specifically for table cells where minimalism is key.
 * Removes all visual clutter except for error indication.
 *
 * @param children - The form control (trigger + content from Popover)
 * @param error - Show error styling (optional)
 *
 * Example:
 * ```tsx
 * <FieldCellShell error={hasError}>
 *   <Popover>
 *     <PopoverTrigger>Click me</PopoverTrigger>
 *     <PopoverContent>Dropdown content</PopoverContent>
 *   </Popover>
 * </FieldCellShell>
 * ```
 */
export const FieldCellShell: React.FC<FieldCellShellProps> = ({ 
  children, 
  error = false 
}) => {
  return (
    <div
      className="ra-field-cell-shell w-full"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 0,
        width: "100%",
      }}
    >
      {children}
    </div>
  );
};

FieldCellShell.displayName = "FieldCellShell";
