/**
 * Compact Form Fields - Optimized for inline editing
 *
 * All compact form fields use:
 * - Height: 32px (vs standard 44px)
 * - Padding: 6px 12px (vs standard 8px 12px)
 * - Font size: 14px
 * - Designed for inline edit contexts within sections
 *
 * Usage:
 * ```tsx
 * import {
 *   CompactInput,
 *   CompactCurrencyInput,
 *   CompactDateField,
 *   CompactSelectField,
 *   RadioGroupField,
 * } from "@/components/forms/compact";
 * ```
 */

export { CompactInput } from "./CompactInput";
export { CompactCurrencyInput, type CompactCurrencyInputProps } from "./CompactCurrencyInput";
export { CompactDateField } from "./CompactDateField";
export { CompactSelectField, type CompactSelectFieldProps } from "./CompactSelectField";
export { RadioGroupField, type RadioGroupFieldProps, type RadioOption } from "./RadioGroupField";
