import { useState, useEffect } from "react";
import { ModalTemplate, ModalButtons } from "@/components/ui/ModalTemplate";
import { FormLayout, FormSection } from "@/components/ui/form-layout";
import { FileUploadField } from "@/components/forms/FileUploadField";
import type { UploadedFile } from "@/components/ui/attachment-uploader";
import {
  createOwner,
  updateOwner,
  linkOwnerToUnit,
  uploadOwnerFile,
  createOwnerDocument,
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

  return (
    <ModalTemplate
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Edit Owner" : "Add Owner"}
      size="md"
      footer={
        <ModalButtons
          onCancel={() => onOpenChange(false)}
          onConfirm={handleSubmit}
          cancelLabel="Cancel"
          confirmLabel={saving ? "Saving..." : isEdit ? "Update" : "Add Owner"}
          confirmDisabled={saving}
        />
      }
    >
      <FormLayout>
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
      </FormLayout>
    </ModalTemplate>
  );
}
