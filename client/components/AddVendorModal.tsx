import { useState, useEffect, useRef } from "react";
import {
  ModalTemplate,
  ModalButtons,
  ModalField,
  FieldRow,
  FieldRowItem,
} from "@/components/ui/ModalTemplate";
import { TextField } from "@/components/forms/TextField";
import { EmailField } from "@/components/forms/EmailField";
import { PhoneNumberField } from "@/components/forms/PhoneNumberField";
import { TextAreaField } from "@/components/forms/TextAreaField";
import { MultiSelectField } from "@/components/forms/MultiSelectField";

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
  const [servicesProvided, setServicesProvided] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<{ vendorName?: boolean }>({});

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

  const availableServices = [
    "HVAC",
    "Plumbing",
    "Electrical",
    "Carpentry",
    "Roofing",
    "Painting",
    "Flooring",
    "Landscaping",
    "Pest Control",
    "Security Systems",
    "Appliance Repair",
    "General Maintenance",
  ];

  const toggleService = (service: string) => {
    setServicesProvided((prev) =>
      prev.includes(service)
        ? prev.filter((s) => s !== service)
        : [...prev, service],
    );
  };

  const validateForm = (): boolean => {
    const newErrors: { vendorName?: boolean } = {};
    if (!vendorName.trim()) {
      newErrors.vendorName = true;
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
          servicesProvided,
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
      setErrors((prev) => ({ ...prev, vendorName: false }));
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
      <FieldRow columns={2}>
        <FieldRowItem>
          <TextField
            label="Vendor Name"
            required
            value={vendorName}
            onChange={handleVendorNameChange}
            placeholder="Vendor Name"
            error={errors.vendorName ? "Vendor Name is required" : undefined}
          />
        </FieldRowItem>
        <FieldRowItem>
          <EmailField
            label="Primary Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vendor@example.com"
          />
        </FieldRowItem>
      </FieldRow>

      <PhoneNumberField
        label="Vendor Phone Number"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="(123) 456-7890"
      />

      <MultiSelectField
        label="Services Provided"
        value={servicesProvided}
        onChange={setServicesProvided}
        placeholder="Select services provided..."
        options={availableServices.map((service) => ({
          value: service,
          label: service,
        }))}
      />

      <TextAreaField
        label="Notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Insert Vendor Notes"
        autoGrow
      />
    </ModalTemplate>
  );
}
