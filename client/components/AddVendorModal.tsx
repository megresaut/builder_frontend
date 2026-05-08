import { useState, useEffect } from "react";
import {
  ModalTemplate,
  ModalButtons,
  ModalField,
} from "@/components/ui/ModalTemplate";
import { FieldShell } from "@/components/forms/FieldShell";
import { SelectField } from "@/components/forms/SelectField";
import { CurrencyField } from "@/components/forms/CurrencyField";
import { MultiInputField } from "@/components/forms/MultiInputField";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { fetchJSON } from "@/api/fetchJSON";
import { toast } from "sonner";

interface AddVendorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  edit?: boolean;
  initialVendor?: {
    id: number;
    name: string;
    email: string;
    altEmail?: string;
    phone: string;
    altPhone?: string;
    website?: string;
    address?: string;
    hourlyRate?: number | null;
    emergencyHourlyRate?: number | null;
    notes?: string;
    servicesProvided?: string | string[];
    serviceAreaTags?: string[];
  };

  onAddVendor?: (vendor: {
    id: number;
    name: string;
    email: string;
    altEmail?: string;
    phone: string;
    altPhone?: string;
    servicesProvided: string[];
    serviceAreaTags: string[];
    notes: string;
  }) => void;

  onEditVendor?: (vendor: {
    name: string;
    email: string;
    altEmail?: string;
    phone: string;
    altPhone?: string;
    website?: string;
    address?: string;
    hourlyRate?: number | null;
    emergencyHourlyRate?: number | null;
    notes?: string;
    servicesProvided: string[];
    serviceAreaTags: string[];
  }) => void;
}


export default function AddVendorModal({
  open,
  onOpenChange,
  onAddVendor,
  edit,
  initialVendor,
  onEditVendor,
}: AddVendorModalProps) {
  const [vendorName, setVendorName] = useState("");
  const [email, setEmail] = useState("");
  const [altEmail, setAltEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [altPhone, setAltPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [address, setAddress] = useState("");
  const [hourlyRate, setHourlyRate] = useState<number | string>("");
  const [emergencyHourlyRate, setEmergencyHourlyRate] = useState<number | string>("");
  const [servicesProvided, setServicesProvided] = useState<string[]>([]);
  const [serviceAreaTags, setServiceAreaTags] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<{ vendorName?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const availableServices = [
    { value: "hvac", label: "HVAC" },
    { value: "plumbing", label: "Plumbing" },
    { value: "electrical", label: "Electrical" },
    { value: "carpentry", label: "Carpentry" },
    { value: "roofing", label: "Roofing" },
    { value: "painting", label: "Painting" },
    { value: "flooring", label: "Flooring" },
    { value: "landscaping", label: "Landscaping" },
    { value: "pest-control", label: "Pest Control" },
    { value: "security-systems", label: "Security Systems" },
    { value: "appliance-repair", label: "Appliance Repair" },
    { value: "general-maintenance", label: "General Maintenance" },
  ];

  useEffect(() => {
    if (!open) return;

    if (edit && initialVendor) {
      setVendorName(initialVendor.name || "");
      setEmail(initialVendor.email || "");
      setAltEmail(initialVendor.altEmail || "");
      setPhone(initialVendor.phone || "");
      setAltPhone(initialVendor.altPhone || "");
      setWebsite(initialVendor.website || "");
      setAddress(initialVendor.address || "");
      setHourlyRate(
        initialVendor.hourlyRate != null ? initialVendor.hourlyRate : "",
      );
      setEmergencyHourlyRate(
        initialVendor.emergencyHourlyRate != null
          ? initialVendor.emergencyHourlyRate
          : "",
      );
      setServicesProvided(
        Array.isArray(initialVendor.servicesProvided)
          ? initialVendor.servicesProvided
          : initialVendor.servicesProvided
          ? [initialVendor.servicesProvided]
          : [],
      );
      setServiceAreaTags(initialVendor.serviceAreaTags ?? []);
      setNotes(initialVendor.notes || "");
    } else {
      // Add mode
      setVendorName("");
      setEmail("");
      setAltEmail("");
      setPhone("");
      setAltPhone("");
      setWebsite("");
      setAddress("");
      setHourlyRate("");
      setEmergencyHourlyRate("");
      setServicesProvided([]);
      setServiceAreaTags([]);
      setNotes("");
    }

    setErrors({});
    setSubmitError(null);
  }, [open, edit, initialVendor]);


  const validateForm = (): boolean => {
    const newErrors: { vendorName?: string } = {};
    if (!vendorName.trim()) {
      newErrors.vendorName = "Vendor Name is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    if (submitting) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      if (edit && initialVendor) {
        const category = servicesProvided.join(", ");
        const toCents = (v: number | string): number | null => {
          if (v === "" || v === null || v === undefined) return null;
          const n = typeof v === "number" ? v : parseFloat(v);
          if (isNaN(n)) return null;
          return Math.round(n * 100);
        };
        await fetchJSON(`/vendors/${initialVendor.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            name: vendorName,
            primary_email: email,
            alt_email: altEmail,
            phone,
            alt_phone: altPhone,
            website,
            address,
            hourly_rate_cents: toCents(hourlyRate),
            emergency_hourly_rate_cents: toCents(emergencyHourlyRate),
            notes,
            category,
            service_area_tags: serviceAreaTags,
          }),
        });

        onEditVendor?.({
          name: vendorName,
          email,
          altEmail,
          phone,
          altPhone,
          website,
          address,
          hourlyRate: typeof hourlyRate === "number" ? hourlyRate : null,
          emergencyHourlyRate:
            typeof emergencyHourlyRate === "number" ? emergencyHourlyRate : null,
          notes,
          servicesProvided,
          serviceAreaTags,
        });

        toast.success("Vendor updated");
        onOpenChange(false);
        return;
      }

      // CREATE MODE
      const category = servicesProvided.join(", ");

      const res = await fetchJSON("/vendors/create", {
        method: "POST",
        body: JSON.stringify({
          name: vendorName,
          primary_email: email || "",
          alt_email: altEmail || "",
          phone: phone || "",
          alt_phone: altPhone || "",
          notes: notes || "",
          category,
          service_area_tags: serviceAreaTags,
          requires_1099: true,
          has_insurance: true,
        }),
      });

      onAddVendor?.({
        id: res.id,
        name: vendorName,
        email,
        altEmail,
        phone,
        altPhone,
        servicesProvided,
        serviceAreaTags,
        notes,
      });

      onOpenChange(false);
    } catch (err: any) {
      setSubmitError(err?.message || "Failed to save vendor. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };




  const handleVendorNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVendorName(e.target.value);
    if (errors.vendorName && e.target.value.trim()) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.vendorName;
        return newErrors;
      });
    }
  };

  return (
    <ModalTemplate
      open={open}
      onOpenChange={onOpenChange}
      title={edit ? "Edit Vendor" : "Add Vendor"}
      size="lg"
      onClose={() => onOpenChange(false)}
      footer={
        <ModalButtons
          onCancel={() => onOpenChange(false)}
          onConfirm={handleSubmit}
          cancelLabel="Cancel"
          confirmLabel={edit ? "Save Changes" : "Create Vendor"}
          confirmDisabled={submitting}
          cancelDisabled={submitting}
        />
      }
    >
      <ModalField spacing="tight">
        <FieldShell
          label="Vendor Name"
          required
          error={errors.vendorName}
          htmlFor="vendor-name"
        >
          <Input
            id="vendor-name"
            type="text"
            value={vendorName}
            onChange={handleVendorNameChange}
            placeholder="Vendor Name"
          />
        </FieldShell>
      </ModalField>

      <ModalField spacing="tight">
        <FieldShell label="Primary Email" htmlFor="primary-email">
          <Input
            id="primary-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vendor@example.com"
          />
        </FieldShell>
      </ModalField>

      <ModalField spacing="tight">
        <FieldShell label="Alternate Email" htmlFor="alt-email">
          <Input
            id="alt-email"
            type="email"
            value={altEmail}
            onChange={(e) => setAltEmail(e.target.value)}
            placeholder="alternate@example.com"
          />
        </FieldShell>
      </ModalField>

      <ModalField spacing="tight">
        <FieldShell label="Vendor Phone Number" htmlFor="vendor-phone">
          <Input
            id="vendor-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(123) 456-7890"
          />
        </FieldShell>
      </ModalField>

      <ModalField spacing="tight">
        <FieldShell label="Alternate Phone Number" htmlFor="alt-phone">
          <Input
            id="alt-phone"
            type="tel"
            value={altPhone}
            onChange={(e) => setAltPhone(e.target.value)}
            placeholder="(123) 456-7890"
          />
        </FieldShell>
      </ModalField>

      <ModalField spacing="tight">
        <FieldShell label="Website" htmlFor="vendor-website">
          <Input
            id="vendor-website"
            type="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://vendor.com"
          />
        </FieldShell>
      </ModalField>

      <ModalField spacing="tight">
        <FieldShell label="Address" htmlFor="vendor-address">
          <Input
            id="vendor-address"
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Street, City, State ZIP"
          />
        </FieldShell>
      </ModalField>

      <ModalField spacing="tight">
        <CurrencyField
          label="Hourly Rate"
          id="vendor-hourly-rate"
          value={hourlyRate}
          onChange={(v) => setHourlyRate(v)}
        />
      </ModalField>

      <ModalField spacing="tight">
        <CurrencyField
          label="Emergency Hourly Rate"
          id="vendor-emergency-hourly-rate"
          value={emergencyHourlyRate}
          onChange={(v) => setEmergencyHourlyRate(v)}
        />
      </ModalField>

      <ModalField spacing="tight">
        <SelectField
          label="Services Provided"
          id="services-provided"
          value={servicesProvided}
          onChange={(val) =>
            setServicesProvided(Array.isArray(val) ? val : [val])
          }
          options={availableServices}
          placeholder="Select services..."
          multiple
        />
      </ModalField>

      <ModalField spacing="tight">
        <MultiInputField
          label="Service Areas"
          id="service-area-tags"
          value={serviceAreaTags}
          onChange={setServiceAreaTags}
          placeholder="Add cities or regions"
          addPlaceholder="e.g. North Shore"
          addButtonLabel="Add area"
        />
      </ModalField>

      <ModalField spacing="tight">
        <FieldShell label="Notes" htmlFor="notes">
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Insert Vendor Notes"
            autoGrow
          />
        </FieldShell>
      </ModalField>

      {submitError && (
        <div className="text-sm text-red-600 mt-2">{submitError}</div>
      )}
    </ModalTemplate>
  );
}
