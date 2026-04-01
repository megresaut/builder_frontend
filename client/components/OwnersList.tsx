import { useState, useEffect, useCallback } from "react";
import { PlusIcon, EditIcon, DeleteIcon } from "@/components/icons";
import AddOwnerModal, { type OwnerFormData } from "./AddOwnerModal";
import { ModalTemplate, ModalButtons } from "@/components/ui/ModalTemplate";
import { FormLayout, FormSection } from "@/components/ui/form-layout";
import { toast } from "sonner";
import {
  fetchOwnersByUnit,
  deleteOwner,
  fetchOwnerDocuments,
  uploadOwnerFile,
  createOwnerDocument,
  deleteOwnerDocument,
  fetchOwnerAudit,
  type Owner,
  type OwnerDocument,
  type OwnerAuditEntry,
} from "@/data/owners";

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

interface OwnersListProps {
  unitId: number;
  propertyId: number;
}

export default function OwnersList({ unitId, propertyId }: OwnersListProps) {
  const [owners, setOwners] = useState<Owner[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOwnerId, setExpandedOwnerId] = useState<number | null>(null);
  const [showAuditFor, setShowAuditFor] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingOwner, setEditingOwner] = useState<OwnerFormData | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // Lazily loaded per-owner data
  const [ownerDocs, setOwnerDocs] = useState<Record<number, OwnerDocument[]>>({});
  const [ownerAudit, setOwnerAudit] = useState<Record<number, OwnerAuditEntry[]>>({});
  const [docsLoading, setDocsLoading] = useState<Record<number, boolean>>({});

  // Upload state
  const [uploadingForOwner, setUploadingForOwner] = useState<number | null>(null);
  const [uploadDocType, setUploadDocType] = useState<"ownership" | "insurance" | "tax" | "other">("ownership");

  const loadOwners = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchOwnersByUnit(unitId);
      setOwners(data);
    } catch {
      setOwners([]);
    } finally {
      setLoading(false);
    }
  }, [unitId]);

  useEffect(() => {
    loadOwners();
  }, [loadOwners]);

  const loadOwnerDocs = async (ownerId: number) => {
    if (ownerDocs[ownerId] !== undefined) return;
    setDocsLoading((prev) => ({ ...prev, [ownerId]: true }));
    try {
      const docs = await fetchOwnerDocuments(ownerId);
      setOwnerDocs((prev) => ({ ...prev, [ownerId]: docs }));
    } catch {
      setOwnerDocs((prev) => ({ ...prev, [ownerId]: [] }));
    } finally {
      setDocsLoading((prev) => ({ ...prev, [ownerId]: false }));
    }
  };

  const loadOwnerAudit = async (ownerId: number) => {
    if (ownerAudit[ownerId] !== undefined) return;
    try {
      const entries = await fetchOwnerAudit(ownerId);
      setOwnerAudit((prev) => ({ ...prev, [ownerId]: entries }));
    } catch {
      setOwnerAudit((prev) => ({ ...prev, [ownerId]: [] }));
    }
  };

  const handleExpand = (ownerId: number) => {
    const isExpanded = expandedOwnerId === ownerId;
    setExpandedOwnerId(isExpanded ? null : ownerId);
    if (!isExpanded) {
      loadOwnerDocs(ownerId);
    }
  };

  const handleAuditToggle = (ownerId: number) => {
    const isOpen = showAuditFor === ownerId;
    setShowAuditFor(isOpen ? null : ownerId);
    if (!isOpen) {
      loadOwnerAudit(ownerId);
    }
  };

  const handleSaved = () => {
    setShowModal(false);
    setEditingOwner(null);
    loadOwners();
    // Clear cached docs/audit so they reload on next expand
    setOwnerDocs({});
    setOwnerAudit({});
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await deleteOwner(deleteConfirmId);
      toast.success("Owner removed");
    } catch {
      toast.error("Failed to remove owner");
    } finally {
      setDeleteConfirmId(null);
      if (expandedOwnerId === deleteConfirmId) setExpandedOwnerId(null);
      loadOwners();
    }
  };

  const handleOwnerDocUpload = async (ownerId: number, docType: "ownership" | "insurance" | "tax" | "other") => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf,.doc,.docx,.jpg,.jpeg,.png";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const { object_key, mime } = await uploadOwnerFile(file);
        await createOwnerDocument({
          owner_id: ownerId,
          document_type: docType,
          document_label: file.name,
          document_object_key: object_key,
          document_mime: mime,
        });
        // Reload docs for this owner
        const docs = await fetchOwnerDocuments(ownerId);
        setOwnerDocs((prev) => ({ ...prev, [ownerId]: docs }));
        toast.success(`"${file.name}" uploaded`);
      } catch {
        toast.error("Upload failed");
      }
    };
    input.click();
  };

  const handleOwnerDocDelete = async (ownerId: number, docId: number) => {
    try {
      await deleteOwnerDocument(docId);
      setOwnerDocs((prev) => ({
        ...prev,
        [ownerId]: (prev[ownerId] || []).filter((d) => d.id !== docId),
      }));
      toast.success("Document removed");
    } catch {
      toast.error("Failed to remove document");
    }
  };

  const openEditModal = (owner: Owner) => {
    setEditingOwner({
      id: owner.id,
      firstName: owner.first_name,
      lastName: owner.last_name,
      email: owner.email || "",
      phone: owner.phone || "",
      ownershipPercentage: owner.ownership_percentage,
      ownerSince: owner.owner_since || "",
      mailingAddress: owner.mailing_address || "",
      status: (owner.status as "active" | "inactive"),
      entityType: (owner.entity_type as "individual" | "llc" | "trust"),
      entityName: owner.entity_name || "",
      taxId: owner.tax_id || "",
    });
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[#303030] font-semibold text-base">Owners</h3>
        </div>
        <div className="text-sm text-gray-400 py-4 text-center">Loading owners...</div>
      </div>
    );
  }

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
            const style = STATUS_STYLES[owner.status] ?? STATUS_STYLES.inactive;
            const isExpanded = expandedOwnerId === owner.id;
            const isAuditOpen = showAuditFor === owner.id;
            const docs = ownerDocs[owner.id] ?? [];
            const audit = ownerAudit[owner.id] ?? [];
            const isDocsLoading = docsLoading[owner.id];

            return (
              <div key={owner.id} className="border border-[#E4E4E7] rounded-lg bg-white">
                <div
                  className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => handleExpand(owner.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-[#303030]">
                        {owner.first_name} {owner.last_name}
                      </span>
                      <span className="text-xs text-[#71717A]">
                        {owner.entity_name || owner.email || ""}
                      </span>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
                      {style.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-[#1357D5] bg-blue-50 px-2 py-0.5 rounded-full mr-1">
                      {owner.ownership_percentage}%
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
                        <div className="text-[#303030]">{ENTITY_LABELS[owner.entity_type] ?? owner.entity_type}</div>
                      </div>
                      <div>
                        <span className="text-[#71717A] text-xs">OWNERSHIP</span>
                        <div className="text-[#303030]">{owner.ownership_percentage}%</div>
                      </div>
                      {owner.entity_name && (
                        <div className="col-span-2">
                          <span className="text-[#71717A] text-xs">ENTITY NAME</span>
                          <div className="text-[#303030]">{owner.entity_name}</div>
                        </div>
                      )}
                      <div>
                        <span className="text-[#71717A] text-xs">EMAIL</span>
                        <div className="text-[#303030]">{owner.email || "—"}</div>
                      </div>
                      <div>
                        <span className="text-[#71717A] text-xs">PHONE</span>
                        <div className="text-[#303030]">{owner.phone || "—"}</div>
                      </div>
                      <div className="col-span-2">
                        <span className="text-[#71717A] text-xs">MAILING ADDRESS</span>
                        <div className="text-[#303030]">{owner.mailing_address || "—"}</div>
                      </div>
                      <div>
                        <span className="text-[#71717A] text-xs">OWNER SINCE</span>
                        <div className="text-[#303030]">
                          {owner.owner_since ? formatDate(owner.owner_since) : "—"}
                        </div>
                      </div>
                      <div>
                        <span className="text-[#71717A] text-xs">TAX ID</span>
                        <div className="text-[#303030]">{owner.tax_id || "—"}</div>
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
                                onChange={(e) => setUploadDocType(e.target.value as typeof uploadDocType)}
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
                      {isDocsLoading ? (
                        <div className="text-sm text-gray-400 mt-2">Loading...</div>
                      ) : docs.length === 0 ? (
                        <div className="text-sm text-gray-400 mt-2">No documents</div>
                      ) : (
                        <div className="flex flex-col gap-1.5 mt-2">
                          {docs.map((doc) => {
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
                                  <span className="text-sm text-[#303030] truncate">{doc.document_label || doc.document_object_key}</span>
                                </div>
                                <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                                  <span className={`px-2 py-0.5 rounded-md text-xs font-medium capitalize ${typeColors[doc.document_type] ?? typeColors.other}`}>
                                    {doc.document_type}
                                  </span>
                                  <span className="text-xs text-[#A0A0A0]">{formatDate(doc.created_at)}</span>
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
                        onClick={() => handleAuditToggle(owner.id)}
                        className="flex items-center gap-1.5 text-xs font-medium text-[#71717A] hover:text-[#303030] transition-colors bg-none border-none cursor-pointer p-0 mb-2"
                      >
                        <svg className={`w-3 h-3 transition-transform ${isAuditOpen ? "rotate-90" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        Audit History ({audit.length} events)
                      </button>
                      {isAuditOpen && (
                        <div className="ml-1 border-l-2 border-[#E4E4E7] pl-3 flex flex-col gap-3">
                          {audit.length === 0 ? (
                            <div className="text-xs text-gray-400">No audit history</div>
                          ) : (
                            audit.map((entry) => (
                              <div key={entry.id} className="relative flex flex-col gap-0.5">
                                <div className="absolute -left-[19px] top-1 w-2.5 h-2.5 rounded-full bg-white border-2 border-[#D4DFFA]" />
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium text-[#303030]">{entry.action}</span>
                                  <span className="text-[10px] text-[#A0A0A0]">{formatDate(entry.created_at)}</span>
                                </div>
                                {entry.details && (
                                  <span className="text-xs text-[#71717A]">{entry.details}</span>
                                )}
                              </div>
                            ))
                          )}
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
        unitId={unitId}
        propertyId={propertyId}
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
