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
import { fetchJSON } from "@/api/fetchJSON";

interface AddVendorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  edit?: boolean;
  initialVendor?: {
    id: number;
    name: string;
    email: string;
    phone: string;
    website?: string;
    servicesProvided?: string | string[];
  };

  onAddVendor?: (vendor: {
    id: number;
    name: string;
    email: string;
    phone: string;
    servicesProvided: string[];
    notes: string;
  }) => void;

  onEditVendor?: (vendor: {
    name: string;
    email: string;
    phone: string;
    website?: string;
    servicesProvided: string[];
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
  const [phone, setPhone] = useState("");
  const [servicesProvided, setServicesProvided] = useState<string[]>([]);
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
    if (!open) return;
  
    if (edit && initialVendor) {
      setVendorName(initialVendor.name || "");
      setEmail(initialVendor.email || "");
      setPhone(initialVendor.phone || "");
      setServicesProvided(
        Array.isArray(initialVendor.servicesProvided)
          ? initialVendor.servicesProvided
          : initialVendor.servicesProvided
          ? [initialVendor.servicesProvided]
          : [],
      );
      setNotes("");
    } else {
      // Add mode
      setVendorName("");
      setEmail("");
      setPhone("");
      setServicesProvided([]);
      setNotes("");
    }
  
    setErrors({});
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
  
    if (edit && initialVendor && onEditVendor) {
      onEditVendor({
        name: vendorName,
        email,
        phone,
        website: initialVendor.website,
        servicesProvided,
      });
  
      onOpenChange(false);
      return;
    }
  
    // CREATE MODE (unchanged)
    const category = servicesProvided.join(", ");
  
    const res = await fetchJSON("/vendors/create", {
      method: "POST",
      body: JSON.stringify({
        name: vendorName,
        primary_email: email || "",
        phone: phone || "",
        notes: notes || "",
        category,
        requires_1099: true,
        has_insurance: true,
      }),
    });
  
    onAddVendor?.({
      id: res.id,
      name: vendorName,
      email,
      phone,
      servicesProvided,
      notes,
    });
  
    onOpenChange(false);
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
    </ModalTemplate>
  );
}
