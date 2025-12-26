import { useState } from "react";
import { useParams } from "react-router-dom";

import PageTemplate from "@/layout/PageTemplate";
import PageHeader from "@/components/PageHeader";
import PdfViewerModal from "@/components/PdfViewerModal";
import VendorActionsModal from "@/components/VendorActionsModal";
import { FormShowcaseModal } from "@/components/FormShowcaseModal";
import EntityListSection from "@/components/EntityListSection";
import { FormDialog } from "@/components/FormDialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useDelayedAction } from "@/hooks/useDelayedAction";
import { EmailIcon, EditIcon } from "@/components/icons";
import {
  TextField,
  TextAreaField,
  EmailField,
  PhoneNumberField,
  AddressField,
  DateField,
  FileUploadField,
  FieldRow,
  FieldRowItem,
  type AddressValue,
} from "@/components/forms";
import {
  useVendorDetail,
  useVendorNotes,
  useVendorInsurance,
  useVendorFiles,
  useVendorCustomFields,
} from "@/hooks/vendors";
import type { VendorDetail as VendorDetailType, VendorNote, VendorFile } from "@/data/vendors";

export default function VendorDetail() {
  const { vendorId } = useParams<{ vendorId: string }>();
  const id = Number(vendorId);

  // Use hooks for data
  const { vendor, loading: vendorLoading, error: vendorError } = useVendorDetail(id);
  const { notes, addNote, removeNote, editNote } = useVendorNotes(id);
  const { insurance, addInsurance } = useVendorInsurance(id);
  const { files, uploadFile, deleteFile } = useVendorFiles(id);
  const { fields, addField, removeField } = useVendorCustomFields(id);

  // Local state for UI
  const [isInactive, setIsInactive] = useState(false);
  const [selectedNote, setSelectedNote] = useState<VendorNote | null>(null);
  const [isAddEditNoteOpen, setIsAddEditNoteOpen] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
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
  const [fileDraft, setFileDraft] = useState<File | null>(null);

  const [isEditVendorOpen, setIsEditVendorOpen] = useState(false);
  const [vendorDraft, setVendorDraft] = useState<VendorDetailType | null>(vendor);

  const [isInactivateConfirmOpen, setIsInactivateConfirmOpen] = useState(false);
  const [isVendorActionsOpen, setIsVendorActionsOpen] = useState(false);
  const [isFormShowcaseOpen, setIsFormShowcaseOpen] = useState(false);

  const handleConfirmInactivate = useDelayedAction({
    onClose: setIsInactivateConfirmOpen,
    onAction: () => setIsInactive((v) => !v),
    delayMs: 600,
  });

  const openAddNote = () => {
    setEditingNoteId(null);
    setNoteDraft("");
    setIsAddEditNoteOpen(true);
  };

  const openEditNote = (note: VendorNote) => {
    setEditingNoteId(note.id);
    setNoteDraft(note.text);
    setIsAddEditNoteOpen(true);
  };

  const saveNote = async () => {
    const text = noteDraft.trim();
    if (!text) return;

    if (editingNoteId === null) {
      await addNote(text);
    } else {
      await editNote(editingNoteId, text);
    }

    setIsAddEditNoteOpen(false);
    setEditingNoteId(null);
    setNoteDraft("");
  };

  const openEditVendor = () => {
    if (vendor) {
      setVendorDraft(vendor);
      setIsEditVendorOpen(true);
    }
  };

  const saveVendor = () => {
    if (vendorDraft) {
      const trimmedName = vendorDraft.name.trim();
      if (!trimmedName) return;
      setIsEditVendorOpen(false);
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

  const handleAddFile = async () => {
    if (!fileDraft) return;
    await uploadFile(fileDraft);
    setFileDraft(null);
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
    return <PageTemplate><div className="flex items-center justify-center h-96">Loading vendor details...</div></PageTemplate>;
  }

  if (vendorError || !vendor) {
    return <PageTemplate><div className="flex items-center justify-center h-96">Error loading vendor</div></PageTemplate>;
  }

  return (
    <>
      <PageTemplate>
        <div className="flex flex-col gap-6 w-fit min-w-full">
          <PageHeader
            title={vendor.name}
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
                  {vendor.category}
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
              <div className="bg-white border border-[#E5E5E5] rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-4 flex flex-col">
                {/* Vendor Information Card */}
                <div className="flex flex-col font-medium">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <h2 className="text-[#303030] text-xl font-medium leading-[1.1]">
                      Vendor Information
                    </h2>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsFormShowcaseOpen(true)}
                        className="flex items-center gap-1 text-[#2463EB] text-sm font-medium leading-[1.4] tracking-[-0.28px] whitespace-nowrap rounded-lg hover:opacity-80 transition-opacity"
                        title="View field components showcase"
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 14 14"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M11.2 1H2.8C1.81 1 1.009 1.81 1.009 2.8L1 12.2C1 13.19 1.81 14 2.8 14H11.2C12.19 14 13 13.19 13 12.2V2.8C13 1.81 12.19 1 11.2 1ZM11.2 12.2H2.8V2.8H11.2V12.2ZM3.5 5.25H8.75V6.75H3.5V5.25ZM3.5 7.75H10.5V9.25H3.5V7.75Z"
                            fill="currentColor"
                          />
                        </svg>
                        <span>Showcase</span>
                      </button>
                      <button
                        onClick={openEditVendor}
                        className="flex items-center gap-1 text-[#2463EB] text-sm font-medium leading-[1.4] tracking-[-0.28px] whitespace-nowrap rounded-lg hover:opacity-80 transition-opacity"
                      >
                        <EditIcon width={14} height={14} />
                        <span>Edit</span>
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-col whitespace-nowrap">
                    <div className="flex items-start gap-10 flex-wrap">
                      <div className="flex flex-col w-[220px]">
                        <div className="text-[#71717A] text-xs font-medium leading-[1.33]">
                          EMAIL
                        </div>
                        {vendor.email ? (
                          <div className="mt-1 flex items-center gap-1 text-[#2463EB] text-sm font-medium leading-[1.4] tracking-[-0.28px] rounded-lg">
                            <EmailIcon width={14} height={14} />
                            <span>{vendor.email}</span>
                          </div>
                        ) : (
                          <div className="mt-1 text-[#303030] text-sm font-medium leading-[1.29]">
                            --
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col">
                        <div className="text-[#71717A] text-xs font-medium leading-[1.33]">
                          PHONE
                        </div>
                        <div className="mt-1 text-[#303030] text-sm font-medium leading-[1.29]">
                          {vendor.phone || "--"}
                        </div>
                      </div>

                      <div className="flex flex-col">
                        <div className="text-[#71717A] text-xs font-medium leading-[1.33]">
                          ADDRESS
                        </div>
                        <div className="mt-1 text-[#303030] text-sm font-medium leading-[1.29]">
                          {vendor.address || "--"}
                        </div>
                      </div>

                      <div className="flex flex-col">
                        <div className="text-[#71717A] text-xs font-medium leading-[1.33]">
                          WEBSITE
                        </div>
                        <div className="mt-1 text-[#303030] text-sm font-medium leading-[1.29]">
                          {vendor.website || "--"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-col">
                    <div className="flex items-start gap-10">
                      <div className="flex flex-col">
                        <div className="text-[#71717A] text-xs font-medium leading-[1.33]">
                          SERVICES PROVIDED
                        </div>
                        <div className="mt-1 text-[#303030] text-sm font-medium leading-[1.29]">
                          {vendor.servicesProvided || "--"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 w-full h-px">
                  <svg
                    width="100%"
                    height="1"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <line
                      x1="0"
                      y1="0"
                      x2="100%"
                      y2="0"
                      stroke="#E5E5E5"
                      strokeWidth="1"
                    />
                  </svg>
                </div>

                {/* Vendor Insurance Section */}
                <EntityListSection
                  title="Vendor Insurance"
                  items={insurance}
                  onAddClick={() => setIsAddInsuranceOpen(true)}
                  renderItem={(ins) => (
                    <div className="flex-1 text-[#303030] text-sm font-normal leading-[1.29]">
                      <div>{ins.provider}</div>
                      <div className="text-[#71717A] text-xs mt-1">
                        Policy: {ins.policyNumber} • Expires: {ins.expirationDate}
                      </div>
                    </div>
                  )}
                  actions={[]}
                  emptyMessage="No vendor insurance information on file."
                  addButtonLabel="Add"
                />

                <div className="mt-5 w-full h-px">
                  <svg
                    width="100%"
                    height="1"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <line
                      x1="0"
                      y1="0"
                      x2="100%"
                      y2="0"
                      stroke="#E5E5E5"
                      strokeWidth="1"
                    />
                  </svg>
                </div>

                {/* Custom Fields Section */}
                <EntityListSection
                  title="Custom Fields"
                  items={fields}
                  onAddClick={() => setIsAddCustomFieldOpen(true)}
                  renderItem={(field) => (
                    <div className="flex gap-6 flex-1">
                      <div className="text-[#303030] text-sm font-normal leading-[1.29] w-[220px]">
                        <div className="font-medium">{field.name}</div>
                        <div className="text-[#71717A] text-xs mt-1">{field.value}</div>
                      </div>
                    </div>
                  )}
                  actions={[]}
                  emptyMessage="There are no custom fields created to track additional information in this location. Contact your administrator to add custom fields."
                  addButtonLabel="Add"
                />

                <div className="mt-5 w-full h-px">
                  <svg
                    width="100%"
                    height="1"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <line
                      x1="0"
                      y1="0"
                      x2="100%"
                      y2="0"
                      stroke="#E5E5E5"
                      strokeWidth="1"
                    />
                  </svg>
                </div>

                {/* Recent Notes Section */}
                <EntityListSection
                  title="Recent Notes"
                  items={notes}
                  onAddClick={openAddNote}
                  renderItem={(note) => (
                    <div className="flex-1">
                      <div className="text-[#303030] text-sm font-normal leading-[1.29] whitespace-pre-line">
                        {note.text}
                      </div>
                      <div className="flex items-center gap-8 mt-2 text-xs text-[#71717A]">
                        <span>{note.date}</span>
                        <span>{note.author}</span>
                      </div>
                    </div>
                  )}
                  actions={[
                    {
                      label: "View",
                      onClick: (item) => {
                        setSelectedNote(item as VendorNote);
                        setIsViewNoteOpen(true);
                      },
                    },
                    {
                      label: "Delete",
                      isDangerous: true,
                      onClick: (item) => removeNote(item.id),
                    },
                  ]}
                  emptyMessage="You don't have any notes for this vendor right now."
                  addButtonLabel="Add"
                />

                <div className="mt-5 w-full h-px">
                  <svg
                    width="100%"
                    height="1"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <line
                      x1="0"
                      y1="0"
                      x2="100%"
                      y2="0"
                      stroke="#E5E5E5"
                      strokeWidth="1"
                    />
                  </svg>
                </div>

                {/* Recent Files Section */}
                <EntityListSection
                  title="Recent Files"
                  items={files}
                  onAddClick={() => setIsAddFileOpen(true)}
                  renderItem={(file) => (
                    <div className="flex-1">
                      {file.url ? (
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#2463EB] text-sm font-medium leading-[1.29] hover:underline"
                        >
                          {file.name}
                        </a>
                      ) : (
                        <div className="text-[#303030] text-sm font-normal leading-[1.29]">
                          {file.name}
                        </div>
                      )}
                      <div className="text-[#71717A] text-xs mt-1">{file.uploadedAt}</div>
                    </div>
                  )}
                  actions={[
                    {
                      label: "View",
                      onClick: (item) => {
                        setSelectedFile(item as VendorFile);
                        setIsViewFileOpen(true);
                      },
                    },
                    {
                      label: "Delete",
                      isDangerous: true,
                      onClick: (item) => deleteFile(item.id),
                    },
                  ]}
                  emptyMessage="You don't have any files for this vendor right now."
                  addButtonLabel="Add"
                />
              </div>
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

      {/* Add/Edit Note Dialog */}
      <FormDialog
        open={isAddEditNoteOpen}
        onOpenChange={(open) => {
          setIsAddEditNoteOpen(open);
          if (!open) {
            setEditingNoteId(null);
            setNoteDraft("");
          }
        }}
        title={editingNoteId === null ? "Add Note" : "Edit Note"}
        onSubmit={saveNote}
        onCancel={() => {
          setEditingNoteId(null);
          setNoteDraft("");
        }}
        submitLabel="Save Note"
        isValid={noteDraft.trim().length > 0}
        size="sm"
      >
        <TextAreaField
          label="Note"
          value={noteDraft}
          onChange={(e) => setNoteDraft(e.target.value)}
          placeholder="Enter your note here..."
        />
      </FormDialog>

      {/* View Note Dialog */}
      <FormDialog
        open={isViewNoteOpen}
        onOpenChange={(open) => {
          setIsViewNoteOpen(open);
          if (!open) setSelectedNote(null);
        }}
        title="Note Details"
        onSubmit={() => {
          if (selectedNote) {
            openEditNote(selectedNote);
            setIsViewNoteOpen(false);
          }
        }}
        submitLabel="Edit"
        size="sm"
      >
        {selectedNote ? (
          <div>
            <div className="text-[#303030] whitespace-pre-line mb-4 p-3 bg-gray-50 rounded-lg">
              {selectedNote.text}
            </div>
            <div className="text-sm text-[#71717A] mb-2">
              <span className="font-medium">Author:</span> {selectedNote.author}
            </div>
            <div className="text-sm text-[#71717A]">
              <span className="font-medium">Date:</span> {selectedNote.date}
            </div>
          </div>
        ) : null}
      </FormDialog>

      {/* Add Insurance Dialog */}
      <FormDialog
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
        onSubmit={handleAddInsurance}
        onCancel={() => {
          setInsuranceProvider("");
          setInsurancePolicyNumber("");
          setInsuranceExpirationDate("");
        }}
        submitLabel="Save"
        isValid={
          insuranceProvider.trim().length > 0 &&
          insurancePolicyNumber.trim().length > 0 &&
          insuranceExpirationDate.trim().length > 0
        }
        size="sm"
      >
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
          placeholder="MM/DD/YYYY"
        />
      </FormDialog>

      {/* Add Custom Field Dialog */}
      <FormDialog
        open={isAddCustomFieldOpen}
        onOpenChange={(open) => {
          setIsAddCustomFieldOpen(open);
          if (!open) {
            setCustomFieldName("");
            setCustomFieldValue("");
          }
        }}
        title="Add Custom Field"
        onSubmit={handleAddCustomField}
        onCancel={() => {
          setCustomFieldName("");
          setCustomFieldValue("");
        }}
        submitLabel="Save"
        isValid={customFieldName.trim().length > 0 && customFieldValue.trim().length > 0}
        size="sm"
      >
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
      </FormDialog>

      {/* Add File Dialog */}
      <FormDialog
        open={isAddFileOpen}
        onOpenChange={(open) => {
          setIsAddFileOpen(open);
          if (!open) {
            setFileDraft(null);
          }
        }}
        title="Add File"
        onSubmit={handleAddFile}
        onCancel={() => {
          setFileDraft(null);
        }}
        submitLabel="Add"
        isValid={fileDraft !== null}
        size="sm"
      >
        <div className="px-6 py-5 grid gap-5">
          <div className="grid gap-2">
            <label className="text-sm font-medium text-[#303030]">File</label>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setFileDraft(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-[#303030] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#013764] file:text-white hover:file:bg-[#003a73]"
            />
          </div>
        </div>
      </FormDialog>

      {/* Edit Vendor Dialog */}
      <FormDialog
        open={isEditVendorOpen}
        onOpenChange={setIsEditVendorOpen}
        title="Edit Vendor"
        onSubmit={saveVendor}
        onCancel={() => {}}
        submitLabel="Save Vendor"
        isValid={vendorDraft?.name.trim().length ?? 0 > 0}
        size="sm"
      >
        <div className="flex flex-col gap-4">
          {vendorDraft && (
            <>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex flex-col gap-2 flex-1 min-w-[240px]">
                  <label className="text-[#303030] font-medium text-sm leading-[20px]">
                    Vendor Name <span className="text-red-600">*</span>
                  </label>
                  <Input
                    value={vendorDraft.name}
                    onChange={(e) =>
                      setVendorDraft((prev) => (prev ? {
                        ...prev,
                        name: e.target.value,
                      } : null))
                    }
                    placeholder="Input Vendor Name"
                    className="h-10 rounded-lg border-[#E5E5E5] bg-[#F7F7F7] placeholder:text-[#A1A1A9] text-base font-normal tracking-[-0.32px] leading-[140%]"
                  />
                </div>
                <div className="flex flex-col gap-2 flex-1 min-w-[240px]">
                  <label className="text-[#303030] font-medium text-sm leading-[20px]">
                    Category
                  </label>
                  <Input
                    value={vendorDraft.category}
                    onChange={(e) =>
                      setVendorDraft((prev) => (prev ? {
                        ...prev,
                        category: e.target.value,
                      } : null))
                    }
                    placeholder="Category"
                    className="h-10 rounded-lg border-[#E5E5E5] bg-[#F7F7F7] placeholder:text-[#A1A1A9] text-base font-normal tracking-[-0.32px] leading-[140%]"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex flex-col gap-2 flex-1 min-w-[240px]">
                  <label className="text-[#303030] font-medium text-sm leading-[20px]">
                    Primary Email
                  </label>
                  <Input
                    type="email"
                    value={vendorDraft.email || ""}
                    onChange={(e) =>
                      setVendorDraft((prev) => (prev ? {
                        ...prev,
                        email: e.target.value,
                      } : null))
                    }
                    placeholder="Input Vendor Email"
                    className="h-10 rounded-lg border-[#E5E5E5] bg-[#F7F7F7] placeholder:text-[#A1A1A9] text-base font-normal tracking-[-0.32px] leading-[140%]"
                  />
                </div>
                <div className="flex flex-col gap-2 flex-1 min-w-[240px]">
                  <label className="text-[#303030] font-medium text-sm leading-[20px]">
                    Phone
                  </label>
                  <Input
                    value={vendorDraft.phone || ""}
                    onChange={(e) =>
                      setVendorDraft((prev) => (prev ? {
                        ...prev,
                        phone: e.target.value,
                      } : null))
                    }
                    placeholder="Input Vendor Phone"
                    className="h-10 rounded-lg border-[#E5E5E5] bg-[#F7F7F7] placeholder:text-[#A1A1A9] text-base font-normal tracking-[-0.32px] leading-[140%]"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex flex-col gap-2 flex-1 min-w-[240px]">
                  <label className="text-[#303030] font-medium text-sm leading-[20px]">
                    Address
                  </label>
                  <Input
                    value={vendorDraft.address || ""}
                    onChange={(e) =>
                      setVendorDraft((prev) => (prev ? {
                        ...prev,
                        address: e.target.value,
                      } : null))
                    }
                    placeholder="Address"
                    className="h-10 rounded-lg border-[#E5E5E5] bg-[#F7F7F7] placeholder:text-[#A1A1A9] text-base font-normal tracking-[-0.32px] leading-[140%]"
                  />
                </div>
                <div className="flex flex-col gap-2 flex-1 min-w-[240px]">
                  <label className="text-[#303030] font-medium text-sm leading-[20px]">
                    Website
                  </label>
                  <Input
                    value={vendorDraft.website || ""}
                    onChange={(e) =>
                      setVendorDraft((prev) => (prev ? {
                        ...prev,
                        website: e.target.value,
                      } : null))
                    }
                    placeholder="https://..."
                    className="h-10 rounded-lg border-[#E5E5E5] bg-[#F7F7F7] placeholder:text-[#A1A1A9] text-base font-normal tracking-[-0.32px] leading-[140%]"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[#303030] font-medium text-sm leading-[20px]">
                  Services Provided
                </label>
                <Input
                  value={vendorDraft.servicesProvided || ""}
                  onChange={(e) =>
                    setVendorDraft((prev) => (prev ? {
                      ...prev,
                      servicesProvided: e.target.value,
                    } : null))
                  }
                  placeholder="Services provided"
                  className="h-10 rounded-lg border-[#E5E5E5] bg-[#F7F7F7] placeholder:text-[#A1A1A9] text-base font-normal tracking-[-0.32px] leading-[140%]"
                />
              </div>
            </>
          )}
        </div>
      </FormDialog>

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

      <FormShowcaseModal
        open={isFormShowcaseOpen}
        onOpenChange={setIsFormShowcaseOpen}
      />

      <VendorActionsModal
        open={isVendorActionsOpen}
        onOpenChange={setIsVendorActionsOpen}
      />
    </>
  );
}
