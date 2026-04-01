import { useState, useEffect, useCallback } from "react";
import type { Tenant, TenantDocument } from "@/types/tenant";
import {
  fetchTenantsByUnit,
  deleteTenant,
  fetchTenantDocuments,
  uploadTenantDocument,
  createTenantDocument,
  deleteTenantDocument,
} from "@/data/tenants";
import AddTenantModal from "./AddTenantModal";
import { PlusIcon, EditIcon, DeleteIcon } from "@/components/icons";
import { ModalTemplate, ModalButtons } from "@/components/ui/ModalTemplate";
import { FormLayout, FormSection } from "@/components/ui/form-layout";
import { toast } from "sonner";

interface TenantsListProps {
  unitId: number;
  propertyId: number;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  active: { bg: "bg-green-100", text: "text-green-800", label: "Active" },
  pending: { bg: "bg-amber-100", text: "text-amber-800", label: "Pending" },
  former: { bg: "bg-gray-100", text: "text-gray-600", label: "Former" },
};

function formatCents(cents: number | null): string {
  if (cents == null) return "—";
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function TenantsList({ unitId, propertyId }: TenantsListProps) {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [expandedTenantId, setExpandedTenantId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "pending" | "former">("all");

  // Lazily loaded docs per tenant
  const [tenantDocs, setTenantDocs] = useState<Record<number, TenantDocument[]>>({});
  const [docsLoading, setDocsLoading] = useState<Record<number, boolean>>({});
  const [uploadingForTenant, setUploadingForTenant] = useState<number | null>(null);
  const [uploadDocType, setUploadDocType] = useState("lease");

  const loadTenants = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchTenantsByUnit(unitId);
      setTenants(data);
    } catch {
      setTenants([]);
    } finally {
      setLoading(false);
    }
  }, [unitId]);

  useEffect(() => {
    loadTenants();
  }, [loadTenants]);

  const loadTenantDocs = async (tenantId: number) => {
    if (tenantDocs[tenantId] !== undefined) return;
    setDocsLoading((prev) => ({ ...prev, [tenantId]: true }));
    try {
      const docs = await fetchTenantDocuments(tenantId);
      setTenantDocs((prev) => ({ ...prev, [tenantId]: docs }));
    } catch {
      setTenantDocs((prev) => ({ ...prev, [tenantId]: [] }));
    } finally {
      setDocsLoading((prev) => ({ ...prev, [tenantId]: false }));
    }
  };

  const handleExpand = (tenantId: number) => {
    const isExpanded = expandedTenantId === tenantId;
    setExpandedTenantId(isExpanded ? null : tenantId);
    if (!isExpanded) loadTenantDocs(tenantId);
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await deleteTenant(deleteConfirmId);
      toast.success("Tenant deleted");
    } catch {
      toast.error("Failed to delete tenant");
    } finally {
      setDeleteConfirmId(null);
      if (expandedTenantId === deleteConfirmId) setExpandedTenantId(null);
      loadTenants();
    }
  };

  const handleSaved = () => {
    setShowModal(false);
    setEditingTenant(null);
    loadTenants();
    setTenantDocs({});
  };

  const handleTenantDocUpload = async (tenantId: number, docType: string) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf,.doc,.docx,.jpg,.jpeg,.png";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const { object_key, mime } = await uploadTenantDocument(file);
        await createTenantDocument({
          tenant_id: tenantId,
          document_type: docType,
          document_label: file.name,
          document_object_key: object_key,
          document_mime: mime,
        });
        const docs = await fetchTenantDocuments(tenantId);
        setTenantDocs((prev) => ({ ...prev, [tenantId]: docs }));
        toast.success(`"${file.name}" uploaded`);
      } catch {
        toast.error("Upload failed");
      }
    };
    input.click();
  };

  const handleTenantDocDelete = async (tenantId: number, docId: number) => {
    try {
      await deleteTenantDocument(docId);
      setTenantDocs((prev) => ({
        ...prev,
        [tenantId]: (prev[tenantId] || []).filter((d) => d.id !== docId),
      }));
      toast.success("Document removed");
    } catch {
      toast.error("Failed to remove document");
    }
  };

  const filteredTenants = statusFilter === "all"
    ? tenants
    : tenants.filter((t) => t.status === statusFilter);

  const counts = {
    all: tenants.length,
    active: tenants.filter((t) => t.status === "active").length,
    pending: tenants.filter((t) => t.status === "pending").length,
    former: tenants.filter((t) => t.status === "former").length,
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-[#303030] font-semibold text-base">Tenants</h3>
          <span className="text-xs text-[#71717A] bg-gray-100 px-2 py-0.5 rounded-full">
            {counts.active} active
          </span>
        </div>
        <button
          onClick={() => {
            setEditingTenant(null);
            setShowModal(true);
          }}
          className="flex items-center gap-1.5 text-[#1357D5] font-medium text-sm hover:underline transition-colors bg-none border-none cursor-pointer p-0"
        >
          <PlusIcon width={16} height={16} className="text-[#1357D5]" />
          Add Tenant
        </button>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 border-b border-[#E4E4E7]">
        {(["all", "active", "pending", "former"] as const).map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3 py-1.5 text-xs font-medium border-b-2 transition-colors ${
              statusFilter === status
                ? "border-[#1357D5] text-[#1357D5]"
                : "border-transparent text-[#71717A] hover:text-[#303030]"
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)} ({counts[status]})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-sm text-gray-400 py-4 text-center">Loading tenants...</div>
      ) : filteredTenants.length === 0 ? (
        <div className="text-sm text-gray-400 py-4 text-center">
          {statusFilter === "all" ? "No tenants assigned to this unit." : `No ${statusFilter} tenants.`}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filteredTenants.map((tenant) => {
            const style = STATUS_STYLES[tenant.status] || STATUS_STYLES.pending;
            const isExpanded = expandedTenantId === tenant.id;
            const docs = tenantDocs[tenant.id] ?? [];
            const isDocsLoading = docsLoading[tenant.id];

            const typeColors: Record<string, string> = {
              lease: "bg-blue-50 text-blue-700",
              insurance: "bg-amber-50 text-amber-700",
              id: "bg-purple-50 text-purple-700",
              other: "bg-gray-100 text-gray-600",
            };

            return (
              <div key={tenant.id} className="border border-[#E4E4E7] rounded-lg bg-white">
                <div
                  className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => handleExpand(tenant.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-[#303030]">
                        {tenant.first_name} {tenant.last_name}
                      </span>
                      <span className="text-xs text-[#71717A]">
                        {tenant.email || tenant.phone || "No contact info"}
                      </span>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
                      {style.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {tenant.rent_amount_cents != null && (
                      <span className="text-xs text-[#71717A] mr-2">
                        {formatCents(tenant.rent_amount_cents)}/mo
                      </span>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingTenant(tenant);
                        setShowModal(true);
                      }}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                      title="Edit"
                    >
                      <EditIcon width={14} height={14} color="#525252" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirmId(tenant.id);
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
                        <span className="text-[#71717A] text-xs">LEASE TYPE</span>
                        <div className="text-[#303030]">
                          {tenant.lease_type === "fixed" ? "Fixed" : tenant.lease_type === "month_to_month" ? "Month-to-Month" : "—"}
                        </div>
                      </div>
                      <div>
                        <span className="text-[#71717A] text-xs">RENT</span>
                        <div className="text-[#303030]">{formatCents(tenant.rent_amount_cents)}</div>
                      </div>
                      <div>
                        <span className="text-[#71717A] text-xs">LEASE START</span>
                        <div className="text-[#303030]">{formatDate(tenant.lease_start_date)}</div>
                      </div>
                      <div>
                        <span className="text-[#71717A] text-xs">LEASE END</span>
                        <div className="text-[#303030]">{formatDate(tenant.lease_end_date)}</div>
                      </div>
                      <div>
                        <span className="text-[#71717A] text-xs">MOVE IN</span>
                        <div className="text-[#303030]">{formatDate(tenant.move_in_date)}</div>
                      </div>
                      <div>
                        <span className="text-[#71717A] text-xs">MOVE OUT</span>
                        <div className="text-[#303030]">{formatDate(tenant.move_out_date)}</div>
                      </div>
                      <div>
                        <span className="text-[#71717A] text-xs">SECURITY DEPOSIT</span>
                        <div className="text-[#303030]">{formatCents(tenant.security_deposit_cents)}</div>
                      </div>
                      <div>
                        <span className="text-[#71717A] text-xs">PHONE</span>
                        <div className="text-[#303030]">{tenant.phone || "—"}</div>
                      </div>
                      {tenant.emergency_contact_name && (
                        <div className="col-span-2">
                          <span className="text-[#71717A] text-xs">EMERGENCY CONTACT</span>
                          <div className="text-[#303030]">
                            {tenant.emergency_contact_name}
                            {tenant.emergency_contact_relationship && ` (${tenant.emergency_contact_relationship})`}
                            {tenant.emergency_contact_phone && ` — ${tenant.emergency_contact_phone}`}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Documents */}
                    <div className="border-t border-[#E4E4E7] pt-3 mt-2">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-[#71717A] tracking-wide">DOCUMENTS</span>
                        <div className="flex items-center gap-1.5">
                          {uploadingForTenant === tenant.id ? (
                            <div className="flex items-center gap-2">
                              <select
                                className="h-9 text-sm border border-[#DADADA] rounded-lg px-3 py-1.5 text-[#303030] bg-white focus:outline-none focus:ring-1 focus:ring-[#1357D5]/20"
                                value={uploadDocType}
                                onChange={(e) => setUploadDocType(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <option value="lease">Lease</option>
                                <option value="insurance">Insurance</option>
                                <option value="id">ID</option>
                                <option value="other">Other</option>
                              </select>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTenantDocUpload(tenant.id, uploadDocType);
                                  setUploadingForTenant(null);
                                }}
                                className="h-9 text-sm font-medium text-white bg-[#013764] hover:bg-[#003a73] px-4 py-1.5 rounded-lg border border-white shadow-[0_0_0_1px_#002D5A] transition-colors"
                              >
                                Choose File
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setUploadingForTenant(null);
                                }}
                                className="h-9 text-sm font-medium text-[#303030] hover:bg-gray-50 px-4 py-1.5 rounded-lg border border-[#DADADA] bg-[#FBFBFB] transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setUploadingForTenant(tenant.id);
                                setUploadDocType("lease");
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
                          {docs.map((doc) => (
                            <div key={doc.id} className="flex items-center justify-between py-2.5 px-3 rounded-lg border border-[#F0F0F0] bg-[#FAFAFA] hover:bg-[#F5F5F5] transition-colors">
                              <div className="flex items-center gap-3 min-w-0">
                                <svg className="w-5 h-5 text-[#71717A] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                                <span className="text-sm text-[#303030] truncate">
                                  {doc.document_label || doc.document_object_key}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                                <span className={`px-2 py-0.5 rounded-md text-xs font-medium capitalize ${typeColors[doc.document_type] ?? typeColors.other}`}>
                                  {doc.document_type}
                                </span>
                                <span className="text-xs text-[#A0A0A0]">{formatDate(doc.created_at)}</span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleTenantDocDelete(tenant.id, doc.id);
                                  }}
                                  className="p-1 hover:bg-red-50 rounded-md transition-colors"
                                >
                                  <DeleteIcon width={14} height={14} color="#982740" />
                                </button>
                              </div>
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

      <AddTenantModal
        open={showModal}
        onOpenChange={(open) => {
          if (!open) {
            setShowModal(false);
            setEditingTenant(null);
          }
        }}
        unitId={unitId}
        propertyId={propertyId}
        editData={editingTenant}
        onSaved={handleSaved}
      />

      <ModalTemplate
        open={deleteConfirmId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteConfirmId(null);
        }}
        title="Delete Tenant"
        size="sm"
        footer={
          <ModalButtons
            onCancel={() => setDeleteConfirmId(null)}
            onConfirm={handleDelete}
            cancelLabel="Cancel"
            confirmLabel="Delete"
          />
        }
      >
        <FormLayout>
          <FormSection showDivider={false}>
            <p className="text-sm text-[#303030]">
              Are you sure you want to delete this tenant? This will also remove their documents and insurance links.
            </p>
          </FormSection>
        </FormLayout>
      </ModalTemplate>
    </div>
  );
}
