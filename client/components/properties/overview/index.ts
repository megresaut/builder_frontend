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
 *   AddPropertyNoteModal,
 *   AddPropertyFileModal,
 *   UploadPhotoModal,
 *   ViewPropertyNoteModal,
 * } from "@/components/properties/overview";
 * ```
 */

// Inline edit components
export { InlineEditWrapper } from "./InlineEditWrapper";
export { EditCustomFieldsInline } from "./EditCustomFieldsInline";

// Modals
export { default as EditPropertyCustomFieldsModal } from "./EditPropertyCustomFieldsModal";
export { default as EditPropertyRatesModal } from "./EditPropertyRatesModal";
export { default as AddPropertyNoteModal } from "./AddPropertyNoteModal";
export { default as AddPropertyFileModal } from "./AddPropertyFileModal";
export { default as UploadPhotoModal } from "./UploadPhotoModal";
export { default as ViewPropertyNoteModal } from "./ViewPropertyNoteModal";

// Re-export types if needed
export type { EditCustomFieldsInlineProps } from "./EditCustomFieldsInline";
