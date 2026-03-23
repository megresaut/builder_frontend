import { useState, useEffect, useRef } from "react";
import {
  ModalTemplate,
  ModalField,
  ModalButtons,
} from "@/components/ui/ModalTemplate";
import { accountingAPI } from "@/api/accounting";
import { toast } from "sonner";

interface StatementUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const inputStyle: React.CSSProperties = {
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
  color: "#303030",
  width: "100%",
  boxSizing: "border-box" as const,
};

export default function StatementUploadModal({
  open,
  onOpenChange,
  onSuccess,
}: StatementUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [accountName, setAccountName] = useState("");
  const [month, setMonth] = useState("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  // Reset state on close
  useEffect(() => {
    if (!open) {
      setFile(null);
      setAccountName("");
      setMonth("");
      setSaving(false);
      setErrors({});
      if (fileRef.current) fileRef.current.value = "";
    }
  }, [open]);

  const handleConfirm = async () => {
    const newErrors: Record<string, string> = {};
    if (!file) newErrors.file = "Please select a file";
    if (!accountName.trim()) newErrors.accountName = "Account name is required";
    if (!month) newErrors.month = "Month is required";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSaving(true);
    try {
      await accountingAPI.uploadStatement(file!, accountName.trim(), month);
      toast.success("Statement uploaded successfully");
      onOpenChange(false);
      onSuccess?.();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalTemplate
      open={open}
      onOpenChange={onOpenChange}
      title="Upload Statement"
      size="sm"
      footer={
        <ModalButtons
          onCancel={() => onOpenChange(false)}
          onConfirm={handleConfirm}
          confirmLabel={saving ? "Uploading..." : "Upload"}
          cancelDisabled={saving}
        />
      }
    >
      <ModalField label="Statement File (.csv, .pdf)">
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.pdf"
          onChange={(e) => {
            setFile(e.target.files?.[0] || null);
            setErrors((prev) => ({ ...prev, file: "" }));
          }}
          style={{
            ...inputStyle,
            borderColor: errors.file ? "rgb(239, 68, 68)" : "rgba(229, 229, 229, 1)",
            borderWidth: errors.file ? "2px" : "1px",
          }}
        />
        {errors.file && (
          <p className="text-red-500 text-xs mt-1">{errors.file}</p>
        )}
      </ModalField>

      <ModalField label="Account Name">
        <input
          type="text"
          placeholder="e.g. Chase Business Checking"
          value={accountName}
          onChange={(e) => {
            setAccountName(e.target.value);
            setErrors((prev) => ({ ...prev, accountName: "" }));
          }}
          style={{
            ...inputStyle,
            borderColor: errors.accountName ? "rgb(239, 68, 68)" : "rgba(229, 229, 229, 1)",
            borderWidth: errors.accountName ? "2px" : "1px",
          }}
        />
        {errors.accountName && (
          <p className="text-red-500 text-xs mt-1">{errors.accountName}</p>
        )}
      </ModalField>

      <ModalField label="Month">
        <input
          type="month"
          value={month}
          onChange={(e) => {
            setMonth(e.target.value);
            setErrors((prev) => ({ ...prev, month: "" }));
          }}
          style={{
            ...inputStyle,
            borderColor: errors.month ? "rgb(239, 68, 68)" : "rgba(229, 229, 229, 1)",
            borderWidth: errors.month ? "2px" : "1px",
          }}
        />
        {errors.month && (
          <p className="text-red-500 text-xs mt-1">{errors.month}</p>
        )}
      </ModalField>
    </ModalTemplate>
  );
}
