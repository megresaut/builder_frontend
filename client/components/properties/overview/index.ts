/**
 * Property Overview Components & Modals
 *
 * This folder contains all components and modals specific to the Property Details Overview page.
 *
 * Usage:
 * ```tsx
 * import {
 *   InlineEditWrapper,
 *   EditCustomFieldsInline,
 *   EditPropertyCustomFieldsModal,
 *   EditPropertyRatesModal,
 *   UploadPhotoModal,
 * } from "@/components/properties/overview";
 * ```
 */

// Inline edit components
export { InlineEditWrapper } from "./InlineEditWrapper";
export { EditCustomFieldsInline } from "./EditCustomFieldsInline";
export { EditRatesInline } from "./EditRatesInline";

// Modals
export { default as EditPropertyCustomFieldsModal } from "./EditPropertyCustomFieldsModal";
export { default as EditPropertyRatesModal } from "./EditPropertyRatesModal";
export { default as UploadPhotoModal } from "./UploadPhotoModal";
