import { useState, useEffect, useRef, useCallback } from "react";
import { Dialog, DialogTitle } from "@/components/ui/dialog";
import { Modal } from "@/components/ui/Modal";
import { FormLayout, FormSection } from "@/components/ui/form-layout";
import { FileUploadField } from "@/components/forms/FileUploadField";
import type { UploadedFile } from "@/components/ui/attachment-uploader";
import {
  createOwner,
  updateOwner,
  linkOwnerToUnit,
  uploadOwnerFile,
  createOwnerDocument,
  fetchOwnersByProperty,
  type Owner,
} from "@/data/owners";
import { createInsurancePolicy } from "@/data/insurance";
import { toast } from "sonner";

export interface OwnerFormData {
  id?: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  ownershipPercentage: number;
  ownerSince: string;
  mailingAddress: string;
  status: "active" | "inactive";
  entityType: "individual" | "llc" | "trust";
  entityName: string;
  taxId: string;
}

interface AddOwnerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unitId: number;
  propertyId: number;
  editData: OwnerFormData | null;
  onSaved: () => void;
}

export default function AddOwnerModal({
  open,
  onOpenChange,
  unitId,
  propertyId,
  editData,
  onSaved,
}: AddOwnerModalProps) {
  const isEdit = Boolean(editData);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [ownershipPercentage, setOwnershipPercentage] = useState("");
  const [ownerSince, setOwnerSince] = useState("");
  const [mailingAddress, setMailingAddress] = useState("");
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [entityType, setEntityType] = useState<"individual" | "llc" | "trust">("individual");
  const [entityName, setEntityName] = useState("");
  const [taxId, setTaxId] = useState("");
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState("owner-info");

  // Section refs for scroll-to nav
  const sectionRefs = {
    "owner-info": useRef<HTMLDivElement>(null),
    "ownership": useRef<HTMLDivElement>(null),
    "entity": useRef<HTMLDivElement>(null),
    "address": useRef<HTMLDivElement>(null),
    "documents": useRef<HTMLDivElement>(null),
    "insurance": useRef<HTMLDivElement>(null),
  };
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollToSection = (id: string) => {
    const el = sectionRefs[id as keyof typeof sectionRefs]?.current;
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveSection(id);
  };

  // Existing owner picker
  const [existingOwners, setExistingOwners] = useState<Owner[]>([]);
  const [selectedOwnerLabel, setSelectedOwnerLabel] = useState<string | null>(null);
  const [ownerSearch, setOwnerSearch] = useState("");
  const [showOwnerDropdown, setShowOwnerDropdown] = useState(false);
  const ownerSearchRef = useRef<HTMLDivElement>(null);
  const ownerSearchInputRef = useRef<HTMLInputElement>(null);

  // Document uploads
  const [ownershipFiles, setOwnershipFiles] = useState<UploadedFile[]>([]);
  const [insuranceFiles, setInsuranceFiles] = useState<UploadedFile[]>([]);

  // Insurance fields
  const [insCarrier, setInsCarrier] = useState("");
  const [insPolicyNumber, setInsPolicyNumber] = useState("");
  const [insPolicyType, setInsPolicyType] = useState("");
  const [insEffective, setInsEffective] = useState("");
  const [insExpiration, setInsExpiration] = useState("");
  const [insPremiumDollars, setInsPremiumDollars] = useState("");
  const [insCoverageDollars, setInsCoverageDollars] = useState("");

  useEffect(() => {
    if (open && !editData) {
      fetchOwnersByProperty(propertyId).then(setExistingOwners).catch(() => {});
    }
    if (!open) {
      setOwnerSearch("");
      setShowOwnerDropdown(false);
      setSelectedOwnerLabel(null);
    }
  }, [open, editData, propertyId]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ownerSearchRef.current && !ownerSearchRef.current.contains(e.target as Node)) {
        setShowOwnerDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function applyExistingOwner(owner: Owner) {
    setFirstName(owner.first_name);
    setLastName(owner.last_name);
    setEmail(owner.email ?? "");
    setPhone(owner.phone ?? "");
    setMailingAddress(owner.mailing_address ?? "");
    setEntityType(owner.entity_type as "individual" | "llc" | "trust");
    setEntityName(owner.entity_name ?? "");
    setTaxId(owner.tax_id ?? "");
    setSelectedOwnerLabel(`${owner.first_name} ${owner.last_name}`);
    setOwnerSearch("");
    setShowOwnerDropdown(false);
  }

  function toggleOwnerDropdown() {
    setShowOwnerDropdown((prev) => {
      if (!prev) {
        setOwnerSearch("");
        setTimeout(() => ownerSearchInputRef.current?.focus(), 0);
      }
      return !prev;
    });
  }

  useEffect(() => {
    if (open && editData) {
      setFirstName(editData.firstName);
      setLastName(editData.lastName);
      setEmail(editData.email);
      setPhone(editData.phone);
      setOwnershipPercentage(editData.ownershipPercentage.toString());
      setOwnerSince(editData.ownerSince);
      setMailingAddress(editData.mailingAddress);
      setStatus(editData.status);
      setEntityType(editData.entityType);
      setEntityName(editData.entityName);
      setTaxId(editData.taxId);
      setOwnershipFiles([]);
      setInsuranceFiles([]);
      setInsCarrier("");
      setInsPolicyNumber("");
      setInsPolicyType("");
      setInsEffective("");
      setInsExpiration("");
      setInsPremiumDollars("");
      setInsCoverageDollars("");
    } else if (open && !editData) {
      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
      setOwnershipPercentage("");
      setOwnerSince("");
      setMailingAddress("");
      setStatus("active");
      setEntityType("individual");
      setEntityName("");
      setTaxId("");
      setOwnershipFiles([]);
      setInsuranceFiles([]);
      setInsCarrier("");
      setInsPolicyNumber("");
      setInsPolicyType("");
      setInsEffective("");
      setInsExpiration("");
      setInsPremiumDollars("");
      setInsCoverageDollars("");
    }
  }, [open, editData]);

  const handleSubmit = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      toast.error("First and last name are required");
      return;
    }

    const pct = parseFloat(ownershipPercentage);
    if (isNaN(pct) || pct <= 0 || pct > 100) {
      toast.error("Ownership percentage must be between 0 and 100");
      return;
    }

    setSaving(true);
    try {
      let ownerId: number;

      if (isEdit && editData?.id) {
        await updateOwner({
          id: editData.id,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          ownership_percentage: pct,
          owner_since: ownerSince || undefined,
          mailing_address: mailingAddress.trim(),
          status,
          entity_type: entityType,
          entity_name: entityName.trim(),
          tax_id: taxId.trim(),
        });
        ownerId = editData.id;
        toast.success("Owner updated");
      } else {
        const created = await createOwner({
          property_id: propertyId,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          ownership_percentage: pct,
          owner_since: ownerSince || new Date().toISOString().split("T")[0],
          mailing_address: mailingAddress.trim(),
          status,
          entity_type: entityType,
          entity_name: entityName.trim(),
          tax_id: taxId.trim(),
        });
        ownerId = created.id;
        await linkOwnerToUnit(ownerId, unitId);
        toast.success("Owner added");
      }

      // Upload ownership documents (2-step: upload file → create record)
      for (const f of ownershipFiles) {
        if (!f.file) continue;
        try {
          const { object_key, mime } = await uploadOwnerFile(f.file);
          await createOwnerDocument({
            owner_id: ownerId,
            document_type: "ownership",
            document_label: f.file.name,
            document_object_key: object_key,
            document_mime: mime,
          });
        } catch {
          toast.error(`Failed to upload ${f.file.name}`);
        }
      }

      // Upload insurance doc and create policy record
      if (insPolicyType && insCarrier && insEffective && insExpiration) {
        let coiKey = "";
        let coiMime = "";
        for (const f of insuranceFiles) {
          if (!f.file) continue;
          try {
            const { object_key, mime } = await uploadOwnerFile(f.file);
            coiKey = object_key;
            coiMime = mime;
          } catch {
            toast.error(`Failed to upload ${f.file.name}`);
          }
        }
        try {
          const premiumCents = insPremiumDollars
            ? Math.round(parseFloat(insPremiumDollars) * 100)
            : null;
          const coverageCents = insCoverageDollars
            ? Math.round(parseFloat(insCoverageDollars) * 100)
            : null;
          await createInsurancePolicy({
            property_id: propertyId,
            policy_type: insPolicyType,
            policy_layer: "primary",
            carrier_name: insCarrier,
            policy_number: insPolicyNumber,
            agent_name: "",
            agent_firm: "",
            agent_phone: "",
            agent_email: "",
            premium_cents: premiumCents,
            coverage_amount_cents: coverageCents,
            effective_date: insEffective,
            expiration_date: insExpiration,
            avm_master_policy: false,
            policy_object_key: "",
            policy_mime: "",
            coi_object_key: coiKey,
            coi_mime: coiMime,
            notes: "",
          });
          toast.success("Insurance policy saved");
        } catch {
          toast.error("Failed to save insurance policy");
        }
      }

      onSaved();
    } catch {
      toast.error("Failed to save owner");
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-[#DADADA] bg-white px-3 py-2 text-sm text-[#303030] placeholder:text-[#A0A0A0] focus:outline-none focus:ring-2 focus:ring-[#1357D5]/20 focus:border-[#1357D5]";
  const labelClass = "block text-xs font-medium text-[#71717A] mb-1";

  const NAV_SECTIONS = [
    { id: "owner-info", label: "Owner Info" },
    { id: "ownership", label: "Ownership" },
    { id: "entity", label: "Entity" },
    { id: "address", label: "Address" },
    { id: "documents", label: "Documents" },
    { id: "insurance", label: "Insurance" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Modal size="md" hideCloseButton style={{ padding: 0 }}>
        <DialogTitle className="sr-only">{isEdit ? "Edit Owner" : "Add Owner"}</DialogTitle>

        {/* Sticky header: title + close + underline tabs */}
        <div className="sticky top-0 z-10 bg-white px-8 pt-8 pb-0">
          {/* Title row */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-2xl font-semibold text-[#303030]" style={{ lineHeight: 1.08 }}>
              {isEdit ? "Edit Owner" : "Add Owner"}
            </span>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          {/* Underline tab nav */}
          <div className="flex items-center gap-5 border-b border-[#e5e5e5]">
            {NAV_SECTIONS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => scrollToSection(s.id)}
                className={`shrink-0 pb-2 text-sm font-medium transition-colors whitespace-nowrap ${
                  activeSection === s.id
                    ? "border-b-2 border-[#09090b] text-[#09090b] -mb-px"
                    : "text-[#717179] hover:text-[#09090b]"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable content */}
        <div className="px-8 py-5">
      <FormLayout>
        {!isEdit && (
          <div className="mb-2" ref={ownerSearchRef}>
            <label className={labelClass}>Select from existing owner</label>
            <div className="relative">
              <button
                type="button"
                className="w-full rounded-lg border border-[#DADADA] bg-white px-3 py-2 text-sm text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-[#1357D5]/20 focus:border-[#1357D5]"
                onClick={toggleOwnerDropdown}
              >
                <span className={selectedOwnerLabel ? "text-[#303030]" : "text-[#A0A0A0]"}>
                  {selectedOwnerLabel ?? "Select an existing owner..."}
                </span>
                <svg className={`w-4 h-4 text-[#71717A] transition-transform ${showOwnerDropdown ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showOwnerDropdown && (
                <div className="absolute z-50 mt-1 w-full rounded-lg border border-[#DADADA] bg-white shadow-lg">
                  <div className="p-2 border-b border-[#F0F0F0]">
                    <input
                      ref={ownerSearchInputRef}
                      className="w-full rounded-md border border-[#DADADA] bg-white px-3 py-1.5 text-sm text-[#303030] placeholder:text-[#A0A0A0] focus:outline-none focus:ring-2 focus:ring-[#1357D5]/20 focus:border-[#1357D5]"
                      placeholder="Search..."
                      value={ownerSearch}
                      onChange={(e) => setOwnerSearch(e.target.value)}
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {existingOwners
                      .filter((o) => {
                        const full = `${o.first_name} ${o.last_name}`.toLowerCase();
                        return ownerSearch === "" || full.includes(ownerSearch.toLowerCase());
                      })
                      .map((o) => (
                        <button
                          key={o.id}
                          type="button"
                          className="w-full text-left px-3 py-2 text-sm text-[#303030] hover:bg-[#F5F5F5] flex items-center justify-between"
                          onMouseDown={() => applyExistingOwner(o)}
                        >
                          <span>{o.first_name} {o.last_name}</span>
                          {o.email && <span className="text-xs text-[#A0A0A0]">{o.email}</span>}
                        </button>
                      ))}
                    {existingOwners.filter((o) => {
                      const full = `${o.first_name} ${o.last_name}`.toLowerCase();
                      return ownerSearch === "" || full.includes(ownerSearch.toLowerCase());
                    }).length === 0 && (
                      <div className="px-3 py-2 text-sm text-[#A0A0A0]">No matching owners</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div ref={sectionRefs["owner-info"]} className="scroll-mt-24">
        <FormSection title="Owner Information" showDivider>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>First Name *</label>
              <input
                className={inputClass}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Margaret"
              />
            </div>
            <div>
              <label className={labelClass}>Last Name *</label>
              <input
                className={inputClass}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Chen"
              />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input
                className={inputClass}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@example.com"
              />
            </div>
            <div>
              <label className={labelClass}>Phone</label>
              <input
                className={inputClass}
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>
          </div>
        </FormSection>
        </div>

        <div ref={sectionRefs["ownership"]} className="scroll-mt-24">
        <FormSection title="Ownership Details" showDivider>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Ownership Percentage *</label>
              <div className="relative">
                <input
                  className={inputClass}
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={ownershipPercentage}
                  onChange={(e) => setOwnershipPercentage(e.target.value)}
                  placeholder="50"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#71717A]">
                  %
                </span>
              </div>
            </div>
            <div>
              <label className={labelClass}>Status</label>
              <select
                className={inputClass}
                value={status}
                onChange={(e) => setStatus(e.target.value as "active" | "inactive")}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Owner Since</label>
              <input
                className={inputClass}
                type="date"
                value={ownerSince}
                onChange={(e) => setOwnerSince(e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>Tax ID</label>
              <input
                className={inputClass}
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                placeholder="XX-XXXXXXX"
              />
            </div>
          </div>
        </FormSection>
        </div>

        <div ref={sectionRefs["entity"]} className="scroll-mt-24">
        <FormSection title="Entity Information" showDivider>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Entity Type</label>
              <select
                className={inputClass}
                value={entityType}
                onChange={(e) =>
                  setEntityType(e.target.value as "individual" | "llc" | "trust")
                }
              >
                <option value="individual">Individual</option>
                <option value="llc">LLC</option>
                <option value="trust">Trust</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>
                Entity Name{" "}
                {entityType !== "individual" && (
                  <span className="text-[#A0A0A0]">
                    ({entityType === "llc" ? "LLC" : "Trust"} name)
                  </span>
                )}
              </label>
              <input
                className={inputClass}
                value={entityName}
                onChange={(e) => setEntityName(e.target.value)}
                placeholder={
                  entityType === "llc"
                    ? "Williams Investment Partners LLC"
                    : entityType === "trust"
                      ? "Chen Family Trust"
                      : "N/A for Individual"
                }
                disabled={entityType === "individual"}
              />
            </div>
          </div>
        </FormSection>
        </div>

        <div ref={sectionRefs["address"]} className="scroll-mt-24">
        <FormSection title="Mailing Address" showDivider>
          <div>
            <label className={labelClass}>Address</label>
            <textarea
              className={`${inputClass} resize-none`}
              rows={2}
              value={mailingAddress}
              onChange={(e) => setMailingAddress(e.target.value)}
              placeholder="42 Brookfield Lane, Stamford, CT 06902"
            />
          </div>
        </FormSection>
        </div>

        <div ref={sectionRefs["documents"]} className="scroll-mt-24">
        <FormSection title="Ownership Agreement" description="Upload the ownership/deed agreement" showDivider>
          <FileUploadField
            label="Ownership Document"
            files={ownershipFiles}
            onFilesAdded={(newFiles) => setOwnershipFiles((prev) => [...prev, ...newFiles])}
            onFileRemoved={(fileId) => setOwnershipFiles((prev) => prev.filter((f) => f.id !== fileId))}
            accept=".pdf,.doc,.docx"
            maxFiles={5}
            placeholder="Drop ownership agreement here, or click to browse"
          />
        </FormSection>
        </div>

        <div ref={sectionRefs["insurance"]} className="scroll-mt-24">
        <FormSection title="Insurance Policy" description="This will also appear in the Insurance tab" showDivider={false}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Policy Type</label>
              <select className={inputClass} value={insPolicyType} onChange={(e) => setInsPolicyType(e.target.value)}>
                <option value="">Select...</option>
                <option value="property">Property</option>
                <option value="general_liability">General Liability</option>
                <option value="umbrella">Umbrella</option>
                <option value="dwelling_fire">Dwelling Fire</option>
                <option value="flood">Flood</option>
                <option value="earthquake">Earthquake</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Insurance Carrier</label>
              <input className={inputClass} value={insCarrier} onChange={(e) => setInsCarrier(e.target.value)} placeholder="Hartford, Travelers, etc." />
            </div>
            <div>
              <label className={labelClass}>Policy Number</label>
              <input className={inputClass} value={insPolicyNumber} onChange={(e) => setInsPolicyNumber(e.target.value)} placeholder="POL-123456" />
            </div>
            <div>
              <label className={labelClass}>Annual Premium ($)</label>
              <input className={inputClass} type="number" step="0.01" min="0" value={insPremiumDollars} onChange={(e) => setInsPremiumDollars(e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <label className={labelClass}>Coverage Amount ($)</label>
              <input className={inputClass} type="number" step="0.01" min="0" value={insCoverageDollars} onChange={(e) => setInsCoverageDollars(e.target.value)} placeholder="0.00" />
            </div>
            <div>{/* spacer */}</div>
            <div>
              <label className={labelClass}>Effective Date</label>
              <input className={inputClass} type="date" value={insEffective} onChange={(e) => setInsEffective(e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Expiration Date</label>
              <input className={inputClass} type="date" value={insExpiration} onChange={(e) => setInsExpiration(e.target.value)} />
            </div>
          </div>
          <FileUploadField
            label="Policy Document / COI"
            files={insuranceFiles}
            onFilesAdded={(newFiles) => setInsuranceFiles((prev) => [...prev, ...newFiles])}
            onFileRemoved={(fileId) => setInsuranceFiles((prev) => prev.filter((f) => f.id !== fileId))}
            accept=".pdf,.jpg,.jpeg,.png"
            maxFiles={3}
            placeholder="Drop insurance policy or COI here, or click to browse"
          />
        </FormSection>
        </div>
      </FormLayout>
        </div>

        {/* Sticky footer */}
        <div className="sticky bottom-0 z-10 bg-white border-t border-[#e5e5e5] px-8 py-5 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 rounded-lg border border-[#DADADA] text-sm font-medium text-[#303030] hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-[#013764] text-white text-sm font-medium hover:bg-[#003a73] transition-colors disabled:opacity-50 shadow-[0_0_0_1px_#002D5A]"
          >
            {saving ? "Saving..." : isEdit ? "Update" : "Add Owner"}
          </button>
        </div>
      </Modal>
    </Dialog>
  );
}
