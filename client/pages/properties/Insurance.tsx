import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchJSON, authFetch, API_BASE } from "@/api/fetchJSON";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Policy = {
  id: number;
  property_id: number;
  policy_type: string;
  policy_layer: string;
  carrier_name: string;
  policy_number: string | null;
  agent_name: string | null;
  agent_firm: string | null;
  agent_phone: string | null;
  agent_email: string | null;
  premium_cents: number | null;
  coverage_amount_cents: number | null;
  effective_date: string;
  expiration_date: string;
  renewal_status: "active" | "expiring" | "renewal_in_progress" | "renewed" | "lapsed";
  avm_master_policy: boolean;
  policy_object_key: string | null;
  policy_mime: string | null;
  coi_object_key: string | null;
  coi_mime: string | null;
  notes: string | null;
  last_edited_by_user_id: number | null;
  created_at: string;
  updated_at: string;
};

type RentersInsurance = {
  id: number;
  unit_id: number;
  property_id: number;
  tenant_name: string | null;
  carrier_name: string | null;
  policy_number: string | null;
  effective_date: string | null;
  expiration_date: string | null;
  status: "active" | "expiring" | "lapsed" | "untracked";
  document_object_key: string | null;
  document_mime: string | null;
  notes: string | null;
  last_edited_by_user_id: number | null;
  created_at: string;
  updated_at: string;
  unit_name: string;
};

type InsuranceSummary = {
  active_policies: number;
  expiring_soon: number;
  units_with_renters_active: number;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const POLICY_TYPE_LABELS: Record<string, string> = {
  general_liability: "General Liability",
  property: "Property",
  umbrella: "Umbrella",
  flood: "Flood",
  earthquake: "Earthquake",
  workers_comp: "Workers' Comp",
  other: "Other",
};

function formatPolicyType(code: string): string {
  return POLICY_TYPE_LABELS[code] ?? code;
}

function formatCents(cents: number | null): string {
  if (cents == null) return "--";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "--";
  const [y, m, d] = dateStr.split("-");
  return `${m}/${d}/${y}`;
}

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + "T00:00:00");
  const diff = target.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function renewalStatusLabel(status: string): string {
  switch (status) {
    case "active":
      return "Active";
    case "expiring":
      return "Expiring";
    case "renewal_in_progress":
      return "Renewal In Progress";
    case "renewed":
      return "Renewed";
    case "lapsed":
      return "Lapsed";
    default:
      return status;
  }
}

function rentersStatusLabel(status: string): string {
  switch (status) {
    case "active":
      return "Active";
    case "expiring":
      return "Expiring";
    case "lapsed":
      return "Lapsed";
    case "untracked":
      return "Untracked";
    default:
      return status;
  }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex h-[116px] flex-col items-start gap-4 flex-1 p-4 rounded-xl border border-[#E5E5E5] shadow-[0_1px_3px_0_rgba(0,0,0,0.03)]">
      <div className="flex items-center self-stretch">
        <div className="flex-1 text-[#717179] font-medium text-base leading-[18px]">
          {label}
        </div>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M7.99992 8.6665C8.36811 8.6665 8.66659 8.36803 8.66659 7.99984C8.66659 7.63165 8.36811 7.33317 7.99992 7.33317C7.63173 7.33317 7.33325 7.63165 7.33325 7.99984C7.33325 8.36803 7.63173 8.6665 7.99992 8.6665Z" stroke="#303030" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M7.99992 3.99984C8.36811 3.99984 8.66659 3.70136 8.66659 3.33317C8.66659 2.96498 8.36811 2.6665 7.99992 2.6665C7.63173 2.6665 7.33325 2.96498 7.33325 3.33317C7.33325 3.70136 7.63173 3.99984 7.99992 3.99984Z" stroke="#303030" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M7.99992 13.3332C8.36811 13.3332 8.66659 13.0347 8.66659 12.6665C8.66659 12.2983 8.36811 11.9998 7.99992 11.9998C7.63173 11.9998 7.33325 12.2983 7.33325 12.6665C7.33325 13.0347 7.63173 13.3332 7.99992 13.3332Z" stroke="#303030" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <div className="flex items-end gap-2 self-stretch">
        <div className="text-[#303030] font-medium text-[26px] leading-[28px]">
          {value}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({
  status,
  daysRemaining,
}: {
  status: string;
  daysRemaining?: number | null;
}) {
  const label =
    status === "active" || status === "renewed" || status === "renewal_in_progress" || status === "lapsed" || status === "untracked"
      ? renewalStatusLabel(status)
      : rentersStatusLabel(status);

  if (status === "active" || status === "renewed") {
    return (
      <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g clipPath="url(#clip0_approved)">
            <path d="M4.99967 8.00004L6.99967 10L10.9997 6.00004M14.6663 8.00004C14.6663 11.6819 11.6816 14.6667 7.99967 14.6667C4.31778 14.6667 1.33301 11.6819 1.33301 8.00004C1.33301 4.31814 4.31778 1.33337 7.99967 1.33337C11.6816 1.33337 14.6663 4.31814 14.6663 8.00004Z" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </g>
        </svg>
        {label}
      </span>
    );
  }

  if (status === "expiring") {
    return (
      <span className="inline-flex items-center gap-1.5 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M7.99967 5.33337V8.00004M7.99967 10.6667H8.00634M14.6663 8.00004C14.6663 11.6819 11.6816 14.6667 7.99967 14.6667C4.31778 14.6667 1.33301 11.6819 1.33301 8.00004C1.33301 4.31814 4.31778 1.33337 7.99967 1.33337C11.6816 1.33337 14.6663 4.31814 14.6663 8.00004Z" stroke="#CA8A04" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        {label}
        {daysRemaining != null && (
          <span className="text-xs">({daysRemaining}d)</span>
        )}
      </span>
    );
  }

  if (status === "renewal_in_progress") {
    return (
      <span className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M7.99967 4.00004V8.00004L10.6663 9.33337M14.6663 8.00004C14.6663 11.6819 11.6816 14.6667 7.99967 14.6667C4.31778 14.6667 1.33301 11.6819 1.33301 8.00004C1.33301 4.31814 4.31778 1.33337 7.99967 1.33337C11.6816 1.33337 14.6663 4.31814 14.6663 8.00004Z" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        {label}
      </span>
    );
  }

  if (status === "lapsed") {
    return (
      <span className="inline-flex items-center gap-1.5 bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M7.99967 5.33337V8.00004M7.99967 10.6667H8.00634M14.6663 8.00004C14.6663 11.6819 11.6816 14.6667 7.99967 14.6667C4.31778 14.6667 1.33301 11.6819 1.33301 8.00004C1.33301 4.31814 4.31778 1.33337 7.99967 1.33337C11.6816 1.33337 14.6663 4.31814 14.6663 8.00004Z" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        {label}
      </span>
    );
  }

  if (status === "untracked") {
    return (
      <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-medium">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4.66699 8.00004H11.3337M14.6663 8.00004C14.6663 11.6819 11.6816 14.6667 7.99967 14.6667C4.31778 14.6667 1.33301 11.6819 1.33301 8.00004C1.33301 4.31814 4.31778 1.33337 7.99967 1.33337C11.6816 1.33337 14.6663 4.31814 14.6663 8.00004Z" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        {label}
      </span>
    );
  }

  // Fallback
  return (
    <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-medium">
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Action Button (three-dot menu with portal dropdown)
// ---------------------------------------------------------------------------

function InsuranceActionButton({
  itemId,
  openMenuId,
  setOpenMenuId,
  onEdit,
  onRenew,
  onDelete,
}: {
  itemId: number;
  openMenuId: number | null;
  setOpenMenuId: (id: number | null) => void;
  onEdit?: () => void;
  onRenew?: () => void;
  onDelete?: () => void;
}) {
  const showMenu = openMenuId === itemId;
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    let animationFrameId: number;

    const updateMenuPos = () => {
      if (showMenu && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setMenuPos({
          top: rect.bottom + 8,
          left: rect.right - 145,
        });
      }
      if (showMenu) {
        animationFrameId = requestAnimationFrame(updateMenuPos);
      }
    };

    if (showMenu) updateMenuPos();

    return () => animationFrameId && cancelAnimationFrame(animationFrameId);
  }, [showMenu]);

  useEffect(() => {
    if (!showMenu) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        menuRef.current &&
        buttonRef.current &&
        !menuRef.current.contains(target) &&
        !buttonRef.current.contains(target)
      ) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenu, setOpenMenuId]);

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setOpenMenuId(showMenu ? null : itemId)}
        className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="text-gray-600"
        >
          <circle cx="12" cy="12" r="1" />
          <circle cx="19" cy="12" r="1" />
          <circle cx="5" cy="12" r="1" />
        </svg>
      </button>

      {showMenu &&
        createPortal(
          <div
            ref={menuRef}
            className="bg-white flex flex-col justify-center items-start gap-4 p-4"
            style={{
              width: "145px",
              border: "0.5px solid #DADADA",
              borderRadius: "8px",
              boxShadow:
                "0 38px 11px 0 rgba(0,0,0,0.00), 0 24px 10px 0 rgba(0,0,0,0.01), 0 14px 8px 0 rgba(0,0,0,0.04), 0 6px 6px 0 rgba(0,0,0,0.06), 0 2px 3px 0 rgba(0,0,0,0.07)",
              zIndex: 99999,
              position: "fixed",
              top: menuPos.top + "px",
              left: menuPos.left + "px",
              pointerEvents: "auto",
            }}
            onMouseLeave={() => setOpenMenuId(null)}
          >
            {onEdit && (
              <button
                onClick={() => {
                  onEdit();
                  setOpenMenuId(null);
                }}
                className="flex justify-between items-center w-full hover:opacity-70 transition-opacity"
              >
                <span
                  className="text-[#303030] font-normal text-base leading-[140%] tracking-[-0.32px] capitalize"
                  style={{
                    fontFamily:
                      "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                  }}
                >
                  Edit
                </span>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M15.75 15.7502H9.75002M1.875 16.1252L6.03695 14.5245C6.30316 14.4221 6.43626 14.3709 6.56079 14.3041C6.6714 14.2447 6.77685 14.1761 6.87603 14.0992C6.98769 14.0125 7.08853 13.9117 7.29021 13.71L15.75 5.25023C16.5784 4.4218 16.5784 3.07865 15.75 2.25023C14.9216 1.4218 13.5784 1.4218 12.75 2.25022L4.29021 10.71C4.08853 10.9117 3.98769 11.0125 3.90104 11.1242C3.82408 11.2234 3.75555 11.3288 3.69618 11.4394C3.62933 11.564 3.57814 11.6971 3.47575 11.9633L1.875 16.1252Z"
                    stroke="#525252"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            )}

            {onRenew && (
              <button
                onClick={() => {
                  onRenew();
                  setOpenMenuId(null);
                }}
                className="flex justify-between items-center w-full hover:opacity-70 transition-opacity"
              >
                <span
                  className="text-[#303030] font-normal text-base leading-[140%] tracking-[-0.32px] capitalize"
                  style={{
                    fontFamily:
                      "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                  }}
                >
                  Renew
                </span>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M1.5 7.5C1.5 7.5 3.19 4.627 4.93 3.44C6.67 2.253 8.82 1.82 10.89 2.25C14.01 2.89 16.5 5.63 16.5 9C16.5 12.87 13.37 16 9.5 16C6.19 16 3.42 13.71 2.67 10.5M1.5 7.5V2.5M1.5 7.5H6.5"
                    stroke="#525252"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            )}

            {onDelete && (
              <button
                onClick={() => {
                  onDelete();
                  setOpenMenuId(null);
                }}
                className="flex justify-between items-center w-full hover:opacity-70 transition-opacity"
              >
                <span
                  className="text-[#982740] font-normal text-base leading-[140%] tracking-[-0.32px] capitalize"
                  style={{
                    fontFamily:
                      "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                  }}
                >
                  Delete
                </span>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M6.75 2.25H11.25M2.25 4.5H15.75M14.25 4.5L13.724 12.3895C13.6451 13.5732 13.6057 14.165 13.35 14.6138C13.1249 15.0088 12.7854 15.3265 12.3762 15.5248C11.9115 15.75 11.3183 15.75 10.132 15.75H7.86799C6.68168 15.75 6.08852 15.75 5.62375 15.5248C5.21457 15.3265 4.87507 15.0088 4.64999 14.6138C4.39433 14.165 4.35488 13.5732 4.27596 12.3895L3.75 4.5M7.5 7.875V11.625M10.5 7.875V11.625"
                    stroke="#982740"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            )}
          </div>,
          document.body
        )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Policy Form Modal (inline panel)
// ---------------------------------------------------------------------------

type PolicyFormData = Omit<Policy, "id" | "created_at" | "updated_at" | "last_edited_by_user_id">;

const EMPTY_POLICY_FORM: Partial<PolicyFormData> = {
  property_id: 0,
  policy_type: "general_liability",
  policy_layer: "owner",
  carrier_name: "",
  policy_number: "",
  agent_name: "",
  agent_firm: "",
  agent_phone: "",
  agent_email: "",
  premium_cents: null,
  coverage_amount_cents: null,
  effective_date: "",
  expiration_date: "",
  renewal_status: "active",
  avm_master_policy: false,
  notes: "",
};

function PolicyFormPanel({
  propertyId,
  initial,
  onClose,
  onSaved,
}: {
  propertyId: number;
  initial: Policy | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!initial;
  const isCustomType = initial?.policy_type && !(initial.policy_type in POLICY_TYPE_LABELS);
  const [form, setForm] = useState<Record<string, any>>(() =>
    initial
      ? { ...initial, policy_type: isCustomType ? "other" : initial.policy_type }
      : { ...EMPTY_POLICY_FORM, property_id: propertyId }
  );
  const [customPolicyType, setCustomPolicyType] = useState(
    isCustomType ? initial!.policy_type : ""
  );
  const [saving, setSaving] = useState(false);
  const [policyFile, setPolicyFile] = useState<File | null>(null);
  const [coiFile, setCoiFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState(false);
  const policyInputRef = useRef<HTMLInputElement>(null);
  const coiInputRef = useRef<HTMLInputElement>(null);
  const autofillInputRef = useRef<HTMLInputElement>(null);

  const set = (key: string, value: any) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleAutofill = async (file: File) => {
    setParsing(true);
    try {
      // 1. Upload the PDF
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await authFetch("/insurance/policies/upload", {
        method: "POST",
        body: formData,
      });
      if (!uploadRes.ok) throw new Error("Upload failed");
      const uploadData = await uploadRes.json();

      // 2. Parse with AI
      const parseRes = await fetchJSON("/insurance/policies/parse-pdf", {
        method: "POST",
        body: JSON.stringify({ object_key: uploadData.object_key }),
      }) as Record<string, any>;

      // 3. Apply extracted fields to form
      const fieldMap: Record<string, string> = {
        policy_type: "policy_type",
        carrier_name: "carrier_name",
        policy_number: "policy_number",
        agent_name: "agent_name",
        agent_firm: "agent_firm",
        agent_phone: "agent_phone",
        agent_email: "agent_email",
        premium_cents: "premium_cents",
        coverage_amount_cents: "coverage_amount_cents",
        effective_date: "effective_date",
        expiration_date: "expiration_date",
        notes: "notes",
        policy_object_key: "policy_object_key",
        policy_mime: "policy_mime",
      };

      setForm((prev) => {
        const updated = { ...prev };
        for (const [aiKey, formKey] of Object.entries(fieldMap)) {
          if (parseRes[aiKey] != null && parseRes[aiKey] !== "") {
            updated[formKey] = parseRes[aiKey];
          }
        }
        // If AI returned a policy_type not in our known list, set to "other"
        if (updated.policy_type && !(updated.policy_type in POLICY_TYPE_LABELS)) {
          setCustomPolicyType(updated.policy_type);
          updated.policy_type = "other";
        }
        return updated;
      });

      setPolicyFile(file);
      setParsed(true);
      const confidence = parseRes.confidence != null ? Math.round(parseRes.confidence * 100) : null;
      toast.success(
        confidence != null
          ? `Policy parsed (${confidence}% confidence) — review the fields below`
          : "Policy parsed — review the fields below"
      );
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to parse policy PDF");
    } finally {
      setParsing(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const resolvedType = form.policy_type === "other" ? customPolicyType.trim() : form.policy_type;
      if (form.policy_type === "other" && !resolvedType) {
        toast.error("Please enter a custom policy type");
        setSaving(false);
        return;
      }
      const payload = { ...form, policy_type: resolvedType };
      if (isEdit) {
        const patch: Record<string, any> = { id: initial!.id };
        const resolvedInitial = { ...initial, policy_type: isCustomType ? "other" : initial!.policy_type };
        for (const key of Object.keys(payload)) {
          if ((payload as any)[key] !== (resolvedInitial as any)[key]) {
            patch[key] = payload[key];
          }
        }
        await fetchJSON("/insurance/policies", {
          method: "PATCH",
          body: JSON.stringify(patch),
        });
      } else {
        await fetchJSON("/insurance/policies", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      toast.success(isEdit ? "Policy updated" : "Policy created");
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to save policy");
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-[900px] max-h-[90vh] overflow-y-auto rounded-xl border border-[#E5E5E5] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] bg-white p-6" data-testid="policy-form-panel">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[#303030] font-medium text-[22px] leading-6">{isEdit ? "Edit Policy" : "Add Policy"}</h3>
          <button onClick={onClose} className="border border-[#DADADA] rounded-lg px-4 py-2 text-[#303030] hover:bg-gray-50 text-sm">
            Cancel
          </button>
        </div>

        {/* AI Autofill — only show on create, before fields are parsed */}
        {!isEdit && !parsed && (
          <div className="mb-5">
            <div
              onClick={() => !parsing && autofillInputRef.current?.click()}
              className={cn(
                "flex items-center justify-center gap-3 rounded-lg border-2 border-dashed px-4 py-4 cursor-pointer transition-colors",
                parsing
                  ? "border-blue-300 bg-blue-50 cursor-wait"
                  : "border-[#013764] bg-[#f0f6fb] hover:bg-[#e0eef8]"
              )}
            >
              <input
                ref={autofillInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleAutofill(f);
                }}
              />
              {parsing ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-[#013764]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-sm font-medium text-[#013764]">Parsing policy document...</span>
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#013764" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
                  <div>
                    <span className="text-sm font-medium text-[#013764]">Upload a policy PDF to autofill</span>
                    <span className="block text-xs text-[#4a7a9b]">AI will extract carrier, dates, coverage, agent info and more</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Parsed banner */}
        {parsed && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-4 py-2.5">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            <span className="text-sm text-green-800 font-medium">Fields autofilled from policy PDF — review and adjust before saving</span>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="block">
            <span className="text-[#717179] text-sm font-medium">Policy Type</span>
            <select
              className="mt-1 block w-full rounded-lg border border-[#DADADA] px-3 py-2 text-sm text-[#303030]"
              value={form.policy_type ?? ""}
              onChange={(e) => set("policy_type", e.target.value)}
            >
              {Object.entries(POLICY_TYPE_LABELS).map(([code, label]) => (
                <option key={code} value={code}>
                  {label}
                </option>
              ))}
            </select>
            {form.policy_type === "other" && (
              <input
                className="mt-2 block w-full rounded-lg border border-[#DADADA] px-3 py-2 text-sm text-[#303030]"
                placeholder="Enter custom policy type"
                value={customPolicyType}
                onChange={(e) => setCustomPolicyType(e.target.value)}
              />
            )}
          </label>
          <label className="block">
            <span className="text-[#717179] text-sm font-medium">Layer</span>
            <select
              className="mt-1 block w-full rounded-lg border border-[#DADADA] px-3 py-2 text-sm text-[#303030]"
              value={form.policy_layer ?? "owner"}
              onChange={(e) => set("policy_layer", e.target.value)}
            >
              <option value="owner">Owner</option>
              <option value="association">Association</option>
              <option value="tenant">Tenant</option>
            </select>
          </label>
          <label className="block">
            <span className="text-[#717179] text-sm font-medium">Carrier Name*</span>
            <input
              className="mt-1 block w-full rounded-lg border border-[#DADADA] px-3 py-2 text-sm text-[#303030]"
              value={form.carrier_name ?? ""}
              onChange={(e) => set("carrier_name", e.target.value)}
            />
          </label>
          <label className="block">
            <span className="text-[#717179] text-sm font-medium">Policy Number</span>
            <input
              className="mt-1 block w-full rounded-lg border border-[#DADADA] px-3 py-2 text-sm text-[#303030]"
              value={form.policy_number ?? ""}
              onChange={(e) => set("policy_number", e.target.value)}
            />
          </label>
          <label className="block">
            <span className="text-[#717179] text-sm font-medium">Agent Name</span>
            <input
              className="mt-1 block w-full rounded-lg border border-[#DADADA] px-3 py-2 text-sm text-[#303030]"
              value={form.agent_name ?? ""}
              onChange={(e) => set("agent_name", e.target.value)}
            />
          </label>
          <label className="block">
            <span className="text-[#717179] text-sm font-medium">Agent Firm</span>
            <input
              className="mt-1 block w-full rounded-lg border border-[#DADADA] px-3 py-2 text-sm text-[#303030]"
              value={form.agent_firm ?? ""}
              onChange={(e) => set("agent_firm", e.target.value)}
            />
          </label>
          <label className="block">
            <span className="text-[#717179] text-sm font-medium">Agent Phone</span>
            <input
              className="mt-1 block w-full rounded-lg border border-[#DADADA] px-3 py-2 text-sm text-[#303030]"
              value={form.agent_phone ?? ""}
              onChange={(e) => set("agent_phone", e.target.value)}
            />
          </label>
          <label className="block">
            <span className="text-[#717179] text-sm font-medium">Agent Email</span>
            <input
              className="mt-1 block w-full rounded-lg border border-[#DADADA] px-3 py-2 text-sm text-[#303030]"
              value={form.agent_email ?? ""}
              onChange={(e) => set("agent_email", e.target.value)}
            />
          </label>
          <label className="block">
            <span className="text-[#717179] text-sm font-medium">Premium ($)</span>
            <input
              type="number"
              step="0.01"
              className="mt-1 block w-full rounded-lg border border-[#DADADA] px-3 py-2 text-sm text-[#303030]"
              value={form.premium_cents != null ? (form.premium_cents / 100).toFixed(2) : ""}
              onChange={(e) =>
                set("premium_cents", e.target.value ? Math.round(parseFloat(e.target.value) * 100) : null)
              }
            />
          </label>
          <label className="block">
            <span className="text-[#717179] text-sm font-medium">Coverage ($)</span>
            <input
              type="number"
              step="0.01"
              className="mt-1 block w-full rounded-lg border border-[#DADADA] px-3 py-2 text-sm text-[#303030]"
              value={form.coverage_amount_cents != null ? (form.coverage_amount_cents / 100).toFixed(2) : ""}
              onChange={(e) =>
                set(
                  "coverage_amount_cents",
                  e.target.value ? Math.round(parseFloat(e.target.value) * 100) : null
                )
              }
            />
          </label>
          <label className="block">
            <span className="text-[#717179] text-sm font-medium">Effective Date*</span>
            <input
              type="date"
              className="mt-1 block w-full rounded-lg border border-[#DADADA] px-3 py-2 text-sm text-[#303030]"
              value={form.effective_date ?? ""}
              onChange={(e) => set("effective_date", e.target.value)}
            />
          </label>
          <label className="block">
            <span className="text-[#717179] text-sm font-medium">Expiration Date*</span>
            <input
              type="date"
              className="mt-1 block w-full rounded-lg border border-[#DADADA] px-3 py-2 text-sm text-[#303030]"
              value={form.expiration_date ?? ""}
              onChange={(e) => set("expiration_date", e.target.value)}
            />
          </label>
          {isEdit && (
            <label className="block">
              <span className="text-[#717179] text-sm font-medium">Renewal Status</span>
              <select
                className="mt-1 block w-full rounded-lg border border-[#DADADA] px-3 py-2 text-sm text-[#303030]"
                value={form.renewal_status ?? "active"}
                onChange={(e) => set("renewal_status", e.target.value)}
              >
                <option value="active">Active</option>
                <option value="expiring">Expiring</option>
                <option value="renewal_in_progress">Renewal In Progress</option>
                <option value="renewed">Renewed</option>
                <option value="lapsed">Lapsed</option>
              </select>
            </label>
          )}
          <label className="flex items-center gap-2 text-sm text-[#717179] font-medium pt-6">
            <input
              type="checkbox"
              checked={!!form.avm_master_policy}
              onChange={(e) => set("avm_master_policy", e.target.checked)}
            />
            AVM Master Policy
          </label>
        </div>

        {/* Documents */}
        <p className="mt-4 text-[#717179] text-xs font-medium uppercase tracking-wider mb-3">Documents</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 mb-4">
          {/* Policy Document Upload */}
          <div
            onClick={() => policyInputRef.current?.click()}
            className={cn(
              "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-5 cursor-pointer transition-colors",
              policyFile ? "border-green-300 bg-green-50" : "border-[#DADADA] bg-gray-50 hover:bg-gray-100 hover:border-gray-400"
            )}
          >
            <input
              ref={policyInputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => setPolicyFile(e.target.files?.[0] ?? null)}
            />
            {policyFile ? (
              <>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                <span className="text-sm font-medium text-green-700 text-center truncate max-w-full">{policyFile.name}</span>
                <span className="text-xs text-green-600">{(policyFile.size / 1024).toFixed(0)} KB</span>
              </>
            ) : (
              <>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
                <span className="text-sm font-medium text-[#717179]">Upload Policy Document</span>
                <span className="text-xs text-[#999]">PDF files only</span>
              </>
            )}
          </div>

          {/* COI Upload */}
          <div
            onClick={() => coiInputRef.current?.click()}
            className={cn(
              "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-5 cursor-pointer transition-colors",
              coiFile ? "border-green-300 bg-green-50" : "border-[#DADADA] bg-gray-50 hover:bg-gray-100 hover:border-gray-400"
            )}
          >
            <input
              ref={coiInputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => setCoiFile(e.target.files?.[0] ?? null)}
            />
            {coiFile ? (
              <>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                <span className="text-sm font-medium text-green-700 text-center truncate max-w-full">{coiFile.name}</span>
                <span className="text-xs text-green-600">{(coiFile.size / 1024).toFixed(0)} KB</span>
              </>
            ) : (
              <>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
                <span className="text-sm font-medium text-[#717179]">Upload COI</span>
                <span className="text-xs text-[#999]">Certificate of Insurance</span>
              </>
            )}
          </div>
        </div>

        <label className="block">
          <span className="text-[#717179] text-sm font-medium">Notes</span>
          <textarea
            className="mt-1 block w-full rounded-lg border border-[#DADADA] px-3 py-2 text-sm text-[#303030]"
            rows={2}
            value={form.notes ?? ""}
            onChange={(e) => set("notes", e.target.value)}
          />
        </label>

        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="border border-[#DADADA] rounded-lg px-4 py-2 text-[#303030] hover:bg-gray-50 text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#013764] text-white rounded-lg px-4 py-2 hover:bg-[#003a73] disabled:opacity-50 text-sm"
          >
            {saving ? "Saving..." : isEdit ? "Update Policy" : "Add Policy"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ---------------------------------------------------------------------------
// Renewal Panel (inline, above tables)
// ---------------------------------------------------------------------------

function RenewalPanel({
  policy,
  onClose,
  onSaved,
}: {
  policy: Policy;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [renewalStatus, setRenewalStatus] = useState<Policy["renewal_status"]>("renewal_in_progress");
  const [newPolicyNumber, setNewPolicyNumber] = useState(policy.policy_number ?? "");
  const [newExpirationDate, setNewExpirationDate] = useState("");
  const [newPremium, setNewPremium] = useState(policy.premium_cents != null ? (policy.premium_cents / 100).toFixed(2) : "");
  const [notes, setNotes] = useState(policy.notes ?? "");
  const [policyFile, setPolicyFile] = useState<File | null>(null);
  const [coiFile, setCoiFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const policyInputRef = useRef<HTMLInputElement>(null);
  const coiInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    setSaving(true);
    try {
      const patch: Record<string, any> = { id: policy.id, renewal_status: renewalStatus };
      if (newPolicyNumber && newPolicyNumber !== policy.policy_number) {
        patch.policy_number = newPolicyNumber;
      }
      if (newExpirationDate) {
        patch.expiration_date = newExpirationDate;
      }
      if (newPremium) {
        patch.premium_cents = Math.round(parseFloat(newPremium) * 100);
      }
      if (notes !== (policy.notes ?? "")) {
        patch.notes = notes;
      }
      // TODO: When backend upload endpoint is built, upload files first and set object keys
      // For now, file names are shown as confirmation but not persisted
      await fetchJSON("/insurance/policies", {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
      toast.success("Renewal updated");
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to update renewal");
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-[700px] max-h-[90vh] overflow-y-auto rounded-xl border border-[#E5E5E5] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] bg-white p-6" data-testid="renewal-panel">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[#303030] font-medium text-[22px] leading-6">
            Renewal — {formatPolicyType(policy.policy_type)} ({policy.carrier_name})
          </h3>
          <button onClick={onClose} className="border border-[#DADADA] rounded-lg px-4 py-2 text-[#303030] hover:bg-gray-50 text-sm">
            Close
          </button>
        </div>

        {/* Agent Contact */}
        <div className="rounded-lg border border-[#E5E5E5] bg-gray-50 p-4 mb-4">
          <p className="text-[#717179] text-xs font-medium uppercase tracking-wider mb-3">Agent Contact</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {policy.agent_name && (
              <div className="text-sm">
                <span className="text-[#717179]">Agent: </span>
                <span className="font-medium text-[#303030]">{policy.agent_name}</span>
              </div>
            )}
            {policy.agent_firm && (
              <div className="text-sm">
                <span className="text-[#717179]">Firm: </span>
                <span className="font-medium text-[#303030]">{policy.agent_firm}</span>
              </div>
            )}
          </div>
          <div className="flex gap-2 mt-3">
            {policy.agent_phone && (
              <a
                href={`tel:${policy.agent_phone}`}
                className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs text-white hover:bg-green-700 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                {policy.agent_phone}
              </a>
            )}
            {policy.agent_email && (
              <a
                href={`mailto:${policy.agent_email}`}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs text-white hover:bg-blue-700 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                {policy.agent_email}
              </a>
            )}
          </div>
        </div>

        {/* Renewal Details */}
        <p className="text-[#717179] text-xs font-medium uppercase tracking-wider mb-3">Renewal Details</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-4">
          <label className="block">
            <span className="text-[#717179] text-sm font-medium">Renewal Status</span>
            <select
              className="mt-1 block w-full rounded-lg border border-[#DADADA] px-3 py-2 text-sm text-[#303030]"
              value={renewalStatus}
              onChange={(e) => setRenewalStatus(e.target.value as Policy["renewal_status"])}
            >
              <option value="renewal_in_progress">Renewal In Progress</option>
              <option value="renewed">Renewed</option>
              <option value="active">Active</option>
              <option value="expiring">Expiring</option>
              <option value="lapsed">Lapsed</option>
            </select>
          </label>
          <label className="block">
            <span className="text-[#717179] text-sm font-medium">New Policy Number</span>
            <input
              className="mt-1 block w-full rounded-lg border border-[#DADADA] px-3 py-2 text-sm text-[#303030]"
              value={newPolicyNumber}
              onChange={(e) => setNewPolicyNumber(e.target.value)}
              placeholder={policy.policy_number ?? ""}
            />
          </label>
          <label className="block">
            <span className="text-[#717179] text-sm font-medium">New Expiration Date</span>
            <input
              type="date"
              className="mt-1 block w-full rounded-lg border border-[#DADADA] px-3 py-2 text-sm text-[#303030]"
              value={newExpirationDate}
              onChange={(e) => setNewExpirationDate(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="text-[#717179] text-sm font-medium">New Premium ($)</span>
            <input
              type="number"
              step="0.01"
              className="mt-1 block w-full rounded-lg border border-[#DADADA] px-3 py-2 text-sm text-[#303030]"
              value={newPremium}
              onChange={(e) => setNewPremium(e.target.value)}
            />
          </label>
        </div>

        {/* Document Uploads */}
        <p className="text-[#717179] text-xs font-medium uppercase tracking-wider mb-3">Documents</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 mb-4">
          {/* Policy Document Upload */}
          <div
            onClick={() => policyInputRef.current?.click()}
            className={cn(
              "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-5 cursor-pointer transition-colors",
              policyFile ? "border-green-300 bg-green-50" : "border-[#DADADA] bg-gray-50 hover:bg-gray-100 hover:border-gray-400"
            )}
          >
            <input
              ref={policyInputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => setPolicyFile(e.target.files?.[0] ?? null)}
            />
            {policyFile ? (
              <>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                <span className="text-sm font-medium text-green-700 text-center truncate max-w-full">{policyFile.name}</span>
                <span className="text-xs text-green-600">{(policyFile.size / 1024).toFixed(0)} KB</span>
              </>
            ) : (
              <>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
                <span className="text-sm font-medium text-[#717179]">Upload Policy Document</span>
                <span className="text-xs text-[#999]">PDF files only</span>
              </>
            )}
          </div>

          {/* COI Upload */}
          <div
            onClick={() => coiInputRef.current?.click()}
            className={cn(
              "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-5 cursor-pointer transition-colors",
              coiFile ? "border-green-300 bg-green-50" : "border-[#DADADA] bg-gray-50 hover:bg-gray-100 hover:border-gray-400"
            )}
          >
            <input
              ref={coiInputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => setCoiFile(e.target.files?.[0] ?? null)}
            />
            {coiFile ? (
              <>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                <span className="text-sm font-medium text-green-700 text-center truncate max-w-full">{coiFile.name}</span>
                <span className="text-xs text-green-600">{(coiFile.size / 1024).toFixed(0)} KB</span>
              </>
            ) : (
              <>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
                <span className="text-sm font-medium text-[#717179]">Upload COI</span>
                <span className="text-xs text-[#999]">Certificate of Insurance</span>
              </>
            )}
          </div>
        </div>

        {/* Notes */}
        <label className="block mb-4">
          <span className="text-[#717179] text-sm font-medium">Notes</span>
          <textarea
            className="mt-1 block w-full rounded-lg border border-[#DADADA] px-3 py-2 text-sm text-[#303030]"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Renewal notes..."
          />
        </label>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="border border-[#DADADA] rounded-lg px-4 py-2 text-[#303030] hover:bg-gray-50 text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#013764] text-white rounded-lg px-4 py-2 hover:bg-[#003a73] disabled:opacity-50 text-sm"
          >
            {saving ? "Saving..." : "Save Renewal"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ---------------------------------------------------------------------------
// Renters Form Panel
// ---------------------------------------------------------------------------

function RentersFormPanel({
  propertyId,
  initial,
  onClose,
  onSaved,
}: {
  propertyId: number;
  initial: RentersInsurance | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!initial;
  const [form, setForm] = useState<Record<string, any>>(() =>
    initial
      ? { ...initial }
      : {
          property_id: propertyId,
          unit_id: "",
          tenant_name: "",
          carrier_name: "",
          policy_number: "",
          effective_date: "",
          expiration_date: "",
          status: "active",
          notes: "",
        }
  );
  const [saving, setSaving] = useState(false);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [coiFile, setCoiFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState(false);
  const docInputRef = useRef<HTMLInputElement>(null);
  const coiInputRef = useRef<HTMLInputElement>(null);
  const autofillInputRef = useRef<HTMLInputElement>(null);
  const { data: units = [] } = useQuery<{ id: number; unit_name: string }[]>({
    queryKey: ["units", propertyId],
    queryFn: () => fetchJSON(`/properties/${propertyId}/units`),
    enabled: !!propertyId,
  });

  const set = (key: string, value: any) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleAutofill = async (file: File) => {
    setParsing(true);
    try {
      // 1. Upload the PDF
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await authFetch("/insurance/policies/upload", {
        method: "POST",
        body: formData,
      });
      if (!uploadRes.ok) throw new Error("Upload failed");
      const uploadData = await uploadRes.json();

      // 2. Parse with AI
      const parseRes = await fetchJSON("/insurance/renters/parse-pdf", {
        method: "POST",
        body: JSON.stringify({ object_key: uploadData.object_key }),
      }) as Record<string, any>;

      // 3. Apply extracted fields to form
      const fieldMap: Record<string, string> = {
        tenant_name: "tenant_name",
        carrier_name: "carrier_name",
        policy_number: "policy_number",
        effective_date: "effective_date",
        expiration_date: "expiration_date",
        notes: "notes",
        document_object_key: "document_object_key",
        document_mime: "document_mime",
      };

      setForm((prev) => {
        const updated = { ...prev };
        for (const [aiKey, formKey] of Object.entries(fieldMap)) {
          if (parseRes[aiKey] != null && parseRes[aiKey] !== "") {
            updated[formKey] = parseRes[aiKey];
          }
        }
        return updated;
      });

      setDocFile(file);
      setParsed(true);
      const confidence = parseRes.confidence != null ? Math.round(parseRes.confidence * 100) : null;
      toast.success(
        confidence != null
          ? `Policy parsed (${confidence}% confidence) — review the fields below`
          : "Policy parsed — review the fields below"
      );
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to parse policy PDF");
    } finally {
      setParsing(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Upload document if a new file was selected
      let docObjectKey = form.document_object_key || "";
      let docMime = form.document_mime || "";
      if (docFile && !form.document_object_key) {
        const fd = new FormData();
        fd.append("file", docFile);
        const uploadRes = await authFetch("/insurance/policies/upload", {
          method: "POST",
          body: fd,
        });
        if (!uploadRes.ok) throw new Error("File upload failed");
        const uploadData = await uploadRes.json();
        docObjectKey = uploadData.object_key;
        docMime = uploadData.mime;
      }

      // Upload COI if selected
      let coiObjectKey = form.coi_object_key || "";
      let coiMime = form.coi_mime || "";
      if (coiFile) {
        const fd = new FormData();
        fd.append("file", coiFile);
        const uploadRes = await authFetch("/insurance/policies/upload", {
          method: "POST",
          body: fd,
        });
        if (!uploadRes.ok) throw new Error("COI upload failed");
        const uploadData = await uploadRes.json();
        coiObjectKey = uploadData.object_key;
        coiMime = uploadData.mime;
      }

      if (isEdit) {
        const patch: Record<string, any> = { id: initial!.id };
        for (const key of Object.keys(form)) {
          if ((form as any)[key] !== (initial as any)[key]) {
            patch[key] = form[key];
          }
        }
        if (docFile || form.document_object_key !== initial?.document_object_key) {
          patch.document_object_key = docObjectKey;
          patch.document_mime = docMime;
        }
        if (coiFile) {
          patch.coi_object_key = coiObjectKey;
          patch.coi_mime = coiMime;
        }
        await fetchJSON("/insurance/renters", {
          method: "PATCH",
          body: JSON.stringify(patch),
        });
      } else {
        const body = {
          ...form,
          unit_id: Number(form.unit_id),
          document_object_key: docObjectKey,
          document_mime: docMime,
          coi_object_key: coiObjectKey,
          coi_mime: coiMime,
        };
        await fetchJSON("/insurance/renters", {
          method: "POST",
          body: JSON.stringify(body),
        });
      }
      toast.success(isEdit ? "Renters insurance updated" : "Renters insurance created");
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to save renters insurance");
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-[900px] max-h-[90vh] overflow-y-auto rounded-xl border border-[#E5E5E5] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] bg-white p-6" data-testid="renters-form-panel">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[#303030] font-medium text-[22px] leading-6">
            {isEdit ? "Edit Renters Insurance" : "Add Renters Insurance"}
          </h3>
          <button onClick={onClose} className="border border-[#DADADA] rounded-lg px-4 py-2 text-[#303030] hover:bg-gray-50 text-sm">
            Cancel
          </button>
        </div>

        {/* AI Autofill — only show on create, before fields are parsed */}
        {!isEdit && !parsed && (
          <div className="mb-5">
            <div
              onClick={() => !parsing && autofillInputRef.current?.click()}
              className={cn(
                "flex items-center justify-center gap-3 rounded-lg border-2 border-dashed px-4 py-4 cursor-pointer transition-colors",
                parsing
                  ? "border-blue-300 bg-blue-50 cursor-wait"
                  : "border-[#013764] bg-[#f0f6fb] hover:bg-[#e0eef8]"
              )}
            >
              <input
                ref={autofillInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleAutofill(f);
                }}
              />
              {parsing ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-[#013764]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-sm font-medium text-[#013764]">Parsing policy document...</span>
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#013764" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
                  <div>
                    <span className="text-sm font-medium text-[#013764]">Upload a policy PDF to autofill</span>
                    <span className="block text-xs text-[#4a7a9b]">AI will extract tenant name, carrier, dates and more</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Parsed banner */}
        {parsed && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-4 py-2.5">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            <span className="text-sm text-green-800 font-medium">Fields autofilled from policy PDF — review and adjust before saving</span>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {!isEdit && (
            <label className="block">
              <span className="text-[#717179] text-sm font-medium">Unit*</span>
              <select
                className="mt-1 block w-full rounded-lg border border-[#DADADA] px-3 py-2 text-sm text-[#303030]"
                value={form.unit_id ?? ""}
                onChange={(e) => set("unit_id", e.target.value)}
              >
                <option value="">Select a unit</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.unit_name || `Unit ${u.id}`}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="block">
            <span className="text-[#717179] text-sm font-medium">Tenant Name</span>
            <input
              className="mt-1 block w-full rounded-lg border border-[#DADADA] px-3 py-2 text-sm text-[#303030]"
              value={form.tenant_name ?? ""}
              onChange={(e) => set("tenant_name", e.target.value)}
            />
          </label>
          <label className="block">
            <span className="text-[#717179] text-sm font-medium">Carrier</span>
            <input
              className="mt-1 block w-full rounded-lg border border-[#DADADA] px-3 py-2 text-sm text-[#303030]"
              value={form.carrier_name ?? ""}
              onChange={(e) => set("carrier_name", e.target.value)}
            />
          </label>
          <label className="block">
            <span className="text-[#717179] text-sm font-medium">Policy Number</span>
            <input
              className="mt-1 block w-full rounded-lg border border-[#DADADA] px-3 py-2 text-sm text-[#303030]"
              value={form.policy_number ?? ""}
              onChange={(e) => set("policy_number", e.target.value)}
            />
          </label>
          <label className="block">
            <span className="text-[#717179] text-sm font-medium">Effective Date</span>
            <input
              type="date"
              className="mt-1 block w-full rounded-lg border border-[#DADADA] px-3 py-2 text-sm text-[#303030]"
              value={form.effective_date ?? ""}
              onChange={(e) => set("effective_date", e.target.value)}
            />
          </label>
          <label className="block">
            <span className="text-[#717179] text-sm font-medium">Expiration Date</span>
            <input
              type="date"
              className="mt-1 block w-full rounded-lg border border-[#DADADA] px-3 py-2 text-sm text-[#303030]"
              value={form.expiration_date ?? ""}
              onChange={(e) => set("expiration_date", e.target.value)}
            />
          </label>
          {isEdit && (
            <label className="block">
              <span className="text-[#717179] text-sm font-medium">Status</span>
              <select
                className="mt-1 block w-full rounded-lg border border-[#DADADA] px-3 py-2 text-sm text-[#303030]"
                value={form.status ?? "active"}
                onChange={(e) => set("status", e.target.value)}
              >
                <option value="active">Active</option>
                <option value="expiring">Expiring</option>
                <option value="lapsed">Lapsed</option>
                <option value="untracked">Untracked</option>
              </select>
            </label>
          )}
        </div>

        {/* Documents */}
        <p className="mt-4 text-[#717179] text-xs font-medium uppercase tracking-wider mb-3">Documents</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 mb-4">
          {/* Policy Document Upload */}
          <div
            onClick={() => docInputRef.current?.click()}
            className={cn(
              "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-5 cursor-pointer transition-colors",
              docFile || form.document_object_key
                ? "border-green-300 bg-green-50"
                : "border-[#DADADA] bg-gray-50 hover:bg-gray-100 hover:border-gray-400"
            )}
          >
            <input
              ref={docInputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => setDocFile(e.target.files?.[0] ?? null)}
            />
            {docFile ? (
              <>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                <span className="text-sm font-medium text-green-700 text-center truncate max-w-full">{docFile.name}</span>
                <span className="text-xs text-green-600">{(docFile.size / 1024).toFixed(0)} KB</span>
              </>
            ) : form.document_object_key ? (
              <>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                <span className="text-sm font-medium text-green-700">Policy uploaded</span>
                <span className="text-xs text-green-600">Click to replace</span>
              </>
            ) : (
              <>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
                <span className="text-sm font-medium text-[#717179]">Upload Policy Document</span>
                <span className="text-xs text-[#999]">PDF files only</span>
              </>
            )}
          </div>

          {/* COI Upload */}
          <div
            onClick={() => coiInputRef.current?.click()}
            className={cn(
              "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-5 cursor-pointer transition-colors",
              coiFile || form.coi_object_key
                ? "border-green-300 bg-green-50"
                : "border-[#DADADA] bg-gray-50 hover:bg-gray-100 hover:border-gray-400"
            )}
          >
            <input
              ref={coiInputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => setCoiFile(e.target.files?.[0] ?? null)}
            />
            {coiFile ? (
              <>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                <span className="text-sm font-medium text-green-700 text-center truncate max-w-full">{coiFile.name}</span>
                <span className="text-xs text-green-600">{(coiFile.size / 1024).toFixed(0)} KB</span>
              </>
            ) : form.coi_object_key ? (
              <>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                <span className="text-sm font-medium text-green-700">COI uploaded</span>
                <span className="text-xs text-green-600">Click to replace</span>
              </>
            ) : (
              <>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
                <span className="text-sm font-medium text-[#717179]">Upload COI</span>
                <span className="text-xs text-[#999]">Certificate of Insurance</span>
              </>
            )}
          </div>
        </div>

        <label className="mt-4 block">
          <span className="text-[#717179] text-sm font-medium">Notes</span>
          <textarea
            className="mt-1 block w-full rounded-lg border border-[#DADADA] px-3 py-2 text-sm text-[#303030]"
            rows={2}
            value={form.notes ?? ""}
            onChange={(e) => set("notes", e.target.value)}
          />
        </label>

        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="border border-[#DADADA] rounded-lg px-4 py-2 text-[#303030] hover:bg-gray-50 text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#013764] text-white rounded-lg px-4 py-2 hover:bg-[#003a73] disabled:opacity-50 text-sm"
          >
            {saving ? "Saving..." : isEdit ? "Update" : "Add"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

type InsuranceProps = {
  propertyAddress: string;
  propertyType: string;
  propertyUnits: number;
  propertyId: number;
};

export function Insurance({ propertyAddress, propertyType, propertyUnits, propertyId }: InsuranceProps) {
  const queryClient = useQueryClient();
  const { propertyId: paramId } = useParams<{ propertyId: string }>();
  const pid = propertyId || Number(paramId);

  // ---- Data fetching ----
  const { data: summary } = useQuery<InsuranceSummary>({
    queryKey: ["insurance-summary", pid],
    queryFn: () => fetchJSON(`/insurance/summary?property_id=${pid}`),
    enabled: !!pid,
  });

  const {
    data: policies = [],
    refetch: refetchPolicies,
  } = useQuery<Policy[]>({
    queryKey: ["insurance-policies", pid],
    queryFn: () => fetchJSON(`/insurance/policies?property_id=${pid}`),
    enabled: !!pid,
  });

  const {
    data: renters = [],
    refetch: refetchRenters,
  } = useQuery<RentersInsurance[]>({
    queryKey: ["insurance-renters", pid],
    queryFn: () => fetchJSON(`/insurance/renters?property_id=${pid}`),
    enabled: !!pid,
  });

  // ---- UI State ----
  const [policyFormOpen, setPolicyFormOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);
  const [renewalPolicy, setRenewalPolicy] = useState<Policy | null>(null);

  const [rentersFormOpen, setRentersFormOpen] = useState(false);
  const [editingRenters, setEditingRenters] = useState<RentersInsurance | null>(null);

  const [openPolicyMenuId, setOpenPolicyMenuId] = useState<number | null>(null);
  const [pdfViewer, setPdfViewer] = useState<{ url: string; title: string } | null>(null);
  const [openRentersMenuId, setOpenRentersMenuId] = useState<number | null>(null);

  const refetchAll = () => {
    refetchPolicies();
    refetchRenters();
    queryClient.invalidateQueries({ queryKey: ["insurance-summary", pid] });
  };

  // ---- Handlers ----
  const handleDeletePolicy = async (id: number) => {
    if (!confirm("Delete this policy?")) return;
    try {
      await fetchJSON(`/insurance/policies?id=${id}`, { method: "DELETE" });
      toast.success("Policy deleted");
      refetchAll();
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to delete policy");
    }
  };

  const handleDeleteRenters = async (id: number) => {
    if (!confirm("Delete this renters insurance record?")) return;
    try {
      await fetchJSON(`/insurance/renters?id=${id}`, { method: "DELETE" });
      toast.success("Renters insurance deleted");
      refetchAll();
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to delete renters insurance");
    }
  };

  const openEditPolicy = (p: Policy) => {
    setEditingPolicy(p);
    setPolicyFormOpen(true);
    setRenewalPolicy(null);
  };

  const openAddPolicy = () => {
    setEditingPolicy(null);
    setPolicyFormOpen(true);
    setRenewalPolicy(null);
  };

  const openRenewalPanel = (p: Policy) => {
    setRenewalPolicy(p);
    setPolicyFormOpen(false);
  };

  const openEditRenters = (r: RentersInsurance) => {
    setEditingRenters(r);
    setRentersFormOpen(true);
  };

  const openAddRenters = () => {
    setEditingRenters(null);
    setRentersFormOpen(true);
  };

  // ---- Render ----
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="flex items-start content-start gap-4 self-stretch flex-wrap" data-testid="summary-cards">
        <SummaryCard label="Active Policies" value={summary?.active_policies ?? 0} />
        <SummaryCard label="Expiring Soon" value={summary?.expiring_soon ?? 0} />
        <SummaryCard label="Renters Coverage" value={summary?.units_with_renters_active ?? 0} />
      </div>

      {/* Renewal Panel (inline, above tables) */}
      {renewalPolicy && (
        <RenewalPanel
          policy={renewalPolicy}
          onClose={() => setRenewalPolicy(null)}
          onSaved={refetchAll}
        />
      )}

      {/* Policy Form Panel (inline) */}
      {policyFormOpen && (
        <PolicyFormPanel
          propertyId={pid}
          initial={editingPolicy}
          onClose={() => {
            setPolicyFormOpen(false);
            setEditingPolicy(null);
          }}
          onSaved={refetchAll}
        />
      )}

      {/* Property Policies Table */}
      <div className="w-full border border-gray-200 bg-white rounded-lg overflow-hidden">
        <div className="flex justify-between items-center px-6 py-3 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-4">
            <h2 className="text-[#303030] font-medium text-[22px] leading-6">Property Policies</h2>
          </div>
          <div className="flex items-start gap-2.5">
            <button
              onClick={openAddPolicy}
              className="flex h-9 items-center gap-2 px-3 rounded-lg border border-white bg-[#013764] shadow-[0_0_0_1px_#002D5A] hover:bg-[#003a73] transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 4.16667V15.8333M4.16667 10H15.8333" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-white font-normal text-base leading-[140%] tracking-[-0.32px]">
                Add Policy
              </span>
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 h-12">
                <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#717179] text-sm font-medium leading-[18px]">Policy Type</span>
                  </div>
                </th>
                <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#717179] text-sm font-medium leading-[18px]">Carrier</span>
                  </div>
                </th>
                <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#717179] text-sm font-medium leading-[18px]">Policy #</span>
                  </div>
                </th>
                <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#717179] text-sm font-medium leading-[18px]">Coverage</span>
                  </div>
                </th>
                <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#717179] text-sm font-medium leading-[18px]">Premium</span>
                  </div>
                </th>
                <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#717179] text-sm font-medium leading-[18px]">Effective</span>
                  </div>
                </th>
                <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#717179] text-sm font-medium leading-[18px]">Expires</span>
                  </div>
                </th>
                <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#717179] text-sm font-medium leading-[18px]">Status</span>
                  </div>
                </th>
                <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#717179] text-sm font-medium leading-[18px]">Documents</span>
                  </div>
                </th>
                <th className="px-3 py-3 text-left whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#717179] text-sm font-medium leading-[18px]">Actions</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {policies.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-3 py-6 text-center text-gray-400 text-sm">
                    No policies found
                  </td>
                </tr>
              )}
              {policies.map((p) => {
                const days = daysUntil(p.expiration_date);
                return (
                  <tr
                    key={p.id}
                    data-testid={`policy-row-${p.id}`}
                    className={cn(
                      "border-b border-gray-200",
                      p.renewal_status === "expiring" && "bg-yellow-50",
                      p.renewal_status === "lapsed" && "bg-red-50"
                    )}
                  >
                    <td className="px-3 py-3 border-r border-gray-200">
                      <span className="text-[#303030] text-sm font-normal">{formatPolicyType(p.policy_type)}</span>
                    </td>
                    <td className="px-3 py-3 border-r border-gray-200">
                      <span className="text-[#303030] text-sm font-normal">{p.carrier_name}</span>
                    </td>
                    <td className="px-3 py-3 border-r border-gray-200">
                      <span className="text-[#303030] text-sm font-normal">{p.policy_number ?? "--"}</span>
                    </td>
                    <td className="px-3 py-3 border-r border-gray-200">
                      <span className="text-[#303030] text-sm font-normal">{formatCents(p.coverage_amount_cents)}</span>
                    </td>
                    <td className="px-3 py-3 border-r border-gray-200">
                      <span className="text-[#303030] text-sm font-normal">{formatCents(p.premium_cents)}</span>
                    </td>
                    <td className="px-3 py-3 border-r border-gray-200">
                      <span className="text-[#303030] text-sm font-normal">{formatDate(p.effective_date)}</span>
                    </td>
                    <td className="px-3 py-3 border-r border-gray-200">
                      <span className="text-[#303030] text-sm font-normal">{formatDate(p.expiration_date)}</span>
                    </td>
                    <td className="px-3 py-3 border-r border-gray-200">
                      <StatusBadge status={p.renewal_status} daysRemaining={days} />
                    </td>
                    <td className="px-3 py-3 border-r border-gray-200">
                      <div className="flex items-center gap-1.5">
                        {p.policy_object_key && (
                          <button
                            onClick={() => setPdfViewer({ url: `${API_BASE}/files/${p.policy_object_key}`, title: `${formatPolicyType(p.policy_type)} Policy — ${p.carrier_name}` })}
                            className="inline-flex items-center gap-1 rounded-md border border-[#DADADA] bg-white px-2 py-1 text-xs text-[#303030] hover:bg-gray-50 transition-colors shadow-[0_1px_2px_0_rgba(0,0,0,0.04)]"
                            title="View policy document"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#525252" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                            Policy
                          </button>
                        )}
                        {p.coi_object_key && (
                          <button
                            onClick={() => setPdfViewer({ url: `${API_BASE}/files/${p.coi_object_key}`, title: `COI — ${formatPolicyType(p.policy_type)} — ${p.carrier_name}` })}
                            className="inline-flex items-center gap-1 rounded-md border border-[#DADADA] bg-white px-2 py-1 text-xs text-[#303030] hover:bg-gray-50 transition-colors shadow-[0_1px_2px_0_rgba(0,0,0,0.04)]"
                            title="View certificate of insurance"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#525252" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                            COI
                          </button>
                        )}
                        {!p.policy_object_key && !p.coi_object_key && (
                          <span className="text-gray-400 text-sm">--</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <InsuranceActionButton
                        itemId={p.id}
                        openMenuId={openPolicyMenuId}
                        setOpenMenuId={setOpenPolicyMenuId}
                        onEdit={() => openEditPolicy(p)}
                        onRenew={() => openRenewalPanel(p)}
                        onDelete={() => handleDeletePolicy(p.id)}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Renters Form Panel (inline) */}
      {rentersFormOpen && (
        <RentersFormPanel
          propertyId={pid}
          initial={editingRenters}
          onClose={() => {
            setRentersFormOpen(false);
            setEditingRenters(null);
          }}
          onSaved={refetchAll}
        />
      )}

      {/* Renters Insurance Table */}
      <div className="w-full border border-gray-200 bg-white rounded-lg overflow-hidden">
        <div className="flex justify-between items-center px-6 py-3 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-4">
            <h2 className="text-[#303030] font-medium text-[22px] leading-6">Renters Insurance</h2>
          </div>
          <div className="flex items-start gap-2.5">
            <button
              onClick={openAddRenters}
              className="flex h-9 items-center gap-2 px-3 rounded-lg border border-white bg-[#013764] shadow-[0_0_0_1px_#002D5A] hover:bg-[#003a73] transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 4.16667V15.8333M4.16667 10H15.8333" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-white font-normal text-base leading-[140%] tracking-[-0.32px]">
                Add Renters Insurance
              </span>
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 h-12">
                <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#717179] text-sm font-medium leading-[18px]">Unit</span>
                  </div>
                </th>
                <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#717179] text-sm font-medium leading-[18px]">Tenant</span>
                  </div>
                </th>
                <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#717179] text-sm font-medium leading-[18px]">Carrier</span>
                  </div>
                </th>
                <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#717179] text-sm font-medium leading-[18px]">Policy #</span>
                  </div>
                </th>
                <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#717179] text-sm font-medium leading-[18px]">Effective</span>
                  </div>
                </th>
                <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#717179] text-sm font-medium leading-[18px]">Expires</span>
                  </div>
                </th>
                <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#717179] text-sm font-medium leading-[18px]">Status</span>
                  </div>
                </th>
                <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#717179] text-sm font-medium leading-[18px]">Document</span>
                  </div>
                </th>
                <th className="px-3 py-3 text-left whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#717179] text-sm font-medium leading-[18px]">Actions</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {renters.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-3 py-6 text-center text-gray-400 text-sm">
                    No renters insurance records found
                  </td>
                </tr>
              )}
              {renters.map((r) => {
                const days = daysUntil(r.expiration_date);
                return (
                  <tr
                    key={r.id}
                    data-testid={`renters-row-${r.id}`}
                    className={cn(
                      "border-b border-gray-200",
                      r.status === "expiring" && "bg-yellow-50",
                      r.status === "lapsed" && "bg-red-50"
                    )}
                  >
                    <td className="px-3 py-3 border-r border-gray-200">
                      <span className="text-[#303030] text-sm font-normal">{r.unit_name}</span>
                    </td>
                    <td className="px-3 py-3 border-r border-gray-200">
                      <span className="text-[#303030] text-sm font-normal">{r.tenant_name ?? "--"}</span>
                    </td>
                    <td className="px-3 py-3 border-r border-gray-200">
                      <span className="text-[#303030] text-sm font-normal">{r.carrier_name ?? "--"}</span>
                    </td>
                    <td className="px-3 py-3 border-r border-gray-200">
                      <span className="text-[#303030] text-sm font-normal">{r.policy_number ?? "--"}</span>
                    </td>
                    <td className="px-3 py-3 border-r border-gray-200">
                      <span className="text-[#303030] text-sm font-normal">{formatDate(r.effective_date)}</span>
                    </td>
                    <td className="px-3 py-3 border-r border-gray-200">
                      <span className="text-[#303030] text-sm font-normal">{formatDate(r.expiration_date)}</span>
                    </td>
                    <td className="px-3 py-3 border-r border-gray-200">
                      <StatusBadge status={r.status} daysRemaining={days} />
                    </td>
                    <td className="px-3 py-3 border-r border-gray-200">
                      {r.document_object_key ? (
                        <button
                          onClick={() => setPdfViewer({ url: `${API_BASE}/files/${r.document_object_key}`, title: `Renters Insurance — ${r.tenant_name ?? r.unit_name}` })}
                          className="inline-flex items-center gap-1 rounded-md border border-[#DADADA] bg-white px-2 py-1 text-xs text-[#303030] hover:bg-gray-50 transition-colors shadow-[0_1px_2px_0_rgba(0,0,0,0.04)]"
                          title="View document"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#525252" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                          View
                        </button>
                      ) : (
                        <span className="text-gray-400 text-sm">--</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <InsuranceActionButton
                        itemId={r.id}
                        openMenuId={openRentersMenuId}
                        setOpenMenuId={setOpenRentersMenuId}
                        onEdit={() => openEditRenters(r)}
                        onDelete={() => handleDeleteRenters(r.id)}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* PDF Viewer Modal */}
      {pdfViewer && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setPdfViewer(null)} />
          <div className="relative flex flex-col w-full max-w-[1000px] h-[85vh] rounded-xl border border-[#E5E5E5] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] bg-white overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 bg-gray-50 shrink-0">
              <div className="flex items-center gap-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#525252" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                <h3 className="text-[#303030] font-medium text-base truncate max-w-[700px]">{pdfViewer.title}</h3>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={pdfViewer.url}
                  download
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#DADADA] bg-white px-3 py-1.5 text-sm text-[#303030] hover:bg-gray-50 transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#525252" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  Download
                </a>
                <a
                  href={pdfViewer.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#DADADA] bg-white px-3 py-1.5 text-sm text-[#303030] hover:bg-gray-50 transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#525252" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                  Open
                </a>
                <button
                  onClick={() => setPdfViewer(null)}
                  className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-[#DADADA] bg-white hover:bg-gray-100 transition-colors"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#525252" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            </div>
            {/* PDF iframe */}
            <iframe
              src={pdfViewer.url}
              className="flex-1 w-full bg-gray-100"
              title={pdfViewer.title}
            />
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
