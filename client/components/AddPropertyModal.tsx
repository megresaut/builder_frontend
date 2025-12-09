import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  };
}

const AVAILABLE_MANAGERS: Manager[] = [
  { id: "1", name: "David Harris", initials: "DH" },
  { id: "2", name: "Sarah Johnson", initials: "SJ" },
  { id: "3", name: "Michael Chen", initials: "MC" },
  { id: "4", name: "Emily Rodriguez", initials: "ER" },
];

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

export default function AddPropertyModal({
  open,
  onOpenChange,
  editData,
}: AddPropertyModalProps) {
  const [country, setCountry] = useState("United States");
  const [streetAddress, setStreetAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("CT");
  const [zipCode, setZipCode] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [selectedManagers, setSelectedManagers] = useState<Manager[]>([]);
  const [hourlyRate, setHourlyRate] = useState("");
  const [emergencyHourlyRate, setEmergencyHourlyRate] = useState("");
  const [managementFee, setManagementFee] = useState("");
  const [status, setStatus] = useState<"Active" | "Inactive">("Active");
  const [showManagerDropdown, setShowManagerDropdown] = useState(false);
  const managerButtonRef = useRef<HTMLButtonElement>(null);
  const [managerDropdownPos, setManagerDropdownPos] = useState({
    top: 0,
    left: 0,
  });

  useEffect(() => {
    if (editData) {
      setStreetAddress(editData.address.split(",")[0]);
      const locationParts = editData.location
        .split(",")
        .map((part) => part.trim());
      if (locationParts.length >= 1) {
        setCity(locationParts[0]);
      }
      if (locationParts.length >= 2) {
        setState(locationParts[1]);
      }
      setPropertyType(editData.type);
      setSelectedManagers(editData.managers);
      setStatus(editData.status === "active" ? "Active" : "Inactive");
    }
  }, [editData]);

  useEffect(() => {
    let animationFrameId: number;

    const updateManagerDropdownPos = () => {
      if (showManagerDropdown && managerButtonRef.current) {
        const rect = managerButtonRef.current.getBoundingClientRect();
        setManagerDropdownPos({
          top: rect.bottom + 8,
          left: rect.left,
        });
      }

      if (showManagerDropdown) {
        animationFrameId = requestAnimationFrame(updateManagerDropdownPos);
      }
    };

    if (showManagerDropdown) {
      updateManagerDropdownPos();
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [showManagerDropdown]);

  const handleZipCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    setZipCode(value.slice(0, 5));
  };

  const formatDollarValue = (value: string): string => {
    const numericValue = value.replace(/[^\d.]/g, "");
    const parts = numericValue.split(".");
    if (parts.length > 2) {
      return parts[0] + "." + parts.slice(1).join("");
    }
    if (parts[1] && parts[1].length > 2) {
      return parts[0] + "." + parts[1].slice(0, 2);
    }
    return numericValue;
  };

  const handleDollarInput = (
    value: string,
    setter: React.Dispatch<React.SetStateAction<string>>,
  ) => {
    const formatted = formatDollarValue(value);
    setter(formatted);
  };

  const toggleManager = (manager: Manager) => {
    setSelectedManagers((prev) => {
      const isSelected = prev.some((m) => String(m.id) === String(manager.id));
      if (isSelected) {
        return prev.filter((m) => String(m.id) !== String(manager.id));
      } else {
        return [...prev, manager];
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[694px] p-8 gap-0">
        <DialogTitle className="text-[#303030] font-semibold text-2xl leading-[30px] mb-4">
          {editData ? "Edit Property" : "Add Property"}
        </DialogTitle>

        <div className="flex flex-col gap-4">
          {/* Address Section */}
          <div className="text-[#71717A] font-medium text-base leading-4">
            Address
          </div>

          {/* Country */}
          <div className="flex flex-col gap-0">
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger className="h-[38px] rounded-lg border-[#E5E5E5] bg-[#F7F7F7] text-base font-normal tracking-[-0.32px] leading-[140%]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="United States">United States</SelectItem>
                <SelectItem value="Canada">Canada</SelectItem>
                <SelectItem value="Mexico">Mexico</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Street Address */}
          <div className="flex flex-col gap-0">
            <Input
              value={streetAddress}
              onChange={(e) => setStreetAddress(e.target.value)}
              placeholder="Street Address"
              className="h-[38px] rounded-lg border-[#E5E5E5] bg-[#F7F7F7] placeholder:text-[#A1A1A9] text-base font-normal tracking-[-0.32px] leading-[140%]"
            />
          </div>

          {/* City, State, Zip Code Row */}
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[180px]">
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="City"
                className="h-[38px] rounded-lg border-[#E5E5E5] bg-[#F7F7F7] placeholder:text-[#A1A1A9] text-base font-normal tracking-[-0.32px] leading-[140%]"
              />
            </div>
            <div className="flex-1 min-w-[180px]">
              <Select value={state} onValueChange={setState}>
                <SelectTrigger className="h-[38px] rounded-lg border-[#E5E5E5] bg-[#F7F7F7] text-base font-normal tracking-[-0.32px] leading-[140%]">
                  <SelectValue placeholder="State" />
                </SelectTrigger>
                <SelectContent>
                  {US_STATES.map((stateCode) => (
                    <SelectItem key={stateCode} value={stateCode}>
                      {stateCode}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[180px]">
              <Input
                value={zipCode}
                onChange={handleZipCodeChange}
                placeholder="Zip Code"
                maxLength={5}
                className="h-[38px] rounded-lg border-[#E5E5E5] bg-[#F7F7F7] placeholder:text-[#A1A1A9] text-base font-normal tracking-[-0.32px] leading-[140%]"
              />
            </div>
          </div>

          {/* Basics Section */}
          <div className="text-[#71717A] font-medium text-base leading-4 mt-0">
            Basics
          </div>

          {/* Property Type and Property Manager Row */}
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[240px] flex flex-col gap-2">
              <label className="text-[#303030] font-medium text-sm leading-[20px]">
                Property Type <span className="text-red-600">*</span>
              </label>
              <Select value={propertyType} onValueChange={setPropertyType}>
                <SelectTrigger className="h-[38px] rounded-lg border-[#E5E5E5] bg-[#F7F7F7]">
                  <SelectValue
                    placeholder="Select Property Type"
                    className="text-[#A1A1A9] text-base font-normal tracking-[-0.32px] leading-[140%]"
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Concierge">Concierge</SelectItem>
                  <SelectItem value="Rental">Rental</SelectItem>
                  <SelectItem value="Commercial">Commercial</SelectItem>
                  <SelectItem value="OR">OR</SelectItem>
                  <SelectItem value="HOA">HOA</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[240px] flex flex-col gap-2">
              <label className="text-[#303030] font-medium text-sm leading-[20px]">
                Property Manager <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <button
                  ref={managerButtonRef}
                  onClick={() => setShowManagerDropdown(!showManagerDropdown)}
                  type="button"
                  className="h-[38px] rounded-lg border border-[#E5E5E5] bg-[#F7F7F7] w-full flex items-center gap-2 px-3 py-2"
                >
                  <div className="flex items-center gap-2 flex-1">
                    {selectedManagers.length === 0 ? (
                      <span className="text-[#A1A1A9] text-base font-normal tracking-[-0.32px] leading-[140%]">
                        Select Manager
                      </span>
                    ) : (
                      selectedManagers.map((manager) => (
                        <div
                          key={manager.id}
                          className="w-[22px] h-[22px] rounded-full bg-white border border-[#2463EB] flex items-center justify-center"
                        >
                          <span className="text-[#2463EB] font-semibold text-[9px] leading-4">
                            {manager.initials}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                  <img
                    loading="lazy"
                    src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/58b391a68a67fb22d1a988b1710aaec5fa5d28ec?placeholderIfAbsent=true"
                    className="w-4 h-4"
                    alt=""
                  />
                </button>

                {showManagerDropdown &&
                  createPortal(
                    <div
                      className="bg-white flex flex-col p-2 gap-1"
                      style={{
                        width: "280px",
                        border: "0.5px solid #DADADA",
                        borderRadius: "8px",
                        boxShadow:
                          "0 38px 11px 0 rgba(0, 0, 0, 0.00), 0 24px 10px 0 rgba(0, 0, 0, 0.01), 0 14px 8px 0 rgba(0, 0, 0, 0.04), 0 6px 6px 0 rgba(0, 0, 0, 0.06), 0 2px 3px 0 rgba(0, 0, 0, 0.07)",
                        zIndex: 99999,
                        position: "fixed",
                        top: managerDropdownPos.top + "px",
                        left: managerDropdownPos.left + "px",
                        pointerEvents: "auto",
                      }}
                      onMouseLeave={() => setShowManagerDropdown(false)}
                    >
                      {AVAILABLE_MANAGERS.map((manager) => {
                        const isSelected = selectedManagers.some(
                          (m) => String(m.id) === String(manager.id),
                        );
                        return (
                          <button
                            key={manager.id}
                            onClick={() => toggleManager(manager)}
                            type="button"
                            className="w-full flex items-center justify-between gap-2 px-3 py-2 hover:bg-gray-50 rounded transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-[#2463EB] flex items-center justify-center">
                                <span className="text-white font-semibold text-[10px]">
                                  {manager.initials}
                                </span>
                              </div>
                              <span className="text-[#303030] font-normal text-sm">
                                {manager.name}
                              </span>
                            </div>
                            {isSelected && (
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 16 16"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M13.5 3L6 10.5L2.5 7"
                                  stroke="#2463EB"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            )}
                          </button>
                        );
                      })}
                    </div>,
                    document.body,
                  )}
              </div>
            </div>
          </div>

          {/* Hourly Rates Row */}
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[240px] flex flex-col gap-2">
              <label className="text-[#303030] font-medium text-sm leading-[20px]">
                Hourly Rate for Field Team
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A1A1A9] text-base">
                  $
                </span>
                <Input
                  value={hourlyRate}
                  onChange={(e) =>
                    handleDollarInput(e.target.value, setHourlyRate)
                  }
                  placeholder="Insert Hourly Rate"
                  className="h-[38px] rounded-lg border-[#E5E5E5] bg-[#F7F7F7] placeholder:text-[#A1A1A9] text-base font-normal tracking-[-0.32px] leading-[140%] pl-7"
                />
              </div>
            </div>

            <div className="flex-1 min-w-[240px] flex flex-col gap-2">
              <label className="text-[#303030] font-medium text-sm leading-[20px]">
                Emergency Hourly Rate for Field Team
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A1A1A9] text-base">
                  $
                </span>
                <Input
                  value={emergencyHourlyRate}
                  onChange={(e) =>
                    handleDollarInput(e.target.value, setEmergencyHourlyRate)
                  }
                  placeholder="Insert Emergency Hourly Rate"
                  className="h-[38px] rounded-lg border-[#E5E5E5] bg-[#F7F7F7] placeholder:text-[#A1A1A9] text-base font-normal tracking-[-0.32px] leading-[140%] pl-7"
                />
              </div>
            </div>
          </div>

          {/* Management Fee and Status Row */}
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[240px] flex flex-col gap-2">
              <label className="text-[#303030] font-medium text-sm leading-[20px]">
                Management Fee <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A1A1A9] text-base">
                  $
                </span>
                <Input
                  value={managementFee}
                  onChange={(e) =>
                    handleDollarInput(e.target.value, setManagementFee)
                  }
                  placeholder="Insert Management Fee"
                  className="h-[38px] rounded-lg border-[#E5E5E5] bg-[#F7F7F7] placeholder:text-[#A1A1A9] text-base font-normal tracking-[-0.32px] leading-[140%] pl-7"
                />
              </div>
            </div>

            <div className="flex-1 min-w-[240px] flex flex-col gap-2">
              <label className="text-[#303030] font-medium text-sm leading-[20px]">
                Status <span className="text-red-600">*</span>
              </label>
              <Select
                value={status}
                onValueChange={(value: "Active" | "Inactive") =>
                  setStatus(value)
                }
              >
                <SelectTrigger className="h-[38px] rounded-lg border-[#E5E5E5] bg-[#F7F7F7]">
                  <div
                    className="flex items-center gap-1.5 px-3 py-1 rounded-2xl"
                    style={{
                      backgroundColor:
                        status === "Active" ? "#d1fae5" : "#fed7aa",
                    }}
                  >
                    <span
                      className="text-sm font-normal tracking-[-0.28px] leading-[140%]"
                      style={{
                        color: status === "Active" ? "#059669" : "#d97706",
                      }}
                    >
                      {status}
                    </span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Add/Update Property Button */}
          <button className="flex h-9 w-full items-center justify-center gap-2 px-4 rounded-lg bg-[#013764] shadow-[0_0_0_1px_#002D5A] hover:bg-[#003a73] transition-colors mt-2">
            <span className="text-white font-medium text-base">
              {editData ? "Update Property" : "Add Property"}
            </span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
