import { useState, useEffect, useCallback } from "react";
import type { Tenant } from "@/types/tenant";
import { fetchTenantsByUnit, deleteTenant } from "@/data/tenants";
import AddTenantModal from "./AddTenantModal";
import TenantDocuments from "./TenantDocuments";
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
  pending: { bg: "bg-yellow-100", text: "text-yellow-800", label: "Pending" },
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

  const loadTenants = useCallback(async () => {
    try {
      const data = await fetchTenantsByUnit(unitId);
      setTenants(data);
    } catch (err) {
      console.error("Failed to load tenants:", err);
    } finally {
      setLoading(false);
    }
  }, [unitId]);

  useEffect(() => {
    loadTenants();
  }, [loadTenants]);

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await deleteTenant(deleteConfirmId);
      setTenants((prev) => prev.filter((t) => t.id !== deleteConfirmId));
      setDeleteConfirmId(null);
      if (expandedTenantId === deleteConfirmId) setExpandedTenantId(null);
      toast.success("Tenant deleted");
    } catch {
      toast.error("Failed to delete tenant");
    }
  };

  const handleSaved = () => {
    setShowModal(false);
    setEditingTenant(null);
    loadTenants();
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-[#303030] font-semibold text-base">Tenants</h3>
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

      {loading ? (
        <div className="text-sm text-gray-400 py-4 text-center">Loading tenants...</div>
      ) : tenants.length === 0 ? (
        <div className="text-sm text-gray-400 py-4 text-center">
          No tenants assigned to this unit.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {tenants.map((tenant) => {
            const style = STATUS_STYLES[tenant.status] || STATUS_STYLES.pending;
            const isExpanded = expandedTenantId === tenant.id;
            return (
              <div key={tenant.id} className="border border-[#E4E4E7] rounded-lg bg-white">
                <div
                  className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedTenantId(isExpanded ? null : tenant.id)}
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
                    <TenantDocuments tenantId={tenant.id} />
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
