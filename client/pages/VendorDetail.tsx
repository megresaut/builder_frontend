import { useState, useEffect, useRef } from "react";
import { useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { usePropertyBreadcrumb } from "@/hooks/PropertyBreadcrumbContext";
import { fetchJSON, authFetch, API_BASE } from "@/api/fetchJSON";
import { toast } from "sonner";

import PageTemplate from "@/layout/PageTemplate";
import PageHeader from "@/components/PageHeader";
import PdfViewerModal from "@/components/PdfViewerModal";
import VendorActionsModal from "@/components/VendorActionsModal";
import AddVendorModal from "@/components/AddVendorModal";
import AddNoteModal from "@/components/AddNoteModal";
import AddFileModal from "@/components/AddFileModal";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useDelayedAction } from "@/hooks/useDelayedAction";
import { EmailIcon, EditIcon, DeleteIcon } from "@/components/icons";
import PopoverActionsDropdown from "@/components/PopoverActionsDropdown";
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
  altEmail?: string;
  phone: string;
  altPhone?: string;
  address?: string;
  website?: string;
  hourlyRate?: number | null;
  emergencyHourlyRate?: number | null;
  notes?: string;
  servicesProvided?: string | string[];
  serviceAreaTags?: string[];
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

type VendorTab = "Overview" | "Performance";

interface VendorPerformanceAPI {
  work_orders_total: number;
  work_orders_completed: number;
  work_orders_in_progress: number;
  work_orders_open: number;
  avg_cost: number | null;
  avg_completion_days: number | null;
  avg_response_hours: number | null;
  avg_rating: number | null;
  total_ratings: number;
  outstanding_compliance_docs: number;
  required_compliance_docs: number;
  recent_work_orders: {
    id: number;
    task_id: number;
    name: string;
    property_name: string | null;
    status: string;
    actual_cost: number | null;
    completed_at: string | null;
    created_at: string;
    rating: number | null;
  }[];
  bills_total: number;
  bills_amount_cents: number;
  bills: {
    id: number;
    invoice_number: string | null;
    statement_date: string;
    due_date: string | null;
    amount_cents: number;
    property_id: number | null;
    property_name: string | null;
    push_status: string | null;
    memo: string | null;
    pdf_object_key: string | null;
    created_at: string;
  }[];
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

async function apiUploadComplianceFile(file: File): Promise<{ object_key: string; mime: string; filename: string }> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await authFetch(`/vendors/compliance/upload`, {
    method: "POST",
    body: fd,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "upload failed");
  }
  return res.json();
}

async function apiAddVendorCompliance(
  vendorId: number,
  doc: Omit<VendorComplianceDoc, "id">,
  uploadInfo?: { object_key: string; mime: string; filename: string },
): Promise<VendorComplianceDoc> {
  const body: Record<string, any> = {
    document_type: doc.documentType,
    document_name: doc.documentName,
    provider: doc.provider || "",
    policy_number: doc.policyNumber || "",
    license_number: doc.licenseNumber || "",
    expiration_date: toISODate(doc.expirationDate),
  };
  if (uploadInfo) {
    body.document_object_key = uploadInfo.object_key;
    body.document_mime = uploadInfo.mime;
    body.file_name = uploadInfo.filename;
  }
  const resp: BackendComplianceDoc = await fetchJSON(`/vendors/compliance/docs/${vendorId}`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  // Use the canonical mapper so uploaded_by + file_url match the rest of the
  // list (avoids the "Uploaded by You" vs "Uploaded by <real name>" drift).
  return mapBackendDoc(resp);
}

async function apiDeleteVendorCompliance(docId: number): Promise<void> {
  await fetchJSON(`/vendors/compliance/docs/delete/${docId}`, {
    method: "DELETE",
  });
}

async function apiUpdateVendorCompliance(
  docId: number,
  patch: Partial<Omit<VendorComplianceDoc, "id" | "uploadedBy" | "uploadedAt">>,
): Promise<VendorComplianceDoc> {
  const body: Record<string, any> = {};
  if (patch.documentType !== undefined) body.document_type = patch.documentType;
  if (patch.documentName !== undefined) body.document_name = patch.documentName;
  if (patch.provider !== undefined) body.provider = patch.provider;
  if (patch.policyNumber !== undefined) body.policy_number = patch.policyNumber;
  if (patch.licenseNumber !== undefined) body.license_number = patch.licenseNumber;
  if (patch.expirationDate !== undefined) body.expiration_date = toISODate(patch.expirationDate);
  const resp: BackendComplianceDoc = await fetchJSON(`/vendors/compliance/docs/update/${docId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  return mapBackendDoc(resp);
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

// ============================================================================
// KPI Sub-components
// ============================================================================

function KpiStatCard({ label, value, subtitle, accent }: {
  label: string;
  value: string | number;
  subtitle?: string;
  accent?: "green" | "blue" | "yellow" | "red" | "gray";
}) {
  const accentColors: Record<string, string> = {
    green: "border-l-emerald-500",
    blue: "border-l-blue-500",
    yellow: "border-l-yellow-500",
    red: "border-l-red-500",
    gray: "border-l-gray-400",
  };
  return (
    <div className={`bg-white rounded-lg border border-[#e5e5e5] border-l-4 ${accentColors[accent || "blue"]} p-5`}>
      <div className="text-2xl font-semibold text-[#09090b]">{value}</div>
      <div className="text-sm text-[#71717A] mt-1">{label}</div>
      {subtitle && <div className="text-xs text-[#A1A1AA] mt-0.5">{subtitle}</div>}
    </div>
  );
}

function StarRating({ rating, max = 5 }: { rating: number | null; max?: number }) {
  if (rating === null) {
    return <span className="text-sm text-[#71717A]">No ratings yet</span>;
  }
  const filled = Math.round(rating);
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <svg key={i} width="18" height="18" viewBox="0 0 24 24" fill={i < filled ? "#f59e0b" : "none"} stroke={i < filled ? "#f59e0b" : "#d1d5db"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
      <span className="text-sm text-[#71717A] ml-1.5">{rating.toFixed(1)} / {max}.0</span>
    </div>
  );
}

function WorkOrderStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    completed: "bg-emerald-100 text-emerald-700",
    in_progress: "bg-blue-100 text-blue-700",
    cancelled: "bg-red-100 text-red-600",
  };
  const labels: Record<string, string> = {
    completed: "Completed",
    in_progress: "In Progress",
    new: "Open",
    sent: "Sent",
    scheduled: "Scheduled",
    cancelled: "Cancelled",
  };
  const style = styles[status] ?? "bg-gray-100 text-gray-600";
  const label = labels[status] ?? status.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${style}`}>
      {label}
    </span>
  );
}


function VendorPerformanceTab({ vendorId }: { vendorId: number }) {
  const navigate = useNavigate();
  const [perf, setPerf] = useState<VendorPerformanceAPI | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchJSON(`/vendors/performance/${vendorId}`)
      .then(setPerf)
      .catch(() => setPerf(null))
      .finally(() => setLoading(false));
  }, [vendorId]);

  if (loading) {
    return <div className="text-sm text-[#71717A] py-8 text-center">Loading performance data...</div>;
  }
  if (!perf) {
    return <div className="text-sm text-[#71717A] py-8 text-center">Failed to load performance data.</div>;
  }

  const total = perf.work_orders_total || 1; // avoid divide-by-zero in progress bars

  return (
    <div className="flex flex-col gap-6">
      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiStatCard
          label="Work Orders Completed"
          value={perf.work_orders_completed}
          subtitle={`${perf.work_orders_total} total`}
          accent="green"
        />
        <KpiStatCard
          label="Avg. Work Order Cost"
          value={perf.avg_cost != null ? `$${perf.avg_cost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—"}
          accent="blue"
        />
        <KpiStatCard
          label="Outstanding Compliance Docs"
          value={perf.outstanding_compliance_docs}
          subtitle={`of ${perf.required_compliance_docs} required`}
          accent={perf.outstanding_compliance_docs > 0 ? "red" : "green"}
        />
        <KpiStatCard
          label="Avg. Response Time"
          value={perf.avg_response_hours != null ? `${Math.round(perf.avg_response_hours)}h` : "—"}
          subtitle={perf.avg_completion_days != null ? `${perf.avg_completion_days.toFixed(1)} day avg. completion` : undefined}
          accent="blue"
        />
      </div>

      {/* Rating + Completion Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Vendor Rating */}
        <SectionGroupCardTemplate>
          <SectionRowTemplate isLast={true}>
            <h2 className="text-[#303030] text-xl font-medium leading-[1.1] mb-3">Vendor Rating</h2>
            <StarRating rating={perf.avg_rating} />
            <p className="text-sm text-[#71717A] mt-2">
              Based on {perf.total_ratings} completed work order evaluation{perf.total_ratings !== 1 ? "s" : ""}
            </p>
          </SectionRowTemplate>
        </SectionGroupCardTemplate>

        {/* Work Order Breakdown */}
        <SectionGroupCardTemplate>
          <SectionRowTemplate isLast={true}>
            <h2 className="text-[#303030] text-xl font-medium leading-[1.1] mb-3">Work Order Breakdown</h2>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#303030]">Completed</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${(perf.work_orders_completed / total) * 100}%` }} />
                  </div>
                  <span className="text-sm font-medium text-[#303030] w-8 text-right">{perf.work_orders_completed}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#303030]">In Progress</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full bg-blue-500" style={{ width: `${(perf.work_orders_in_progress / total) * 100}%` }} />
                  </div>
                  <span className="text-sm font-medium text-[#303030] w-8 text-right">{perf.work_orders_in_progress}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#303030]">Open</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full bg-gray-400" style={{ width: `${(perf.work_orders_open / total) * 100}%` }} />
                  </div>
                  <span className="text-sm font-medium text-[#303030] w-8 text-right">{perf.work_orders_open}</span>
                </div>
              </div>
            </div>
          </SectionRowTemplate>
        </SectionGroupCardTemplate>
      </div>

      {/* Recent Work Orders Table */}
      <SectionGroupCardTemplate>
        <SectionRowTemplate isLast={true}>
          <h2 className="text-[#303030] text-xl font-medium leading-[1.1] mb-3">Recent Work Orders</h2>
          {perf.recent_work_orders.length === 0 ? (
            <p className="text-sm text-[#71717A]">No work orders found for this vendor.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#e5e5e5]">
                    <th className="text-left py-2 pr-4 font-medium text-[#71717A] text-xs uppercase tracking-wider">Work Order</th>
                    <th className="text-left py-2 pr-4 font-medium text-[#71717A] text-xs uppercase tracking-wider">Property</th>
                    <th className="text-left py-2 pr-4 font-medium text-[#71717A] text-xs uppercase tracking-wider">Status</th>
                    <th className="text-right py-2 font-medium text-[#71717A] text-xs uppercase tracking-wider">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {perf.recent_work_orders.map((wo) => (
                    <tr
                      key={wo.id}
                      className="border-b border-[#f4f4f5] last:border-b-0 hover:bg-[#f9f9f9] cursor-pointer"
                      onClick={() => navigate(`/tasks/${wo.task_id}/workorders/${wo.id}`)}
                    >
                      <td className="py-2.5 pr-4 text-[#303030] font-medium">{wo.name}</td>
                      <td className="py-2.5 pr-4 text-[#71717A]">{wo.property_name ?? "—"}</td>
                      <td className="py-2.5 pr-4"><WorkOrderStatusBadge status={wo.status} /></td>
                      <td className="py-2.5 text-right text-[#303030]">
                        {wo.actual_cost != null
                          ? `$${wo.actual_cost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionRowTemplate>
      </SectionGroupCardTemplate>

      {/* Bills */}
      <SectionGroupCardTemplate>
        <SectionRowTemplate isLast={true}>
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-[#303030] text-xl font-medium leading-[1.1]">Bills</h2>
            {perf.bills_total > 0 && (
              <div className="text-xs text-[#71717A]">
                {perf.bills_total} bill{perf.bills_total === 1 ? "" : "s"} ·
                {" "}Total: ${(perf.bills_amount_cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            )}
          </div>
          {perf.bills.length === 0 ? (
            <p className="text-sm text-[#71717A]">No bills associated with this vendor.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#e5e5e5]">
                    <th className="text-left py-2 pr-4 font-medium text-[#71717A] text-xs uppercase tracking-wider">Invoice #</th>
                    <th className="text-left py-2 pr-4 font-medium text-[#71717A] text-xs uppercase tracking-wider">Statement Date</th>
                    <th className="text-left py-2 pr-4 font-medium text-[#71717A] text-xs uppercase tracking-wider">Due Date</th>
                    <th className="text-left py-2 pr-4 font-medium text-[#71717A] text-xs uppercase tracking-wider">Property</th>
                    <th className="text-left py-2 pr-4 font-medium text-[#71717A] text-xs uppercase tracking-wider">Status</th>
                    <th className="text-right py-2 font-medium text-[#71717A] text-xs uppercase tracking-wider">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {perf.bills.map((b) => {
                    const stmt = b.statement_date ? new Date(b.statement_date).toLocaleDateString() : "—";
                    const due = b.due_date ? new Date(b.due_date).toLocaleDateString() : "—";
                    return (
                      <tr
                        key={b.id}
                        className="border-b border-[#f4f4f5] last:border-b-0 hover:bg-[#f9f9f9] cursor-pointer"
                        onClick={() => navigate(`/bills/record?readOnly=true&billId=${b.id}`)}
                      >
                        <td className="py-2.5 pr-4 text-[#303030] font-medium">{b.invoice_number ?? "—"}</td>
                        <td className="py-2.5 pr-4 text-[#71717A]">{stmt}</td>
                        <td className="py-2.5 pr-4 text-[#71717A]">{due}</td>
                        <td className="py-2.5 pr-4 text-[#71717A]">{b.property_name ?? "—"}</td>
                        <td className="py-2.5 pr-4 text-[#71717A]">{b.push_status || "—"}</td>
                        <td className="py-2.5 text-right text-[#303030]">
                          ${(b.amount_cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </SectionRowTemplate>
      </SectionGroupCardTemplate>
    </div>
  );
}

export default function VendorDetail() {
  const { vendorId } = useParams<{ vendorId: string }>();
  const id = Number(vendorId);

  const location = useLocation();
  const routeVendor = (location.state as any)?.vendor ?? null;
  const { setVendorDisplayName } = usePropertyBreadcrumb();

  const [activeTab, setActiveTab] = useState<VendorTab>("Overview");

  const mapApiVendor = useCallback((apiVendor: any): VendorDetail => ({
    id: apiVendor.id,
    name: apiVendor.name,
    category: apiVendor.category || "Uncategorized",
    email: apiVendor.primary_email ?? "",
    altEmail: apiVendor.alt_email ?? undefined,
    phone: apiVendor.phone ?? "",
    altPhone: apiVendor.alt_phone ?? undefined,
    address: apiVendor.address ?? undefined,
    website: apiVendor.website ?? undefined,
    hourlyRate: apiVendor.hourly_rate_cents ?? null,
    emergencyHourlyRate: apiVendor.emergency_hourly_rate_cents ?? null,
    notes: apiVendor.notes ?? undefined,
    servicesProvided: apiVendor.category
      ? String(apiVendor.category).split(",").map((s: string) => s.trim()).filter(Boolean)
      : [],
    serviceAreaTags: Array.isArray(apiVendor.service_area_tags)
      ? apiVendor.service_area_tags
      : [],
  }), []);

  // Mock data state for vendor detail
  const [vendor, setVendor] = useState<VendorDetail | null>(() => {
    if (!routeVendor) return null;

    return {
      id: routeVendor.id,
      name: routeVendor.name,
      category: routeVendor.category ?? "Uncategorized",
      // Handle both 'email' (from list page) and 'primary_email' (from API) fields
      email: (routeVendor as any).email || routeVendor.primary_email || "",
      altEmail: (routeVendor as any).alt_email ?? (routeVendor as any).altEmail ?? undefined,
      phone: routeVendor.phone ?? "",
      altPhone: (routeVendor as any).alt_phone ?? (routeVendor as any).altPhone ?? undefined,
      address: routeVendor.address ?? undefined,
      website: routeVendor.website ?? undefined,
      hourlyRate: (routeVendor as any).hourly_rate_cents ?? (routeVendor as any).hourlyRate ?? null,
      emergencyHourlyRate:
        (routeVendor as any).emergency_hourly_rate_cents ?? (routeVendor as any).emergencyHourlyRate ?? null,
      notes: routeVendor.notes ?? undefined,
      servicesProvided: routeVendor.category
        ? [routeVendor.category]
        : [],
      serviceAreaTags: Array.isArray((routeVendor as any).service_area_tags)
        ? (routeVendor as any).service_area_tags
        : Array.isArray((routeVendor as any).serviceAreaTags)
        ? (routeVendor as any).serviceAreaTags
        : [],
    };
  });

  const refreshVendor = useCallback(async () => {
    if (!id || isNaN(id)) return;
    try {
      const apiVendor = await fetchJSON(`/vendors/${id}`);
      if (apiVendor) {
        setVendor(mapApiVendor(apiVendor));
        setIsInactive(!!apiVendor.deactivated_at);
      }
    } catch (err) {
      console.error("Failed to refresh vendor:", err);
    }
  }, [id, mapApiVendor]);

  // Always fetch the full vendor record from the API on mount, even when a
  // partial vendor was supplied via route state. The list page only carries a
  // few columns, so without this the Edit Vendor modal opens with empty
  // fields for website/address/hourly_rate/notes — making it look like saves
  // aren't persisting when in fact they are.
  useEffect(() => {
    if (id && !isNaN(id)) {
      (async () => {
        try {
          let fetchedVendor: VendorDetail | null = null;
          try {
            const apiVendor = await fetchJSON(`/vendors/${id}`);
            if (apiVendor) fetchedVendor = mapApiVendor(apiVendor);
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
    // Intentionally exclude `vendor` from deps — the previous gate prevented
    // an infinite loop, but it also stopped the fetch entirely whenever route
    // state pre-filled vendor. Now we run once per id change, which is what
    // we want.
  }, [id, mapApiVendor]);

  useEffect(() => {
    if (vendor?.name) setVendorDisplayName(vendor.name);
    return () => setVendorDisplayName(null);
  }, [vendor?.name, setVendorDisplayName]);

  // Mock data state for notes
  const [notes, setNotes] = useState<VendorNote[]>([]);

  // Mock data state for files
  const [mockFiles, setMockFiles] = useState<VendorFile[]>([]);


  // Map backend vendor note → NotesTemplate-compatible shape.
  // Backend returns { id, vendor_id, author_id, author_name, note, note_type, created_at }
  // NotesTemplate expects { id, text, date, author }.
  const mapApiNote = useCallback((n: any): VendorNote => ({
    id: n.id,
    text: n.note ?? "",
    author: n.author_name || "Unknown",
    date: n.created_at
      ? new Date(n.created_at).toLocaleString(undefined, {
          year: "numeric",
          month: "numeric",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        })
      : "",
  }), []);

  // Load notes from the backend on mount.
  useEffect(() => {
    if (!id || isNaN(id)) return;
    (async () => {
      try {
        const data: any[] = await fetchJSON(`/vendors/notes/${id}`);
        setNotes((data || []).map(mapApiNote));
      } catch (err) {
        console.error("Failed to load notes:", err);
      }
    })();
  }, [id, mapApiNote]);

  // Map backend vendor file → FilesTemplate-compatible shape.
  // Backend: { id, vendor_id, filename, object_key, mime, size_bytes,
  //            category, description, uploaded_by_user_id, uploaded_by_name, created_at }
  // Template: { id, name, url, uploadedAt, category, description, author }
  const mapApiFile = useCallback((f: any): VendorFile & { author?: string; objectKey?: string } => ({
    id: f.id,
    name: f.filename ?? "Untitled",
    url: f.object_key ? `${API_BASE}/files/${f.object_key}` : undefined,
    uploadedAt: f.created_at
      ? new Date(f.created_at).toLocaleString(undefined, {
          year: "numeric",
          month: "numeric",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        })
      : "",
    type: f.mime ?? undefined,
    category: f.category ?? undefined,
    description: f.description ?? undefined,
    author: f.uploaded_by_name ?? undefined,
    objectKey: f.object_key ?? undefined,
  }), []);

  // Load files from the backend on mount.
  useEffect(() => {
    if (!id || isNaN(id)) return;
    (async () => {
      try {
        const data: any[] = await fetchJSON(`/vendors/files/${id}`);
        setMockFiles((data || []).map(mapApiFile));
      } catch (err) {
        console.error("Failed to load files:", err);
      }
    })();
  }, [id, mapApiFile]);

  // Real-API note operations (replaces the previous in-memory mocks).
  const addNote = useCallback(async (text: string) => {
    try {
      const created: any = await fetchJSON(`/vendors/notes/${id}`, {
        method: "POST",
        body: JSON.stringify({ note: text, note_type: "general" }),
      });
      setNotes((prev) => [mapApiNote(created), ...prev]);
    } catch (err) {
      console.error("Failed to add note:", err);
    }
  }, [id, mapApiNote]);

  const removeNote = useCallback(async (noteId: number) => {
    try {
      await fetchJSON(`/vendors/notes/${noteId}`, { method: "DELETE" });
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
    } catch (err) {
      console.error("Failed to delete note:", err);
    }
  }, []);

  const editNote = useCallback(async (noteId: number, text: string) => {
    try {
      await fetchJSON(`/vendors/notes/${noteId}`, {
        method: "PATCH",
        body: JSON.stringify({ note: text, note_type: "general" }),
      });
      setNotes((prev) =>
        prev.map((n) => (n.id === noteId ? { ...n, text } : n)),
      );
    } catch (err) {
      console.error("Failed to edit note:", err);
    }
  }, []);

  // Real-API file operations.
  const uploadFile = useCallback(
    async (
      file: File,
      category?: string,
      description?: string,
      fileName?: string,
    ) => {
      try {
        const fd = new FormData();
        fd.append("file", file);
        if (category) fd.append("category", category);
        if (description) fd.append("description", description);
        if (fileName) fd.append("filename", fileName);

        const res = await authFetch(`/vendors/files/${id}`, {
          method: "POST",
          body: fd,
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || "upload failed");
        }
        const created = await res.json();
        setMockFiles((prev) => [mapApiFile(created), ...prev]);
      } catch (err) {
        console.error("Failed to upload file:", err);
      }
    },
    [id, mapApiFile],
  );

  const updateFile = useCallback(
    async (fileId: number, updates: Partial<Pick<VendorFile, "name" | "category" | "description">>) => {
      try {
        const body: Record<string, any> = {};
        if (updates.name !== undefined) body.filename = updates.name;
        if (updates.category !== undefined) body.category = updates.category;
        if (updates.description !== undefined) body.description = updates.description;
        const updated = await fetchJSON(`/vendors/files/${fileId}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
        setMockFiles((prev) =>
          prev.map((f) => (f.id === fileId ? mapApiFile(updated) : f)),
        );
      } catch (err) {
        console.error("Failed to update file:", err);
      }
    },
    [mapApiFile],
  );

  const deleteFile = useCallback(async (fileId: number) => {
    try {
      await fetchJSON(`/vendors/files/${fileId}`, { method: "DELETE" });
      setMockFiles((prev) => prev.filter((f) => f.id !== fileId));
    } catch (err) {
      console.error("Failed to delete file:", err);
    }
  }, []);

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

  const updateComplianceDoc = useCallback(
    async (
      docId: number,
      patch: Partial<Omit<VendorComplianceDoc, "id" | "uploadedBy" | "uploadedAt">>,
    ) => {
      try {
        const updated = await apiUpdateVendorCompliance(docId, patch);
        setCompliance((prev) =>
          prev.map((d) => (d.id === docId ? { ...d, ...updated } : d)),
        );
      } catch (err) {
        console.error("Failed to update compliance document", err);
      }
    },
    [],
  );

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
  // When set, the compliance modal is in "edit" mode and Save will PATCH instead of POST.
  const [editingComplianceId, setEditingComplianceId] = useState<number | null>(null);
  // The actual File binary captured from the upload input — kept separate from
  // complianceFileName because the input value can't be set programmatically.
  const [complianceFile, setComplianceFile] = useState<File | null>(null);
  const [complianceParsing, setComplianceParsing] = useState(false);
  const [complianceParsed, setComplianceParsed] = useState(false);
  const [complianceParseError, setComplianceParseError] = useState<string | null>(null);
  const complianceAutofillRef = useRef<HTMLInputElement>(null);
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

  // Persist deactivate/reactivate against the backend. Optimistically flips
  // the local toggle, refreshes the canonical vendor record afterward so
  // deactivated_at is in sync.
  const handleConfirmInactivate = useDelayedAction({
    onClose: setIsInactivateConfirmOpen,
    onAction: async () => {
      const targetActive = isInactive; // we're toggling — if currently inactive, target is active
      try {
        await fetchJSON(
          `/vendors/${targetActive ? "reactivate" : "deactivate"}/${id}`,
          { method: "POST" },
        );
        setIsInactive((v) => !v);
        await refreshVendor();
        toast.success(targetActive ? "Vendor reactivated" : "Vendor deactivated");
      } catch (err: any) {
        toast.error(err?.message ?? "Failed to update vendor status");
      }
    },
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

  const resetComplianceForm = () => {
    setComplianceDocType("certificate_of_insurance");
    setComplianceDocName("");
    setComplianceProvider("");
    setCompliancePolicyNumber("");
    setComplianceLicenseNumber("");
    setComplianceExpirationDate("");
    setComplianceFileName("");
    setComplianceFile(null);
    setEditingComplianceId(null);
    setComplianceParsing(false);
    setComplianceParsed(false);
    setComplianceParseError(null);
  };

  // AI autofill — works for all doc types via the type-aware compliance
  // parser endpoint. The backend returns a normalized shape so we can map it
  // uniformly into the form fields.
  const handleComplianceAutofill = async (file: File) => {
    setComplianceParsing(true);
    setComplianceParseError(null);
    try {
      // 1. Upload to the compliance storage endpoint to get an object_key.
      const uploaded = await apiUploadComplianceFile(file);

      // 2. Run the AI parser with the current document type so it knows what
      //    to look for.
      const parsed: any = await fetchJSON("/vendors/compliance/parse-pdf", {
        method: "POST",
        body: JSON.stringify({
          object_key: uploaded.object_key,
          document_type: complianceDocType,
        }),
      });

      // 3. Apply parsed fields conservatively — only set when non-empty so we
      //    don't blow away anything the user already typed.
      if (parsed.document_name && !complianceDocName.trim()) {
        setComplianceDocName(parsed.document_name);
      }
      if (parsed.provider) setComplianceProvider(parsed.provider);
      if (parsed.policy_number) setCompliancePolicyNumber(parsed.policy_number);
      if (parsed.license_number) setComplianceLicenseNumber(parsed.license_number);
      if (parsed.expiration_date) {
        // Backend returns ISO yyyy-mm-dd; the form expects mm/dd/yyyy.
        const m = String(parsed.expiration_date).match(/^(\d{4})-(\d{2})-(\d{2})$/);
        setComplianceExpirationDate(m ? `${m[2]}/${m[3]}/${m[1]}` : parsed.expiration_date);
      }

      // 4. Stash the file so save uploads it and links to the doc row.
      setComplianceFile(file);
      setComplianceFileName(file.name);
      setComplianceParsed(true);
    } catch (err: any) {
      console.error("AI autofill failed", err);
      setComplianceParseError(err?.message ?? "Failed to parse the document");
    } finally {
      setComplianceParsing(false);
    }
  };

  // Refetch the compliance list from the backend. Used after create/update so
  // the row reflects canonical data including the real uploaded_by name (the
  // create endpoint returns a different shape than the list endpoint).
  const refreshCompliance = useCallback(async () => {
    if (!id || isNaN(id)) return;
    try {
      const fetched = await fetchVendorCompliance(id);
      setCompliance(fetched);
    } catch (err) {
      console.error("Failed to refresh compliance list", err);
    }
  }, [id]);

  // Strip the storage path + timestamp prefix so the form displays the
  // friendly original filename. Backend currently stores file_name as the
  // raw object_key (e.g. "vendors/compliance/1777506011286-logo.png"); we
  // peel that down to just "logo.png" for display.
  const prettifyFileName = (raw?: string | null): string => {
    if (!raw) return "";
    // Drop any directory portion
    const base = raw.split("/").pop() || raw;
    // Drop a leading "<digits>-" timestamp prefix
    return base.replace(/^\d+-/, "");
  };

  const openEditComplianceDoc = (doc: VendorComplianceDoc) => {
    setEditingComplianceId(doc.id);
    setComplianceDocType(doc.documentType);
    setComplianceDocName(doc.documentName);
    setComplianceProvider(doc.provider ?? "");
    setCompliancePolicyNumber(doc.policyNumber ?? "");
    setComplianceLicenseNumber(doc.licenseNumber ?? "");
    setComplianceExpirationDate(doc.expirationDate);
    setComplianceFileName(prettifyFileName(doc.fileName));
    setIsAddComplianceOpen(true);
  };

  const handleAddCompliance = async () => {
    const docName = complianceDocName.trim();
    const expirationDate = complianceExpirationDate.trim();
    if (!docName || !expirationDate) return;

    try {
      // If the user attached a new file, upload the binary first and pass
      // along the resulting object_key/mime in the doc payload.
      let uploadInfo: { object_key: string; mime: string; filename: string } | undefined;
      if (complianceFile) {
        uploadInfo = await apiUploadComplianceFile(complianceFile);
      }

      if (editingComplianceId != null) {
        // PATCH the row (filename only saved if a new file was uploaded)
        const patch: Record<string, any> = {
          document_type: complianceDocType,
          document_name: docName,
          provider: complianceProvider.trim(),
          policy_number: compliancePolicyNumber.trim(),
          license_number: complianceLicenseNumber.trim(),
          expiration_date: toISODate(expirationDate),
        };
        if (uploadInfo) {
          patch.document_object_key = uploadInfo.object_key;
          patch.document_mime = uploadInfo.mime;
        }
        await fetchJSON(`/vendors/compliance/docs/update/${editingComplianceId}`, {
          method: "PATCH",
          body: JSON.stringify(patch),
        });
      } else {
        await apiAddVendorCompliance(
          id,
          {
            documentType: complianceDocType,
            documentName: docName,
            provider: complianceProvider.trim() || undefined,
            policyNumber: compliancePolicyNumber.trim() || undefined,
            licenseNumber: complianceLicenseNumber.trim() || undefined,
            expirationDate,
            uploadedBy: "",
            uploadedAt: "",
          },
          uploadInfo,
        );
      }

      // Always refetch from the server so the row shows the canonical
      // uploaded_by name and computed file_url, regardless of which path
      // (create vs update) was taken.
      await refreshCompliance();
    } catch (err) {
      console.error("Failed to save compliance document", err);
    }

    resetComplianceForm();
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

  const handleTabClick = (tab: VendorTab) => {
    setActiveTab(tab);
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
            {(["Overview", "Performance"] as VendorTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabClick(tab)}
                className={`flex items-center gap-1.5 py-2 whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab
                    ? "border-[#09090b] text-[#09090b]"
                    : "border-transparent text-[#717179] hover:text-[#09090b]"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab === "Performance" && (
            <VendorPerformanceTab vendorId={id} />
          )}

          {activeTab === "Overview" && (
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
                          label: "ALT EMAIL",
                          value: (vendorDraft || vendor).altEmail,
                          icon: (vendorDraft || vendor).altEmail ? (
                            <EmailIcon width={14} height={14} />
                          ) : undefined,
                        },
                        {
                          label: "PHONE",
                          value: (vendorDraft || vendor).phone,
                        },
                        {
                          label: "ALT PHONE",
                          value: (vendorDraft || vendor).altPhone,
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
                          label: "HOURLY RATE",
                          value: (() => {
                            const v = (vendorDraft || vendor).hourlyRate;
                            return v == null ? "" : `$${(v / 100).toFixed(2)}/hr`;
                          })(),
                        },
                        {
                          label: "EMERGENCY HOURLY RATE",
                          value: (() => {
                            const v = (vendorDraft || vendor).emergencyHourlyRate;
                            return v == null ? "" : `$${(v / 100).toFixed(2)}/hr`;
                          })(),
                        },
                        {
                          label: "SERVICES PROVIDED",
                          value: (vendorDraft || vendor).servicesProvided,
                        },
                        {
                          label: "SERVICE AREAS",
                          value: (() => {
                            const tags = (vendorDraft || vendor).serviceAreaTags ?? [];
                            if (tags.length === 0) return undefined;
                            return (
                              <div className="flex flex-wrap gap-1">
                                {tags.map((t) => (
                                  <span
                                    key={t}
                                    className="inline-flex items-center px-2 py-0.5 rounded bg-[#f0f0f0] text-[#303030] text-xs capitalize"
                                  >
                                    {t}
                                  </span>
                                ))}
                              </div>
                            );
                          })(),
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
                            rightSlot={
                              <PopoverActionsDropdown
                                row={doc}
                                rowKey="id"
                                actions={[
                                  {
                                    label: "Edit",
                                    icon: <EditIcon width={18} height={18} color="#303030" />,
                                    onClick: () => openEditComplianceDoc(doc),
                                  },
                                  {
                                    label: "Delete",
                                    icon: <DeleteIcon width={18} height={18} color="#982740" />,
                                    onClick: () => {
                                      if (confirm("Delete this compliance document?")) {
                                        removeComplianceDoc(doc.id);
                                      }
                                    },
                                  },
                                ]}
                              />
                            }
                            leftSlot={
                              <div
                                role="button"
                                tabIndex={0}
                                onClick={() => openEditComplianceDoc(doc)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    openEditComplianceDoc(doc);
                                  }
                                }}
                                className="flex-1 text-[#303030] text-sm font-normal leading-[1.29] cursor-pointer hover:bg-gray-50 rounded -mx-1 px-1 py-0.5"
                              >
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
                                    View document
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
          )}
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
        title={
          viewingComplianceDoc
            ? prettifyFileName(viewingComplianceDoc.fileName) ||
              viewingComplianceDoc.documentName ||
              "Document Preview"
            : "Document Preview"
        }
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

      {/* Add / Edit Compliance Document Dialog */}
      <ModalTemplate
        open={isAddComplianceOpen}
        onOpenChange={(open) => {
          setIsAddComplianceOpen(open);
          if (!open) {
            resetComplianceForm();
          }
        }}
        title={editingComplianceId ? "Edit Compliance Document" : "Add Compliance Document"}
        size="sm"
        footer={
          <ModalButtons
            onCancel={() => {
              resetComplianceForm();
              setIsAddComplianceOpen(false);
            }}
            onConfirm={handleAddCompliance}
            cancelLabel="Cancel"
            confirmLabel={editingComplianceId ? "Save Changes" : "Save"}
            confirmDisabled={
              complianceDocName.trim().length === 0 ||
              complianceExpirationDate.trim().length === 0
            }
          />
        }
      >
        <FormLayout>
          <FormSection showDivider={false}>
            {/* AI Autofill — available for all doc types on create */}
            {!editingComplianceId && (
              <>
                {!complianceParsed && (
                  <div
                    onClick={() => !complianceParsing && complianceAutofillRef.current?.click()}
                    onDragOver={(e) => !complianceParsing && e.preventDefault()}
                    onDrop={(e) => {
                      if (complianceParsing) return;
                      e.preventDefault();
                      const f = e.dataTransfer.files?.[0];
                      if (!f) return;
                      if (f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")) {
                        handleComplianceAutofill(f);
                      } else {
                        setComplianceParseError("Only PDF files are supported");
                      }
                    }}
                    className={
                      "flex items-center justify-center gap-3 rounded-lg border-2 border-dashed px-4 py-4 transition-colors mb-3 " +
                      (complianceParsing
                        ? "border-blue-300 bg-blue-50 cursor-wait"
                        : "border-[#013764] bg-[#f0f6fb] hover:bg-[#e0eef8] cursor-pointer")
                    }
                  >
                    <input
                      ref={complianceAutofillRef}
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleComplianceAutofill(f);
                      }}
                    />
                    {complianceParsing ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-[#013764]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="text-sm font-medium text-[#013764]">Parsing document...</span>
                      </>
                    ) : (
                      <>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#013764" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
                        <div>
                          <span className="text-sm font-medium text-[#013764]">Upload a document to autofill</span>
                          <span className="block text-xs text-[#4a7a9b]">AI will extract fields based on the selected document type · drag &amp; drop</span>
                        </div>
                      </>
                    )}
                  </div>
                )}
                {complianceParsed && (
                  <div className="mb-3 flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-3 py-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    <span className="text-sm text-green-800 font-medium">Fields autofilled — review and adjust before saving</span>
                  </div>
                )}
                {complianceParseError && !complianceParsing && (
                  <div className="mb-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
                    {complianceParseError}
                  </div>
                )}
              </>
            )}

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
                    if (file) {
                      setComplianceFileName(file.name);
                      setComplianceFile(file);
                    }
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
        onEditVendor={() => {
          refreshVendor();
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
