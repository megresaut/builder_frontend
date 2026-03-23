import { useState, useEffect } from "react";
import {
  ModalTemplate,
  ModalField,
  ModalButtons,
} from "@/components/ui/ModalTemplate";
import { fetchJSON } from "@/api/fetchJSON";
import { accountingAPI } from "@/api/accounting";
import { toast } from "sonner";

const EXPENSE_CATEGORIES = [
  "Maintenance",
  "Repairs",
  "Supplies",
  "Plumbing",
  "Electrical",
  "HVAC",
  "Landscaping",
  "Cleaning",
  "Other",
];

interface BulkTagModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: number[];
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

export default function BulkTagModal({
  open,
  onOpenChange,
  selectedIds,
  onSuccess,
}: BulkTagModalProps) {
  const [properties, setProperties] = useState<{ id: number; name: string }[]>([]);
  const [vendors, setVendors] = useState<{ id: number; name: string }[]>([]);
  const [propertyId, setPropertyId] = useState<number | undefined>();
  const [vendorId, setVendorId] = useState<number | undefined>();
  const [category, setCategory] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      setPropertyId(undefined);
      setVendorId(undefined);
      setCategory("");
      setSaving(false);
    }
  }, [open]);

  useEffect(() => {
    fetchJSON("/properties")
      .then((data: any[]) =>
        setProperties(
          (data || []).map((p: any) => ({ id: p.id, name: p.name || p.address_line1 }))
        )
      )
      .catch(() => {});
    fetchJSON("/vendors")
      .then((data: any[]) =>
        setVendors((data || []).map((v: any) => ({ id: v.id, name: v.name })))
      )
      .catch(() => {});
  }, []);

  const handleConfirm = async () => {
    if (!propertyId && !vendorId && !category) {
      toast.error("Please select at least one field to apply");
      return;
    }
    setSaving(true);
    try {
      await accountingAPI.bulkTag(selectedIds, {
        property_id: propertyId,
        vendor_id: vendorId,
        expense_category: category || undefined,
      });
      toast.success(`Tagged ${selectedIds.length} transactions`);
      onOpenChange(false);
      onSuccess?.();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Bulk tag failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalTemplate
      open={open}
      onOpenChange={onOpenChange}
      title="Bulk Tag Transactions"
      size="sm"
      footer={
        <ModalButtons
          onCancel={() => onOpenChange(false)}
          onConfirm={handleConfirm}
          confirmLabel={saving ? "Applying..." : `Tag ${selectedIds.length} Transactions`}
          cancelDisabled={saving}
        />
      }
    >
      <p className="text-sm text-gray-500 mb-4">
        Apply the following tags to {selectedIds.length} selected transaction{selectedIds.length !== 1 ? "s" : ""}.
        Only non-empty fields will be applied.
      </p>

      <ModalField label="Property">
        <select
          value={propertyId || ""}
          onChange={(e) => setPropertyId(e.target.value ? Number(e.target.value) : undefined)}
          style={inputStyle}
        >
          <option value="">-- No change --</option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </ModalField>

      <ModalField label="Vendor">
        <select
          value={vendorId || ""}
          onChange={(e) => setVendorId(e.target.value ? Number(e.target.value) : undefined)}
          style={inputStyle}
        >
          <option value="">-- No change --</option>
          {vendors.map((v) => (
            <option key={v.id} value={v.id}>{v.name}</option>
          ))}
        </select>
      </ModalField>

      <ModalField label="Category">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={inputStyle}
        >
          <option value="">-- No change --</option>
          {EXPENSE_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </ModalField>
    </ModalTemplate>
  );
}
