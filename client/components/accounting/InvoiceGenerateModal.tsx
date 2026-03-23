import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ModalTemplate,
  ModalField,
  ModalButtons,
} from "@/components/ui/ModalTemplate";
import { fetchJSON } from "@/api/fetchJSON";
import { accountingAPI } from "@/api/accounting";
import { toast } from "sonner";

interface InvoiceGenerateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultPropertyId?: number;
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

export default function InvoiceGenerateModal({
  open,
  onOpenChange,
  defaultPropertyId,
  onSuccess,
}: InvoiceGenerateModalProps) {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<{ id: number; name: string }[]>([]);
  const [propertyId, setPropertyId] = useState<number | undefined>(defaultPropertyId);
  const [month, setMonth] = useState("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) {
      setPropertyId(defaultPropertyId);
      setMonth("");
      setSaving(false);
      setErrors({});
    }
  }, [open, defaultPropertyId]);

  useEffect(() => {
    fetchJSON("/properties")
      .then((data: any[]) =>
        setProperties(
          (data || []).map((p: any) => ({ id: p.id, name: p.name || p.address_line1 }))
        )
      )
      .catch(() => {});
  }, []);

  const handleConfirm = async () => {
    const newErrors: Record<string, string> = {};
    if (!propertyId) newErrors.propertyId = "Please select a property";
    if (!month) newErrors.month = "Please select a month";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSaving(true);
    try {
      const result = await accountingAPI.generateInvoice(propertyId!, month);
      toast.success("Invoice generated successfully");
      onOpenChange(false);
      onSuccess?.();
      if (result?.id) {
        navigate(`/accounting/statements`);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to generate invoice");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalTemplate
      open={open}
      onOpenChange={onOpenChange}
      title="Generate Invoice"
      size="sm"
      footer={
        <ModalButtons
          onCancel={() => onOpenChange(false)}
          onConfirm={handleConfirm}
          confirmLabel={saving ? "Generating..." : "Generate"}
          cancelDisabled={saving}
        />
      }
    >
      <ModalField label="Property">
        <select
          value={propertyId || ""}
          onChange={(e) => {
            setPropertyId(e.target.value ? Number(e.target.value) : undefined);
            setErrors((prev) => ({ ...prev, propertyId: "" }));
          }}
          style={{
            ...inputStyle,
            borderColor: errors.propertyId ? "rgb(239, 68, 68)" : "rgba(229, 229, 229, 1)",
            borderWidth: errors.propertyId ? "2px" : "1px",
          }}
        >
          <option value="">Select property...</option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        {errors.propertyId && (
          <p className="text-red-500 text-xs mt-1">{errors.propertyId}</p>
        )}
      </ModalField>

      <ModalField label="Invoice Month">
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
