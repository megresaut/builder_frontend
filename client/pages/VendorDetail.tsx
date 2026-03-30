import { useState, useEffect } from "react";
import { useCallback } from "react";
import { useParams } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { usePropertyBreadcrumb } from "@/hooks/PropertyBreadcrumbContext";
import { fetchJSON } from "@/api/fetchJSON";

import PageTemplate from "@/layout/PageTemplate";
import PageHeader from "@/components/PageHeader";
import PdfViewerModal from "@/components/PdfViewerModal";
import VendorActionsModal from "@/components/VendorActionsModal";
import AddVendorModal from "@/components/AddVendorModal";
import AddNoteModal from "@/components/AddNoteModal";
import AddFileModal from "@/components/AddFileModal";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useDelayedAction } from "@/hooks/useDelayedAction";
import { EmailIcon, EditIcon } from "@/components/icons";
import { TextField, SelectField } from "@/components/forms";
import { FormLayout, FormSection } from "@/components/ui/form-layout";
import { ModalTemplate, ModalButtons } from "@/components/ui/ModalTemplate";
import type { UploadedFile } from "@/components/ui/attachment-uploader";
import {
  SectionRowTemplate,
  SectionGroupCardTemplate,
  SectionActionTemplate,
  EmptyStateTemplate,
  RecordListTemplate,
  RecordRowTemplate,
  KeyValueGrid,
  NotesTemplate,
  FilesTemplate,
  DataSectionTemplate,
  type KeyValueCell,
  type Subsection,
} from "@/components/templates";

// ============================================================================
// Type Definitions (local to this component)
// ============================================================================

interface VendorDetail {
  id: number;
  name: string;
  category: string;
  email: string;
  phone: string;
  address?: string;
  website?: string;
  servicesProvided?: string | string[];
}

interface VendorNote {
  id: number;
  text: string;
  author: string;
  date: string;
}

interface VendorFile {
  id: number;
  name: string;
  url?: string;
  uploadedAt?: string;
  type?: string;
  category?: string;
  description?: string;
}

interface VendorComplianceDoc {
  id: number;
  documentType: "certificate_of_insurance" | "w9" | "1099" | "business_license" | "avm_agreement" | "contractors_license" | "other";
  documentName: string;
  provider?: string;
  policyNumber?: string;
  licenseNumber?: string;
  expirationDate: string;
  fileName?: string;
  fileUrl?: string;
  uploadedBy: string;
  uploadedAt: string;
}

/**
 * Generate a simple mock PDF as a blob URL with placeholder text.
 */
function createMockPdfUrl(title: string, details: string): string {
  const pdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792]
   /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
4 0 obj
<< /Length 220 >>
stream
BT
/F1 24 Tf
50 700 Td
(${title}) Tj
/F1 12 Tf
0 -40 Td
(${details}) Tj
0 -25 Td
(This is a mock document for demo purposes.) Tj
0 -25 Td
(In production, the actual uploaded file would be served here.) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000306 00000 n
0000000240 00000 n
trailer
<< /Size 6 /Root 1 0 R >>
startxref
578
%%EOF`;
  const blob = new Blob([pdfContent], { type: "application/pdf" });
  return URL.createObjectURL(blob);
}

interface VendorCustomField {
  id: number;
  name: string;
  value: string;
}

// ============================================================================
// Mock Data Storage (persists during session)
// ============================================================================

const MOCK_VENDOR_DETAILS: Record<number, VendorDetail> = {
  1: {
    id: 1,
    name: "David Smith",
    category: "HVAC",
    email: "david.smith@example.com",
    phone: "724.705.2990",
    address: "123 Main St, Pittsburgh, PA 15213",
    website: "https://davidsmithservices.com",
    servicesProvided: ["HVAC", "Plumbing", "Maintenance"],
  },
};

let mockNotesStorage: Record<number, VendorNote[]> = {
  1: [
    {
      id: 1,
      text: "Reliable vendor, quick turnaround on HVAC repairs",
      author: "John Doe",
      date: "2025-01-08 2:30 PM",
    },
    {
      id: 2,
      text: "Completed plumbing inspection last week",
      author: "Jane Smith",
      date: "2025-01-05 10:15 AM",
    },
  ],
};

let mockFilesStorage: Record<number, VendorFile[]> = {};

// API helpers for vendor compliance docs

interface BackendComplianceDoc {
  id: number;
  document_type: string;
  document_name: string;
  provider?: string | null;
  policy_number?: string | null;
  license_number?: string | null;
  expiration_date: string;
  file_name?: string | null;
  file_url?: string | null;
  uploaded_by: string;
  uploaded_at: string;
}

function formatExpDate(dateStr: string): string {
  // Backend returns YYYY-MM-DD; display as MM/DD/YYYY
  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    const [y, m, d] = dateStr.split("T")[0].split("-");
    return `${m}/${d}/${y}`;
  }
  return dateStr;
}

function mapBackendDoc(doc: BackendComplianceDoc): VendorComplianceDoc {
  return {
    id: doc.id,
    documentType: doc.document_type as VendorComplianceDoc["documentType"],
    documentName: doc.document_name,
    provider: doc.provider ?? undefined,
    policyNumber: doc.policy_number ?? undefined,
    licenseNumber: doc.license_number ?? undefined,
    expirationDate: formatExpDate(doc.expiration_date),
    fileName: doc.file_name ?? undefined,
    fileUrl: doc.file_url ?? undefined,
    uploadedBy: doc.uploaded_by,
    uploadedAt: doc.uploaded_at,
  };
}

async function fetchVendorCompliance(vendorId: number): Promise<VendorComplianceDoc[]> {
  const data: BackendComplianceDoc[] = await fetchJSON(`/vendors/compliance/docs/${vendorId}`);
  return data.map(mapBackendDoc);
}

function toISODate(dateStr: string): string {
  // Convert MM/DD/YYYY to YYYY-MM-DD for the backend
  const match = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (match) {
    const [, m, d, y] = match;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  return dateStr; // already ISO or other format
}

async function apiAddVendorCompliance(
  vendorId: number,
  doc: Omit<VendorComplianceDoc, "id">,
): Promise<VendorComplianceDoc> {
  const resp = await fetchJSON(`/vendors/compliance/docs/${vendorId}`, {
    method: "POST",
    body: JSON.stringify({
      document_type: doc.documentType,
      document_name: doc.documentName,
      provider: doc.provider || "",
      policy_number: doc.policyNumber || "",
      license_number: doc.licenseNumber || "",
      expiration_date: toISODate(doc.expirationDate),
    }),
  });
  return {
    id: resp.id,
    documentType: resp.document_type as VendorComplianceDoc["documentType"],
    documentName: resp.document_name,
    provider: resp.provider ?? undefined,
    policyNumber: resp.policy_number ?? undefined,
    licenseNumber: resp.license_number ?? undefined,
    expirationDate: resp.expiration_date,
    uploadedBy: "You",
    uploadedAt: new Date().toLocaleString(),
  };
}

async function apiDeleteVendorCompliance(docId: number): Promise<void> {
  await fetchJSON(`/vendors/compliance/docs/delete/${docId}`, {
    method: "DELETE",
  });
}

let mockCustomFieldsStorage: Record<number, VendorCustomField[]> = {
  1: [
    {
      id: 1,
      name: "License Number",
      value: "LIC-2024-001",
    },
    {
      id: 2,
      name: "Certification",
      value: "EPA Certified",
    },
  ],
};

// ============================================================================
// Mock API Functions (can be replaced with real fetch calls)
// ============================================================================

/**
 * Mock API: Fetch vendor detail by ID
 * Real API would be: GET /vendors/{vendor_id}
 */
async function mockFetchVendorDetail(vendorId: number): Promise<VendorDetail | null> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  const detail = MOCK_VENDOR_DETAILS[vendorId];
  if (!detail) {
    // Create default detail for any vendor ID
    return {
      id: vendorId,
      name: `Vendor ${vendorId}`,
      category: "General Services",
      email: `vendor${vendorId}@example.com`,
      phone: "(555) 000-0000",
      address: undefined,
      website: undefined,
      servicesProvided: ["General Services"],
    };
  }
  return detail;
}

/**
 * Mock API: Fetch all notes for a vendor
 * Real API would be: GET /vendors/notes/{vendor_id}
 */
async function mockFetchVendorNotes(vendorId: number): Promise<VendorNote[]> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 200));

  // Initialize notes for vendor if not exist
  if (!mockNotesStorage[vendorId]) {
    mockNotesStorage[vendorId] = [];
  }

  // Return notes sorted by date (newest first)
  return [...mockNotesStorage[vendorId]].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return dateB - dateA;
  });
}

/**
 * Mock API: Create a new note for a vendor
 * Real API would be: POST /vendors/notes/{vendor_id}
 */
async function mockCreateVendorNote(
  vendorId: number,
  text: string,
): Promise<VendorNote> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 200));

  if (!mockNotesStorage[vendorId]) {
    mockNotesStorage[vendorId] = [];
  }

  const newNote: VendorNote = {
    id: Date.now(),
    text,
    author: "Current User",
    date: new Date().toLocaleString(undefined, {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      second: undefined,
    }),
  };

  mockNotesStorage[vendorId].push(newNote);
  return newNote;
}

/**
 * Mock API: Update an existing note
 * Real API would be: PATCH /vendors/notes/{note_id}
 */
async function mockUpdateVendorNote(
  vendorId: number,
  noteId: number,
  text: string,
): Promise<VendorNote | null> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 200));

  if (!mockNotesStorage[vendorId]) return null;

  const note = mockNotesStorage[vendorId].find((n) => n.id === noteId);
  if (note) {
    note.text = text;
    note.date = new Date().toLocaleString(undefined, {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }
  return note || null;
}

/**
 * Mock API: Delete a note
 * Real API would be: DELETE /vendors/notes/{note_id}
 */
async function mockDeleteVendorNote(
  vendorId: number,
  noteId: number,
): Promise<boolean> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 200));

  if (!mockNotesStorage[vendorId]) return false;

  const idx = mockNotesStorage[vendorId].findIndex((n) => n.id === noteId);
  if (idx >= 0) {
    mockNotesStorage[vendorId].splice(idx, 1);
    return true;
  }
  return false;
}

/**
 * Mock API: Fetch all files for a vendor
 * Real API would be: GET /vendors/files/{vendor_id}
 */
async function mockFetchVendorFiles(vendorId: number): Promise<VendorFile[]> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 200));

  // Initialize files for vendor if not exist
  if (!mockFilesStorage[vendorId]) {
    mockFilesStorage[vendorId] = [];
  }

  return [...mockFilesStorage[vendorId]];
}

/**
 * Mock API: Upload a file for a vendor
 * Real API would be: POST /vendors/files/{vendor_id}
 */
async function mockUploadVendorFile(
  vendorId: number,
  file: File,
  category?: string,
  description?: string,
  fileName?: string,
): Promise<VendorFile> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 200));

  if (!mockFilesStorage[vendorId]) {
    mockFilesStorage[vendorId] = [];
  }

  const url = URL.createObjectURL(file);
  const newFile: VendorFile = {
    id: Date.now(),
    name: fileName || file.name,
    url,
    uploadedAt: new Date().toLocaleString(),
    type: file.type,
    category,
    description,
  };

  mockFilesStorage[vendorId].push(newFile);
  return newFile;
}

/**
 * Mock API: Update file metadata
 * Real API would be: PATCH /vendors/files/{file_id}
 */
async function mockUpdateVendorFile(
  vendorId: number,
  fileId: number,
  updates: Partial<Pick<VendorFile, "name" | "category" | "description">>,
): Promise<void> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 200));

  if (!mockFilesStorage[vendorId]) return;

  const file = mockFilesStorage[vendorId].find((f) => f.id === fileId);
  if (file) {
    if (updates.name !== undefined) file.name = updates.name;
    if (updates.category !== undefined) file.category = updates.category;
    if (updates.description !== undefined) file.description = updates.description;
  }
}

/**
 * Mock API: Delete a file
 * Real API would be: DELETE /vendors/files/{file_id}
 */
async function mockDeleteVendorFile(
  vendorId: number,
  fileId: number,
): Promise<void> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 200));

  if (!mockFilesStorage[vendorId]) return;

  const file = mockFilesStorage[vendorId].find((f) => f.id === fileId);
  if (file && file.url) {
    try {
      URL.revokeObjectURL(file.url);
    } catch {
      // ignore
    }
  }

  const idx = mockFilesStorage[vendorId].findIndex((f) => f.id === fileId);
  if (idx >= 0) {
    mockFilesStorage[vendorId].splice(idx, 1);
  }
}

// (compliance API functions moved above, near mock storage section)

/**
 * Mock API: Fetch all custom fields for a vendor
 * Real API would be: GET /vendors/custom-fields/{vendor_id}
 */
async function mockFetchVendorCustomFields(
  vendorId: number,
): Promise<VendorCustomField[]> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 200));

  if (!mockCustomFieldsStorage[vendorId]) {
    mockCustomFieldsStorage[vendorId] = [];
  }

  return [...mockCustomFieldsStorage[vendorId]];
}

/**
 * Mock API: Add custom field for a vendor
 * Real API would be: POST /vendors/custom-fields/{vendor_id}
 */
async function mockAddVendorCustomField(
  vendorId: number,
  name: string,
  value: string,
): Promise<VendorCustomField> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 200));

  if (!mockCustomFieldsStorage[vendorId]) {
    mockCustomFieldsStorage[vendorId] = [];
  }

  const newField: VendorCustomField = {
    id: Date.now(),
    name,
    value,
  };

  mockCustomFieldsStorage[vendorId].push(newField);
  return newField;
}

/**
 * Mock API: Delete custom field
 * Real API would be: DELETE /vendors/custom-fields/{field_id}
 */
async function mockDeleteVendorCustomField(
  vendorId: number,
  fieldId: number,
): Promise<void> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 200));

  if (!mockCustomFieldsStorage[vendorId]) return;

  const idx = mockCustomFieldsStorage[vendorId].findIndex((f) => f.id === fieldId);
  if (idx >= 0) {
    mockCustomFieldsStorage[vendorId].splice(idx, 1);
  }
}

export default function VendorDetail() {
  const { vendorId } = useParams<{ vendorId: string }>();
  const id = Number(vendorId);

  const location = useLocation();
  const routeVendor = (location.state as any)?.vendor ?? null;
  const { setVendorDisplayName } = usePropertyBreadcrumb();

  // Mock data state for vendor detail
  const [vendor, setVendor] = useState<VendorDetail | null>(() => {
    if (!routeVendor) return null;
  
    return {
      id: routeVendor.id,
      name: routeVendor.name,
      category: routeVendor.category ?? "Uncategorized",
      // Handle both 'email' (from list page) and 'primary_email' (from API) fields
      email: (routeVendor as any).email || routeVendor.primary_email || "",
      phone: routeVendor.phone ?? "",
      address: undefined,
      website: routeVendor.domain ?? undefined,
      servicesProvided: routeVendor.category
        ? [routeVendor.category]
        : [],
    };
  });
  
  // Fetch vendor detail if not provided via route state
  useEffect(() => {
    if (!vendor && id && !isNaN(id)) {
      (async () => {
        try {
          // Try to fetch from real API endpoint first
          // Note: This endpoint may not exist yet, so we fall back to mock
          let fetchedVendor: VendorDetail | null = null;
          try {
            const apiVendor = await fetchJSON(`/vendors/${id}`);
            // Map API response to VendorDetail format
            if (apiVendor) {
              fetchedVendor = {
                id: apiVendor.id,
                name: apiVendor.name,
                category: apiVendor.category || "Uncategorized",
                email: apiVendor.primary_email ?? "",
                phone: apiVendor.phone || "",
                address: undefined,
                website: apiVendor.domain || undefined,
                servicesProvided: apiVendor.category ? [apiVendor.category] : [],
              };
            }
          } catch (apiErr) {
            // API endpoint doesn't exist or failed, fall back to mock
            fetchedVendor = await mockFetchVendorDetail(id);
          }
          
          if (fetchedVendor) {
            setVendor(fetchedVendor);
          }
        } catch (err) {
          console.error("Failed to load vendor detail:", err);
        }
      })();
    }
  }, [vendor, id]);

  useEffect(() => {
    if (vendor?.name) setVendorDisplayName(vendor.name);
    return () => setVendorDisplayName(null);
  }, [vendor?.name, setVendorDisplayName]);

  // Mock data state for notes
  const [notes, setNotes] = useState<VendorNote[]>([]);

  // Mock data state for files
  const [mockFiles, setMockFiles] = useState<VendorFile[]>([]);


  // Load mock notes on mount
  useEffect(() => {
    (async () => {
      try {
        const fetchedNotes = await mockFetchVendorNotes(id);
        setNotes(fetchedNotes);
      } catch (err) {
        console.error("Failed to load notes");
      }
    })();
  }, [id]);

  // Load mock files on mount
  useEffect(() => {
    (async () => {
      try {
        const fetchedFiles = await mockFetchVendorFiles(id);
        setMockFiles(fetchedFiles);
      } catch (err) {
        console.error("Failed to load files");
      }
    })();
  }, [id]);

  // Mock note operations
  const addNote = useCallback(async (text: string) => {
    try {
      const newNote = await mockCreateVendorNote(id, text);
      setNotes((prev) => [newNote as VendorNote, ...prev]);
    } catch (err) {
      console.error("Failed to add note");
    }
  }, [id]);

  const removeNote = useCallback(async (noteId: number) => {
    try {
      await mockDeleteVendorNote(id, noteId);
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
    } catch (err) {
      console.error("Failed to delete note");
    }
  }, [id]);

  const editNote = useCallback(async (noteId: number, text: string) => {
    try {
      const updated = await mockUpdateVendorNote(id, noteId, text);
      if (updated) {
        setNotes((prev) =>
          prev.map((n) =>
            n.id === noteId
              ? {
                  ...n,
                  text: updated.text,
                  date: updated.date,
                }
              : n,
          ),
        );
      }
    } catch (err) {
      console.error("Failed to edit note");
    }
  }, [id]);

  // Mock file operations
  const uploadFile = useCallback(
    async (
      file: File,
      category?: string,
      description?: string,
      fileName?: string,
    ) => {
      try {
        const newFile = await mockUploadVendorFile(
          id,
          file,
          category,
          description,
          fileName,
        );
        setMockFiles((prev) => [...prev, newFile]);
      } catch (err) {
        console.error("Failed to upload file");
      }
    },
    [id],
  );

  const updateFile = useCallback(
    async (fileId: number, updates: Partial<Pick<VendorFile, "name" | "category" | "description">>) => {
      try {
        await mockUpdateVendorFile(id, fileId, updates);
        setMockFiles((prev) =>
          prev.map((f) =>
            f.id === fileId
              ? {
                  ...f,
                  ...updates,
                }
              : f,
          ),
        );
      } catch (err) {
        console.error("Failed to update file");
      }
    },
    [id],
  );

  const deleteFile = useCallback(async (fileId: number) => {
    try {
      await mockDeleteVendorFile(id, fileId);
      setMockFiles((prev) => prev.filter((f) => f.id !== fileId));
    } catch (err) {
      console.error("Failed to delete file");
    }
  }, [id]);

  // Mock data state for compliance documents
  const [compliance, setCompliance] = useState<VendorComplianceDoc[]>([]);

  // Mock data state for custom fields
  const [fields, setFields] = useState<VendorCustomField[]>([]);

  // Load compliance docs from API on mount
  useEffect(() => {
    (async () => {
      try {
        const fetched = await fetchVendorCompliance(id);
        setCompliance(fetched);
      } catch (err) {
        console.error("Failed to load compliance docs", err);
      }
    })();
  }, [id]);

  // Load mock custom fields on mount
  useEffect(() => {
    (async () => {
      try {
        const fetchedFields = await mockFetchVendorCustomFields(id);
        setFields(fetchedFields);
      } catch (err) {
        console.error("Failed to load custom fields");
      }
    })();
  }, [id]);

  // Compliance CRUD operations (live API)
  const addComplianceDoc = useCallback(
    async (doc: Omit<VendorComplianceDoc, "id">) => {
      try {
        const newDoc = await apiAddVendorCompliance(id, doc);
        setCompliance((prev) => [...prev, newDoc]);
      } catch (err) {
        console.error("Failed to add compliance document", err);
      }
    },
    [id],
  );

  const removeComplianceDoc = useCallback(async (docId: number) => {
    try {
      await apiDeleteVendorCompliance(docId);
      setCompliance((prev) => prev.filter((i) => i.id !== docId));
    } catch (err) {
      console.error("Failed to delete compliance document", err);
    }
  }, [id]);

  // Mock custom field operations
  const addField = useCallback(
    async (name: string, value: string) => {
      try {
        const newField = await mockAddVendorCustomField(id, name, value);
        setFields((prev) => [...prev, newField]);
      } catch (err) {
        console.error("Failed to add custom field");
      }
    },
    [id],
  );

  const removeField = useCallback(async (fieldId: number) => {
    try {
      await mockDeleteVendorCustomField(id, fieldId);
      setFields((prev) => prev.filter((f) => f.id !== fieldId));
    } catch (err) {
      console.error("Failed to delete custom field");
    }
  }, [id]);

  // Local state for UI
  const [isInactive, setIsInactive] = useState(false);
  const [selectedNote, setSelectedNote] = useState<VendorNote | null>(null);
  const [isAddEditNoteOpen, setIsAddEditNoteOpen] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [isViewNoteOpen, setIsViewNoteOpen] = useState(false);

  const [isAddComplianceOpen, setIsAddComplianceOpen] = useState(false);
  const [complianceDocType, setComplianceDocType] = useState<VendorComplianceDoc["documentType"]>("certificate_of_insurance");
  const [complianceDocName, setComplianceDocName] = useState("");
  const [complianceProvider, setComplianceProvider] = useState("");
  const [compliancePolicyNumber, setCompliancePolicyNumber] = useState("");
  const [complianceLicenseNumber, setComplianceLicenseNumber] = useState("");
  const [complianceExpirationDate, setComplianceExpirationDate] = useState("");
  const [complianceFileName, setComplianceFileName] = useState("");

  const [viewingComplianceDoc, setViewingComplianceDoc] = useState<VendorComplianceDoc | null>(null);
  const [isViewComplianceDocOpen, setIsViewComplianceDocOpen] = useState(false);

  const [isAddCustomFieldOpen, setIsAddCustomFieldOpen] = useState(false);
  const [customFieldName, setCustomFieldName] = useState("");
  const [customFieldValue, setCustomFieldValue] = useState("");

  const [selectedFile, setSelectedFile] = useState<VendorFile | null>(null);
  const [isViewFileOpen, setIsViewFileOpen] = useState(false);
  const [isAddFileOpen, setIsAddFileOpen] = useState(false);
  const [isEditingFile, setIsEditingFile] = useState(false);

  const [isEditVendorOpen, setIsEditVendorOpen] = useState(false);
  const [vendorDraft, setVendorDraft] = useState<VendorDetail | null>(null);

  const [isInactivateConfirmOpen, setIsInactivateConfirmOpen] = useState(false);
  const [isVendorActionsOpen, setIsVendorActionsOpen] = useState(false);

  // Sync vendorDraft with vendor when vendor data loads
  useEffect(() => {
    if (vendor) {
      setVendorDraft(vendor);
    }
  }, [vendor]);

  // Update mockFiles after successful upload (for non-editing flow)
  useEffect(() => {
    setMockFiles((prev) => {
      if (mockFiles.length !== prev.length) {
        return mockFiles;
      }
      return prev;
    });
  }, []);

  const handleConfirmInactivate = useDelayedAction({
    onClose: setIsInactivateConfirmOpen,
    onAction: () => setIsInactive((v) => !v),
    delayMs: 600,
  });

  const openAddNote = () => {
    setEditingNoteId(null);
    setIsAddEditNoteOpen(true);
  };

  const openEditNote = (note: VendorNote) => {
    setEditingNoteId(note.id);
    setIsAddEditNoteOpen(true);
  };

  const saveNote = async (text: string) => {
    const trimmedText = text.trim();
    if (!trimmedText) return;

    if (editingNoteId === null) {
      await addNote(trimmedText);
    } else {
      await editNote(editingNoteId, trimmedText);
    }

    setIsAddEditNoteOpen(false);
    setEditingNoteId(null);
  };

  const openEditVendor = () => {
    if (vendorDraft) {
      setIsEditVendorOpen(true);
    }
  };

  const handleAddCompliance = async () => {
    const docName = complianceDocName.trim();
    const expirationDate = complianceExpirationDate.trim();
    if (!docName || !expirationDate) return;

    await addComplianceDoc({
      documentType: complianceDocType,
      documentName: docName,
      provider: complianceProvider.trim() || undefined,
      policyNumber: compliancePolicyNumber.trim() || undefined,
      licenseNumber: complianceLicenseNumber.trim() || undefined,
      expirationDate,
      fileName: complianceFileName.trim() || undefined,
      uploadedBy: "Current User",
      uploadedAt: new Date().toLocaleString(undefined, {
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }),
    });

    setComplianceDocType("certificate_of_insurance");
    setComplianceDocName("");
    setComplianceProvider("");
    setCompliancePolicyNumber("");
    setComplianceLicenseNumber("");
    setComplianceExpirationDate("");
    setComplianceFileName("");
    setIsAddComplianceOpen(false);
  };

  const handleAddFile = async (
    files: UploadedFile[],
    category: string,
    description: string,
  ) => {
    if (files.length === 0) {
      return;
    }

    const fileObj = files[0];

    if (isEditingFile && selectedFile) {
      // Update existing file
      const updates: Partial<
        Pick<VendorFile, "name" | "category" | "description">
      > = {
        name: fileObj.name,
      };
      if (category) updates.category = category;
      if (description) updates.description = description;

      await updateFile(selectedFile.id, updates);
    } else {
      // Create new file
      if (fileObj?.file) {
        await uploadFile(
          fileObj.file,
          category || undefined,
          description || undefined,
          fileObj.name,
        );
      }
    }

    setIsEditingFile(false);
    setSelectedFile(null);
    setIsAddFileOpen(false);
  };

  const handleAddCustomField = async () => {
    const name = customFieldName.trim();
    const value = customFieldValue.trim();
    if (!name || !value) return;

    await addField(name, value);

    setCustomFieldName("");
    setCustomFieldValue("");
    setIsAddCustomFieldOpen(false);
  };

  const handleTabClick = (_tab: string) => {
    // reserved for future tab switching
  };

  if (!vendor) {
    return (
      <PageTemplate>
        <div className="flex items-center justify-center h-96">
          Vendor not found
        </div>
      </PageTemplate>
    );
  }
  

  return (
    <>
      <PageTemplate>
        <div className="flex flex-col gap-6 w-fit min-w-full">
          <PageHeader
            title={(vendorDraft || vendor).name}
            subtitle={
              <div className="flex items-center gap-3">
                <div className="text-[#717179] font-medium text-base leading-4">
                  Vendor
                </div>
                <svg
                  width="4"
                  height="4"
                  viewBox="0 0 4 4"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle cx="2" cy="2" r="2" fill="#717179" />
                </svg>
                <span className="text-[#717179] font-medium text-base leading-4">
                  {(vendorDraft || vendor).category}
                </span>
                <svg
                  width="4"
                  height="4"
                  viewBox="0 0 4 4"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle cx="2" cy="2" r="2" fill="#717179" />
                </svg>
                <button
                  onClick={openEditVendor}
                  className="text-[#1357D5] font-medium text-base leading-[1.4] hover:underline bg-none border-none cursor-pointer p-0"
                >
                  Edit
                </button>
              </div>
            }
            actionButton={{
              label: isInactive ? "Activate Vendor" : "Inactivate Vendor",
              onClick: () => setIsInactivateConfirmOpen(true),
            }}
            moreOptions={{
              onView: () => setIsVendorActionsOpen(true),
            }}
          />

          <div className="flex items-start gap-6 min-h-[36px] w-full border-b border-[#e5e5e5] font-['Geist',sans-serif] text-base text-[#717179] font-medium flex-nowrap overflow-x-auto">
            <button
              onClick={() => handleTabClick("Overview")}
              className={`flex items-center gap-1.5 py-2 whitespace-nowrap border-b-2 border-[#09090b] text-[#09090b] transition-colors`}
            >
              Overview
            </button>
          </div>

          <div className="flex items-start gap-6">
            <div className="flex-1 min-w-[240px] w-full">
              <SectionGroupCardTemplate>
                {/* Vendor Information Section */}
                <DataSectionTemplate
                  title="Vendor Information"
                  subsections={[
                    {
                      title: "",
                      fields: [
                        {
                          label: "EMAIL",
                          value: (vendorDraft || vendor).email,
                          icon: (vendorDraft || vendor).email ? (
                            <EmailIcon width={14} height={14} />
                          ) : undefined,
                        },
                        {
                          label: "PHONE",
                          value: (vendorDraft || vendor).phone,
                        },
                        {
                          label: "ADDRESS",
                          value: (vendorDraft || vendor).address,
                        },
                        {
                          label: "WEBSITE",
                          value: (vendorDraft || vendor).website,
                        },
                        {
                          label: "SERVICES PROVIDED",
                          value: (vendorDraft || vendor).servicesProvided,
                        },
                      ],
                    },
                  ]}
                  onEdit={openEditVendor}
                  isLast={false}
                />

                {/* Vendor Compliance Section */}
                <SectionRowTemplate isLast={false}>
                  <div className="flex items-center justify-between gap-4 flex-wrap font-medium">
                    <h2 className="text-[#303030] text-xl font-medium leading-[1.1]">
                      Vendor Compliance
                    </h2>
                    <SectionActionTemplate
                      label="Add"
                      onClick={() => setIsAddComplianceOpen(true)}
                    />
                  </div>

                  {compliance.length === 0 ? (
                    <EmptyStateTemplate message="No vendor compliance documents on file." />
                  ) : (
                    <RecordListTemplate>
                      {compliance.map((doc, idx) => {
                        const typeLabels: Record<string, string> = {
                          certificate_of_insurance: "Certificate of Insurance",
                          w9: "W-9",
                          "1099": "1099",
                          business_license: "Business License",
                          avm_agreement: "AVM Agreement",
                          contractors_license: "Contractor's License",
                          other: "Other",
                        };
                        const isExpiringSoon = (() => {
                          const parts = doc.expirationDate.split("/");
                          if (parts.length !== 3) return false;
                          const expDate = new Date(+parts[2], +parts[0] - 1, +parts[1]);
                          const daysLeft = Math.ceil((expDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                          return daysLeft <= 30 && daysLeft >= 0;
                        })();
                        const isExpired = (() => {
                          const parts = doc.expirationDate.split("/");
                          if (parts.length !== 3) return false;
                          const expDate = new Date(+parts[2], +parts[0] - 1, +parts[1]);
                          return expDate.getTime() < Date.now();
                        })();
                        return (
                          <RecordRowTemplate
                            key={doc.id}
                            isLast={idx === compliance.length - 1}
                            leftSlot={
                              <div className="flex-1 text-[#303030] text-sm font-normal leading-[1.29]">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{doc.documentName}</span>
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 font-medium">
                                    {typeLabels[doc.documentType] || doc.documentType}
                                  </span>
                                  {isExpired && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-medium">
                                      Expired
                                    </span>
                                  )}
                                  {isExpiringSoon && !isExpired && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700 font-medium">
                                      Expiring Soon
                                    </span>
                                  )}
                                </div>
                                {doc.provider && (
                                  <div className="text-[#71717A] text-xs mt-1">
                                    Provider: {doc.provider}
                                    {doc.policyNumber && ` • Policy: ${doc.policyNumber}`}
                                  </div>
                                )}
                                <div className="text-[#71717A] text-xs mt-1">
                                  Expires: {doc.expirationDate}
                                </div>
                                {doc.fileName && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setViewingComplianceDoc(doc);
                                      setIsViewComplianceDocOpen(true);
                                    }}
                                    className="text-[#1357D5] text-xs mt-1 flex items-center gap-1 hover:underline bg-transparent border-none cursor-pointer p-0"
                                  >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                                    {doc.fileName}
                                  </button>
                                )}
                                <div className="text-[#A1A1AA] text-[11px] mt-1.5">
                                  Uploaded by {doc.uploadedBy} on {doc.uploadedAt}
                                </div>
                              </div>
                            }
                          />
                        );
                      })}
                    </RecordListTemplate>
                  )}
                </SectionRowTemplate>

                {/* Custom Fields Section */}
                <SectionRowTemplate isLast={false}>
                  <div className="flex items-center justify-between gap-4 flex-wrap font-medium">
                    <h2 className="text-[#303030] text-xl font-medium leading-[1.1]">
                      Custom Fields
                    </h2>
                    <SectionActionTemplate
                      label="Add"
                      onClick={() => setIsAddCustomFieldOpen(true)}
                    />
                  </div>

                  {fields.length === 0 ? (
                    <EmptyStateTemplate message="There are no custom fields created to track additional information in this location. Contact your administrator to add custom fields." />
                  ) : (
                    <RecordListTemplate>
                      {fields.map((field, idx) => (
                        <RecordRowTemplate
                          key={field.id}
                          isLast={idx === fields.length - 1}
                          leftSlot={
                            <div className="flex gap-6 flex-1">
                              <div className="text-[#303030] text-sm font-normal leading-[1.29] w-[220px]">
                                <div className="font-medium">{field.name}</div>
                                <div className="text-[#71717A] text-xs mt-1">
                                  {field.value}
                                </div>
                              </div>
                            </div>
                          }
                        />
                      ))}
                    </RecordListTemplate>
                  )}
                </SectionRowTemplate>

                {/* Recent Notes Section */}
                <NotesTemplate
                  notes={notes}
                  onAdd={openAddNote}
                  onEdit={(note) => {
                    setSelectedNote(note);
                    setIsViewNoteOpen(true);
                  }}
                  onDelete={removeNote}
                  isLast={false}
                  emptyMessage="You don't have any notes for this vendor right now."
                />

                {/* Recent Files Section */}
                <FilesTemplate
                  files={mockFiles}
                  onAdd={() => {
                    setIsEditingFile(false);
                    setSelectedFile(null);
                    setIsAddFileOpen(true);
                  }}
                  onEdit={(file) => {
                    setSelectedFile(file);
                    setIsEditingFile(true);
                    setIsAddFileOpen(true);
                  }}
                  onDelete={deleteFile}
                  onView={(file) => {
                    setSelectedFile(file);
                    setIsViewFileOpen(true);
                  }}
                  isLast={true}
                  emptyMessage="You don't have any files for this vendor right now."
                />
              </SectionGroupCardTemplate>
            </div>
          </div>
        </div>
      </PageTemplate>

      {/* File Preview Modal */}
      <PdfViewerModal
        open={isViewFileOpen}
        onOpenChange={(open) => {
          setIsViewFileOpen(open);
          if (!open) setSelectedFile(null);
        }}
        title={selectedFile?.name || "File Preview"}
        url={selectedFile?.url}
      />

      {/* Compliance Document Preview Modal */}
      <PdfViewerModal
        open={isViewComplianceDocOpen}
        onOpenChange={(open) => {
          setIsViewComplianceDocOpen(open);
          if (!open) setViewingComplianceDoc(null);
        }}
        title={viewingComplianceDoc?.fileName || "Document Preview"}
        url={viewingComplianceDoc?.fileUrl}
      />

      {/* Add/Edit Note Modal */}
      <AddNoteModal
        open={isAddEditNoteOpen}
        onOpenChange={(open) => {
          setIsAddEditNoteOpen(open);
          if (!open) {
            setEditingNoteId(null);
          }
        }}
        initialText={editingNoteId !== null ? selectedNote?.text || "" : ""}
        isEditMode={editingNoteId !== null}
        onSubmit={saveNote}
      />

      {/* View Note Dialog */}
      <ModalTemplate
        open={isViewNoteOpen}
        onOpenChange={(open) => {
          setIsViewNoteOpen(open);
          if (!open) setSelectedNote(null);
        }}
        title="Note Details"
        size="sm"
        footer={
          <ModalButtons
            onCancel={() => setIsViewNoteOpen(false)}
            onConfirm={() => {
              if (selectedNote) {
                openEditNote(selectedNote);
                setIsViewNoteOpen(false);
              }
            }}
            cancelLabel="Close"
            confirmLabel="Edit"
          />
        }
      >
        {selectedNote ? (
          <FormLayout>
            <FormSection showDivider={false}>
              <div className="text-[#303030] whitespace-pre-line p-3 bg-gray-50 rounded-lg">
                {selectedNote.text}
              </div>
              <div className="text-sm text-[#71717A]">
                <span className="font-medium">Author:</span>{" "}
                {selectedNote.author}
              </div>
              <div className="text-sm text-[#71717A]">
                <span className="font-medium">Date:</span> {selectedNote.date}
              </div>
            </FormSection>
          </FormLayout>
        ) : null}
      </ModalTemplate>

      {/* Add Compliance Document Dialog */}
      <ModalTemplate
        open={isAddComplianceOpen}
        onOpenChange={(open) => {
          setIsAddComplianceOpen(open);
          if (!open) {
            setComplianceDocType("certificate_of_insurance");
            setComplianceDocName("");
            setComplianceProvider("");
            setCompliancePolicyNumber("");
            setComplianceExpirationDate("");
            setComplianceFileName("");
          }
        }}
        title="Add Compliance Document"
        size="sm"
        footer={
          <ModalButtons
            onCancel={() => {
              setComplianceDocType("certificate_of_insurance");
              setComplianceDocName("");
              setComplianceProvider("");
              setCompliancePolicyNumber("");
              setComplianceExpirationDate("");
              setComplianceFileName("");
              setIsAddComplianceOpen(false);
            }}
            onConfirm={handleAddCompliance}
            cancelLabel="Cancel"
            confirmLabel="Save"
            confirmDisabled={
              complianceDocName.trim().length === 0 ||
              complianceExpirationDate.trim().length === 0
            }
          />
        }
      >
        <FormLayout>
          <FormSection showDivider={false}>
            <SelectField
              label="Document Type"
              value={complianceDocType}
              onChange={(val) => setComplianceDocType((typeof val === "string" ? val : val[0]) as VendorComplianceDoc["documentType"])}
              options={[
                { value: "certificate_of_insurance", label: "Certificate of Insurance" },
                { value: "w9", label: "W-9" },
                { value: "1099", label: "1099" },
                { value: "business_license", label: "Business License" },
                { value: "avm_agreement", label: "AVM Agreement" },
                { value: "contractors_license", label: "Contractor's License" },
                { value: "other", label: "Other" },
              ]}
            />

            <TextField
              label="Document Name"
              value={complianceDocName}
              onChange={(e) => setComplianceDocName(e.target.value)}
              placeholder="e.g. General Liability Insurance"
            />

            {(complianceDocType === "certificate_of_insurance") && (
              <>
                <TextField
                  label="Provider"
                  value={complianceProvider}
                  onChange={(e) => setComplianceProvider(e.target.value)}
                  placeholder="Insurance provider"
                />
                <TextField
                  label="Policy Number"
                  value={compliancePolicyNumber}
                  onChange={(e) => setCompliancePolicyNumber(e.target.value)}
                  placeholder="Policy number"
                />
              </>
            )}

            {complianceDocType === "contractors_license" && (
              <TextField
                label="License Number"
                value={complianceLicenseNumber}
                onChange={(e) => setComplianceLicenseNumber(e.target.value)}
                placeholder="e.g. 1045328"
              />
            )}

            <TextField
              label="Expiration Date"
              value={complianceExpirationDate}
              onChange={(e) => setComplianceExpirationDate(e.target.value)}
              placeholder="mm/dd/yyyy"
            />

            <div>
              <label className="block text-sm font-medium text-[#303030] mb-1.5">
                Upload Document
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setComplianceFileName(file.name);
                  }}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border file:border-gray-300 file:text-sm file:font-medium file:bg-white file:text-gray-700 hover:file:bg-gray-50 file:cursor-pointer"
                />
              </div>
              {complianceFileName && (
                <p className="text-xs text-[#71717A] mt-1">{complianceFileName}</p>
              )}
            </div>
          </FormSection>
        </FormLayout>
      </ModalTemplate>

      {/* Add Custom Field Dialog */}
      <ModalTemplate
        open={isAddCustomFieldOpen}
        onOpenChange={(open) => {
          setIsAddCustomFieldOpen(open);
          if (!open) {
            setCustomFieldName("");
            setCustomFieldValue("");
          }
        }}
        title="Add Custom Field"
        size="sm"
        footer={
          <ModalButtons
            onCancel={() => {
              setCustomFieldName("");
              setCustomFieldValue("");
              setIsAddCustomFieldOpen(false);
            }}
            onConfirm={handleAddCustomField}
            cancelLabel="Cancel"
            confirmLabel="Save"
            confirmDisabled={
              customFieldName.trim().length === 0 ||
              customFieldValue.trim().length === 0
            }
          />
        }
      >
        <FormLayout>
          <FormSection showDivider={false}>
            <TextField
              label="Field Name"
              value={customFieldName}
              onChange={(e) => setCustomFieldName(e.target.value)}
              placeholder="Field name"
            />

            <TextField
              label="Value"
              value={customFieldValue}
              onChange={(e) => setCustomFieldValue(e.target.value)}
              placeholder="Value"
            />
          </FormSection>
        </FormLayout>
      </ModalTemplate>

      {/* Add/Edit File Modal */}
      <AddFileModal
        open={isAddFileOpen}
        onOpenChange={(open) => {
          setIsAddFileOpen(open);
          if (!open) {
            setIsEditingFile(false);
            setSelectedFile(null);
          }
        }}
        initialFiles={
          isEditingFile && selectedFile
            ? [
                {
                  id: String(selectedFile.id),
                  name: selectedFile.name,
                  size: 0,
                  type: selectedFile.type || "",
                  url: selectedFile.url,
                },
              ]
            : []
        }
        initialCategory={
          isEditingFile && selectedFile ? selectedFile.category || "" : ""
        }
        initialDescription={
          isEditingFile && selectedFile ? selectedFile.description || "" : ""
        }
        isEditMode={isEditingFile}
        onSubmit={handleAddFile}
      />

      {/* Edit Vendor Dialog */}
      <AddVendorModal
        open={isEditVendorOpen}
        onOpenChange={setIsEditVendorOpen}
        edit={true}
        initialVendor={vendorDraft || undefined}
        onEditVendor={(updatedVendor) => {
          if (vendor) {
            const updatedVendorData = {
              ...vendor,
              name: updatedVendor.name,
              email: updatedVendor.email,
              phone: updatedVendor.phone,
              website: updatedVendor.website,
              servicesProvided: updatedVendor.servicesProvided,
            };
            // Update main vendor data for display
            // In a real app, this would call an API to persist changes
            setVendorDraft(updatedVendorData);
          }
          setIsEditVendorOpen(false);
        }}
      />

      {/* Inactivate Confirmation Dialog */}
      <ConfirmDialog
        open={isInactivateConfirmOpen}
        onOpenChange={setIsInactivateConfirmOpen}
        title={isInactive ? "Activate Vendor" : "Inactivate Vendor"}
        message={
          isInactive
            ? "Activating will make this vendor available for new work orders and tasks."
            : "Inactivating will prevent this vendor from being used for new work orders and tasks."
        }
        confirmLabel={isInactive ? "Activate" : "Inactivate"}
        onConfirm={handleConfirmInactivate}
      />

      <VendorActionsModal
        open={isVendorActionsOpen}
        onOpenChange={setIsVendorActionsOpen}
      />
    </>
  );
}
