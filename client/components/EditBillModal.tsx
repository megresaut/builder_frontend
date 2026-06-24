import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  ModalTemplate,
  ModalButtons,
} from "@/components/ui/ModalTemplate";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { fetchJSON } from "@/api/fetchJSON";

/**
 * EditBillModal — PATCH an already-pushed bill. Hits PATCH /vendors/bills/{id}
 * which propagates to QBO (sparse) + Buildium (PUT). Rolls back on Buildium
 * rejection so the local DB never gets ahead of the books.
 *
 * v1 surface: memo, invoice number, statement date, due date. Editing line
 * items / vendor / property requires the GL + property pickers from
 * RecordBillModal and can be added later. Backend already supports those
 * fields if/when the UI catches up.
 */

interface EditBillModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bill: {
    id: number;
    vendorName?: string;
    propertyName?: string;
    invoiceNumber?: string;
    memo?: string;
    statementDate?: string; // YYYY-MM-DD
    dueDate?: string;       // YYYY-MM-DD
  };
  onSaved?: () => void;
}

export default function EditBillModal({
  open,
  onOpenChange,
  bill,
  onSaved,
}: EditBillModalProps) {
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [memo, setMemo] = useState("");
  const [statementDate, setStatementDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setInvoiceNumber(bill.invoiceNumber ?? "");
    setMemo(bill.memo ?? "");
    setStatementDate(toIsoDate(bill.statementDate));
    setDueDate(toIsoDate(bill.dueDate));
  }, [open, bill]);

  const buildPatch = () => {
    const patch: Record<string, unknown> = {};
    if ((bill.invoiceNumber ?? "") !== invoiceNumber) patch.invoice_number = invoiceNumber;
    if ((bill.memo ?? "") !== memo) patch.memo = memo;
    const origStmt = toIsoDate(bill.statementDate);
    const origDue = toIsoDate(bill.dueDate);
    if (origStmt !== statementDate && statementDate) patch.statement_date = statementDate;
    if (origDue !== dueDate && dueDate) patch.due_date = dueDate;
    return patch;
  };

  const handleSave = async () => {
    const patch = buildPatch();
    if (Object.keys(patch).length === 0) {
      toast.message("No changes to save");
      return;
    }
    setSaving(true);
    try {
      const res = await fetchJSON(`/vendors/bills/${bill.id}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
      toast.success(
        `Bill updated — QBO ${res?.qbo_synced ? "synced" : "skipped"}, Buildium ${res?.buildium_synced ? "synced" : "skipped"}`,
      );
      onSaved?.();
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      // Backend surfaces Buildium error verbatim via "Buildium rejected the edit: ..."
      toast.error(msg, { duration: 8000 });
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalTemplate
      open={open}
      onOpenChange={onOpenChange}
      title="Edit Bill"
      size="sm"
      footer={
        <ModalButtons
          onCancel={() => onOpenChange(false)}
          onConfirm={handleSave}
          cancelLabel="Cancel"
          confirmLabel={saving ? "Saving…" : "Save changes"}
          confirmDisabled={saving}
        />
      }
    >
      <div className="text-sm text-[#717179] mb-4">
        <div>
          <span className="text-[#303030] font-medium">{bill.vendorName || "—"}</span>
        </div>
        {bill.propertyName && <div>{bill.propertyName}</div>}
      </div>

      <div className="space-y-3 text-sm">
        <Field label="Invoice number">
          <Input
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
            disabled={saving}
          />
        </Field>
        <Field label="Statement date">
          <Input
            type="date"
            value={statementDate}
            onChange={(e) => setStatementDate(e.target.value)}
            disabled={saving}
          />
        </Field>
        <Field label="Due date">
          <Input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            disabled={saving}
          />
        </Field>
        <Field label="Memo">
          <Textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            rows={3}
            disabled={saving}
          />
        </Field>
      </div>

      <div className="mt-4 text-xs text-[#717179] border border-amber-200 bg-amber-50 rounded-md p-3">
        Changes apply to QuickBooks and Buildium together. If Buildium rejects
        the edit (e.g. for a paid bill), QuickBooks is rolled back and nothing
        is saved.
      </div>
    </ModalTemplate>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs text-[#717179] mb-1">{label}</span>
      {children}
    </label>
  );
}

function toIsoDate(s?: string): string {
  if (!s) return "";
  // Already YYYY-MM-DD?
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "";
  // Use UTC methods — the API returns dates as UTC midnight timestamps
  // (e.g. "2026-06-26T00:00:00Z"). Local methods would shift the date back
  // one day for any timezone behind UTC.
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
