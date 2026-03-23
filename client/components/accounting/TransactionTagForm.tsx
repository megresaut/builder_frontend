import { useState, useEffect, useRef } from "react";
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

interface Transaction {
  id: number;
  date: string;
  description: string;
  amount_cents: number;
  status: string;
  property_id?: number;
  vendor_id?: number;
  expense_category?: string;
  memo?: string;
}

interface TransactionTagFormProps {
  transaction: Transaction;
  onSaved?: () => void;
}

const inputStyle: React.CSSProperties = {
  borderRadius: "8px",
  backgroundColor: "rgba(255, 255, 255, 1)",
  borderColor: "rgba(229, 229, 229, 1)",
  borderStyle: "solid",
  borderWidth: "1px",
  padding: "8px 12px",
  fontSize: "14px",
  fontWeight: 400,
  letterSpacing: "-0.32px",
  lineHeight: 1.4,
  fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
  color: "#303030",
  width: "100%",
  boxSizing: "border-box" as const,
};

export default function TransactionTagForm({
  transaction,
  onSaved,
}: TransactionTagFormProps) {
  const [properties, setProperties] = useState<{ id: number; name: string }[]>([]);
  const [vendors, setVendors] = useState<{ id: number; name: string }[]>([]);
  const [propertyId, setPropertyId] = useState<number | undefined>(transaction.property_id);
  const [vendorId, setVendorId] = useState<number | undefined>(transaction.vendor_id);
  const [category, setCategory] = useState(transaction.expense_category || "");
  const [memo, setMemo] = useState(transaction.memo || "");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Load properties and vendors
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

  // Reset form when transaction changes
  useEffect(() => {
    setPropertyId(transaction.property_id);
    setVendorId(transaction.vendor_id);
    setCategory(transaction.expense_category || "");
    setMemo(transaction.memo || "");
    setReceiptFile(null);
    if (fileRef.current) fileRef.current.value = "";
  }, [transaction.id]);

  const handleSave = async () => {
    if (!propertyId) {
      toast.error("Please select a property");
      return;
    }
    setSaving(true);
    try {
      await accountingAPI.tagTransaction(transaction.id, {
        property_id: propertyId,
        vendor_id: vendorId,
        expense_category: category || undefined,
        memo: memo || undefined,
      });
      if (receiptFile) {
        await accountingAPI.uploadReceipt(transaction.id, receiptFile);
      }
      toast.success("Transaction tagged successfully");
      onSaved?.();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to tag transaction");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-lg font-semibold text-gray-900">Tag Transaction</h3>

      <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
        <div className="font-medium text-gray-900">{transaction.description}</div>
        <div className="mt-1">
          {new Date(transaction.date).toLocaleDateString()} &middot;{" "}
          <span className={transaction.amount_cents < 0 ? "text-red-600" : "text-green-600"}>
            ${Math.abs(transaction.amount_cents / 100).toFixed(2)}
          </span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Property *</label>
        <select
          value={propertyId || ""}
          onChange={(e) => setPropertyId(e.target.value ? Number(e.target.value) : undefined)}
          style={inputStyle}
        >
          <option value="">Select property...</option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Vendor</label>
        <select
          value={vendorId || ""}
          onChange={(e) => setVendorId(e.target.value ? Number(e.target.value) : undefined)}
          style={inputStyle}
        >
          <option value="">Select vendor...</option>
          {vendors.map((v) => (
            <option key={v.id} value={v.id}>{v.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={inputStyle}
        >
          <option value="">Select category...</option>
          {EXPENSE_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Memo</label>
        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          rows={3}
          placeholder="Add a note..."
          style={inputStyle}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Receipt</label>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,.pdf"
          onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
          style={inputStyle}
        />
      </div>

      <div className="flex gap-2 pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? "Saving..." : "Save Tag"}
        </button>
      </div>
    </div>
  );
}
