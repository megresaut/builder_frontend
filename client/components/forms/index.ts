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

// Field components (FieldShell + input)
export { TextField } from "./TextField";
export { TextAreaField } from "./TextAreaField";
export { NumberField } from "./NumberField";
export { CurrencyField } from "./CurrencyField";
export { DateField } from "./DateField";
export { SelectField } from "./SelectField";
export { ComboboxField } from "./ComboboxField";
export { MultiSelectField, type MultiSelectOption } from "./MultiSelectField";

// Layout components
export { FieldRow, FieldRowItem } from "@/components/ui/field-row";
export { FormSection } from "@/components/ui/form-section";
