import { useState, useEffect } from "react";
import { ModalTemplate, ModalButtons } from "@/components/ui/ModalTemplate";
import { FormLayout, FormSection } from "@/components/ui/form-layout";
import { TextField, AddressField, type AddressValue } from "@/components/forms";

interface Unit {
  id: number;
  unitNumber: string;
  address: string;
  tenants: string[];
  propertyId: number;
}

interface AddUnitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editData?: Unit;
  onSubmit: (unit: Unit) => void;
  propertyAddress: string;
  propertyId: number;
}

// Extract address components from property address
const parsePropertyAddress = (address: string) => {
  // Parse address like "22 Indian Chase Dr, Greenwich, CT 06831"
  const parts = address.split(",").map((p) => p.trim());
  const street = parts[0] || "";
  
  let city = "";
  let state = "";
  let zip = "";

  if (parts.length >= 2) {
    city = parts[1] || "";
  }
  if (parts.length >= 3) {
    const stateZip = parts[2].split(" ");
    state = stateZip[0] || "";
    zip = stateZip[1] || "";
  }

  return { street, city, state, zip };
};

const mockSaveUnit = async (payload: any): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log("[API] POST /units", payload);
      resolve();
    }, 300);
  });
};

const mockUpdateUnit = async (id: number, payload: any): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`[API] PATCH /units/${id}`, payload);
      resolve();
    }, 300);
  });
};

export default function AddUnitModal({
  open,
  onOpenChange,
  editData,
  onSubmit,
  propertyAddress,
  propertyId,
}: AddUnitModalProps) {
  const isEditMode = Boolean(editData);
  const defaultAddress = parsePropertyAddress(propertyAddress);

  // Form state
  const [unitNumber, setUnitNumber] = useState("");
  const [addressValue, setAddressValue] = useState<AddressValue>({
    street: defaultAddress.street,
    city: defaultAddress.city,
    state: defaultAddress.state,
    zipCode: defaultAddress.zip,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!open) {
      setUnitNumber("");
      setAddressValue({
        street: defaultAddress.street,
        city: defaultAddress.city,
        state: defaultAddress.state,
        zipCode: defaultAddress.zip,
      });
      setErrors({});
    } else if (editData) {
      // Populate form from edit data
      setUnitNumber(editData.unitNumber);
      // Parse the unit-specific address
      const parts = editData.address.split(",").map((p) => p.trim());
      const street = parts[0] || defaultAddress.street;
      const city = parts[1] || defaultAddress.city;
      let state = defaultAddress.state;
      let zip = defaultAddress.zip;

      if (parts.length >= 3) {
        const stateZip = parts[2].split(" ");
        state = stateZip[0] || defaultAddress.state;
        zip = stateZip[1] || defaultAddress.zip;
      }

      setAddressValue({ street, city, state, zipCode: zip });
    }
  }, [open, editData, defaultAddress]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!unitNumber.trim()) {
      newErrors.unitNumber = "Unit number is required";
    }
    if (!addressValue.street.trim()) {
      newErrors.street = "Street address is required";
    }
    if (!addressValue.city.trim()) {
      newErrors.city = "City is required";
    }
    if (!addressValue.state.trim()) {
      newErrors.state = "State is required";
    }
    if (!addressValue.zipCode.trim()) {
      newErrors.zipCode = "ZIP code is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    const fullAddress = `${addressValue.street}, ${addressValue.city}, ${addressValue.state} ${addressValue.zipCode}`;
    const payload = {
      unit_number: unitNumber,
      address: fullAddress,
      property_id: propertyId,
    };

    try {
      if (isEditMode && editData) {
        await mockUpdateUnit(editData.id, payload);
        onSubmit({
          ...editData,
          unitNumber,
          address: fullAddress,
        });
      } else {
        await mockSaveUnit(payload);
        const newUnit: Unit = {
          id: Date.now(),
          unitNumber,
          address: fullAddress,
          tenants: [],
          propertyId,
        };
        onSubmit(newUnit);
      }
    } catch (error) {
      console.error("Failed to save unit:", error);
      setErrors({ form: "Failed to save unit. Please try again." });
    }
  };

  return (
    <ModalTemplate
      open={open}
      onOpenChange={onOpenChange}
      title={isEditMode ? "Edit Unit" : "Add Unit"}
      size="md"
      footer={
        <ModalButtons
          onCancel={() => onOpenChange(false)}
          onConfirm={handleSubmit}
          cancelLabel="Cancel"
          confirmLabel={isEditMode ? "Save Unit" : "Create Unit"}
        />
      }
    >
      <FormLayout>
        {/* Unit Information Section */}
        <FormSection showDivider={true}>
          <div
            style={{
              fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
              fontSize: "20px",
              color: "rgba(48, 48, 48, 1)",
              fontWeight: 600,
              lineHeight: 1.3,
              marginBottom: "12px",
            }}
          >
            Unit Information
          </div>

          <TextField
            label="Unit Number"
            value={unitNumber}
            onChange={(e) => setUnitNumber(e.target.value)}
            required
            error={errors.unitNumber}
            placeholder="e.g., 1A, Suite 100"
          />
        </FormSection>

        {/* Street Address Section */}
        <FormSection showDivider={false}>
          <AddressField
            label="Street Address"
            required
            value={addressValue}
            onChange={setAddressValue}
            error={errors.street || errors.city || errors.state || errors.zipCode}
            showLabel={true}
          />
        </FormSection>
      </FormLayout>
    </ModalTemplate>
  );
}
