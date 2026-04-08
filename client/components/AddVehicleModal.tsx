import { useState, useEffect, useRef } from "react";
import { ModalTemplate, ModalButtons } from "@/components/ui/ModalTemplate";
import { FormLayout, FormSection } from "@/components/ui/form-layout";
import type { TenantVehicle, CreateVehicleRequest } from "@/types/tenant";
import {
  createTenantVehicle,
  updateTenantVehicle,
  uploadVehicleRegistration,
  parseVehicleRegistration,
} from "@/data/tenants";
import { toast } from "sonner";

interface AddVehicleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId: number;
  editData: TenantVehicle | null;
  onSaved: () => void;
}

export default function AddVehicleModal({
  open,
  onOpenChange,
  tenantId,
  editData,
  onSaved,
}: AddVehicleModalProps) {
  const isEdit = Boolean(editData);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [color, setColor] = useState("");
  const [licensePlate, setLicensePlate] = useState("");
  const [licenseState, setLicenseState] = useState("");
  const [vin, setVin] = useState("");
  const [registrationExpDate, setRegistrationExpDate] = useState("");
  const [hasParkingPermit, setHasParkingPermit] = useState(false);
  const [parkingSpot, setParkingSpot] = useState("");
  const [saving, setSaving] = useState(false);

  // Registration upload + parse
  const [regFile, setRegFile] = useState<File | null>(null);
  const [regObjectKey, setRegObjectKey] = useState<string | null>(null);
  const [regMime, setRegMime] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parseStatus, setParseStatus] = useState<"idle" | "uploading" | "parsing" | "done" | "error">("idle");

  useEffect(() => {
    if (!open) return;
    if (editData) {
      setMake(editData.make);
      setModel(editData.model);
      setYear(editData.year?.toString() ?? "");
      setColor(editData.color ?? "");
      setLicensePlate(editData.license_plate);
      setLicenseState(editData.license_state ?? "");
      setVin(editData.vin ?? "");
      setRegistrationExpDate(editData.registration_exp_date ?? "");
      setHasParkingPermit(editData.has_parking_permit);
      setParkingSpot(editData.parking_spot ?? "");
      setRegObjectKey(editData.registration_object_key ?? null);
      setRegMime(editData.registration_mime ?? null);
    } else {
      setMake("");
      setModel("");
      setYear("");
      setColor("");
      setLicensePlate("");
      setLicenseState("");
      setVin("");
      setRegistrationExpDate("");
      setHasParkingPermit(false);
      setParkingSpot("");
      setRegObjectKey(null);
      setRegMime(null);
    }
    setRegFile(null);
    setParsing(false);
    setParseStatus("idle");
  }, [open, editData]);

  const handleRegistrationUpload = async (file: File) => {
    setRegFile(file);
    setParseStatus("uploading");

    try {
      const { object_key, mime } = await uploadVehicleRegistration(file);
      setRegObjectKey(object_key);
      setRegMime(mime);
      setParseStatus("parsing");

      const parsed = await parseVehicleRegistration(object_key);

      // Auto-fill fields from parsed data (only fill empty fields)
      if (parsed.make && !make) setMake(parsed.make);
      if (parsed.model && !model) setModel(parsed.model);
      if (parsed.year && !year) setYear(parsed.year.toString());
      if (parsed.color && !color) setColor(parsed.color);
      if (parsed.license_plate && !licensePlate) setLicensePlate(parsed.license_plate);
      if (parsed.license_state && !licenseState) setLicenseState(parsed.license_state);
      if (parsed.vin && !vin) setVin(parsed.vin);
      if (parsed.registration_exp_date && !registrationExpDate) setRegistrationExpDate(parsed.registration_exp_date);

      setParseStatus("done");
      toast.success("Registration parsed — review the fields below");
    } catch {
      setParseStatus("error");
      toast.error("Could not parse registration. Please fill in the fields manually.");
    }
  };

  const handleSubmit = async () => {
    if (!make.trim() || !model.trim() || !licensePlate.trim()) {
      toast.error("Make, model, and license plate are required");
      return;
    }

    setSaving(true);
    try {
      if (isEdit && editData) {
        await updateTenantVehicle({
          id: editData.id,
          make: make.trim(),
          model: model.trim(),
          year: year ? parseInt(year) : undefined,
          color: color.trim() || undefined,
          license_plate: licensePlate.trim(),
          license_state: licenseState.trim() || undefined,
          vin: vin.trim() || undefined,
          registration_exp_date: registrationExpDate || undefined,
          has_parking_permit: hasParkingPermit,
          parking_spot: parkingSpot.trim() || undefined,
        });
        toast.success("Vehicle updated");
      } else {
        const req: CreateVehicleRequest = {
          tenant_id: tenantId,
          make: make.trim(),
          model: model.trim(),
          license_plate: licensePlate.trim(),
        };
        if (year) req.year = parseInt(year);
        if (color.trim()) req.color = color.trim();
        if (licenseState.trim()) req.license_state = licenseState.trim();
        if (vin.trim()) req.vin = vin.trim();
        if (registrationExpDate) req.registration_exp_date = registrationExpDate;
        if (regObjectKey) req.registration_object_key = regObjectKey;
        if (regMime) req.registration_mime = regMime;
        req.has_parking_permit = hasParkingPermit;
        if (parkingSpot.trim()) req.parking_spot = parkingSpot.trim();

        await createTenantVehicle(req);
        toast.success("Vehicle added");
      }
      onSaved();
    } catch {
      toast.error(isEdit ? "Failed to update vehicle" : "Failed to add vehicle");
    } finally {
      setSaving(false);
    }
  };

  const US_STATES = [
    "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
    "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
    "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
    "VA","WA","WV","WI","WY",
  ];

  return (
    <ModalTemplate
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Edit Vehicle" : "Add Vehicle"}
      size="lg"
      footer={
        <ModalButtons
          onCancel={() => onOpenChange(false)}
          onConfirm={handleSubmit}
          cancelLabel="Cancel"
          confirmLabel={saving ? "Saving..." : isEdit ? "Update" : "Add Vehicle"}
          confirmDisabled={saving || parsing}
        />
      }
    >
      <FormLayout>
        {/* Registration Upload */}
        <FormSection title="Vehicle Registration" description="Upload a registration document to auto-fill vehicle details">
          <div className="flex flex-col gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleRegistrationUpload(file);
                e.target.value = "";
              }}
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#DADADA] rounded-lg p-6 text-center cursor-pointer hover:border-[#1357D5] hover:bg-blue-50/30 transition-colors"
            >
              {parseStatus === "idle" && !regFile && (
                <div className="flex flex-col items-center gap-2">
                  <svg className="w-8 h-8 text-[#71717A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span className="text-sm text-[#71717A]">
                    Drop registration here or <span className="text-[#1357D5] font-medium">browse</span>
                  </span>
                  <span className="text-xs text-[#A0A0A0]">PDF, JPG, or PNG</span>
                </div>
              )}
              {parseStatus === "uploading" && (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-[#1357D5] border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-[#71717A]">Uploading...</span>
                </div>
              )}
              {parseStatus === "parsing" && (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-[#1357D5] border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-[#71717A]">Parsing registration...</span>
                </div>
              )}
              {parseStatus === "done" && regFile && (
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-green-700 font-medium">{regFile.name}</span>
                  <span className="text-xs text-[#A0A0A0]">— parsed successfully</span>
                </div>
              )}
              {parseStatus === "error" && (
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span className="text-sm text-amber-700">{regFile?.name} — could not parse, fill manually</span>
                </div>
              )}
            </div>
          </div>
        </FormSection>

        {/* Vehicle Info */}
        <FormSection title="Vehicle Information">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#71717A]">MAKE *</label>
              <input
                type="text"
                placeholder="e.g. Toyota"
                value={make}
                onChange={(e) => setMake(e.target.value)}
                className="h-9 text-sm border border-[#DADADA] rounded-lg px-3 py-1.5 text-[#303030] bg-white focus:outline-none focus:ring-1 focus:ring-[#1357D5]/20"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#71717A]">MODEL *</label>
              <input
                type="text"
                placeholder="e.g. Camry"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="h-9 text-sm border border-[#DADADA] rounded-lg px-3 py-1.5 text-[#303030] bg-white focus:outline-none focus:ring-1 focus:ring-[#1357D5]/20"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#71717A]">YEAR</label>
              <input
                type="number"
                placeholder="e.g. 2023"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="h-9 text-sm border border-[#DADADA] rounded-lg px-3 py-1.5 text-[#303030] bg-white focus:outline-none focus:ring-1 focus:ring-[#1357D5]/20"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#71717A]">COLOR</label>
              <input
                type="text"
                placeholder="e.g. Silver"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-9 text-sm border border-[#DADADA] rounded-lg px-3 py-1.5 text-[#303030] bg-white focus:outline-none focus:ring-1 focus:ring-[#1357D5]/20"
              />
            </div>
          </div>
        </FormSection>

        {/* License & Registration */}
        <FormSection title="License & Registration" showDivider={false}>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#71717A]">LICENSE PLATE *</label>
              <input
                type="text"
                placeholder="e.g. ABC-1234"
                value={licensePlate}
                onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
                className="h-9 text-sm border border-[#DADADA] rounded-lg px-3 py-1.5 text-[#303030] bg-white focus:outline-none focus:ring-1 focus:ring-[#1357D5]/20 uppercase"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#71717A]">STATE</label>
              <select
                value={licenseState}
                onChange={(e) => setLicenseState(e.target.value)}
                className="h-9 text-sm border border-[#DADADA] rounded-lg px-3 py-1.5 text-[#303030] bg-white focus:outline-none focus:ring-1 focus:ring-[#1357D5]/20"
              >
                <option value="">Select state</option>
                {US_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#71717A]">VIN</label>
              <input
                type="text"
                placeholder="17-character VIN"
                value={vin}
                onChange={(e) => setVin(e.target.value.toUpperCase())}
                maxLength={17}
                className="h-9 text-sm border border-[#DADADA] rounded-lg px-3 py-1.5 text-[#303030] bg-white focus:outline-none focus:ring-1 focus:ring-[#1357D5]/20 uppercase font-mono"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#71717A]">REGISTRATION EXPIRES</label>
              <input
                type="date"
                value={registrationExpDate}
                onChange={(e) => setRegistrationExpDate(e.target.value)}
                className="h-9 text-sm border border-[#DADADA] rounded-lg px-3 py-1.5 text-[#303030] bg-white focus:outline-none focus:ring-1 focus:ring-[#1357D5]/20"
              />
            </div>
          </div>
        </FormSection>

      </FormLayout>
    </ModalTemplate>
  );
}
