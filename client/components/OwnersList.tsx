import { useState } from "react";
import { PlusIcon, EditIcon, DeleteIcon } from "@/components/icons";
import AddOwnerModal, { type OwnerFormData } from "./AddOwnerModal";
import { ModalTemplate, ModalButtons } from "@/components/ui/ModalTemplate";
import { FormLayout, FormSection } from "@/components/ui/form-layout";
import { toast } from "sonner";

interface OwnerAuditEntry {
  id: number;
  action: string;
  details: string;
  date: string;
  performedBy: string;
}

interface OwnerDocument {
  id: number;
  label: string;
  type: "ownership" | "insurance" | "tax" | "other";
  uploadedDate: string;
  uploadedBy: string;
}

interface Owner {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  ownershipPercentage: number;
  ownerSince: string;
  mailingAddress: string;
  status: "active" | "inactive";
  entityType: "individual" | "llc" | "trust";
  entityName?: string;
  taxId?: string;
  auditHistory: OwnerAuditEntry[];
  documents: OwnerDocument[];
}

const MOCK_OWNERS: Owner[] = [
  {
    id: 1,
    firstName: "Margaret",
    lastName: "Chen",
    email: "margaret.chen@email.com",
    phone: "(203) 555-0147",
    ownershipPercentage: 60,
    ownerSince: "2018-03-15",
    mailingAddress: "42 Brookfield Lane, Stamford, CT 06902",
    status: "active",
    entityType: "trust",
    entityName: "Chen Family Trust",
    taxId: "XX-XXX4721",
    auditHistory: [
      { id: 1, action: "Ownership Updated", details: "Ownership percentage changed from 50% to 60%", date: "2024-11-02 3:45 PM", performedBy: "Julia LoSchiavo" },
      { id: 2, action: "Contact Updated", details: "Email updated from m.chen@oldmail.com to margaret.chen@email.com", date: "2024-08-19 11:20 AM", performedBy: "Carter Hughes" },
      { id: 3, action: "Entity Changed", details: "Entity type changed from Individual to Trust (Chen Family Trust)", date: "2023-06-10 9:00 AM", performedBy: "Julia LoSchiavo" },
      { id: 4, action: "Mailing Address Updated", details: "Address changed from 15 Oak Street, Greenwich, CT to 42 Brookfield Lane, Stamford, CT 06902", date: "2022-12-01 2:30 PM", performedBy: "Johan Gonzalez" },
      { id: 5, action: "Owner Added", details: "Added as owner with 50% ownership", date: "2018-03-15 10:00 AM", performedBy: "System Import" },
    ],
    documents: [
      { id: 101, label: "Chen Family Trust — Deed of Trust.pdf", type: "ownership", uploadedDate: "2018-03-15", uploadedBy: "System Import" },
      { id: 102, label: "Chen Ownership Agreement — Amendment 2024.pdf", type: "ownership", uploadedDate: "2024-11-02", uploadedBy: "Julia LoSchiavo" },
      { id: 103, label: "Hartford Property Policy — POL-8821.pdf", type: "insurance", uploadedDate: "2025-01-10", uploadedBy: "Carter Hughes" },
      { id: 104, label: "Chen Family Trust — Tax ID Verification.pdf", type: "tax", uploadedDate: "2023-06-10", uploadedBy: "Julia LoSchiavo" },
    ],
  },
  {
    id: 2,
    firstName: "Robert",
    lastName: "Williams",
    email: "r.williams@investco.com",
    phone: "(203) 555-0293",
    ownershipPercentage: 40,
    ownerSince: "2020-07-01",
    mailingAddress: "890 Harbor Drive, Unit 4B, Norwalk, CT 06851",
    status: "active",
    entityType: "llc",
    entityName: "Williams Investment Partners LLC",
    taxId: "XX-XXX8835",
    auditHistory: [
      { id: 1, action: "Ownership Updated", details: "Ownership percentage changed from 50% to 40%", date: "2024-11-02 3:45 PM", performedBy: "Julia LoSchiavo" },
      { id: 2, action: "Phone Updated", details: "Phone changed from (203) 555-0100 to (203) 555-0293", date: "2024-03-15 4:10 PM", performedBy: "Carter Hughes" },
      { id: 3, action: "Mailing Address Updated", details: "Address changed from 500 Main St, Norwalk, CT to 890 Harbor Drive, Unit 4B, Norwalk, CT 06851", date: "2023-01-20 1:15 PM", performedBy: "Johan Gonzalez" },
      { id: 4, action: "Owner Added", details: "Added as owner with 50% ownership via Williams Investment Partners LLC", date: "2020-07-01 9:00 AM", performedBy: "Julia LoSchiavo" },
    ],
    documents: [
      { id: 201, label: "Williams Investment Partners LLC — Operating Agreement.pdf", type: "ownership", uploadedDate: "2020-07-01", uploadedBy: "Julia LoSchiavo" },
      { id: 202, label: "Travelers General Liability — GL-44291.pdf", type: "insurance", uploadedDate: "2025-02-15", uploadedBy: "Carter Hughes" },
      { id: 203, label: "Williams COI — 2025.pdf", type: "insurance", uploadedDate: "2025-02-15", uploadedBy: "Carter Hughes" },
    ],
  },
];

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const ENTITY_LABELS: Record<string, string> = {
  individual: "Individual",
  llc: "LLC",
  trust: "Trust",
};

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  active: { bg: "bg-green-100", text: "text-green-800", label: "Active" },
  inactive: { bg: "bg-gray-100", text: "text-gray-600", label: "Inactive" },
};

export default function OwnersList() {
  const [owners, setOwners] = useState<Owner[]>(MOCK_OWNERS);
  const [expandedOwnerId, setExpandedOwnerId] = useState<number | null>(null);
  const [showAuditFor, setShowAuditFor] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingOwner, setEditingOwner] = useState<OwnerFormData | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [uploadingForOwner, setUploadingForOwner] = useState<number | null>(null);
  const [uploadDocType, setUploadDocType] = useState<OwnerDocument["type"]>("ownership");

  const handleSaved = (data: OwnerFormData) => {
    if (data.id) {
      // Edit existing
      setOwners((prev) =>
        prev.map((o) =>
          o.id === data.id
            ? {
                ...o,
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                phone: data.phone,
                ownershipPercentage: data.ownershipPercentage,
                ownerSince: data.ownerSince,
                mailingAddress: data.mailingAddress,
                status: data.status,
                entityType: data.entityType,
                entityName: data.entityName || undefined,
                taxId: data.taxId || undefined,
              }
            : o,
        ),
      );
    } else {
      // Add new
      const nextId = owners.length ? Math.max(...owners.map((o) => o.id)) + 1 : 1;
      setOwners((prev) => [
        ...prev,
        {
          id: nextId,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          ownershipPercentage: data.ownershipPercentage,
          ownerSince: data.ownerSince,
          mailingAddress: data.mailingAddress,
          status: data.status,
          entityType: data.entityType,
          entityName: data.entityName || undefined,
          taxId: data.taxId || undefined,
          documents: [],
          auditHistory: [
            {
              id: 1,
              action: "Owner Added",
              details: `Added as owner with ${data.ownershipPercentage}% ownership`,
              date: new Date().toLocaleString("en-US", {
                month: "numeric",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
              }),
              performedBy: "Current User",
            },
          ],
        },
      ]);
    }
    setShowModal(false);
    setEditingOwner(null);
  };

  const handleOwnerDocUpload = (ownerId: number, docType: OwnerDocument["type"]) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf,.doc,.docx,.jpg,.jpeg,.png";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;

      setOwners((prev) =>
        prev.map((o) => {
          if (o.id !== ownerId) return o;
          const nextId = o.documents.length
            ? Math.max(...o.documents.map((d) => d.id)) + 1
            : 1;
          return {
            ...o,
            documents: [
              ...o.documents,
              {
                id: nextId,
                label: file.name,
                type: docType,
                uploadedDate: new Date().toISOString().split("T")[0],
                uploadedBy: "Current User",
              },
            ],
          };
        }),
      );
      toast.success(`Document "${file.name}" uploaded`);
    };
    input.click();
  };

  const handleOwnerDocDelete = (ownerId: number, docId: number) => {
    setOwners((prev) =>
      prev.map((o) => {
        if (o.id !== ownerId) return o;
        return { ...o, documents: o.documents.filter((d) => d.id !== docId) };
      }),
    );
    toast.success("Document removed");
  };

  const handleDelete = () => {
    if (!deleteConfirmId) return;
    setOwners((prev) => prev.filter((o) => o.id !== deleteConfirmId));
    setDeleteConfirmId(null);
    if (expandedOwnerId === deleteConfirmId) setExpandedOwnerId(null);
    toast.success("Owner removed");
  };

  const openEditModal = (owner: Owner) => {
    setEditingOwner({
      id: owner.id,
      firstName: owner.firstName,
      lastName: owner.lastName,
      email: owner.email,
      phone: owner.phone,
      ownershipPercentage: owner.ownershipPercentage,
      ownerSince: owner.ownerSince,
      mailingAddress: owner.mailingAddress,
      status: owner.status,
      entityType: owner.entityType,
      entityName: owner.entityName || "",
      taxId: owner.taxId || "",
    });
    setShowModal(true);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-[#303030] font-semibold text-base">Owners</h3>
        <button
          onClick={() => {
            setEditingOwner(null);
            setShowModal(true);
          }}
          className="flex items-center gap-1.5 text-[#1357D5] font-medium text-sm hover:underline transition-colors bg-none border-none cursor-pointer p-0"
        >
          <PlusIcon width={16} height={16} className="text-[#1357D5]" />
          Add Owner
        </button>
      </div>

      {owners.length === 0 ? (
        <div className="text-sm text-gray-400 py-4 text-center">
          No owners assigned to this unit.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {owners.map((owner) => {
            const style = STATUS_STYLES[owner.status];
            const isExpanded = expandedOwnerId === owner.id;
            const isAuditOpen = showAuditFor === owner.id;

            return (
              <div key={owner.id} className="border border-[#E4E4E7] rounded-lg bg-white">
                <div
                  className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedOwnerId(isExpanded ? null : owner.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-[#303030]">
                        {owner.firstName} {owner.lastName}
                      </span>
                      <span className="text-xs text-[#71717A]">
                        {owner.entityName || owner.email}
                      </span>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
                      {style.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-[#1357D5] bg-blue-50 px-2 py-0.5 rounded-full mr-1">
                      {owner.ownershipPercentage}%
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(owner);
                      }}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                      title="Edit"
                    >
                      <EditIcon width={14} height={14} color="#525252" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirmId(owner.id);
                      }}
                      className="p-1 hover:bg-red-50 rounded transition-colors"
                      title="Delete"
                    >
                      <DeleteIcon width={14} height={14} color="#982740" />
                    </button>
                    <svg
                      className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-[#E4E4E7] px-3 pb-3 pt-2">
                    <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm mb-3">
                      <div>
                        <span className="text-[#71717A] text-xs">ENTITY TYPE</span>
                        <div className="text-[#303030]">{ENTITY_LABELS[owner.entityType]}</div>
                      </div>
                      <div>
                        <span className="text-[#71717A] text-xs">OWNERSHIP</span>
                        <div className="text-[#303030]">{owner.ownershipPercentage}%</div>
                      </div>
                      {owner.entityName && (
                        <div className="col-span-2">
                          <span className="text-[#71717A] text-xs">ENTITY NAME</span>
                          <div className="text-[#303030]">{owner.entityName}</div>
                        </div>
                      )}
                      <div>
                        <span className="text-[#71717A] text-xs">EMAIL</span>
                        <div className="text-[#303030]">{owner.email}</div>
                      </div>
                      <div>
                        <span className="text-[#71717A] text-xs">PHONE</span>
                        <div className="text-[#303030]">{owner.phone}</div>
                      </div>
                      <div className="col-span-2">
                        <span className="text-[#71717A] text-xs">MAILING ADDRESS</span>
                        <div className="text-[#303030]">{owner.mailingAddress}</div>
                      </div>
                      <div>
                        <span className="text-[#71717A] text-xs">OWNER SINCE</span>
                        <div className="text-[#303030]">{formatDate(owner.ownerSince)}</div>
                      </div>
                      <div>
                        <span className="text-[#71717A] text-xs">TAX ID</span>
                        <div className="text-[#303030]">{owner.taxId || "—"}</div>
                      </div>
                    </div>

                    {/* Documents */}
                    <div className="border-t border-[#E4E4E7] pt-3 mt-2 mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-[#71717A] tracking-wide">DOCUMENTS</span>
                        <div className="flex items-center gap-1.5">
                          {uploadingForOwner === owner.id ? (
                            <div className="flex items-center gap-2">
                              <select
                                className="h-9 text-sm border border-[#DADADA] rounded-lg px-3 py-1.5 text-[#303030] bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] focus:outline-none focus:ring-1 focus:ring-[#1357D5]/20"
                                value={uploadDocType}
                                onChange={(e) => setUploadDocType(e.target.value as OwnerDocument["type"])}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <option value="ownership">Ownership</option>
                                <option value="insurance">Insurance</option>
                                <option value="tax">Tax</option>
                                <option value="other">Other</option>
                              </select>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOwnerDocUpload(owner.id, uploadDocType);
                                  setUploadingForOwner(null);
                                }}
                                className="h-9 text-sm font-medium text-white bg-[#013764] hover:bg-[#003a73] px-4 py-1.5 rounded-lg border border-white shadow-[0_0_0_1px_#002D5A] transition-colors"
                              >
                                Choose File
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setUploadingForOwner(null);
                                }}
                                className="h-9 text-sm font-medium text-[#303030] hover:bg-gray-50 px-4 py-1.5 rounded-lg border border-[#DADADA] bg-[#FBFBFB] shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setUploadingForOwner(owner.id);
                                setUploadDocType("ownership");
                              }}
                              className="flex items-center gap-1.5 text-[#1357D5] text-sm font-medium hover:underline"
                            >
                              <PlusIcon width={14} height={14} className="text-[#1357D5]" />
                              Upload
                            </button>
                          )}
                        </div>
                      </div>
                      {owner.documents.length === 0 ? (
                        <div className="text-sm text-gray-400 mt-2">No documents</div>
                      ) : (
                        <div className="flex flex-col gap-1.5 mt-2">
                          {owner.documents.map((doc) => {
                            const typeColors: Record<string, string> = {
                              ownership: "bg-blue-50 text-blue-700",
                              insurance: "bg-amber-50 text-amber-700",
                              tax: "bg-purple-50 text-purple-700",
                              other: "bg-gray-100 text-gray-600",
                            };
                            return (
                              <div key={doc.id} className="flex items-center justify-between py-2.5 px-3 rounded-lg border border-[#F0F0F0] bg-[#FAFAFA] hover:bg-[#F5F5F5] transition-colors">
                                <div className="flex items-center gap-3 min-w-0">
                                  <svg className="w-5 h-5 text-[#71717A] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                  </svg>
                                  <span className="text-sm text-[#303030] truncate">{doc.label}</span>
                                </div>
                                <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                                  <span className={`px-2 py-0.5 rounded-md text-xs font-medium capitalize ${typeColors[doc.type] || typeColors.other}`}>
                                    {doc.type}
                                  </span>
                                  <span className="text-xs text-[#A0A0A0]">{formatDate(doc.uploadedDate)}</span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOwnerDocDelete(owner.id, doc.id);
                                    }}
                                    className="p-1 hover:bg-red-50 rounded-md transition-colors"
                                  >
                                    <DeleteIcon width={14} height={14} color="#982740" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Audit History */}
                    <div className="border-t border-[#E4E4E7] pt-2 mt-1">
                      <button
                        onClick={() => setShowAuditFor(isAuditOpen ? null : owner.id)}
                        className="flex items-center gap-1.5 text-xs font-medium text-[#71717A] hover:text-[#303030] transition-colors bg-none border-none cursor-pointer p-0 mb-2"
                      >
                        <svg className={`w-3 h-3 transition-transform ${isAuditOpen ? "rotate-90" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        Audit History ({owner.auditHistory.length} events)
                      </button>
                      {isAuditOpen && (
                        <div className="ml-1 border-l-2 border-[#E4E4E7] pl-3 flex flex-col gap-3">
                          {owner.auditHistory.map((entry) => (
                            <div key={entry.id} className="relative flex flex-col gap-0.5">
                              <div className="absolute -left-[19px] top-1 w-2.5 h-2.5 rounded-full bg-white border-2 border-[#D4DFFA]" />
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-[#303030]">{entry.action}</span>
                                <span className="text-[10px] text-[#A0A0A0]">{entry.date}</span>
                              </div>
                              <span className="text-xs text-[#71717A]">{entry.details}</span>
                              <span className="text-[10px] text-[#A0A0A0]">by {entry.performedBy}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <AddOwnerModal
        open={showModal}
        onOpenChange={(open) => {
          if (!open) {
            setShowModal(false);
            setEditingOwner(null);
          }
        }}
        editData={editingOwner}
        onSaved={handleSaved}
      />

      <ModalTemplate
        open={deleteConfirmId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteConfirmId(null);
        }}
        title="Remove Owner"
        size="sm"
        footer={
          <ModalButtons
            onCancel={() => setDeleteConfirmId(null)}
            onConfirm={handleDelete}
            cancelLabel="Cancel"
            confirmLabel="Remove"
          />
        }
      >
        <FormLayout>
          <FormSection showDivider={false}>
            <p className="text-sm text-[#303030]">
              Are you sure you want to remove this owner? This action will be recorded in the audit history.
            </p>
          </FormSection>
        </FormLayout>
      </ModalTemplate>
    </div>
  );
}
