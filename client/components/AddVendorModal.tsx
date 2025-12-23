import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ModalTemplate,
  ModalButtons,
  ModalField,
  FieldRow,
  FieldRowItem,
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

  useEffect(() => {
    if (open) {
      setVendorName("");
      setEmail("");
      setPhone("");
      setServicesProvided([]);
      setNotes("");
      setErrors({});
      setShowServicesList(false);
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
      <FieldRow columns={2}>
        <FieldRowItem>
          <ModalField label="Vendor Name" spacing="tight">
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
                width: "100%",
                boxSizing: "border-box",
              }}
            />
            {errors.vendorName && (
              <div style={{ color: "rgba(220, 38, 38, 1)", fontSize: "12px", marginTop: "4px" }}>
                Vendor Name is required
              </div>
            )}
          </ModalField>
        </FieldRowItem>
        <FieldRowItem>
          <ModalField label="Primary Email" spacing="tight">
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
                width: "100%",
                boxSizing: "border-box",
              }}
            />
          </ModalField>
        </FieldRowItem>
      </FieldRow>

      <ModalField label="Vendor Phone Number" spacing="tight">
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
            width: "100%",
            boxSizing: "border-box",
          }}
        />
      </ModalField>

      <ModalField label="Services Provided" spacing="tight">
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
              boxSizing: "border-box",
            }}
          >
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center", flex: 1 }}>
              {servicesProvided.length > 0 ? (
                servicesProvided.map((service) => (
                  <span
                    key={service}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      paddingLeft: "10px",
                      paddingRight: "10px",
                      paddingTop: "4px",
                      paddingBottom: "4px",
                      borderRadius: "16px",
                      fontSize: "12px",
                      fontWeight: 500,
                      backgroundColor: "rgba(219, 234, 254, 1)",
                      color: "rgba(30, 58, 138, 1)",
                    }}
                  >
                    {service}
                  </span>
                ))
              ) : (
                <span style={{ color: "rgba(209, 213, 219, 1)", fontSize: "16px", fontWeight: 400 }}>
                  Select Services Provided
                </span>
              )}
            </div>
            <svg
              style={{ width: "16px", height: "16px", color: "rgba(156, 163, 175, 1)", flexShrink: 0 }}
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
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                marginTop: "8px",
                backgroundColor: "rgba(255, 255, 255, 1)",
                borderColor: "rgba(229, 229, 229, 1)",
                borderStyle: "solid",
                borderWidth: "1px",
                borderRadius: "8px",
                boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.08)",
                zIndex: 50,
                padding: "12px",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "8px",
                  maxHeight: "256px",
                  overflowY: "auto",
                }}
              >
                {availableServices.map((service) => (
                  <button
                    key={service}
                    type="button"
                    onClick={() => toggleService(service)}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "8px",
                      fontSize: "14px",
                      fontWeight: 500,
                      transition: "background-color 0.2s",
                      textAlign: "left",
                      border: "1px solid",
                      borderColor: servicesProvided.includes(service)
                        ? "rgba(37, 99, 235, 1)"
                        : "rgba(229, 229, 229, 1)",
                      backgroundColor: servicesProvided.includes(service)
                        ? "rgba(219, 234, 254, 1)"
                        : "rgba(255, 255, 255, 1)",
                      color: servicesProvided.includes(service)
                        ? "rgba(30, 58, 138, 1)"
                        : "rgba(48, 48, 48, 1)",
                      cursor: "pointer",
                      fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                    }}
                  >
                    {service}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </ModalField>

      <ModalField label="Notes">
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
            width: "100%",
            boxSizing: "border-box",
          }}
        />
      </ModalField>
    </ModalTemplate>
  );
}
