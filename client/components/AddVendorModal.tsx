import { useState, useEffect, useMemo } from "react";
import {
  ModalTemplate,
  ModalButtons,
  ModalField,
} from "@/components/ui/ModalTemplate";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dropdown } from "@/components/ui/dropdown";
import { Check, ChevronDown, X, Search } from "lucide-react";

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
  const [serviceSearchQuery, setServiceSearchQuery] = useState("");

  useEffect(() => {
    if (open) {
      setVendorName("");
      setEmail("");
      setPhone("");
      setServicesProvided([]);
      setNotes("");
      setErrors({});
      setShowServicesList(false);
      setServiceSearchQuery("");
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
        : [...prev, service]
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
      <ModalField label="Vendor Name" spacing="tight" error={errors.vendorName ? "Vendor Name is required" : undefined}>
        <Input
          type="text"
          value={vendorName}
          onChange={handleVendorNameChange}
          placeholder="Vendor Name"
          aria-invalid={errors.vendorName}
        />
      </ModalField>

      <ModalField label="Primary Email" spacing="tight">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="vendor@example.com"
        />
      </ModalField>

      <ModalField label="Vendor Phone Number" spacing="tight">
        <Input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="(123) 456-7890"
        />
      </ModalField>

      <ModalField label="Services Provided" spacing="tight">
        <Dropdown
          open={showServicesList}
          onOpenChange={setShowServicesList}
          initialPlacement="bottom"
          minSpaceBelow={340}
          offset={8}
          syncTriggerWidth={true}
        >
          <Dropdown.Trigger
            id="services-provided"
            style={{
              borderColor: "var(--color-border-light)",
              borderWidth: "1px",
              minHeight: "44px",
              height: "auto",
              borderRadius: "8px",
              backgroundColor: "white",
              padding: "8px 12px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              flexWrap: "wrap",
              width: "100%",
              cursor: "pointer",
              fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
              fontSize: "16px",
              border: "solid",
              justifyContent: "space-between",
            }}
          >
            <div className="flex items-center gap-1.5 flex-wrap flex-1">
              {servicesProvided.length === 0 ? (
                <span style={{ color: "var(--color-text-placeholder)", fontSize: "14px" }}>
                  Select services...
                </span>
              ) : (
                servicesProvided.map((service) => (
                  <div
                    key={service}
                    className="flex items-center gap-1 bg-white rounded-full border border-blue-600 px-2 py-0.5 whitespace-nowrap"
                  >
                    <span style={{ fontSize: "12px", color: "var(--color-text-primary)" }}>
                      {service}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleService(service);
                      }}
                      className="hover:opacity-70 transition-opacity"
                      tabIndex={-1}
                    >
                      <X className="w-3 h-3 text-blue-600" />
                    </button>
                  </div>
                ))
              )}
            </div>
            <ChevronDown className="h-4 w-4 flex-shrink-0" style={{ color: "#303030" }} />
          </Dropdown.Trigger>

          <Dropdown.Content
            closeOnOutsideClick={true}
            closeOnEscape={true}
            style={{
              backgroundColor: "white",
              border: "1px solid var(--color-border-light)",
              borderRadius: "8px",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              zIndex: 50,
              padding: "8px 0",
            }}
          >
            {useMemo(() => {
              const filtered = availableServices.filter((service) =>
                service.toLowerCase().includes(serviceSearchQuery.toLowerCase())
              );

              return (
                <div style={{ maxHeight: "340px", overflowY: "auto", display: "flex", flexDirection: "column" }}>
                  <div style={{ padding: "8px 8px", flexShrink: 0 }}>
                    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                      <Search className="w-4 h-4" style={{ position: "absolute", left: "8px", color: "#A1A1A9" }} />
                      <input
                        type="text"
                        placeholder="Search services..."
                        value={serviceSearchQuery}
                        onChange={(e) => setServiceSearchQuery(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                        style={{
                          width: "100%",
                          borderRadius: "6px",
                          border: "1px solid var(--color-border-light)",
                          padding: "6px 8px 6px 28px",
                          fontSize: "13px",
                          fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                          outline: "none",
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ overflowY: "auto", flex: 1 }}>
                    {filtered.length === 0 ? (
                      <div
                        style={{
                          padding: "12px",
                          color: "var(--color-text-muted)",
                          fontSize: "13px",
                          textAlign: "center",
                        }}
                      >
                        No services found
                      </div>
                    ) : (
                      filtered.map((service) => {
                        const isSelected = servicesProvided.includes(service);
                        return (
                          <button
                            key={service}
                            onClick={() => toggleService(service)}
                            style={{
                              width: "100%",
                              padding: "8px 12px",
                              textAlign: "left",
                              backgroundColor: isSelected ? "rgba(36, 99, 235, 0.1)" : "transparent",
                              color: "var(--color-text-primary)",
                              border: "none",
                              cursor: "pointer",
                              fontSize: "13px",
                              fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              transition: "background-color 0.15s",
                            }}
                            onMouseEnter={(e) => {
                              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(36, 99, 235, 0.08)";
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLButtonElement).style.backgroundColor = isSelected
                                ? "rgba(36, 99, 235, 0.1)"
                                : "transparent";
                            }}
                          >
                            {isSelected ? (
                              <Check className="h-4 w-4 text-blue-600" />
                            ) : (
                              <div className="h-4 w-4" />
                            )}
                            <span>{service}</span>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            }, [serviceSearchQuery, servicesProvided])}
          </Dropdown.Content>
        </Dropdown>
      </ModalField>

      <ModalField label="Notes">
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Insert Vendor Notes"
          autoGrow
        />
      </ModalField>
    </ModalTemplate>
  );
}
