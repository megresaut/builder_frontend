/**
 * Forms Component Exports
 *
 * This file provides a central export point for all standardized form field components.
 * All fields use FieldShell for consistent styling and behavior.
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

// Cell field components (for table cells)
export { SelectFieldCell } from "./SelectFieldCell";
export { DateFieldCell } from "./DateFieldCell";
export { NumberFieldCell } from "./NumberFieldCell";
export { CurrencyFieldCell } from "./CurrencyFieldCell";
export { TextFieldCell } from "./TextFieldCell";

// Layout components
export { FieldRow, FieldRowItem } from "@/components/ui/field-row";
export { FormSection } from "@/components/ui/form-section";
