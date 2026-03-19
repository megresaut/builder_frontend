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

interface TenantAuditEntry {
  id: number;
  action: string;
  details: string;
  date: string;
  performedBy: string;
}

const MOCK_AUDIT_HISTORY: Record<number, TenantAuditEntry[]> = {
  901: [
    { id: 1, action: "Lease Renewed", details: "Fixed lease renewed for 12 months, rent increased from $2,200 to $2,400/mo", date: "2025-01-15 10:30 AM", performedBy: "Julia LoSchiavo" },
    { id: 2, action: "Contact Updated", details: "Email changed from j.martinez@old.com to j.martinez@gmail.com", date: "2024-09-03 2:15 PM", performedBy: "Carter Hughes" },
    { id: 3, action: "Emergency Contact Updated", details: "Emergency contact changed from Carlos Martinez to Elena Martinez (sister)", date: "2024-06-20 11:00 AM", performedBy: "Johan Gonzalez" },
    { id: 4, action: "Tenant Added", details: "Moved in with fixed 12-month lease at $2,200/mo", date: "2022-06-01 9:00 AM", performedBy: "Julia LoSchiavo" },
  ],
  902: [
    { id: 1, action: "Rent Adjusted", details: "Rent increased from $1,800 to $1,950/mo", date: "2025-02-01 9:00 AM", performedBy: "Julia LoSchiavo" },
    { id: 2, action: "Lease Converted", details: "Lease type changed from Fixed to Month-to-Month", date: "2024-08-01 10:00 AM", performedBy: "Julia LoSchiavo" },
    { id: 3, action: "Tenant Added", details: "Moved in with fixed 12-month lease at $1,800/mo", date: "2023-03-01 9:00 AM", performedBy: "Carter Hughes" },
  ],
  903: [
    { id: 1, action: "Lease Renewed", details: "Fixed lease renewed for 24 months at $2,800/mo", date: "2025-03-01 10:00 AM", performedBy: "Julia LoSchiavo" },
    { id: 2, action: "Security Deposit Updated", details: "Additional deposit of $500 collected (total $5,600)", date: "2024-04-15 3:30 PM", performedBy: "Carter Hughes" },
    { id: 3, action: "Tenant Added", details: "Moved in with fixed 12-month lease at $2,800/mo, security deposit $5,100", date: "2023-03-01 9:00 AM", performedBy: "Julia LoSchiavo" },
  ],
  904: [
    { id: 1, action: "Status Changed", details: "Status changed from Active to Former", date: "2025-01-31 5:00 PM", performedBy: "Julia LoSchiavo" },
    { id: 2, action: "Move Out Recorded", details: "Move-out date set to Jan 31, 2025. Security deposit refund pending.", date: "2025-01-31 5:00 PM", performedBy: "Julia LoSchiavo" },
    { id: 3, action: "Lease Expiry Notice", details: "Tenant notified of lease expiry, chose not to renew", date: "2024-11-01 10:00 AM", performedBy: "Carter Hughes" },
    { id: 4, action: "Rent Adjusted", details: "Rent increased from $1,600 to $1,750/mo", date: "2024-02-01 9:00 AM", performedBy: "Julia LoSchiavo" },
    { id: 5, action: "Tenant Added", details: "Moved in with fixed 12-month lease at $1,600/mo", date: "2023-02-01 9:00 AM", performedBy: "Johan Gonzalez" },
  ],
  905: [
    { id: 1, action: "Tenant Added", details: "Moved in with month-to-month lease at $2,100/mo", date: "2024-09-15 9:00 AM", performedBy: "Julia LoSchiavo" },
  ],
  906: [
    { id: 1, action: "Lease Renewed", details: "Month-to-month lease continued, rent adjusted from $1,550 to $1,650/mo", date: "2025-01-01 9:00 AM", performedBy: "Julia LoSchiavo" },
    { id: 2, action: "Phone Updated", details: "Phone changed from (203) 555-0606 to (203) 555-0611", date: "2024-07-12 4:30 PM", performedBy: "Carter Hughes" },
    { id: 3, action: "Tenant Added", details: "Moved in with month-to-month lease at $1,550/mo", date: "2023-07-01 9:00 AM", performedBy: "Johan Gonzalez" },
  ],
  907: [
    { id: 1, action: "Status Changed", details: "Status changed from Active to Former", date: "2024-12-31 5:00 PM", performedBy: "Julia LoSchiavo" },
    { id: 2, action: "Move Out Recorded", details: "Move-out date set to Dec 31, 2024. Unit inspection completed — no damages.", date: "2024-12-31 5:00 PM", performedBy: "Carter Hughes" },
    { id: 3, action: "Tenant Added", details: "Moved in with fixed 12-month lease at $2,500/mo", date: "2024-01-01 9:00 AM", performedBy: "Julia LoSchiavo" },
  ],
  908: [
    { id: 1, action: "Lease Started", details: "Pending tenant has signed lease, moving in Apr 1, 2026", date: "2026-03-10 2:00 PM", performedBy: "Julia LoSchiavo" },
    { id: 2, action: "Tenant Added", details: "Created as pending tenant with fixed 12-month lease at $2,300/mo", date: "2026-03-05 11:00 AM", performedBy: "Julia LoSchiavo" },
  ],
  909: [
    { id: 1, action: "Rent Adjusted", details: "Rent increased from $1,900 to $2,050/mo per annual review", date: "2025-06-01 9:00 AM", performedBy: "Julia LoSchiavo" },
    { id: 2, action: "Emergency Contact Added", details: "Added emergency contact: David Kim (brother) — (203) 555-0919", date: "2024-10-05 1:45 PM", performedBy: "Carter Hughes" },
    { id: 3, action: "Lease Converted", details: "Lease type changed from Fixed to Month-to-Month after initial term ended", date: "2024-06-01 9:00 AM", performedBy: "Julia LoSchiavo" },
    { id: 4, action: "Tenant Added", details: "Moved in with fixed 12-month lease at $1,900/mo", date: "2023-06-01 9:00 AM", performedBy: "Johan Gonzalez" },
  ],
  910: [
    { id: 1, action: "Status Changed", details: "Status changed from Pending to Active after move-in confirmation", date: "2026-02-01 10:00 AM", performedBy: "Carter Hughes" },
    { id: 2, action: "Tenant Added", details: "Created as pending tenant with fixed 18-month lease at $2,600/mo", date: "2026-01-15 3:00 PM", performedBy: "Julia LoSchiavo" },
  ],
};

interface TenantMockDocument {
  id: number;
  label: string;
  type: "lease" | "insurance" | "id" | "other";
  uploadedDate: string;
  uploadedBy: string;
}

const MOCK_TENANT_DOCS: Record<number, TenantMockDocument[]> = {
  901: [
    { id: 1001, label: "Martinez Lease Agreement — 2025.pdf", type: "lease", uploadedDate: "2025-01-15", uploadedBy: "Julia LoSchiavo" },
    { id: 1002, label: "Martinez Lease — Original 2022.pdf", type: "lease", uploadedDate: "2022-06-01", uploadedBy: "Julia LoSchiavo" },
    { id: 1003, label: "Lemonade Renters Policy — RP-7891.pdf", type: "insurance", uploadedDate: "2025-02-01", uploadedBy: "Carter Hughes" },
    { id: 1004, label: "Martinez Photo ID.jpg", type: "id", uploadedDate: "2022-06-01", uploadedBy: "Julia LoSchiavo" },
  ],
  902: [
    { id: 1005, label: "Patel Month-to-Month Agreement.pdf", type: "lease", uploadedDate: "2024-08-01", uploadedBy: "Julia LoSchiavo" },
    { id: 1006, label: "State Farm Renters — SF-2245.pdf", type: "insurance", uploadedDate: "2024-09-15", uploadedBy: "Ahmed Patel" },
  ],
  903: [
    { id: 1007, label: "O'Brien Lease — 24 Month Fixed 2025.pdf", type: "lease", uploadedDate: "2025-03-01", uploadedBy: "Julia LoSchiavo" },
    { id: 1008, label: "USAA Renters Insurance — COI.pdf", type: "insurance", uploadedDate: "2025-03-10", uploadedBy: "Sarah O'Brien" },
    { id: 1009, label: "O'Brien Photo ID.jpg", type: "id", uploadedDate: "2023-03-01", uploadedBy: "Julia LoSchiavo" },
  ],
  905: [
    { id: 1010, label: "Thompson MTM Agreement.pdf", type: "lease", uploadedDate: "2024-09-15", uploadedBy: "Julia LoSchiavo" },
  ],
  906: [
    { id: 1011, label: "Rivera Lease — Current.pdf", type: "lease", uploadedDate: "2025-01-01", uploadedBy: "Julia LoSchiavo" },
    { id: 1012, label: "Progressive Renters — PR-5567.pdf", type: "insurance", uploadedDate: "2025-01-05", uploadedBy: "Carlos Rivera" },
  ],
  908: [
    { id: 1013, label: "Sullivan Signed Lease — 2026.pdf", type: "lease", uploadedDate: "2026-03-10", uploadedBy: "Julia LoSchiavo" },
    { id: 1014, label: "Sullivan Photo ID.pdf", type: "id", uploadedDate: "2026-03-05", uploadedBy: "Julia LoSchiavo" },
  ],
  909: [
    { id: 1015, label: "Kim MTM Agreement — Current.pdf", type: "lease", uploadedDate: "2024-06-01", uploadedBy: "Julia LoSchiavo" },
    { id: 1016, label: "Allstate Renters — AL-8834.pdf", type: "insurance", uploadedDate: "2024-11-01", uploadedBy: "Carter Hughes" },
  ],
  910: [
    { id: 1017, label: "Petrov Fixed Lease — 18 Month.pdf", type: "lease", uploadedDate: "2026-01-15", uploadedBy: "Julia LoSchiavo" },
    { id: 1018, label: "Geico Renters Insurance — GR-1192.pdf", type: "insurance", uploadedDate: "2026-02-01", uploadedBy: "Olivia Petrov" },
  ],
};

const MOCK_TENANTS: Tenant[] = [
  {
    id: 901, unit_id: 1, property_id: 1,
    first_name: "Jessica", last_name: "Martinez",
    email: "j.martinez@gmail.com", phone: "(203) 555-0101",
    lease_start_date: "2025-01-15", lease_end_date: "2026-01-14",
    rent_amount_cents: 240000, security_deposit_cents: 480000,
    lease_type: "fixed", move_in_date: "2022-06-01", move_out_date: null,
    status: "active",
    emergency_contact_name: "Elena Martinez", emergency_contact_phone: "(203) 555-0102", emergency_contact_relationship: "Sister",
    last_edited_by_user_id: 1, created_at: "2022-06-01T09:00:00Z", updated_at: "2025-01-15T10:30:00Z",
  },
  {
    id: 902, unit_id: 1, property_id: 1,
    first_name: "Ahmed", last_name: "Patel",
    email: "ahmed.patel@email.com", phone: "(203) 555-0202",
    lease_start_date: "2024-08-01", lease_end_date: null,
    rent_amount_cents: 195000, security_deposit_cents: 390000,
    lease_type: "month_to_month", move_in_date: "2023-03-01", move_out_date: null,
    status: "active",
    emergency_contact_name: "Priya Patel", emergency_contact_phone: "(203) 555-0203", emergency_contact_relationship: "Wife",
    last_edited_by_user_id: 1, created_at: "2023-03-01T09:00:00Z", updated_at: "2025-02-01T09:00:00Z",
  },
  {
    id: 903, unit_id: 1, property_id: 1,
    first_name: "Sarah", last_name: "O'Brien",
    email: "sarah.obrien@email.com", phone: "(203) 555-0303",
    lease_start_date: "2025-03-01", lease_end_date: "2027-02-28",
    rent_amount_cents: 280000, security_deposit_cents: 560000,
    lease_type: "fixed", move_in_date: "2023-03-01", move_out_date: null,
    status: "active",
    emergency_contact_name: "Michael O'Brien", emergency_contact_phone: "(203) 555-0304", emergency_contact_relationship: "Husband",
    last_edited_by_user_id: 1, created_at: "2023-03-01T09:00:00Z", updated_at: "2025-03-01T10:00:00Z",
  },
  {
    id: 904, unit_id: 1, property_id: 1,
    first_name: "David", last_name: "Nguyen",
    email: "d.nguyen@email.com", phone: "(203) 555-0404",
    lease_start_date: "2024-02-01", lease_end_date: "2025-01-31",
    rent_amount_cents: 175000, security_deposit_cents: 350000,
    lease_type: "fixed", move_in_date: "2023-02-01", move_out_date: "2025-01-31",
    status: "former",
    emergency_contact_name: null, emergency_contact_phone: null, emergency_contact_relationship: null,
    last_edited_by_user_id: 1, created_at: "2023-02-01T09:00:00Z", updated_at: "2025-01-31T17:00:00Z",
  },
  {
    id: 905, unit_id: 1, property_id: 1,
    first_name: "Rachel", last_name: "Thompson",
    email: "rachel.t@email.com", phone: "(203) 555-0505",
    lease_start_date: "2024-09-15", lease_end_date: null,
    rent_amount_cents: 210000, security_deposit_cents: 420000,
    lease_type: "month_to_month", move_in_date: "2024-09-15", move_out_date: null,
    status: "active",
    emergency_contact_name: "Mark Thompson", emergency_contact_phone: "(203) 555-0506", emergency_contact_relationship: "Father",
    last_edited_by_user_id: 1, created_at: "2024-09-15T09:00:00Z", updated_at: "2024-09-15T09:00:00Z",
  },
  {
    id: 906, unit_id: 1, property_id: 1,
    first_name: "Carlos", last_name: "Rivera",
    email: "c.rivera@email.com", phone: "(203) 555-0611",
    lease_start_date: "2025-01-01", lease_end_date: null,
    rent_amount_cents: 165000, security_deposit_cents: 330000,
    lease_type: "month_to_month", move_in_date: "2023-07-01", move_out_date: null,
    status: "active",
    emergency_contact_name: "Maria Rivera", emergency_contact_phone: "(203) 555-0607", emergency_contact_relationship: "Mother",
    last_edited_by_user_id: 1, created_at: "2023-07-01T09:00:00Z", updated_at: "2025-01-01T09:00:00Z",
  },
  {
    id: 907, unit_id: 1, property_id: 1,
    first_name: "Lisa", last_name: "Yamamoto",
    email: "l.yamamoto@email.com", phone: "(203) 555-0707",
    lease_start_date: "2024-01-01", lease_end_date: "2024-12-31",
    rent_amount_cents: 250000, security_deposit_cents: 500000,
    lease_type: "fixed", move_in_date: "2024-01-01", move_out_date: "2024-12-31",
    status: "former",
    emergency_contact_name: "Ken Yamamoto", emergency_contact_phone: "(203) 555-0708", emergency_contact_relationship: "Brother",
    last_edited_by_user_id: 1, created_at: "2024-01-01T09:00:00Z", updated_at: "2024-12-31T17:00:00Z",
  },
  {
    id: 908, unit_id: 1, property_id: 1,
    first_name: "James", last_name: "Sullivan",
    email: "james.sullivan@email.com", phone: "(203) 555-0808",
    lease_start_date: "2026-04-01", lease_end_date: "2027-03-31",
    rent_amount_cents: 230000, security_deposit_cents: 460000,
    lease_type: "fixed", move_in_date: null, move_out_date: null,
    status: "pending",
    emergency_contact_name: "Patricia Sullivan", emergency_contact_phone: "(203) 555-0809", emergency_contact_relationship: "Mother",
    last_edited_by_user_id: 1, created_at: "2026-03-05T11:00:00Z", updated_at: "2026-03-10T14:00:00Z",
  },
  {
    id: 909, unit_id: 1, property_id: 1,
    first_name: "Min-Jun", last_name: "Kim",
    email: "minjun.kim@email.com", phone: "(203) 555-0909",
    lease_start_date: "2024-06-01", lease_end_date: null,
    rent_amount_cents: 205000, security_deposit_cents: 380000,
    lease_type: "month_to_month", move_in_date: "2023-06-01", move_out_date: null,
    status: "active",
    emergency_contact_name: "David Kim", emergency_contact_phone: "(203) 555-0919", emergency_contact_relationship: "Brother",
    last_edited_by_user_id: 1, created_at: "2023-06-01T09:00:00Z", updated_at: "2025-06-01T09:00:00Z",
  },
  {
    id: 910, unit_id: 1, property_id: 1,
    first_name: "Olivia", last_name: "Petrov",
    email: "o.petrov@email.com", phone: "(203) 555-1010",
    lease_start_date: "2026-02-01", lease_end_date: "2027-07-31",
    rent_amount_cents: 260000, security_deposit_cents: 520000,
    lease_type: "fixed", move_in_date: "2026-02-01", move_out_date: null,
    status: "active",
    emergency_contact_name: "Dmitri Petrov", emergency_contact_phone: "(203) 555-1011", emergency_contact_relationship: "Father",
    last_edited_by_user_id: 1, created_at: "2026-01-15T15:00:00Z", updated_at: "2026-02-01T10:00:00Z",
  },
];

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
  const [showAuditFor, setShowAuditFor] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "pending" | "former">("all");
  const [uploadingForTenant, setUploadingForTenant] = useState<number | null>(null);
  const [uploadDocType, setUploadDocType] = useState<TenantMockDocument["type"]>("lease");
  const [tenantDocs, setTenantDocs] = useState<Record<number, TenantMockDocument[]>>(MOCK_TENANT_DOCS);

  const loadTenants = useCallback(async () => {
    try {
      const data = await fetchTenantsByUnit(unitId);
      // Use mock data if API returns empty
      setTenants(data.length > 0 ? data : MOCK_TENANTS);
    } catch (err) {
      console.error("Failed to load tenants:", err);
      // Fallback to mock data on error
      setTenants(MOCK_TENANTS);
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
      // For mock data, just remove locally
      setTenants((prev) => prev.filter((t) => t.id !== deleteConfirmId));
      setDeleteConfirmId(null);
      if (expandedTenantId === deleteConfirmId) setExpandedTenantId(null);
      toast.success("Tenant deleted");
    }
  };

  const handleSaved = () => {
    setShowModal(false);
    setEditingTenant(null);
    loadTenants();
  };

  const handleTenantDocUpload = (tenantId: number, docType: TenantMockDocument["type"]) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf,.doc,.docx,.jpg,.jpeg,.png";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;

      setTenantDocs((prev) => {
        const existing = prev[tenantId] || [];
        const nextId = existing.length
          ? Math.max(...existing.map((d) => d.id)) + 1
          : 1;
        return {
          ...prev,
          [tenantId]: [
            ...existing,
            {
              id: nextId,
              label: file.name,
              type: docType,
              uploadedDate: new Date().toISOString().split("T")[0],
              uploadedBy: "Current User",
            },
          ],
        };
      });
      toast.success(`Document "${file.name}" uploaded`);
    };
    input.click();
  };

  const handleTenantDocDelete = (tenantId: number, docId: number) => {
    setTenantDocs((prev) => ({
      ...prev,
      [tenantId]: (prev[tenantId] || []).filter((d) => d.id !== docId),
    }));
    toast.success("Document removed");
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
            const isAuditOpen = showAuditFor === tenant.id;
            const auditEntries = MOCK_AUDIT_HISTORY[tenant.id] || [];
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

                    {/* Audit History */}
                    {auditEntries.length > 0 && (
                      <div className="border-t border-[#E4E4E7] pt-2 mt-1">
                        <button
                          onClick={() => setShowAuditFor(isAuditOpen ? null : tenant.id)}
                          className="flex items-center gap-1.5 text-xs font-medium text-[#71717A] hover:text-[#303030] transition-colors bg-none border-none cursor-pointer p-0 mb-2"
                        >
                          <svg className={`w-3 h-3 transition-transform ${isAuditOpen ? "rotate-90" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          Audit History ({auditEntries.length} events)
                        </button>
                        {isAuditOpen && (
                          <div className="ml-1 border-l-2 border-[#E4E4E7] pl-3 flex flex-col gap-3">
                            {auditEntries.map((entry) => (
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
                    )}

                    {/* Documents */}
                    {(() => {
                      const docs = tenantDocs[tenant.id] || [];
                      const typeColors: Record<string, string> = {
                        lease: "bg-blue-50 text-blue-700",
                        insurance: "bg-amber-50 text-amber-700",
                        id: "bg-purple-50 text-purple-700",
                        other: "bg-gray-100 text-gray-600",
                      };
                      return (
                        <div className="border-t border-[#E4E4E7] pt-3 mt-2">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-[#71717A] tracking-wide">DOCUMENTS</span>
                            <div className="flex items-center gap-1.5">
                              {uploadingForTenant === tenant.id ? (
                                <div className="flex items-center gap-2">
                                  <select
                                    className="h-9 text-sm border border-[#DADADA] rounded-lg px-3 py-1.5 text-[#303030] bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] focus:outline-none focus:ring-1 focus:ring-[#1357D5]/20"
                                    value={uploadDocType}
                                    onChange={(e) => setUploadDocType(e.target.value as TenantMockDocument["type"])}
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
                                    className="h-9 text-sm font-medium text-[#303030] hover:bg-gray-50 px-4 py-1.5 rounded-lg border border-[#DADADA] bg-[#FBFBFB] shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] transition-colors"
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
                          {docs.length === 0 ? (
                            <div className="text-sm text-gray-400 mt-2">No documents</div>
                          ) : (
                            <div className="flex flex-col gap-1.5 mt-2">
                              {docs.map((doc) => (
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
                      );
                    })()}
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
