import { useState } from "react";
import { useParams } from "react-router-dom";
import { Plus } from "lucide-react";

import PageTemplate from "@/layout/PageTemplate";
import PageHeader from "@/components/PageHeader";
import PdfViewerModal from "@/components/PdfViewerModal";
import VendorActionsModal from "@/components/VendorActionsModal";
import { FormShowcaseModal } from "@/components/FormShowcaseModal";
import { useDelayedAction } from "@/hooks/useDelayedAction";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Modal } from "@/components/ui/Modal";
import { ModalTemplate } from "@/components/ui/ModalTemplate";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
    // Mock implementation: update vendor draft
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
                  {" "}
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
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 14 14"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M10.7145 2.68607C11.1052 2.29537 11.7383 2.29537 12.129 2.68607L11.9749 2.84016C12.3656 3.23085 12.3656 3.86402 11.9749 4.25472L5.6117 10.6179C5.46262 10.767 5.28452 10.8795 5.08646 10.9445L2.03645 11.7978C1.74626 11.8816 1.44259 11.7399 1.35879 11.4497L0.505513 8.39971C0.440448 8.20165 0.552982 8.02355 0.701865 7.87467L7.06503 1.51149C7.45572 1.1208 8.08889 1.1208 8.47958 1.51149L10.7145 2.68607Z"
                            fill="currentColor"
                          />
                        </svg>
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
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 14 14"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M11.6673 11.667H2.33398C1.59961 11.667 1.00065 11.068 1.00065 10.3337V3.66699C1.00065 2.93262 1.59961 2.33366 2.33398 2.33366H11.6673C12.4017 2.33366 13.0007 2.93262 13.0007 3.66699V10.3337C13.0007 11.068 12.4017 11.667 11.6673 11.667Z"
                                stroke="#2463EB"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M1.33398 3.33301L7.00065 7.66634L12.6673 3.33301"
                                stroke="#2463EB"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
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

                <div
                  className="mt-5 w-full h-px"
                  style={{ aspectRatio: "1000", objectFit: "contain" }}
                >
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

                <div className="mt-5 flex flex-col font-medium">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <h2 className="text-[#303030] text-xl font-medium leading-[1.1]">
                      Vendor Insurance
                    </h2>
                    <button
                      onClick={() => setIsAddInsuranceOpen(true)}
                      className="flex items-center gap-1 text-[#2463EB] text-sm font-medium leading-[1.4] tracking-[-0.28px] whitespace-nowrap rounded-lg hover:opacity-80 transition-opacity"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add</span>
                    </button>
                  </div>

                  {insurance.length === 0 ? (
                    <p className="mt-3 text-[#303030] text-sm font-medium leading-[1.29]">
                      No vendor insurance information on file.
                    </p>
                  ) : (
                    <div className="mt-3 border border-[#DADADA] rounded-lg overflow-hidden">
                      {insurance.map((ins) => (
                        <div
                          key={ins.id}
                          className="flex items-center justify-between gap-6 px-3 py-2 border-b border-[#DADADA] last:border-b-0"
                        >
                          <div className="flex-1 text-[#303030] text-sm font-normal leading-[1.29]">
                            {ins.provider}
                          </div>
                          <div className="text-[#303030] text-sm font-normal leading-[1.29] w-[220px]">
                            {ins.policyNumber}
                          </div>
                          <div className="text-[#303030] text-sm font-normal leading-[1.29] w-[180px]">
                            Expires: {ins.expirationDate}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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

                <div className="mt-5 flex flex-col font-medium">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <h2 className="text-[#303030] text-xl font-medium leading-[1.1]">
                      Custom Fields
                    </h2>
                    <button
                      onClick={() => setIsAddCustomFieldOpen(true)}
                      className="flex items-center gap-1 text-[#2463EB] text-sm font-medium leading-[1.4] tracking-[-0.28px] whitespace-nowrap rounded-lg hover:opacity-80 transition-opacity"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add</span>
                    </button>
                  </div>

                  {fields.length === 0 ? (
                    <div className="mt-3 flex items-center justify-center min-h-[56px] w-full border border-[#DADADA] rounded-lg">
                      <p className="flex-1 text-[#303030] text-sm font-normal leading-[1.29] text-center px-3">
                        There are no custom fields created to track additional
                        information in this location. Contact your administrator
                        to add custom fields.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-3 border border-[#DADADA] rounded-lg overflow-hidden">
                      {fields.map((field) => (
                        <div
                          key={field.id}
                          className="flex items-center justify-between gap-6 px-3 py-2 border-b border-[#DADADA] last:border-b-0"
                        >
                          <div className="text-[#303030] text-sm font-normal leading-[1.29] w-[220px]">
                            {field.name}
                          </div>
                          <div className="flex-1 text-[#303030] text-sm font-normal leading-[1.29]">
                            {field.value}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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

                <div className="mt-5 flex flex-col">
                  <div className="flex items-center justify-between gap-4 flex-wrap font-medium">
                    <h2 className="text-[#303030] text-xl font-medium leading-[1.1]">
                      Recent Notes
                    </h2>
                    <button
                      onClick={openAddNote}
                      className="flex items-center gap-1 text-[#2463EB] text-sm font-medium leading-[1.4] tracking-[-0.28px] whitespace-nowrap rounded-lg hover:opacity-80 transition-opacity"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add</span>
                    </button>
                  </div>

                  {notes.length === 0 ? (
                    <div className="mt-3 flex items-center gap-1 w-full px-3 py-1.5 bg-[#F9F9F9] border border-[#DADADA] rounded">
                      <p className="text-[#303030] text-sm font-normal leading-[1.29]">
                        You don't have any notes for this vendor right now.
                      </p>
                      <button
                        type="button"
                        onClick={openAddNote}
                        className="text-[#2463EB] text-sm font-medium hover:underline"
                      >
                        Add your first note
                      </button>
                    </div>
                  ) : (
                    <div className="mt-3 border border-[#DADADA] rounded-lg overflow-hidden">
                      {notes.map((note) => (
                        <div
                          key={note.id}
                          className="flex items-center justify-between gap-6 px-3 py-2 border-b border-[#DADADA] last:border-b-0"
                        >
                          <div className="flex-1 text-[#303030] text-sm font-normal leading-[1.29] whitespace-pre-line">
                            {note.text}
                          </div>
                          <div className="flex items-center gap-8 min-w-[240px]">
                            <div className="text-[#303030] text-sm font-normal leading-[1.29] w-[153px]">
                              {note.date}
                            </div>
                            <div className="text-[#303030] text-sm font-normal leading-[1.29] w-[118px]">
                              {note.author}
                            </div>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                                  type="button"
                                  onMouseDown={(e) => e.stopPropagation()}
                                  onClick={(e) => e.stopPropagation()}
                                  className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors"
                                  aria-label="Actions"
                                >
                                  <svg
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <circle cx="12" cy="12" r="1" />
                                    <circle cx="19" cy="12" r="1" />
                                    <circle cx="5" cy="12" r="1" />
                                  </svg>
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                className="z-[99999] bg-white flex flex-col justify-center items-start gap-4 p-4 w-[120px] rounded-lg"
                                style={{ border: "0.5px solid #DADADA" }}
                              >
                                <DropdownMenuItem
                                  onSelect={() => {
                                    setSelectedNote(note);
                                    setIsViewNoteOpen(true);
                                  }}
                                  className="w-full cursor-pointer text-left text-[#303030] font-normal text-base leading-[140%] tracking-[-0.32px] focus:bg-transparent focus:text-[#303030]"
                                >
                                  View
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onSelect={() => {
                                    removeNote(note.id);
                                  }}
                                  className="w-full cursor-pointer text-left text-[#982740] font-normal text-base leading-[140%] tracking-[-0.32px] focus:bg-transparent focus:text-[#982740]"
                                >
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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

                <div className="mt-5 flex flex-col">
                  <div className="flex items-center justify-between gap-4 flex-wrap font-medium">
                    <h2 className="text-[#303030] text-xl font-medium leading-[1.1]">
                      Recent Files
                    </h2>
                    <button
                      onClick={() => setIsAddFileOpen(true)}
                      className="flex items-center gap-1 text-[#2463EB] text-sm font-medium leading-[1.4] tracking-[-0.28px] whitespace-nowrap rounded-lg hover:opacity-80 transition-opacity"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add</span>
                    </button>
                  </div>

                  {files.length === 0 ? (
                    <div className="mt-3 flex items-center gap-1 w-full px-3 py-1.5 bg-[#F9F9F9] border border-[#DADADA] rounded">
                      <p className="text-[#303030] text-sm font-normal leading-[1.29]">
                        You don't have any files for this vendor right now.
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsAddFileOpen(true)}
                        className="text-[#2463EB] text-sm font-medium hover:underline"
                      >
                        Add your first file
                      </button>
                    </div>
                  ) : (
                    <div className="mt-3 border border-[#DADADA] rounded-lg overflow-hidden">
                      {files.map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center justify-between gap-6 px-3 py-2 border-b border-[#DADADA] last:border-b-0"
                        >
                          {file.url ? (
                            <a
                              href={file.url}
                              target="_blank"
                              rel="noreferrer"
                              className="flex-1 text-[#2463EB] text-sm font-medium leading-[1.29] hover:underline"
                            >
                              {file.name}
                            </a>
                          ) : (
                            <div className="flex-1 text-[#303030] text-sm font-normal leading-[1.29]">
                              {file.name}
                            </div>
                          )}
                          <div className="text-[#303030] text-sm font-normal leading-[1.29] w-[200px]">
                            {file.uploadedAt}
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={(e) => e.stopPropagation()}
                                className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors"
                                aria-label="Actions"
                              >
                                <svg
                                  width="18"
                                  height="18"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <circle cx="12" cy="12" r="1" />
                                  <circle cx="19" cy="12" r="1" />
                                  <circle cx="5" cy="12" r="1" />
                                </svg>
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="z-[99999] bg-white flex flex-col justify-center items-start gap-4 p-4 w-[120px] rounded-lg"
                              style={{ border: "0.5px solid #DADADA" }}
                            >
                              <DropdownMenuItem
                                onSelect={() => {
                                  setSelectedFile(file);
                                  setIsViewFileOpen(true);
                                }}
                                className="w-full text-left text-[#303030] font-normal text-base leading-[140%] tracking-[-0.32px] focus:bg-transparent focus:text-[#303030]"
                              >
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onSelect={() => {
                                  deleteFile(file.id);
                                }}
                                className="w-full text-left text-[#982740] font-normal text-base leading-[140%] tracking-[-0.32px] focus:bg-transparent focus:text-[#982740]"
                              >
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </PageTemplate>

      <PdfViewerModal
        open={isViewFileOpen}
        onOpenChange={(open) => {
          setIsViewFileOpen(open);
          if (!open) setSelectedFile(null);
        }}
        title={selectedFile?.name || "File Preview"}
        url={selectedFile?.url}
      />

      <Dialog
        open={isAddEditNoteOpen}
        onOpenChange={(open) => {
          setIsAddEditNoteOpen(open);
          if (!open) {
            setEditingNoteId(null);
            setNoteDraft("");
          }
        }}
      >
        <DialogContent className="max-w-[520px] p-6 gap-0">
          <DialogTitle className="text-[#303030] font-semibold text-2xl leading-[30px] mb-4">
            {editingNoteId === null ? "Add Note" : "Edit Note"}
          </DialogTitle>

          <Textarea
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
            placeholder="Enter your note here..."
            className="min-h-[140px] rounded-lg border-[#E5E5E5] bg-[#F7F7F7] placeholder:text-[#A1A1A9] text-base font-normal tracking-[-0.32px] leading-[140%] resize-none"
          />

          <DialogFooter className="mt-4 gap-3">
            <button
              onClick={() => {
                setIsAddEditNoteOpen(false);
                setEditingNoteId(null);
                setNoteDraft("");
              }}
              className="px-4 py-2 border border-[#DADADA] rounded-lg text-[#303030] font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={saveNote}
              disabled={!noteDraft.trim()}
              className="px-4 py-2 bg-[#013764] text-white rounded-lg font-medium hover:bg-[#003a73] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save Note
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isViewNoteOpen}
        onOpenChange={(open) => {
          setIsViewNoteOpen(open);
          if (!open) setSelectedNote(null);
        }}
      >
        <DialogContent className="max-w-[520px] p-6 gap-0">
          <DialogTitle className="text-[#303030] font-semibold text-2xl leading-[30px] mb-4">
            Note Details
          </DialogTitle>

          {selectedNote ? (
            <div>
              <div className="text-[#303030] whitespace-pre-line mb-4 p-3 bg-gray-50 rounded-lg">
                {selectedNote.text}
              </div>
              <div className="text-sm text-[#71717A] mb-2">
                <span className="font-medium">Author:</span>{" "}
                {selectedNote.author}
              </div>
              <div className="text-sm text-[#71717A]">
                <span className="font-medium">Date:</span> {selectedNote.date}
              </div>

              <DialogFooter className="mt-6 gap-3">
                <button
                  onClick={() => setIsViewNoteOpen(false)}
                  className="px-4 py-2 border border-[#DADADA] rounded-lg text-[#303030] font-medium hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    const noteToEdit = selectedNote;
                    setIsViewNoteOpen(false);
                    setSelectedNote(null);
                    openEditNote(noteToEdit);
                  }}
                  className="px-4 py-2 bg-[#013764] text-white rounded-lg font-medium hover:bg-[#003a73] transition-colors"
                >
                  Edit
                </button>
              </DialogFooter>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog
        open={isAddInsuranceOpen}
        onOpenChange={(open) => {
          setIsAddInsuranceOpen(open);
          if (!open) {
            setInsuranceProvider("");
            setInsurancePolicyNumber("");
            setInsuranceExpirationDate("");
          }
        }}
      >
        <DialogContent className="max-w-[520px] p-6 gap-0">
          <DialogTitle className="text-[#303030] font-semibold text-2xl leading-[30px] mb-4">
            Add Vendor Insurance
          </DialogTitle>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-[#303030] font-medium text-sm leading-[20px]">
                Provider
              </label>
              <Input
                value={insuranceProvider}
                onChange={(e) => setInsuranceProvider(e.target.value)}
                placeholder="Insurance provider"
                className="h-10 rounded-lg border-[#E5E5E5] bg-[#F7F7F7] placeholder:text-[#A1A1A9]"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[#303030] font-medium text-sm leading-[20px]">
                Policy Number
              </label>
              <Input
                value={insurancePolicyNumber}
                onChange={(e) => setInsurancePolicyNumber(e.target.value)}
                placeholder="Policy number"
                className="h-10 rounded-lg border-[#E5E5E5] bg-[#F7F7F7] placeholder:text-[#A1A1A9]"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[#303030] font-medium text-sm leading-[20px]">
                Expiration Date
              </label>
              <Input
                value={insuranceExpirationDate}
                onChange={(e) => setInsuranceExpirationDate(e.target.value)}
                placeholder="MM/DD/YYYY"
                className="h-10 rounded-lg border-[#E5E5E5] bg-[#F7F7F7] placeholder:text-[#A1A1A9]"
              />
            </div>
          </div>

          <DialogFooter className="mt-6 gap-3">
            <button
              onClick={() => {
                setIsAddInsuranceOpen(false);
                setInsuranceProvider("");
                setInsurancePolicyNumber("");
                setInsuranceExpirationDate("");
              }}
              className="px-4 py-2 border border-[#DADADA] rounded-lg text-[#303030] font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddInsurance}
              disabled={
                !insuranceProvider.trim() ||
                !insurancePolicyNumber.trim() ||
                !insuranceExpirationDate.trim()
              }
              className="px-4 py-2 bg-[#013764] text-white rounded-lg font-medium hover:bg-[#003a73] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isAddCustomFieldOpen}
        onOpenChange={(open) => {
          setIsAddCustomFieldOpen(open);
          if (!open) {
            setCustomFieldName("");
            setCustomFieldValue("");
          }
        }}
      >
        <DialogContent className="max-w-[520px] p-6 gap-0">
          <DialogTitle className="text-[#303030] font-semibold text-2xl leading-[30px] mb-4">
            Add Custom Field
          </DialogTitle>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-[#303030] font-medium text-sm leading-[20px]">
                Field Name
              </label>
              <Input
                value={customFieldName}
                onChange={(e) => setCustomFieldName(e.target.value)}
                placeholder="Field name"
                className="h-10 rounded-lg border-[#E5E5E5] bg-[#F7F7F7] placeholder:text-[#A1A1A9]"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[#303030] font-medium text-sm leading-[20px]">
                Value
              </label>
              <Input
                value={customFieldValue}
                onChange={(e) => setCustomFieldValue(e.target.value)}
                placeholder="Value"
                className="h-10 rounded-lg border-[#E5E5E5] bg-[#F7F7F7] placeholder:text-[#A1A1A9]"
              />
            </div>
          </div>

          <DialogFooter className="mt-6 gap-3">
            <button
              onClick={() => {
                setIsAddCustomFieldOpen(false);
                setCustomFieldName("");
                setCustomFieldValue("");
              }}
              className="px-4 py-2 border border-[#DADADA] rounded-lg text-[#303030] font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddCustomField}
              disabled={!customFieldName.trim() || !customFieldValue.trim()}
              className="px-4 py-2 bg-[#013764] text-white rounded-lg font-medium hover:bg-[#003a73] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isAddFileOpen}
        onOpenChange={(open) => {
          setIsAddFileOpen(open);
          if (!open) {
            setFileDraft(null);
          }
        }}
      >
        <DialogContent className="max-w-[520px] p-6 gap-0">
          <DialogTitle className="text-[#303030] font-semibold text-2xl leading-[30px] mb-4">
            Add File
          </DialogTitle>

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

          <DialogFooter className="mt-6 gap-3">
            <button
              onClick={() => {
                setIsAddFileOpen(false);
                setFileDraft(null);
              }}
              className="px-4 py-2 border border-[#DADADA] rounded-lg text-[#303030] font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddFile}
              disabled={!fileDraft}
              className="px-4 py-2 bg-[#013764] text-white rounded-lg font-medium hover:bg-[#003a73] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditVendorOpen} onOpenChange={setIsEditVendorOpen}>
        <DialogContent className="max-w-[694px] p-8 gap-0">
          <DialogTitle className="text-[#303030] font-semibold text-2xl leading-[30px] mb-4">
            Edit Vendor
          </DialogTitle>

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

                <button
                  onClick={saveVendor}
                  disabled={!vendorDraft.name.trim()}
                  className="flex h-9 w-full items-center justify-center gap-2 px-4 rounded-lg border border-white bg-[#013764] shadow-[0_0_0_1px_#002D5A] hover:bg-[#003a73] transition-colors mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="text-white font-medium text-base">
                    Save Vendor
                  </span>
                </button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ModalTemplate
        open={isInactivateConfirmOpen}
        onOpenChange={setIsInactivateConfirmOpen}
        title={isInactive ? "Activate Vendor" : "Inactivate Vendor"}
        size="sm"
        footer={
          <div className="flex gap-2.5 w-full justify-end">
            <button
              onClick={() => setIsInactivateConfirmOpen(false)}
              className="grey-button"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmInactivate}
              className="flex h-9 items-center gap-2 px-3 py-2 rounded-lg border border-white bg-[#013764] hover:bg-[#003a73] transition-colors text-white font-medium text-base whitespace-nowrap"
              style={{ boxShadow: "0px 0px 0px 1px rgba(0, 45, 90, 1)" }}
            >
              Confirm
            </button>
          </div>
        }
      >
        <p style={{ fontSize: "14px", color: "rgba(48, 48, 48, 1)" }}>
          {isInactive
            ? "Activating will make this vendor available for new work orders and tasks."
            : "Inactivating will prevent this vendor from being used for new work orders and tasks."}
        </p>
      </ModalTemplate>

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
