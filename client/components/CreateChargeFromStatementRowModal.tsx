import { useEffect, useMemo, useState } from "react";
import { ModalTemplate, ModalButtons } from "@/components/ui/ModalTemplate";
import { ComboboxField } from "@/components/forms/ComboboxField";
import { FieldShell } from "@/components/forms/FieldShell";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { authFetch, fetchJSON } from "@/api/fetchJSON";
import {
  fetchChartOfAccounts,
  type ChartAccount,
} from "@/data/chartOfAccounts";
import {
  createChargeFromStatementRow,
  type ReconciliationLine,
  type StatementRow,
} from "@/data/credit-card-reconciliation";

interface VendorOption {
  id: number;
  name: string;
}

interface PropertyOption {
  id: number;
  name: string;
  property_type?: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reconciliationID: number;
  statementRow: StatementRow | null;
  onCreated: (line: ReconciliationLine) => void;
}

interface PDFMeta {
  pdf_object_key: string;
  sha256_pdf: string;
  filename: string;
}

const formatCents = (cents: number): string =>
  (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });

export default function CreateChargeFromStatementRowModal({
  open,
  onOpenChange,
  reconciliationID,
  statementRow,
  onCreated,
}: Props) {
  const [vendors, setVendors] = useState<VendorOption[]>([]);
  const [vendorsLoading, setVendorsLoading] = useState(false);
  const [vendorID, setVendorID] = useState<string>("");

  const [coas, setCoas] = useState<ChartAccount[]>([]);
  const [coaID, setCoaID] = useState<string>("");

  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [propertyID, setPropertyID] = useState<string>("");

  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [description, setDescription] = useState("");
  const [pdf, setPdf] = useState<PDFMeta | null>(null);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset + load reference data on each open. Vendors and properties are
  // loaded in full (combobox does client-side filtering — sufficient for
  // typical ~1-2k row vendor lists).
  useEffect(() => {
    if (!open) return;
    setVendorID("");
    setCoaID("");
    setPropertyID("");
    setInvoiceNumber("");
    setDescription("");
    setPdf(null);
    setError(null);

    setVendorsLoading(true);
    fetchJSON("/vendors?limit=5000")
      .then((list: VendorOption[] | { vendors?: VendorOption[] }) => {
        const arr = Array.isArray(list) ? list : (list.vendors ?? []);
        setVendors(arr);
      })
      .catch(() => setVendors([]))
      .finally(() => setVendorsLoading(false));

    fetchChartOfAccounts({ type: "expense", activeOnly: true })
      .then((list) => setCoas(list))
      .catch(() => setCoas([]));

    fetchJSON("/properties")
      .then((list: PropertyOption[] | { properties?: PropertyOption[] }) => {
        const arr = Array.isArray(list) ? list : (list.properties ?? []);
        setProperties(arr);
        // Default to AVMRE LLC if present — most CC charges roll up to it.
        const avmre = arr.find((p) => /AVMRE/i.test(p.name));
        if (avmre) setPropertyID(String(avmre.id));
      })
      .catch(() => setProperties([]));
  }, [open]);

  const vendorOptions = useMemo(
    () =>
      vendors.map((v) => ({ value: String(v.id), label: v.name })).sort((a, b) =>
        a.label.localeCompare(b.label, undefined, { sensitivity: "base" }),
      ),
    [vendors],
  );

  const coaOptions = useMemo(
    () =>
      coas
        .filter((a) => a.qbo_id) // only QBO-mapped accounts can be pushed
        .map((a) => ({ value: String(a.id), label: a.name }))
        .sort((a, b) =>
          a.label.localeCompare(b.label, undefined, { sensitivity: "base" }),
        ),
    [coas],
  );

  const propertyOptions = useMemo(
    () =>
      properties.map((p) => ({ value: String(p.id), label: p.name })).sort((a, b) =>
        a.label.localeCompare(b.label, undefined, { sensitivity: "base" }),
      ),
    [properties],
  );

  const uploadFile = async (file: File) => {
    setUploadingPdf(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await authFetch("/vendors/bills/upload-pdf", {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Upload failed (${res.status})`);
      }
      const data = (await res.json()) as {
        pdf_object_key: string;
        sha256_pdf: string;
      };
      setPdf({
        pdf_object_key: data.pdf_object_key,
        sha256_pdf: data.sha256_pdf,
        filename: file.name,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "PDF upload failed");
    } finally {
      setUploadingPdf(false);
    }
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file
    if (!file) return;
    await uploadFile(file);
  };

  const handleDrop = async (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    // Quick client-side filter so a wildly-wrong file (e.g., .zip) doesn't
    // round-trip the server just to bounce back.
    if (!/\.(pdf|jpe?g|png)$/i.test(file.name)) {
      setError("File must be a PDF, JPG, or PNG");
      return;
    }
    await uploadFile(file);
  };

  const handleSubmit = async () => {
    if (!statementRow) return;
    if (!vendorID) {
      setError("Vendor is required");
      return;
    }
    if (!coaID) {
      setError("GL Account is required");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const line = await createChargeFromStatementRow(reconciliationID, {
        statement_row: statementRow,
        vendor_id: Number(vendorID),
        coa_id: Number(coaID),
        property_id: propertyID ? Number(propertyID) : undefined,
        invoice_number: invoiceNumber.trim() || undefined,
        description: description.trim() || undefined,
        pdf_object_key: pdf?.pdf_object_key,
        sha256_pdf: pdf?.sha256_pdf,
      });
      onCreated(line);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create charge");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalTemplate
      open={open}
      onOpenChange={onOpenChange}
      title="Create charge from statement row"
      size="md"
      footer={
        <ModalButtons
          onCancel={() => onOpenChange(false)}
          onConfirm={handleSubmit}
          cancelLabel="Cancel"
          confirmLabel={submitting ? "Creating…" : "Create & pair"}
          cancelDisabled={submitting}
        />
      }
    >
      {statementRow && (
        <div className="border border-[#E5E5E5] rounded-md bg-[#FAFAFA] px-4 py-3 mb-4">
          <div className="text-xs font-medium text-[#717179] uppercase tracking-wide mb-1">
            From statement
          </div>
          <div className="text-sm font-medium text-[#303030]">
            {statementRow.description || "—"}
          </div>
          <div className="text-xs text-[#717179] mt-0.5">
            {statementRow.date} · row {statementRow.source_row} ·{" "}
            <span className="tabular-nums font-medium text-[#303030]">
              {formatCents(statementRow.amount_cents)}
            </span>
          </div>
        </div>
      )}

      <div style={{ marginBottom: 12 }}>
        <ComboboxField
          label="Vendor"
          required
          id="cc-vendor"
          value={vendorID}
          onChange={setVendorID}
          disabled={submitting || vendorsLoading}
          placeholder={vendorsLoading ? "Loading vendors…" : "Select vendor"}
          searchPlaceholder="Search vendors…"
          options={vendorOptions}
          emptyMessage="No vendors match that search"
        />
      </div>

      <div style={{ marginBottom: 12 }}>
        <ComboboxField
          label="GL Account"
          required
          id="cc-coa"
          value={coaID}
          onChange={setCoaID}
          disabled={submitting}
          placeholder="Select expense account"
          searchPlaceholder="Search GL accounts…"
          options={coaOptions}
          emptyMessage="No expense accounts match"
        />
      </div>

      <div style={{ marginBottom: 12 }}>
        <ComboboxField
          label="Property / Ledger"
          id="cc-property"
          value={propertyID}
          onChange={setPropertyID}
          disabled={submitting}
          placeholder="— None —"
          searchPlaceholder="Search properties…"
          options={propertyOptions}
          emptyMessage="No properties match"
        />
      </div>

      <div style={{ marginBottom: 12 }}>
        <FieldShell
          label="Description (optional)"
          htmlFor="cc-description"
          description="Overrides the statement row description on the bill + QBO line. Leave blank to use the statement row's description."
        >
          <Textarea
            id="cc-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={statementRow?.description ?? "Notes about this charge…"}
            rows={2}
            disabled={submitting}
          />
        </FieldShell>
      </div>

      <div style={{ marginBottom: 12 }}>
        <FieldShell
          label="Reference / Invoice number (optional)"
          htmlFor="cc-invoice"
        >
          <Input
            id="cc-invoice"
            type="text"
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
            placeholder="INV-…"
            disabled={submitting}
          />
        </FieldShell>
      </div>

      <div className="text-xs text-[#717179] mt-2 mb-3">
        Creates a Bill in QBO, pays it from this account's credit card, inserts
        a platform bill row, and auto-pairs the new BillPayment to the
        statement row. Buildium is not touched.
      </div>

      <div style={{ marginBottom: 12 }}>
        <FieldShell label="Receipt / invoice (optional)" htmlFor="cc-pdf">
          <input
            id="cc-pdf"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
            onChange={handleFileSelected}
            disabled={uploadingPdf || submitting}
            className="hidden"
          />
          {pdf ? (
            <div className="flex items-center justify-between gap-3 border border-[#DADADA] rounded-lg px-4 py-3 bg-[#FAFAFA]">
              <div className="min-w-0">
                <div className="text-sm text-[#303030] truncate">
                  ✓ {pdf.filename}
                </div>
                <div className="text-xs text-[#717179]">Attached to this bill</div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <label
                  htmlFor="cc-pdf"
                  className={`text-xs text-[#013764] underline cursor-pointer ${
                    uploadingPdf || submitting ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  Replace
                </label>
                <button
                  type="button"
                  onClick={() => setPdf(null)}
                  disabled={submitting}
                  className="text-xs text-[#717179] underline hover:text-rose-700"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <label
              htmlFor="cc-pdf"
              onDragEnter={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!uploadingPdf && !submitting) setDragActive(true);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!uploadingPdf && !submitting) setDragActive(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDragActive(false);
              }}
              onDrop={handleDrop}
              className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg px-6 py-8 cursor-pointer transition-colors ${
                uploadingPdf || submitting
                  ? "border-[#E5E5E5] bg-[#FAFAFA] cursor-not-allowed"
                  : dragActive
                    ? "border-[#013764] bg-sky-50"
                    : "border-[#DADADA] hover:border-[#9CA3AF] hover:bg-[#FAFAFA]"
              }`}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="h-7 w-7 text-[#717179]"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 13.5h6m-3-3v6m6.75 4.5H5.25A2.25 2.25 0 013 18.75V5.25A2.25 2.25 0 015.25 3h9.879a2.25 2.25 0 011.59.659l3.622 3.622a2.25 2.25 0 01.659 1.59v9.879A2.25 2.25 0 0118.75 21z"
                />
              </svg>
              <div className="text-sm font-medium text-[#303030]">
                {uploadingPdf ? "Uploading…" : "Upload receipt or invoice"}
              </div>
              <div className="text-xs text-[#717179]">
                PDF, JPG, or PNG · drag &amp; drop or click to browse
              </div>
            </label>
          )}
        </FieldShell>
      </div>

      {error && (
        <div className="border border-rose-200 bg-rose-50 text-rose-900 rounded-md px-3 py-2 text-sm mt-3">
          {error}
        </div>
      )}
    </ModalTemplate>
  );
}
