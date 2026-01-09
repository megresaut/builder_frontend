import { useState, useEffect } from "react";
import { useCallback } from "react";
import { useParams } from "react-router-dom";

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
import {
  useVendorInsurance,
  useVendorFiles,
  useVendorCustomFields,
} from "@/hooks/vendors";
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

export default function VendorDetail() {
  const { vendorId } = useParams<{ vendorId: string }>();
  const id = Number(vendorId);

  // Mock data state for vendor detail
  const [vendor, setVendor] = useState<VendorDetailType | null>(null);
  const [vendorLoading, setVendorLoading] = useState(true);
  const [vendorError, setVendorError] = useState<string | null>(null);

  // Mock data state for notes
  const [notes, setNotes] = useState<VendorNote[]>([]);

  // Load mock vendor detail on mount
  useEffect(() => {
    (async () => {
      try {
        setVendorLoading(true);
        setVendorError(null);
        const detail = await mockFetchVendorDetail(id);
        if (detail) {
          // Convert to VendorDetailType shape
          const vendorData: VendorDetailType = {
            id: detail.id,
            name: detail.name,
            category: detail.category,
            email: detail.email || detail.primary_email,
            phone: detail.phone,
            address: detail.address,
            website: detail.website,
            servicesProvided: detail.servicesProvided,
          };
          setVendor(vendorData);
        } else {
          setVendorError("Vendor not found");
        }
      } catch (err) {
        setVendorError("Failed to load vendor");
      } finally {
        setVendorLoading(false);
      }
    })();
  }, [id]);

  // Load mock notes on mount
  useEffect(() => {
    (async () => {
      try {
        const fetchedNotes = await mockFetchVendorNotes(id);
        setNotes(fetchedNotes as VendorNote[]);
      } catch (err) {
        console.error("Failed to load notes");
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

  // Keep other hooks for insurance, files, custom fields
  const { insurance, addInsurance } = useVendorInsurance(id);
  const { files, uploadFile, deleteFile, updateFile } = useVendorFiles(id);
  const { fields, addField, removeField } = useVendorCustomFields(id);

  // Local state for UI
  const [isInactive, setIsInactive] = useState(false);
  const [selectedNote, setSelectedNote] = useState<VendorNote | null>(null);
  const [isAddEditNoteOpen, setIsAddEditNoteOpen] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [isViewNoteOpen, setIsViewNoteOpen] = useState(false);

  const [isAddInsuranceOpen, setIsAddInsuranceOpen] = useState(false);
  const [insuranceProvider, setInsuranceProvider] = useState("");
  const [insurancePolicyNumber, setInsurancePolicyNumber] = useState("");
  const [insuranceExpirationDate, setInsuranceExpirationDate] = useState("");

  const [isAddCustomFieldOpen, setIsAddCustomFieldOpen] = useState(false);
  const [customFieldName, setCustomFieldName] = useState("");
  const [customFieldValue, setCustomFieldValue] = useState("");

  const [selectedFile, setSelectedFile] = useState<VendorFile | null>(null);
  const [isViewFileOpen, setIsViewFileOpen] = useState(false);
  const [isAddFileOpen, setIsAddFileOpen] = useState(false);
  const [isEditingFile, setIsEditingFile] = useState(false);

  const [isEditVendorOpen, setIsEditVendorOpen] = useState(false);
  const [vendorDraft, setVendorDraft] = useState<VendorDetailType | null>(null);

  const [isInactivateConfirmOpen, setIsInactivateConfirmOpen] = useState(false);
  const [isVendorActionsOpen, setIsVendorActionsOpen] = useState(false);

  // Sync vendorDraft with vendor when vendor data loads
  useEffect(() => {
    if (vendor) {
      setVendorDraft(vendor);
    }
  }, [vendor]);

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

  const handleAddInsurance = async () => {
    const provider = insuranceProvider.trim();
    const policyNumber = insurancePolicyNumber.trim();
    const expirationDate = insuranceExpirationDate.trim();
    if (!provider || !policyNumber || !expirationDate) return;

    await addInsurance(provider, policyNumber, expirationDate);

    setInsuranceProvider("");
    setInsurancePolicyNumber("");
    setInsuranceExpirationDate("");
    setIsAddInsuranceOpen(false);
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

  if (vendorLoading) {
    return (
      <PageTemplate>
        <div className="flex items-center justify-center h-96">
          Loading vendor details...
        </div>
      </PageTemplate>
    );
  }

  if (vendorError || !vendor) {
    return (
      <PageTemplate>
        <div className="flex items-center justify-center h-96">
          Error loading vendor
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

                {/* Vendor Insurance Section */}
                <SectionRowTemplate isLast={false}>
                  <div className="flex items-center justify-between gap-4 flex-wrap font-medium">
                    <h2 className="text-[#303030] text-xl font-medium leading-[1.1]">
                      Vendor Insurance
                    </h2>
                    <SectionActionTemplate
                      label="Add"
                      onClick={() => setIsAddInsuranceOpen(true)}
                    />
                  </div>

                  {insurance.length === 0 ? (
                    <EmptyStateTemplate message="No vendor insurance information on file." />
                  ) : (
                    <RecordListTemplate>
                      {insurance.map((ins, idx) => (
                        <RecordRowTemplate
                          key={ins.id}
                          isLast={idx === insurance.length - 1}
                          leftSlot={
                            <div className="flex-1 text-[#303030] text-sm font-normal leading-[1.29]">
                              <div>{ins.provider}</div>
                              <div className="text-[#71717A] text-xs mt-1">
                                Policy: {ins.policyNumber} • Expires:{" "}
                                {ins.expirationDate}
                              </div>
                            </div>
                          }
                        />
                      ))}
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
                  files={files}
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

      {/* Add Insurance Dialog */}
      <ModalTemplate
        open={isAddInsuranceOpen}
        onOpenChange={(open) => {
          setIsAddInsuranceOpen(open);
          if (!open) {
            setInsuranceProvider("");
            setInsurancePolicyNumber("");
            setInsuranceExpirationDate("");
          }
        }}
        title="Add Vendor Insurance"
        size="sm"
        footer={
          <ModalButtons
            onCancel={() => {
              setInsuranceProvider("");
              setInsurancePolicyNumber("");
              setInsuranceExpirationDate("");
              setIsAddInsuranceOpen(false);
            }}
            onConfirm={handleAddInsurance}
            cancelLabel="Cancel"
            confirmLabel="Save"
            confirmDisabled={
              insuranceProvider.trim().length === 0 ||
              insurancePolicyNumber.trim().length === 0 ||
              insuranceExpirationDate.trim().length === 0
            }
          />
        }
      >
        <FormLayout>
          <FormSection showDivider={false}>
            <TextField
              label="Provider"
              value={insuranceProvider}
              onChange={(e) => setInsuranceProvider(e.target.value)}
              placeholder="Insurance provider"
            />

            <TextField
              label="Policy Number"
              value={insurancePolicyNumber}
              onChange={(e) => setInsurancePolicyNumber(e.target.value)}
              placeholder="Policy number"
            />

            <TextField
              label="Expiration Date"
              value={insuranceExpirationDate}
              onChange={(e) => setInsuranceExpirationDate(e.target.value)}
              placeholder="mm/dd/yyyy"
            />
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
