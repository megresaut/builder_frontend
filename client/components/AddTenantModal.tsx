import { useState, useEffect } from "react";
import { ModalTemplate, ModalButtons } from "@/components/ui/ModalTemplate";
import { FormLayout, FormSection } from "@/components/ui/form-layout";
import { FileUploadField } from "@/components/forms/FileUploadField";
import type { UploadedFile } from "@/components/ui/attachment-uploader";
import { createTenant, updateTenant, uploadTenantDocument, createTenantDocument } from "@/data/tenants";
import { createRentersInsurance } from "@/data/insurance";
import type { Tenant } from "@/types/tenant";
import { toast } from "sonner";

interface AddTenantModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unitId: number;
  propertyId: number;
  editData: Tenant | null;
  onSaved: () => void;
}

export default function AddTenantModal({
  open,
  onOpenChange,
  unitId,
  propertyId,
  editData,
  onSaved,
}: AddTenantModalProps) {
  const isEdit = Boolean(editData);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [leaseType, setLeaseType] = useState("");
  const [leaseStart, setLeaseStart] = useState("");
  const [leaseEnd, setLeaseEnd] = useState("");
  const [rentDollars, setRentDollars] = useState("");
  const [depositDollars, setDepositDollars] = useState("");
  const [moveIn, setMoveIn] = useState("");
  const [moveOut, setMoveOut] = useState("");
  const [status, setStatus] = useState("pending");
  const [ecName, setEcName] = useState("");
  const [ecPhone, setEcPhone] = useState("");
  const [ecRelationship, setEcRelationship] = useState("");
  const [saving, setSaving] = useState(false);

  // Document uploads
  const [leaseFiles, setLeaseFiles] = useState<UploadedFile[]>([]);
  const [insuranceFiles, setInsuranceFiles] = useState<UploadedFile[]>([]);

  // Insurance fields
  const [insCarrier, setInsCarrier] = useState("");
  const [insPolicyNumber, setInsPolicyNumber] = useState("");
  const [insEffective, setInsEffective] = useState("");
  const [insExpiration, setInsExpiration] = useState("");

  useEffect(() => {
    if (open && editData) {
      setFirstName(editData.first_name);
      setLastName(editData.last_name);
      setEmail(editData.email || "");
      setPhone(editData.phone || "");
      setLeaseType(editData.lease_type || "");
      setLeaseStart(editData.lease_start_date || "");
      setLeaseEnd(editData.lease_end_date || "");
      setRentDollars(editData.rent_amount_cents != null ? (editData.rent_amount_cents / 100).toString() : "");
      setDepositDollars(editData.security_deposit_cents != null ? (editData.security_deposit_cents / 100).toString() : "");
      setMoveIn(editData.move_in_date || "");
      setMoveOut(editData.move_out_date || "");
      setStatus(editData.status);
      setEcName(editData.emergency_contact_name || "");
      setEcPhone(editData.emergency_contact_phone || "");
      setEcRelationship(editData.emergency_contact_relationship || "");
      setLeaseFiles([]);
      setInsuranceFiles([]);
      setInsCarrier("");
      setInsPolicyNumber("");
      setInsEffective("");
      setInsExpiration("");
    } else if (open && !editData) {
      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
      setLeaseType("");
      setLeaseStart("");
      setLeaseEnd("");
      setRentDollars("");
      setDepositDollars("");
      setMoveIn("");
      setMoveOut("");
      setStatus("pending");
      setEcName("");
      setEcPhone("");
      setEcRelationship("");
      setLeaseFiles([]);
      setInsuranceFiles([]);
      setInsCarrier("");
      setInsPolicyNumber("");
      setInsEffective("");
      setInsExpiration("");
    }
  }, [open, editData]);

  const handleSubmit = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      toast.error("First and last name are required");
      return;
    }

    setSaving(true);
    try {
      const rentCents = rentDollars ? Math.round(parseFloat(rentDollars) * 100) : undefined;
      const depositCents = depositDollars ? Math.round(parseFloat(depositDollars) * 100) : undefined;

      let savedTenant: Tenant;
      if (isEdit && editData) {
        savedTenant = await updateTenant({
          id: editData.id,
          first_name: firstName,
          last_name: lastName,
          email: email || undefined,
          phone: phone || undefined,
          lease_type: leaseType || undefined,
          lease_start_date: leaseStart || undefined,
          lease_end_date: leaseEnd || undefined,
          rent_amount_cents: rentCents,
          security_deposit_cents: depositCents,
          move_in_date: moveIn || undefined,
          move_out_date: moveOut || undefined,
          status: status || undefined,
          emergency_contact_name: ecName || undefined,
          emergency_contact_phone: ecPhone || undefined,
          emergency_contact_relationship: ecRelationship || undefined,
        });
        toast.success("Tenant updated");
      } else {
        savedTenant = await createTenant({
          unit_id: unitId,
          property_id: propertyId,
          first_name: firstName,
          last_name: lastName,
          email: email || undefined,
          phone: phone || undefined,
          lease_type: leaseType || undefined,
          lease_start_date: leaseStart || undefined,
          lease_end_date: leaseEnd || undefined,
          rent_amount_cents: rentCents,
          security_deposit_cents: depositCents,
          move_in_date: moveIn || undefined,
          move_out_date: moveOut || undefined,
          status: status || undefined,
          emergency_contact_name: ecName || undefined,
          emergency_contact_phone: ecPhone || undefined,
          emergency_contact_relationship: ecRelationship || undefined,
        });
        toast.success("Tenant added");
      }

      // Upload lease documents (2-step: upload file → create document record)
      for (const f of leaseFiles) {
        if (!f.file) continue;
        try {
          const { object_key, mime } = await uploadTenantDocument(f.file);
          await createTenantDocument({
            tenant_id: savedTenant.id,
            document_type: "lease",
            document_label: f.file.name,
            document_object_key: object_key,
            document_mime: mime,
          });
        } catch {
          toast.error(`Failed to upload ${f.file.name}`);
        }
      }

      // Create renters insurance record if carrier and dates are provided
      if (insCarrier && insEffective && insExpiration) {
        try {
          await createRentersInsurance({
            unit_id: unitId,
            property_id: propertyId,
            tenant_id: savedTenant.id,
            tenant_name: `${firstName.trim()} ${lastName.trim()}`,
            carrier_name: insCarrier,
            policy_number: insPolicyNumber,
            effective_date: insEffective,
            expiration_date: insExpiration,
            status: "active",
            document_object_key: "",
            document_mime: "",
            coi_object_key: "",
            coi_mime: "",
            notes: "",
          });
          toast.success("Renters insurance saved");
        } catch {
          toast.error("Failed to save renters insurance");
        }
      }

      onSaved();
    } catch {
      toast.error("Failed to save tenant");
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full rounded-lg border border-[#DADADA] bg-white px-3 py-2 text-sm text-[#303030] placeholder:text-[#A0A0A0] focus:outline-none focus:ring-2 focus:ring-[#1357D5]/20 focus:border-[#1357D5]";
  const labelClass = "block text-xs font-medium text-[#71717A] mb-1";

  return (
    <ModalTemplate
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Edit Tenant" : "Add Tenant"}
      size="md"
      footer={
        <ModalButtons
          onCancel={() => onOpenChange(false)}
          onConfirm={handleSubmit}
          cancelLabel="Cancel"
          confirmLabel={saving ? "Saving..." : isEdit ? "Update" : "Add Tenant"}
          confirmDisabled={saving}
        />
      }
    >
      <FormLayout>
        <FormSection title="Personal Information" showDivider>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>First Name *</label>
              <input className={inputClass} value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="John" />
            </div>
            <div>
              <label className={labelClass}>Last Name *</label>
              <input className={inputClass} value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Doe" />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input className={inputClass} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@example.com" />
            </div>
            <div>
              <label className={labelClass}>Phone</label>
              <input className={inputClass} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 123-4567" />
            </div>
          </div>
        </FormSection>

        <FormSection title="Lease Details" showDivider>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Lease Type</label>
              <select className={inputClass} value={leaseType} onChange={(e) => setLeaseType(e.target.value)}>
                <option value="">Select...</option>
                <option value="fixed">Fixed</option>
                <option value="month_to_month">Month-to-Month</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Status</label>
              <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="former">Former</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Lease Start</label>
              <input className={inputClass} type="date" value={leaseStart} onChange={(e) => setLeaseStart(e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Lease End</label>
              <input className={inputClass} type="date" value={leaseEnd} onChange={(e) => setLeaseEnd(e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Monthly Rent ($)</label>
              <input className={inputClass} type="number" step="0.01" min="0" value={rentDollars} onChange={(e) => setRentDollars(e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <label className={labelClass}>Security Deposit ($)</label>
              <input className={inputClass} type="number" step="0.01" min="0" value={depositDollars} onChange={(e) => setDepositDollars(e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <label className={labelClass}>Move-in Date</label>
              <input className={inputClass} type="date" value={moveIn} onChange={(e) => setMoveIn(e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Move-out Date</label>
              <input className={inputClass} type="date" value={moveOut} onChange={(e) => setMoveOut(e.target.value)} />
            </div>
          </div>
        </FormSection>

        <FormSection title="Lease Agreement" description="Upload the signed lease agreement" showDivider>
          <FileUploadField
            label="Lease Document"
            files={leaseFiles}
            onFilesAdded={(newFiles) => setLeaseFiles((prev) => [...prev, ...newFiles])}
            onFileRemoved={(fileId) => setLeaseFiles((prev) => prev.filter((f) => f.id !== fileId))}
            accept=".pdf,.doc,.docx"
            maxFiles={3}
            placeholder="Drop lease agreement here, or click to browse"
          />
        </FormSection>

        <FormSection title="Renters Insurance" description="This will also appear in the Insurance tab" showDivider>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Insurance Carrier</label>
              <input className={inputClass} value={insCarrier} onChange={(e) => setInsCarrier(e.target.value)} placeholder="State Farm, Lemonade, etc." />
            </div>
            <div>
              <label className={labelClass}>Policy Number</label>
              <input className={inputClass} value={insPolicyNumber} onChange={(e) => setInsPolicyNumber(e.target.value)} placeholder="POL-123456" />
            </div>
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
            label="Insurance Document / COI"
            files={insuranceFiles}
            onFilesAdded={(newFiles) => setInsuranceFiles((prev) => [...prev, ...newFiles])}
            onFileRemoved={(fileId) => setInsuranceFiles((prev) => prev.filter((f) => f.id !== fileId))}
            accept=".pdf,.jpg,.jpeg,.png"
            maxFiles={3}
            placeholder="Drop insurance document or COI here, or click to browse"
          />
        </FormSection>

        <FormSection title="Emergency Contact" showDivider={false}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Name</label>
              <input className={inputClass} value={ecName} onChange={(e) => setEcName(e.target.value)} placeholder="Jane Doe" />
            </div>
            <div>
              <label className={labelClass}>Phone</label>
              <input className={inputClass} type="tel" value={ecPhone} onChange={(e) => setEcPhone(e.target.value)} placeholder="(555) 987-6543" />
            </div>
            <div className="col-span-2">
              <label className={labelClass}>Relationship</label>
              <input className={inputClass} value={ecRelationship} onChange={(e) => setEcRelationship(e.target.value)} placeholder="Spouse, Parent, etc." />
            </div>
          </div>
        </FormSection>
      </FormLayout>
    </ModalTemplate>
  );
}
