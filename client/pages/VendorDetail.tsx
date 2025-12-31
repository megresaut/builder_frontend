import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

import PageTemplate from "@/layout/PageTemplate";
import PageHeader from "@/components/PageHeader";
import PdfViewerModal from "@/components/PdfViewerModal";
import VendorActionsModal from "@/components/VendorActionsModal";
import AddVendorModal from "@/components/AddVendorModal";
import {
  ModalTemplate,
  ModalButtons,
  ModalField,
} from "@/components/ui/ModalTemplate";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import PopoverActionsDropdown from "@/components/PopoverActionsDropdown";
import { useDelayedAction } from "@/hooks/useDelayedAction";
import type { UploadedFile } from "@/components/ui/attachment-uploader";
import { EmailIcon, EditIcon, DeleteIcon } from "@/components/icons";
import {
  TextField,
  TextAreaField,
  FileUploadField,
} from "@/components/forms";
import {
  FormLayout,
  FormSection,
} from "@/components/ui/form-layout";
import {
  useVendorDetail,
  useVendorNotes,
  useVendorInsurance,
  useVendorFiles,
  useVendorCustomFields,
} from "@/hooks/vendors";
import type { VendorDetail as VendorDetailType, VendorNote, VendorFile } from "@/data/vendors";
import type { UploadedFile } from "@/components/ui/attachment-uploader";
import {
  SectionRowTemplate,
  SectionGroupCardTemplate,
  SectionActionTemplate,
  EmptyStateTemplate,
  RecordListTemplate,
  RecordRowTemplate,
  KeyValueGrid,
  type KeyValueCell,
} from "@/components/templates";

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
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const [isEditVendorOpen, setIsEditVendorOpen] = useState(false);
  const [vendorDraft, setVendorDraft] = useState<VendorDetailType | null>(null);

  const [isInactivateConfirmOpen, setIsInactivateConfirmOpen] = useState(false);
  const [isVendorActionsOpen, setIsVendorActionsOpen] = useState(false);

  // Sync vendorDraft with vendor when vendor data loads
  useEffect(() => {
    if (vendor && !vendorDraft) {
      setVendorDraft(vendor);
    }
  }, [vendor, vendorDraft]);

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

  const handleAddFile = async () => {
    if (uploadedFiles.length === 0) return;
    for (const fileObj of uploadedFiles) {
      if (fileObj.file) {
        await uploadFile(fileObj.file);
      }
    }
    setUploadedFiles([]);
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
                <SectionRowTemplate isLast={false}>
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <h2 className="text-[#303030] text-xl font-medium leading-[1.1]">
                      Vendor Information
                    </h2>
                    <SectionActionTemplate
                      icon={<EditIcon width={14} height={14} />}
                      label="Edit"
                      onClick={openEditVendor}
                    />
                  </div>

                  <KeyValueGrid
                    cells={[
                      {
                        label: "EMAIL",
                        value: (vendorDraft || vendor).email,
                        icon: (vendorDraft || vendor).email ? <EmailIcon width={14} height={14} /> : undefined,
                        isLink: (vendorDraft || vendor).email ? true : false,
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
                        fullWidth: true,
                      },
                    ]}
                  />
                </SectionRowTemplate>

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
                <SectionRowTemplate isLast={false}>
                  <div className="flex items-center justify-between gap-4 flex-wrap font-medium">
                    <h2 className="text-[#303030] text-xl font-medium leading-[1.1]">
                      Recent Notes
                    </h2>
                    <SectionActionTemplate
                      label="Add"
                      onClick={openAddNote}
                    />
                  </div>

                  {notes.length === 0 ? (
                    <EmptyStateTemplate message="You don't have any notes for this vendor right now." />
                  ) : (
                    <RecordListTemplate>
                      {notes.map((note, idx) => (
                        <RecordRowTemplate
                          key={note.id}
                          isLast={idx === notes.length - 1}
                          leftSlot={
                            <div className="flex-1">
                              <div className="text-[#303030] text-sm font-normal leading-[1.29] whitespace-pre-line">
                                {note.text}
                              </div>
                              <div className="flex items-center gap-8 mt-2 text-xs text-[#71717A]">
                                <span>{note.date}</span>
                                <span>{note.author}</span>
                              </div>
                            </div>
                          }
                          rightSlot={
                            <PopoverActionsDropdown
                              row={note}
                              rowKey="id"
                              actions={[
                                {
                                  label: "Edit",
                                  icon: <EditIcon width={18} height={18} color="#303030" />,
                                  onClick: () => {
                                    setSelectedNote(note);
                                    setIsViewNoteOpen(true);
                                  },
                                },
                                {
                                  label: "Delete",
                                  icon: <DeleteIcon width={18} height={18} color="#982740" />,
                                  onClick: () => removeNote(note.id),
                                },
                              ]}
                            />
                          }
                        />
                      ))}
                    </RecordListTemplate>
                  )}
                </SectionRowTemplate>

                {/* Recent Files Section */}
                <SectionRowTemplate isLast={true}>
                  <div className="flex items-center justify-between gap-4 flex-wrap font-medium">
                    <h2 className="text-[#303030] text-xl font-medium leading-[1.1]">
                      Recent Files
                    </h2>
                    <SectionActionTemplate
                      label="Add"
                      onClick={() => setIsAddFileOpen(true)}
                    />
                  </div>

                  {files.length === 0 ? (
                    <EmptyStateTemplate message="You don't have any files for this vendor right now." />
                  ) : (
                    <RecordListTemplate>
                      {files.map((file, idx) => (
                        <RecordRowTemplate
                          key={file.id}
                          isLast={idx === files.length - 1}
                          leftSlot={
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
                              <div className="text-[#71717A] text-xs mt-1">
                                {file.uploadedAt}
                              </div>
                            </div>
                          }
                          rightSlot={
                            <PopoverActionsDropdown
                              row={file}
                              rowKey="id"
                              actions={[
                                {
                                  label: "View",
                                  icon: <EditIcon width={18} height={18} color="#303030" />,
                                  onClick: () => {
                                    setSelectedFile(file);
                                    setIsViewFileOpen(true);
                                  },
                                },
                                {
                                  label: "Delete",
                                  icon: <DeleteIcon width={18} height={18} color="#982740" />,
                                  onClick: () => deleteFile(file.id),
                                },
                              ]}
                            />
                          }
                        />
                      ))}
                    </RecordListTemplate>
                  )}
                </SectionRowTemplate>
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
        <FormLayout>
          <FormSection showDivider={false}>
            <TextAreaField
              label="Note"
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              placeholder="Enter your note here..."
            />
          </FormSection>
        </FormLayout>
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
          <FormLayout>
            <FormSection showDivider={false}>
              <div className="text-[#303030] whitespace-pre-line p-3 bg-gray-50 rounded-lg">
                {selectedNote.text}
              </div>
              <div className="text-sm text-[#71717A]">
                <span className="font-medium">Author:</span> {selectedNote.author}
              </div>
              <div className="text-sm text-[#71717A]">
                <span className="font-medium">Date:</span> {selectedNote.date}
              </div>
            </FormSection>
          </FormLayout>
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
              placeholder="MM/DD/YYYY"
            />
          </FormSection>
        </FormLayout>
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
      </FormDialog>

      {/* Add File Modal */}
      <ModalTemplate
        open={isAddFileOpen}
        onOpenChange={(open) => {
          setIsAddFileOpen(open);
          if (!open) {
            setUploadedFiles([]);
          }
        }}
        title="Add File"
        size="sm"
        onClose={() => {
          setUploadedFiles([]);
        }}
        footer={
          <ModalButtons
            onCancel={() => {
              setUploadedFiles([]);
              setIsAddFileOpen(false);
            }}
            onConfirm={handleAddFile}
            cancelLabel="Cancel"
            confirmLabel="Add"
            confirmDisabled={uploadedFiles.length === 0}
          />
        }
      >
        <ModalField spacing="tight">
          <FileUploadField
            label="File"
            description="Upload PDF documents"
            files={uploadedFiles}
            onFilesAdded={(newFiles) => {
              setUploadedFiles([...uploadedFiles, ...newFiles]);
            }}
            onFileRemoved={(fileId) => {
              setUploadedFiles(uploadedFiles.filter((f) => f.id !== fileId));
            }}
            onViewFile={(file) => {
              setSelectedFile({
                id: file.id,
                name: file.name,
                url: file.file ? URL.createObjectURL(file.file) : undefined,
                uploadedAt: new Date().toLocaleDateString(),
              });
              setIsViewFileOpen(true);
            }}
            accept=".pdf"
            maxFiles={5}
            maxSize={10 * 1024 * 1024}
          />
        </ModalField>
      </ModalTemplate>

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
