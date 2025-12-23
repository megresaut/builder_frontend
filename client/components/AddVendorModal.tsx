import { useState, useEffect } from "react";
import {
  ModalTemplate,
  ModalButtons,
  ModalField,
} from "@/components/ui/ModalTemplate";
import { FieldShell } from "@/components/forms/FieldShell";
import { SelectField } from "@/components/forms/SelectField";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

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
}

export default function AddVendorModal({
  open,
  onOpenChange,
  onAddVendor,
}: AddVendorModalProps) {
  const [vendorName, setVendorName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [servicesProvided, setServicesProvided] = useState<MultiSelectOption[]>([]);
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<{ vendorName?: string }>({});

  const availableServices: MultiSelectOption[] = [
    { id: "hvac", label: "HVAC" },
    { id: "plumbing", label: "Plumbing" },
    { id: "electrical", label: "Electrical" },
    { id: "carpentry", label: "Carpentry" },
    { id: "roofing", label: "Roofing" },
    { id: "painting", label: "Painting" },
    { id: "flooring", label: "Flooring" },
    { id: "landscaping", label: "Landscaping" },
    { id: "pest-control", label: "Pest Control" },
    { id: "security-systems", label: "Security Systems" },
    { id: "appliance-repair", label: "Appliance Repair" },
    { id: "general-maintenance", label: "General Maintenance" },
  ];

  useEffect(() => {
    if (open) {
      setVendorName("");
      setEmail("");
      setPhone("");
      setServicesProvided([]);
      setNotes("");
      setErrors({});
    }
  }, [open]);

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
      if (onAddVendor) {
        onAddVendor({
          name: vendorName,
          email,
          phone,
          servicesProvided: servicesProvided.map((s) => s.label),
          notes,
        });
      }
      setVendorName("");
      setEmail("");
      setPhone("");
      setServicesProvided([]);
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
      title="Add Vendor"
      size="lg"
      onClose={() => onOpenChange(false)}
      footer={
        <ModalButtons
          onCancel={() => onOpenChange(false)}
          onConfirm={handleSubmit}
          cancelLabel="Cancel"
          confirmLabel="Create Vendor"
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
        <FieldShell
          label="Primary Email"
          htmlFor="primary-email"
        >
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
        <FieldShell
          label="Vendor Phone Number"
          htmlFor="vendor-phone"
        >
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
        <MultiSelectField
          label="Services Provided"
          id="services-provided"
          value={servicesProvided}
          onChange={setServicesProvided}
          options={availableServices}
          placeholder="Select services..."
        />
      </ModalField>

      <ModalField spacing="tight">
        <FieldShell
          label="Notes"
          htmlFor="notes"
        >
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Insert Vendor Notes"
            autoGrow
          />
        </FieldShell>
      </ModalField>
    </ModalTemplate>
  );
}
