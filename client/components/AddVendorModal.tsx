import { useState, useEffect } from "react";
import {
  ModalTemplate,
  ModalButtons,
  ModalField,
} from "@/components/ui/ModalTemplate";
import {
  FormLayout,
  FormSection,
} from "@/components/ui/form-layout";
import { TextField } from "@/components/forms/TextField";
import { TextAreaField } from "@/components/forms/TextAreaField";
import { FieldShell } from "@/components/forms/FieldShell";
import { SelectField } from "@/components/forms/SelectField";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface SelectOption {
  value: string;
  label: string;
}

interface AddVendorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddVendor?: (vendor: {
    name: string;
    email: string;
    phone: string;
    servicesProvided: string[];
    notes: string;
  }) => void;
  edit?: boolean;
  initialVendor?: {
    name: string;
    category?: string;
    email?: string;
    phone?: string;
    website?: string;
    servicesProvided?: string;
  };
  onEditVendor?: (vendor: {
    name: string;
    category: string;
    email: string;
    phone: string;
    website: string;
    servicesProvided: string;
  }) => void;
}

export default function AddVendorModal({
  open,
  onOpenChange,
  onAddVendor,
  edit = false,
  initialVendor,
  onEditVendor,
}: AddVendorModalProps) {
  const [vendorName, setVendorName] = useState("");
  const [category, setCategory] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [servicesProvided, setServicesProvided] = useState<string | string[]>("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<{ vendorName?: string }>({});

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
    if (open) {
      if (edit && initialVendor) {
        setVendorName(initialVendor.name || "");
        setCategory(initialVendor.category || "");
        setEmail(initialVendor.email || "");
        setPhone(initialVendor.phone || "");
        setWebsite(initialVendor.website || "");
        setServicesProvided(initialVendor.servicesProvided || "");
        setNotes("");
      } else {
        setVendorName("");
        setCategory("");
        setEmail("");
        setPhone("");
        setWebsite("");
        setServicesProvided([]);
        setNotes("");
      }
      setErrors({});
    }
  }, [open, edit, initialVendor]);

  const validateForm = (): boolean => {
    const newErrors: { vendorName?: string } = {};
    if (!vendorName.trim()) {
      newErrors.vendorName = "Vendor Name is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      if (edit && onEditVendor) {
        onEditVendor({
          name: vendorName,
          category,
          email,
          phone,
          website,
          servicesProvided: Array.isArray(servicesProvided) ? servicesProvided.join(", ") : servicesProvided,
        });
      } else if (!edit && onAddVendor) {
        const serviceArray = Array.isArray(servicesProvided) ? servicesProvided : [];
        const serviceLabels = serviceArray.map(
          (value) =>
            availableServices.find((s) => s.value === value)?.label || value,
        );
        onAddVendor({
          name: vendorName,
          email,
          phone,
          servicesProvided: serviceLabels,
          notes,
        });
      }
      setVendorName("");
      setCategory("");
      setEmail("");
      setPhone("");
      setWebsite("");
      setServicesProvided("");
      setNotes("");
      onOpenChange(false);
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
          confirmLabel={edit ? "Save Vendor" : "Create Vendor"}
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
        <FieldShell label="Website" htmlFor="website">
          <Input
            id="website"
            type="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://example.com"
          />
        </FieldShell>
      </ModalField>

      <ModalField spacing="tight">
        <SelectField
          label="Services Provided"
          value={Array.isArray(servicesProvided) ? servicesProvided : (servicesProvided ? [servicesProvided] : [])}
          onChange={(val) => setServicesProvided(val)}
          options={[
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
          ]}
          multiple={true}
          placeholder="Select services..."
        />
      </ModalField>

      {!edit && (
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
      )}
    </ModalTemplate>
  );
}
