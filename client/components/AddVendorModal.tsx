import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ModalTemplate,
  ModalButtons,
} from "@/components/ui/ModalTemplate";

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
  const [showServicesList, setShowServicesList] = useState(false);
  const servicesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        servicesRef.current &&
        !servicesRef.current.contains(event.target as Node)
      ) {
        setShowServicesList(false);
      }
    };

    if (showServicesList) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showServicesList]);

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
      setShowServicesList(false);
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
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 min-w-[240px] flex flex-col">
          <label
            style={{
              fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
              fontSize: "14px",
              color: "rgba(48, 48, 48, 1)",
              fontWeight: 500,
              lineHeight: 1.43,
              marginBottom: "8px",
            }}
          >
            Vendor Name
          </label>
          <Input
            value={vendorName}
            onChange={handleVendorNameChange}
            placeholder="Input Vendor Name"
            style={{
              borderRadius: "8px",
              backgroundColor: "rgba(255, 255, 255, 1)",
              borderColor: errors.vendorName ? "rgba(220, 38, 38, 1)" : "rgba(229, 229, 229, 1)",
              borderStyle: "solid",
              borderWidth: errors.vendorName ? "2px" : "1px",
              padding: "8px 12px",
              fontSize: "16px",
              fontWeight: 400,
              letterSpacing: "-0.32px",
              lineHeight: 1.4,
              fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
            }}
          />
          {errors.vendorName && (
            <div style={{ color: "rgba(220, 38, 38, 1)", fontSize: "12px", marginTop: "4px" }}>
              Vendor Name is required
            </div>
          )}
        </div>
        <div className="flex-1 min-w-[240px] flex flex-col">
          <label
            style={{
              fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
              fontSize: "14px",
              color: "rgba(48, 48, 48, 1)",
              fontWeight: 500,
              lineHeight: 1.43,
              marginBottom: "8px",
            }}
          >
            Primary Email
          </label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Input Vendor Email"
            style={{
              borderRadius: "8px",
              backgroundColor: "rgba(255, 255, 255, 1)",
              borderColor: "rgba(229, 229, 229, 1)",
              borderStyle: "solid",
              borderWidth: "1px",
              padding: "8px 12px",
              fontSize: "16px",
              fontWeight: 400,
              letterSpacing: "-0.32px",
              lineHeight: 1.4,
              fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
            }}
          />
        </div>
      </div>

      <div className="flex flex-col">
        <label
          style={{
            fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
            fontSize: "14px",
            color: "rgba(48, 48, 48, 1)",
            fontWeight: 500,
            lineHeight: 1.43,
            marginBottom: "8px",
          }}
        >
          Vendor Phone Number
        </label>
        <Input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Input Vendor Phone"
          style={{
            borderRadius: "8px",
            backgroundColor: "rgba(255, 255, 255, 1)",
            borderColor: "rgba(229, 229, 229, 1)",
            borderStyle: "solid",
            borderWidth: "1px",
            padding: "8px 12px",
            fontSize: "16px",
            fontWeight: 400,
            letterSpacing: "-0.32px",
            lineHeight: 1.4,
            fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
          }}
        />
      </div>

      <div className="flex flex-col" style={{ marginBottom: "12px" }}>
        <label
          style={{
            fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
            fontSize: "14px",
            color: "rgba(48, 48, 48, 1)",
            fontWeight: 500,
            lineHeight: 1.43,
            marginBottom: "8px",
          }}
        >
          Services Provided
        </label>
        <div className="relative" ref={servicesRef}>
          <button
            type="button"
            onClick={() => setShowServicesList(!showServicesList)}
            style={{
              width: "100%",
              borderRadius: "8px",
              backgroundColor: "rgba(255, 255, 255, 1)",
              borderColor: "rgba(229, 229, 229, 1)",
              borderStyle: "solid",
              borderWidth: "1px",
              padding: "8px 12px",
              fontSize: "16px",
              fontWeight: 400,
              letterSpacing: "-0.32px",
              lineHeight: 1.4,
              fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
              textAlign: "left",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
            }}
          >
            <div className="flex flex-wrap gap-2 items-center flex-1">
              {servicesProvided.length > 0 ? (
                servicesProvided.map((service) => (
                  <span
                    key={service}
                    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {service}
                  </span>
                ))
              ) : (
                <span className="text-[#A1A1A9]">
                  Select Services Provided
                </span>
              )}
            </div>
            <svg
              className="w-4 h-4 text-gray-400 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </button>

          {showServicesList && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#E5E5E5] rounded-lg shadow-lg z-50 p-3">
              <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                {availableServices.map((service) => (
                  <button
                    key={service}
                    type="button"
                    onClick={() => toggleService(service)}
                    className={`p-2 rounded-lg text-sm font-medium transition-colors text-left ${
                      servicesProvided.includes(service)
                        ? "bg-blue-100 text-blue-800 border border-blue-300"
                        : "bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    {service}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col">
        <label
          style={{
            fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
            fontSize: "14px",
            color: "rgba(48, 48, 48, 1)",
            fontWeight: 500,
            lineHeight: 1.43,
            marginBottom: "8px",
          }}
        >
          Notes
        </label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Insert Vendor Notes"
          style={{
            borderRadius: "8px",
            backgroundColor: "rgba(255, 255, 255, 1)",
            borderColor: "rgba(229, 229, 229, 1)",
            borderStyle: "solid",
            borderWidth: "1px",
            padding: "8px 12px",
            fontSize: "16px",
            fontWeight: 400,
            letterSpacing: "-0.32px",
            lineHeight: 1.4,
            fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
            minHeight: "169px",
            resize: "none",
          }}
        />
      </div>
    </ModalTemplate>
  );
}
