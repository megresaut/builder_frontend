// Vendors - Core
export {
  fetchVendors,
  fetchVendor,
  mockFetchVendors,
  type BaseVendor,
} from "./vendors/vendors";

export {
  fetchVendorDetail,
  MOCK_VENDOR_DETAILS,
  type VendorDetail,
} from "./vendors/details";

// Relationships
export {
  fetchVendorsForProperty,
  getPropertyVendor,
  VENDOR_PROPERTY_MAPPING,
  type PropertyVendor,
} from "./relationships/propertyServices";

// Related Entities
export {
  fetchVendorNotes,
  createVendorNote,
  deleteVendorNote,
  updateVendorNote,
  MOCK_VENDOR_NOTES,
  type VendorNote,
} from "./related/notes";

export {
  fetchVendorInsurance,
  addVendorInsurance,
  deleteVendorInsurance,
  updateVendorInsurance,
  MOCK_VENDOR_INSURANCE,
  type VendorInsurance,
} from "./related/insurance";

export {
  fetchVendorFiles,
  uploadVendorFile,
  deleteVendorFile,
  updateVendorFile,
  MOCK_VENDOR_FILES,
  type VendorFile,
} from "./related/files";

export {
  fetchVendorCustomFields,
  addVendorCustomField,
  deleteVendorCustomField,
  updateVendorCustomField,
  MOCK_VENDOR_CUSTOM_FIELDS,
  type VendorCustomField,
} from "./related/customFields";
