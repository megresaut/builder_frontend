import { useState, useEffect } from "react";
import { ModalTemplate, ModalSubheader } from "@/components/ui/ModalTemplate";
import {
  TextField,
  SelectField,
  CurrencyField,
  FieldRow,
  FieldRowItem,
} from "@/components/forms";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

interface Manager {
  id: string | number;
  name: string;
  initials: string;
}

interface AddPropertyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editData?: {
    address: string;
    location: string;
    type: string;
    buildingId: string;
    status: "active" | "inactive";
    managers: Manager[];
    rentalOwner?: string;
  };
}

const AVAILABLE_MANAGERS: Manager[] = [
  { id: "1", name: "David Harris", initials: "DH" },
  { id: "2", name: "Sarah Johnson", initials: "SJ" },
  { id: "3", name: "Michael Chen", initials: "MC" },
  { id: "4", name: "Emily Rodriguez", initials: "ER" },
];

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI", "ID",
  "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS",
  "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK",
  "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV",
  "WI", "WY",
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
  const [country, setCountry] = useState("united-states");
  const [streetAddress, setStreetAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("CT");
  const [zipCode, setZipCode] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [selectedManagers, setSelectedManagers] = useState<Manager[]>([]);
  const [rentalOwner, setRentalOwner] = useState("");
  const [hourlyRate, setHourlyRate] = useState(0);
  const [emergencyHourlyRate, setEmergencyHourlyRate] = useState(0);
  const [managementFee, setManagementFee] = useState(0);
  const [status, setStatus] = useState("active");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when modal closes/opens
  useEffect(() => {
    if (!open) {
      setStreetAddress("");
      setCity("");
      setState("CT");
      setZipCode("");
      setPropertyType("");
      setSelectedManagers([]);
      setRentalOwner("");
      setHourlyRate(0);
      setEmergencyHourlyRate(0);
      setManagementFee(0);
      setStatus("active");
      setErrors({});
    } else if (editData) {
      // Populate form with edit data
      setStreetAddress(editData.address.split(",")[0]);
      const locationParts = editData.location.split(",").map((p) => p.trim());
      if (locationParts.length >= 1) setCity(locationParts[0]);
      if (locationParts.length >= 2) setState(locationParts[1]);
      setPropertyType(editData.type.toLowerCase());
      setSelectedManagers(editData.managers);
      setStatus(editData.status);
      setRentalOwner(editData.rentalOwner || "");
    }
  }, [open, editData]);

  const handleZipCodeChange = (value: string) => {
    const digits = value.replace(/\D/g, "");
    setZipCode(digits.slice(0, 5));
  };

  const toggleManager = (manager: Manager) => {
    setSelectedManagers((prev) => {
      const isSelected = prev.some((m) => String(m.id) === String(manager.id));
      return isSelected
        ? prev.filter((m) => String(m.id) !== String(manager.id))
        : [...prev, manager];
    });
  };

  const handleSave = () => {
    const newErrors: Record<string, string> = {};

    if (!propertyType) {
      newErrors.propertyType = "Property type is required";
    }
    if (selectedManagers.length === 0) {
      newErrors.managers = "At least one manager is required";
    }
    if (managementFee === 0) {
      newErrors.managementFee = "Management fee is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // TODO: Save property data
    console.log({
      country,
      streetAddress,
      city,
      state,
      zipCode,
      propertyType,
      selectedManagers,
      rentalOwner,
      hourlyRate,
      emergencyHourlyRate,
      managementFee,
      status,
    });

    onOpenChange(false);
  };

  return (
    <ModalTemplate
      open={open}
      onOpenChange={onOpenChange}
      title={editData ? "Edit Property" : "Add Property"}
      size="lg"
      showDivider={true}
      footer={
        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {editData ? "Update Property" : "Add Property"}
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Address Section */}
        <div className="space-y-4">
          <ModalSubheader>Address</ModalSubheader>

          <SelectField
            label="Country"
            value={country}
            onChange={setCountry}
            placeholder="Select country"
            options={COUNTRIES}
          />

          <TextField
            label="Street Address"
            value={streetAddress}
            onChange={(e) => setStreetAddress(e.target.value)}
            placeholder="Street Address"
          />

          <FieldRow columns={3}>
            <FieldRowItem>
              <TextField
                label="City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="City"
              />
            </FieldRowItem>
            <FieldRowItem>
              <SelectField
                label="State"
                value={state}
                onChange={setState}
                placeholder="Select state"
                options={US_STATES.map((s) => ({ value: s, label: s }))}
              />
            </FieldRowItem>
            <FieldRowItem>
              <TextField
                label="Zip Code"
                value={zipCode}
                onChange={(e) => handleZipCodeChange(e.target.value)}
                placeholder="Zip Code"
                maxLength={5}
              />
            </FieldRowItem>
          </FieldRow>
        </div>

        {/* Basics Section */}
        <div className="space-y-4">
          <ModalSubheader>Basics</ModalSubheader>

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
              <div>
                <label className="text-sm font-medium text-[#303030] block mb-2">
                  Property Manager <span className="text-red-600">*</span>
                </label>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {selectedManagers.map((manager) => (
                      <div
                        key={manager.id}
                        className="flex items-center gap-2 bg-white rounded-full border border-[#2463EB] px-3 py-1.5"
                      >
                        <div className="w-5 h-5 rounded-full bg-[#2463EB] flex items-center justify-center">
                          <span className="text-white font-semibold text-[9px]">
                            {manager.initials}
                          </span>
                        </div>
                        <span className="text-sm text-[#303030]">
                          {manager.name}
                        </span>
                        <button
                          onClick={() => toggleManager(manager)}
                          className="text-[#2463EB] hover:opacity-70 ml-1"
                          type="button"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {AVAILABLE_MANAGERS.map((manager) => {
                      const isSelected = selectedManagers.some(
                        (m) => String(m.id) === String(manager.id)
                      );
                      return (
                        <button
                          key={manager.id}
                          onClick={() => toggleManager(manager)}
                          className="w-full flex items-center justify-between gap-2 px-3 py-2 hover:bg-gray-100 rounded transition-colors text-left"
                          type="button"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-[#2463EB] flex items-center justify-center">
                              <span className="text-white font-semibold text-[10px]">
                                {manager.initials}
                              </span>
                            </div>
                            <span className="text-sm text-[#303030]">
                              {manager.name}
                            </span>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-[#2463EB]" />}
                        </button>
                      );
                    })}
                  </div>
                  {errors.managers && (
                    <p className="text-sm text-red-600">{errors.managers}</p>
                  )}
                </div>
              </div>
            </FieldRowItem>
          </FieldRow>

          <TextField
            label="Rental Owner"
            value={rentalOwner}
            onChange={(e) => setRentalOwner(e.target.value)}
            placeholder="Rental Owner"
          />
        </div>

        {/* Rates Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-[#71717A]">Rates</h3>

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
                required
                value={managementFee}
                onChange={setManagementFee}
                placeholder="0.00"
                error={errors.managementFee}
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
        </div>
      </div>
    </ModalTemplate>
  );
}
