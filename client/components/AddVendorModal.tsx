import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AddVendorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddVendorModal({
  open,
  onOpenChange,
}: AddVendorModalProps) {
  const [vendorName, setVendorName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [servicesProvided, setServicesProvided] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<{ vendorName?: boolean }>({});

  const services = [
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
      console.log("Form submitted", { vendorName, email, phone, servicesProvided, notes });
      setVendorName("");
      setEmail("");
      setPhone("");
      setServicesProvided("");
      setNotes("");
      onOpenChange(false);
    }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[694px] p-8 gap-0">
        <DialogTitle className="text-[#303030] font-semibold text-2xl leading-[30px] mb-4">
          Add Vendor
        </DialogTitle>

        <div className="flex flex-col gap-4">
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
                  errors.vendorName ? "border-red-500 border-2" : "border-[#E5E5E5]"
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
            <Select value={servicesProvided} onValueChange={setServicesProvided}>
              <SelectTrigger className="h-10 rounded-lg border-[#E5E5E5] bg-[#F7F7F7] text-base font-normal tracking-[-0.32px] leading-[140%]">
                <SelectValue placeholder="Select Services Provided" />
              </SelectTrigger>
              <SelectContent>
                {services.map((service) => (
                  <SelectItem key={service} value={service}>
                    {service}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

          <button
            onClick={handleSubmit}
            disabled={!vendorName.trim()}
            className="flex h-9 w-full items-center justify-center gap-2 px-4 rounded-lg border border-white bg-[#013764] shadow-[0_0_0_1px_#002D5A] hover:bg-[#003a73] transition-colors mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="text-white font-medium text-base">
              Create Vendor
            </span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
