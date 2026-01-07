import { useState, useEffect } from "react";
import { ModalTemplate, ModalButtons } from "@/components/ui/ModalTemplate";
import {
  FormLayout,
  FormSection,
} from "@/components/ui/form-layout";
import {
  TextField,
  SelectField,
  CurrencyField,
  MultiSelectField,
  MultiInputField,
  FieldRow,
  FieldRowItem,
  type MultiSelectOption,
} from "@/components/forms";

// Backend contract types
interface PropertyManager {
  id: number;
  name: string;
}

interface PropertyEditData {
  id: number;
  name: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postal_code: string;
  property_type: string;
  buildium_property_id: string;
  active: boolean;
  management_fee_cents: number | null;
  hourly_rate_cents: number | null;
  emergency_hourly_rate_cents: number | null;
  manager_ids: number[];
  manager_names: string[];
}

interface AddPropertyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editData?: PropertyEditData;
}

// Mock API Layer
const mockFetchPropertyManagers = async (): Promise<PropertyManager[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { id: 1, name: "David Harris" },
        { id: 2, name: "Sarah Johnson" },
        { id: 3, name: "Michael Chen" },
        { id: 4, name: "Emily Rodriguez" },
      ]);
    }, 100);
  });
};

const mockSaveProperty = async (payload: any): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log("[API] POST /properties", payload);
      resolve();
    }, 300);
  });
};

const mockUpdateProperty = async (id: number, payload: any): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`[API] PATCH /properties/${id}`, payload);
      resolve();
    }, 300);
  });
};

// Constants
const US_STATES = [
  "AL",
  "AK",
  "AZ",
  "AR",
  "CA",
  "CO",
  "CT",
  "DE",
  "FL",
  "GA",
  "HI",
  "ID",
  "IL",
  "IN",
  "IA",
  "KS",
  "KY",
  "LA",
  "ME",
  "MD",
  "MA",
  "MI",
  "MN",
  "MS",
  "MO",
  "MT",
  "NE",
  "NV",
  "NH",
  "NJ",
  "NM",
  "NY",
  "NC",
  "ND",
  "OH",
  "OK",
  "OR",
  "PA",
  "RI",
  "SC",
  "SD",
  "TN",
  "TX",
  "UT",
  "VT",
  "VA",
  "WA",
  "WV",
  "WI",
  "WY",
];

const PROPERTY_TYPES = [
  { value: "concierge", label: "Concierge" },
  { value: "rental", label: "Rental" },
  { value: "commercial", label: "Commercial" },
  { value: "or", label: "OR" },
  { value: "hoa", label: "HOA" },
];

const COUNTRIES = [
  { value: "united-states", label: "United States" },
  { value: "canada", label: "Canada" },
  { value: "mexico", label: "Mexico" },
];

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

export default function AddPropertyModal({
  open,
  onOpenChange,
  editData,
}: AddPropertyModalProps) {
  // API state
  const [availableManagers, setAvailableManagers] = useState<PropertyManager[]>(
    []
  );
  const [loadingManagers, setLoadingManagers] = useState(false);

  // Form state
  const [country, setCountry] = useState("united-states");
  const [streetAddress, setStreetAddress] = useState("");
  const [unit, setUnit] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("CT");
  const [zipCode, setZipCode] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [selectedManagerIds, setSelectedManagerIds] = useState<number[]>([]);
  const [rentalOwners, setRentalOwners] = useState<string[]>([]);
  const [hourlyRate, setHourlyRate] = useState(0);
  const [emergencyHourlyRate, setEmergencyHourlyRate] = useState(0);
  const [managementFee, setManagementFee] = useState(0);
  const [status, setStatus] = useState("active");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load property managers on component mount
  useEffect(() => {
    const loadManagers = async () => {
      setLoadingManagers(true);
      try {
        const managers = await mockFetchPropertyManagers();
        setAvailableManagers(managers);
      } catch (error) {
        console.error("Failed to load property managers:", error);
      } finally {
        setLoadingManagers(false);
      }
    };

    loadManagers();
  }, []);

  // Reset and populate form when modal opens/closes
  useEffect(() => {
    if (!open) {
      setStreetAddress("");
      setUnit("");
      setCity("");
      setState("CT");
      setZipCode("");
      setPropertyType("");
      setSelectedManagerIds([]);
      setRentalOwners([]);
      setHourlyRate(0);
      setEmergencyHourlyRate(0);
      setManagementFee(0);
      setStatus("active");
      setErrors({});
    } else if (editData) {
      // Populate form from edit data using backend contract
      setStreetAddress(editData.address_line1);
      setUnit(editData.address_line2);
      setCity(editData.city);
      setState(editData.state);
      setZipCode(editData.postal_code);
      setPropertyType(editData.property_type);
      setSelectedManagerIds(editData.manager_ids);
      setStatus(editData.active ? "active" : "inactive");

      // Convert cents to dollars for display
      setHourlyRate(editData.hourly_rate_cents ? editData.hourly_rate_cents / 100 : 0);
      setEmergencyHourlyRate(
        editData.emergency_hourly_rate_cents
          ? editData.emergency_hourly_rate_cents / 100
          : 0
      );
      setManagementFee(
        editData.management_fee_cents ? editData.management_fee_cents / 100 : 0
      );
    }
  }, [open, editData]);

  const handleZipCodeChange = (value: string) => {
    const digits = value.replace(/\D/g, "");
    setZipCode(digits.slice(0, 5));
  };

  const handleSave = async () => {
    const newErrors: Record<string, string> = {};

    if (!streetAddress) {
      newErrors.streetAddress = "Street address is required";
    }
    if (!unit) {
      newErrors.unit = "Unit is required";
    }
    if (!city) {
      newErrors.city = "City is required";
    }
    if (!state) {
      newErrors.state = "State is required";
    }
    if (!zipCode) {
      newErrors.zipCode = "Zip code is required";
    }
    if (!propertyType) {
      newErrors.propertyType = "Property type is required";
    }
    if (selectedManagerIds.length === 0) {
      newErrors.managers = "At least one manager is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Build payload matching backend contract
    const payload = {
      address_line1: streetAddress,
      address_line2: unit,
      city,
      state,
      postal_code: zipCode,
      property_type: propertyType,
      active: status === "active",
      management_fee_cents: managementFee > 0 ? Math.round(managementFee * 100) : null,
      hourly_rate_cents: hourlyRate > 0 ? Math.round(hourlyRate * 100) : null,
      emergency_hourly_rate_cents:
        emergencyHourlyRate > 0
          ? Math.round(emergencyHourlyRate * 100)
          : null,
      manager_ids: selectedManagerIds,
      rental_owners: rentalOwners,
    };

    if (editData) {
      // Edit mode: PATCH request
      await mockUpdateProperty(editData.id, payload);
    } else {
      // Create mode: POST request
      await mockSaveProperty(payload);
    }

    onOpenChange(false);
  };

  // Build manager options from API data
  const managerOptions: MultiSelectOption[] = availableManagers.map((m) => ({
    id: String(m.id),
    label: m.name,
  }));

  // Get selected manager options
  const selectedManagerOptions = managerOptions.filter((m) =>
    selectedManagerIds.includes(Number(m.id))
  );

  return (
    <ModalTemplate
      open={open}
      onOpenChange={onOpenChange}
      title={editData ? "Edit Property" : "Add Property"}
      size="lg"
      footer={
        <ModalButtons
          onCancel={() => onOpenChange(false)}
          onConfirm={handleSave}
          cancelLabel="Cancel"
          confirmLabel={editData ? "Update Property" : "Add Property"}
        />
      }
    >
      <FormLayout>
        {/* Address Section */}
        <FormSection title="Address">
          <SelectField
            label="Country"
            value={country}
            onChange={setCountry}
            placeholder="Select country"
            options={COUNTRIES}
          />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr",
              gap: "12px",
              width: "100%",
            }}
          >
            <TextField
              label="Street Address"
              required
              value={streetAddress}
              onChange={(e) => setStreetAddress(e.target.value)}
              placeholder="Street Address"
              error={errors.streetAddress}
            />
            <TextField
              label="Unit"
              required
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="Unit"
              error={errors.unit}
            />
          </div>

          <FieldRow columns={3}>
            <FieldRowItem>
              <TextField
                label="City"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="City"
                error={errors.city}
              />
            </FieldRowItem>
            <FieldRowItem>
              <SelectField
                label="State"
                required
                value={state}
                onChange={setState}
                placeholder="Select state"
                options={US_STATES.map((s) => ({ value: s, label: s }))}
                error={errors.state}
              />
            </FieldRowItem>
            <FieldRowItem>
              <TextField
                label="Zip Code"
                required
                value={zipCode}
                onChange={(e) => handleZipCodeChange(e.target.value)}
                placeholder="Zip Code"
                maxLength={5}
                error={errors.zipCode}
              />
            </FieldRowItem>
          </FieldRow>
        </FormSection>

        {/* Basics Section */}
        <FormSection title="Basics">
          <FieldRow columns={2}>
            <FieldRowItem>
              <SelectField
                label="Property Type"
                required
                value={propertyType}
                onChange={setPropertyType}
                placeholder="Select Property Type"
                options={PROPERTY_TYPES}
                error={errors.propertyType}
              />
            </FieldRowItem>
            <FieldRowItem>
              <MultiSelectField
                label="Property Manager"
                required
                value={selectedManagerOptions}
                onChange={(newOptions) => {
                  setSelectedManagerIds(newOptions.map((opt) => Number(opt.id)));
                }}
                placeholder="Select managers"
                options={managerOptions}
                disabled={loadingManagers}
                error={errors.managers}
              />
            </FieldRowItem>
          </FieldRow>

          <MultiInputField
            label="Rental Owners"
            value={rentalOwners}
            onChange={setRentalOwners}
            placeholder="No rental owners added"
            addButtonLabel="Add Owner"
            addPlaceholder="Enter owner name"
          />
        </FormSection>

        {/* Rates Section */}
        <FormSection title="Rates">
          <FieldRow columns={2}>
            <FieldRowItem>
              <CurrencyField
                label="Hourly Rate for Field Team"
                value={hourlyRate}
                onChange={setHourlyRate}
                placeholder="0.00"
              />
            </FieldRowItem>
            <FieldRowItem>
              <CurrencyField
                label="Emergency Hourly Rate for Field Team"
                value={emergencyHourlyRate}
                onChange={setEmergencyHourlyRate}
                placeholder="0.00"
              />
            </FieldRowItem>
          </FieldRow>

          <FieldRow columns={2}>
            <FieldRowItem>
              <CurrencyField
                label="Management Fee"
                value={managementFee}
                onChange={setManagementFee}
                placeholder="0.00"
              />
            </FieldRowItem>
            <FieldRowItem>
              <SelectField
                label="Status"
                required
                value={status}
                onChange={setStatus}
                placeholder="Select status"
                options={STATUS_OPTIONS}
              />
            </FieldRowItem>
          </FieldRow>
        </FormSection>
      </FormLayout>
    </ModalTemplate>
  );
}
