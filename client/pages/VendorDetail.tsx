import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Plus } from "lucide-react";

import PageTemplate from "@/layout/PageTemplate";
import PdfViewerModal from "@/components/PdfViewerModal";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface Vendor {
  id: number;
  name: string;
  category: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  servicesProvided?: string;
}

interface Note {
  id: number;
  text: string;
  date: string;
  author: string;
}

interface VendorInsurance {
  id: number;
  provider: string;
  policyNumber: string;
  expirationDate: string;
}

interface CustomField {
  id: number;
  name: string;
  value: string;
}

interface VendorFile {
  id: number;
  name: string;
  url?: string;
  uploadedAt: string;
}

const MOCK_VENDORS: Vendor[] = [
  {
    id: 1,
    name: "Dolce Heating & Plumbing",
    category: "Uncategorized",
    email: "staff@avappraisalmgmt.com",
    phone: undefined,
    address: undefined,
    website: undefined,
    servicesProvided: undefined,
  },
];

const MOCK_NOTES: Note[] = [
  {
    id: 1,
    text: "Southern Conn Gas #05-00011476-6574",
    date: "6/17/2024 10:32 AM",
    author: "Johan Gonazlez",
  },
  {
    id: 2,
    text: "Eversource #51124508037",
    date: "6/17/2024 10:31 AM",
    author: "Johan Gonazlez",
  },
  {
    id: 3,
    text: "Ashley Bae (Daughter): (626) 340-7616",
    date: "6/12/2024 2:31 PM",
    author: "Carteg Hughes",
  },
  {
    id: 4,
    text: "Called Optimum and got the address moved from connors lane to 1544 wazee street denver, co. 80202",
    date: "8/4/2021 10:47 AM",
    author: "Heather Seabrook",
  },
  {
    id: 5,
    text: "Optimum\nAcct#07808-628921-02\n203-293-4709\nPin: 2258",
    date: "3/16/2020 1:59 PM",
    author: "Mario Sciarretta",
  },
];

const nextId = (items: { id: number }[]) =>
  items.length ? Math.max(...items.map((i) => i.id)) + 1 : 1;

export default function VendorDetail() {
  const { vendorId } = useParams<{ vendorId: string }>();

  const vendorFromRoute = useMemo(() => {
    const id = Number(vendorId);
    return MOCK_VENDORS.find((v) => v.id === id) || MOCK_VENDORS[0];
  }, [vendorId]);

  const [vendor, setVendor] = useState<Vendor>(vendorFromRoute);
  const [isInactive, setIsInactive] = useState(false);

  useEffect(() => {
    setVendor(vendorFromRoute);
    setIsInactive(false);
  }, [vendorFromRoute]);

  const [notes, setNotes] = useState<Note[]>(() => [...MOCK_NOTES]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

  const [isAddEditNoteOpen, setIsAddEditNoteOpen] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);

  const [isViewNoteOpen, setIsViewNoteOpen] = useState(false);

  const [vendorInsurances, setVendorInsurances] = useState<VendorInsurance[]>(
    [],
  );
  const [isAddInsuranceOpen, setIsAddInsuranceOpen] = useState(false);
  const [insuranceProvider, setInsuranceProvider] = useState("");
  const [insurancePolicyNumber, setInsurancePolicyNumber] = useState("");
  const [insuranceExpirationDate, setInsuranceExpirationDate] = useState("");

  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [isAddCustomFieldOpen, setIsAddCustomFieldOpen] = useState(false);
  const [customFieldName, setCustomFieldName] = useState("");
  const [customFieldValue, setCustomFieldValue] = useState("");

  const [files, setFiles] = useState<VendorFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<VendorFile | null>(null);
  const [isViewFileOpen, setIsViewFileOpen] = useState(false);

  const [isAddFileOpen, setIsAddFileOpen] = useState(false);
  const [fileDraft, setFileDraft] = useState<File | null>(null);

  const [isEditVendorOpen, setIsEditVendorOpen] = useState(false);
  const [vendorDraft, setVendorDraft] = useState<Vendor>(vendorFromRoute);

  const [isInactivateConfirmOpen, setIsInactivateConfirmOpen] = useState(false);

  const openAddNote = () => {
    setEditingNoteId(null);
    setNoteDraft("");
    setIsAddEditNoteOpen(true);
  };

  const openEditNote = (note: Note) => {
    setEditingNoteId(note.id);
    setNoteDraft(note.text);
    setIsAddEditNoteOpen(true);
  };

  const saveNote = () => {
    const text = noteDraft.trim();
    if (!text) return;

    const now = new Date().toLocaleString();

    setNotes((prev) => {
      if (editingNoteId === null) {
        const newNote: Note = {
          id: nextId(prev),
          text,
          date: now,
          author: "Current User",
        };
        return [newNote, ...prev];
      }

      return prev.map((n) =>
        n.id === editingNoteId
          ? {
              ...n,
              text,
              date: now,
            }
          : n,
      );
    });

    setIsAddEditNoteOpen(false);
    setEditingNoteId(null);
    setNoteDraft("");
  };

  const openEditVendor = () => {
    setVendorDraft(vendor);
    setIsEditVendorOpen(true);
  };

  const saveVendor = () => {
    const trimmedName = vendorDraft.name.trim();
    if (!trimmedName) return;

    setVendor({
      ...vendorDraft,
      name: trimmedName,
      category: vendorDraft.category.trim() || "Uncategorized",
      email: vendorDraft.email?.trim() || undefined,
      phone: vendorDraft.phone?.trim() || undefined,
      address: vendorDraft.address?.trim() || undefined,
      website: vendorDraft.website?.trim() || undefined,
      servicesProvided: vendorDraft.servicesProvided?.trim() || undefined,
    });
    setIsEditVendorOpen(false);
  };

  const addInsurance = () => {
    const provider = insuranceProvider.trim();
    const policyNumber = insurancePolicyNumber.trim();
    const expirationDate = insuranceExpirationDate.trim();
    if (!provider || !policyNumber || !expirationDate) return;

    setVendorInsurances((prev) => [
      ...prev,
      {
        id: nextId(prev),
        provider,
        policyNumber,
        expirationDate,
      },
    ]);

    setInsuranceProvider("");
    setInsurancePolicyNumber("");
    setInsuranceExpirationDate("");
    setIsAddInsuranceOpen(false);
  };

  const revokeBlobUrl = (url?: string) => {
    if (!url) return;
    if (url.startsWith("blob:")) {
      try {
        URL.revokeObjectURL(url);
      } catch {
        // ignore
      }
    }
  };

  const addFile = () => {
    if (!fileDraft) return;

    const now = new Date().toLocaleString();
    const fileName = fileDraft.name;
    const ext = fileName.split(".").pop()?.toLowerCase() || "";
    const docIcon =
      "https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/07da6a33a78bd70b7170adaa97b3fb7b14ff2fc0?placeholderIfAbsent=true";
    const pdfIcon =
      "https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/5ef69f3c3e2f3e3b15cc6139a16a94f848b10be7?placeholderIfAbsent=true";
    const icon = ext === "doc" || ext === "docx" ? docIcon : pdfIcon;
    const url = URL.createObjectURL(fileDraft);

    setFiles((prev) => [
      ...prev,
      {
        id: nextId(prev),
        name: fileName,
        url,
        uploadedAt: now,
      },
    ]);

    setFileDraft(null);
    setIsAddFileOpen(false);
  };

  const addCustomField = () => {
    const name = customFieldName.trim();
    const value = customFieldValue.trim();
    if (!name || !value) return;

    setCustomFields((prev) => [
      ...prev,
      {
        id: nextId(prev),
        name,
        value,
      },
    ]);

    setCustomFieldName("");
    setCustomFieldValue("");
    setIsAddCustomFieldOpen(false);
  };

  const handleTabClick = (_tab: string) => {
    // reserved for future tab switching
  };

  return (
    <>
      <PageTemplate>
        <div className="flex flex-col gap-6 w-fit min-w-full">
          <div className="flex justify-between items-center w-full">
            <div className="flex flex-col items-start gap-1">
              <h1 className="text-[#303030] font-semibold text-2xl leading-[30px]">
                {vendor.name}
                {isInactive ? (
                  <span className="ml-3 text-sm font-medium text-[#982740]">
                    Inactive
                  </span>
                ) : null}
              </h1>
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
                  <div>Edit</div>
                </button>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                />
              </div>
              <div className="flex items-center gap-3" />
            </div>
            <div
              className="flex"
              style={{
                flexDirection: "row",
                gap: "8px",
                width: "auto",
                alignSelf: "center",
                justifyContent: "flex-start",
                alignItems: "center",
              }}
            >
              <button
                onClick={() => setIsInactivateConfirmOpen(true)}
                className="flex h-10 items-center gap-2 px-4 rounded-lg border border-white bg-[#013764] hover:bg-[#003a73] transition-colors"
                style={{
                  boxShadow:
                    "0 0 0 1px #002D5A, 0 0 10px -5px rgba(0, 0, 0, 0.20)",
                }}
              >
                <div className="text-white font-medium text-base leading-normal">
                  {isInactive ? "Activate Vendor" : "Inactivate Vendor"}
                </div>
              </button>
              <button
                className="flex w-10 h-10 justify-center items-center gap-2.5 rounded-lg border border-[#DADADA] bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] hover:bg-gray-50 transition-colors"
                style={{ borderWidth: "0.5px" }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M9.99984 10.8335C10.4601 10.8335 10.8332 10.4604 10.8332 10.0002C10.8332 9.53993 10.4601 9.16683 9.99984 9.16683C9.5396 9.16683 9.1665 9.53993 9.1665 10.0002C9.1665 10.4604 9.5396 10.8335 9.99984 10.8335Z"
                    stroke="#303030"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M9.99984 5.00016C10.4601 5.00016 10.8332 4.62707 10.8332 4.16683C10.8332 3.70659 10.4601 3.3335 9.99984 3.3335C9.5396 3.3335 9.1665 3.70659 9.1665 4.16683C9.1665 4.62707 9.5396 5.00016 9.99984 5.00016Z"
                    stroke="#303030"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M9.99984 16.6668C10.4601 16.6668 10.8332 16.2937 10.8332 15.8335C10.8332 15.3733 10.4601 15.0002 9.99984 15.0002C9.5396 15.0002 9.1665 15.3733 9.1665 15.8335C9.1665 16.2937 9.5396 16.6668 9.99984 16.6668Z"
                    stroke="#303030"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex h-9 items-start gap-6 self-stretch border-b border-[#E5E5E5]">
            <button
              onClick={() => handleTabClick("Overview")}
              className="flex items-center gap-1.5 pb-2 border-b-[1.5px] border-b-[#09090B] transition-colors"
            >
              <span className="font-medium text-base leading-5 text-[#09090B]">
                Overview
              </span>
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

                  {vendorInsurances.length === 0 ? (
                    <p className="mt-3 text-[#303030] text-sm font-medium leading-[1.29]">
                      No vendor insurance information on file.
                    </p>
                  ) : (
                    <div className="mt-3 border border-[#DADADA] rounded-lg overflow-hidden">
                      {vendorInsurances.map((ins) => (
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

                  {customFields.length === 0 ? (
                    <div className="mt-3 flex items-center justify-center min-h-[56px] w-full border border-[#DADADA] rounded-lg">
                      <p className="flex-1 text-[#303030] text-sm font-normal leading-[1.29] text-center px-3">
                        There are no custom fields created to track additional
                        information in this location. Contact your administrator
                        to add custom fields.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-3 border border-[#DADADA] rounded-lg overflow-hidden">
                      {customFields.map((field) => (
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
                                    setNotes((prev) =>
                                      prev.filter((n) => n.id !== note.id),
                                    );
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
                                  setFiles((prev) => {
                                    revokeBlobUrl(file.url);
                                    return prev.filter((f) => f.id !== file.id);
                                  });
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
              onClick={() => setIsAddEditNoteOpen(false)}
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
              onClick={() => setIsAddInsuranceOpen(false)}
              className="px-4 py-2 border border-[#DADADA] rounded-lg text-[#303030] font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={addInsurance}
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
              onClick={() => setIsAddCustomFieldOpen(false)}
              className="px-4 py-2 border border-[#DADADA] rounded-lg text-[#303030] font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={addCustomField}
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
              onClick={addFile}
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
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex flex-col gap-2 flex-1 min-w-[240px]">
                <label className="text-[#303030] font-medium text-sm leading-[20px]">
                  Vendor Name <span className="text-red-600">*</span>
                </label>
                <Input
                  value={vendorDraft.name}
                  onChange={(e) =>
                    setVendorDraft((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
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
                    setVendorDraft((prev) => ({
                      ...prev,
                      category: e.target.value,
                    }))
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
                    setVendorDraft((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
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
                    setVendorDraft((prev) => ({
                      ...prev,
                      phone: e.target.value,
                    }))
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
                    setVendorDraft((prev) => ({
                      ...prev,
                      address: e.target.value,
                    }))
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
                    setVendorDraft((prev) => ({
                      ...prev,
                      website: e.target.value,
                    }))
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
                  setVendorDraft((prev) => ({
                    ...prev,
                    servicesProvided: e.target.value,
                  }))
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
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isInactivateConfirmOpen}
        onOpenChange={setIsInactivateConfirmOpen}
      >
        <DialogContent className="max-w-[520px] p-6 gap-0">
          <DialogTitle className="text-[#303030] font-semibold text-2xl leading-[30px] mb-2">
            {isInactive ? "Activate Vendor" : "Inactivate Vendor"}
          </DialogTitle>
          <p className="text-[#303030] text-sm leading-[1.4] mt-2">
            {isInactive
              ? "Activating will make this vendor available for new work orders and tasks."
              : "Inactivating will prevent this vendor from being used for new work orders and tasks."}
          </p>

          <DialogFooter className="mt-6 gap-3">
            <button
              onClick={() => setIsInactivateConfirmOpen(false)}
              className="px-4 py-2 border border-[#DADADA] rounded-lg text-[#303030] font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setIsInactive((v) => !v);
                setIsInactivateConfirmOpen(false);
              }}
              className="px-4 py-2 bg-[#013764] text-white rounded-lg font-medium hover:bg-[#003a73] transition-colors"
            >
              Confirm
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
