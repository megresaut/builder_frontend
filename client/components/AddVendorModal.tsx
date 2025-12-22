import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ModalTemplate,
  ModalField,
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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Modal size="lg" hideCloseButton>
        <DialogTitle className="sr-only">Add Vendor</DialogTitle>
        <div className="ra-modal-header-wrapper">
          <div className="ra-modal-header">
            <div>Add Vendor</div>
            <img
              loading="lazy"
              src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/2a270b52419cae9104b1782181d0a66d1f416309?placeholderIfAbsent=true"
              className="ra-modal-close-btn"
              onClick={() => onOpenChange(false)}
              alt="Close"
            />
          </div>
          <img
            loading="lazy"
            src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/249a395a76423ecabf7f10a2086df5d9cd674ac7?placeholderIfAbsent=true"
            className="ra-modal-divider"
            alt=""
          />
        </div>

        <div className="flex flex-col gap-4 flex-1">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex flex-col gap-2 flex-1 min-w-[240px]">
              <label className="text-[#303030] font-medium text-sm leading-[20px]">
                Vendor Name <span className="text-red-600">*</span>
              </label>
              <Input
                value={vendorName}
                onChange={(e) => {
                  setVendorName(e.target.value);
                  if (errors.vendorName && e.target.value.trim()) {
                    setErrors((prev) => ({ ...prev, vendorName: false }));
                  }
                }}
                placeholder="Input Vendor Name"
                className={`h-10 rounded-lg bg-[#F7F7F7] placeholder:text-[#A1A1A9] text-base font-normal tracking-[-0.32px] leading-[140%] ${
                  errors.vendorName
                    ? "border-red-500 border-2"
                    : "border-[#E5E5E5]"
                }`}
              />
            </div>
            <div className="flex flex-col gap-2 flex-1 min-w-[240px]">
              <label className="text-[#303030] font-medium text-sm leading-[20px]">
                Primary Email
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Input Vendor Email"
                className="h-10 rounded-lg border-[#E5E5E5] bg-[#F7F7F7] placeholder:text-[#A1A1A9] text-base font-normal tracking-[-0.32px] leading-[140%]"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[#303030] font-medium text-sm leading-[20px]">
              Vendor Phone Number
            </label>
            <Input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Input Vendor Phone"
              className="h-10 rounded-lg border-[#E5E5E5] bg-[#F7F7F7] placeholder:text-[#A1A1A9] text-base font-normal tracking-[-0.32px] leading-[140%]"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[#303030] font-medium text-sm leading-[20px]">
              Services Provided
            </label>
            <div className="relative" ref={servicesRef}>
              <button
                type="button"
                onClick={() => setShowServicesList(!showServicesList)}
                className="w-full h-10 rounded-lg border border-[#E5E5E5] bg-[#F7F7F7] text-base font-normal tracking-[-0.32px] leading-[140%] px-3 py-2 text-left flex items-center justify-between hover:bg-gray-100 transition-colors"
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

          <div className="flex flex-col gap-2">
            <label className="text-[#303030] font-medium text-sm leading-[20px]">
              Notes
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Insert Vendor Notes"
              className="min-h-[169px] rounded-lg border-[#E5E5E5] bg-[#F7F7F7] placeholder:text-[#A1A1A9] text-base font-normal tracking-[-0.32px] leading-[140%] resize-none"
            />
          </div>

          <div className="ra-modal-footer">
            <div
              onClick={() => onOpenChange(false)}
              className="ra-modal-cancel-btn"
            >
              <div className="self-stretch my-auto">Cancel</div>
            </div>
            <div
              onClick={handleSubmit}
              className={`ra-modal-save-btn ${!vendorName.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="self-stretch my-auto">Create Vendor</div>
            </div>
          </div>
        </div>
      </Modal>
    </Dialog>
  );
}
