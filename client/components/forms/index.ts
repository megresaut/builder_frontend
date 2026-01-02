/**
 * Forms Component Exports
 *
 * This file provides a central export point for all standardized form field components.
 * All fields use FieldShell for consistent styling and behavior.
 *
 * Compact Mode:
 * Most field components support a `compact` prop for inline editing contexts.
 * When compact={true}, the field renders without FieldShell wrapper:
 * - Height: 32px (vs standard 44px)
 * - Padding: 6px 12px (vs standard 8px 12px)
 *
 * Example:
 * ```tsx
 * <TextField label="Name" /> // Standard mode with label
 * <TextField value="John" compact /> // Compact mode without label
 * ```
 *
 * Usage:
 * ```tsx
 * import {
 *   FieldShell,
 *   TextField,
 *   SelectField,
 *   CurrencyField,
 *   FieldRow,
 * } from "@/components/forms";
 * ```
 */

// Base wrapper
export { FieldShell } from "./FieldShell";
export { FieldCellShell } from "./FieldCellShell";

// Field components (FieldShell + input)
export { TextField } from "./TextField";
export { TextAreaField } from "./TextAreaField";
export { NumberField } from "./NumberField";
export { CurrencyField } from "./CurrencyField";
export { DateField } from "./DateField";
export { TimeField } from "./TimeField";
export { DateTimeField } from "./DateTimeField";
export { PercentField } from "./PercentField";
export { SelectField } from "./SelectField";
export { ComboboxField } from "./ComboboxField";
export { ComboboxFieldWithCustomInput } from "./ComboboxFieldWithCustomInput";
export { MultiSelectField, type MultiSelectOption } from "./MultiSelectField";
export { EmailField } from "./EmailField";
export { PhoneNumberField } from "./PhoneNumberField";
export { AddressField, type AddressValue } from "./AddressField";
export {
  IdentitySelectField,
  type IdentityOption,
} from "./IdentitySelectField";
export { SensitiveInputField } from "./SensitiveInputField";
export { ReadOnlyTextField } from "./ReadOnlyTextField";
export { FileUploadField } from "./FileUploadField";
export { RadioGroupField, type RadioGroupFieldProps, type RadioOption } from "./RadioGroupField";

// Cell field components (for table cells)
export { SelectFieldCell } from "./SelectFieldCell";
export { DateFieldCell } from "./DateFieldCell";
export { NumberFieldCell } from "./NumberFieldCell";
export { CurrencyFieldCell } from "./CurrencyFieldCell";
export { TextFieldCell } from "./TextFieldCell";
export { VendorFieldCell } from "./VendorFieldCell";

// Layout components
export { FieldRow, FieldRowItem } from "@/components/ui/field-row";
export { FormSection } from "@/components/ui/form-section";
