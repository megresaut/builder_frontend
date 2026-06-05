import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { fetchJSON } from "@/api/fetchJSON";
import SearchSelect, { type SearchSelectOption } from "@/components/SearchSelect";
import { ConciergeGLPicker } from "@/components/ConciergeGLPicker";
import { BuildiumGLPicker } from "@/components/BuildiumGLPicker";
import {
  createChargeFromStatementRow,
  type StatementRow,
} from "@/data/credit-card-reconciliation";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reconciliationID: number;
  rows: StatementRow[];
  onDone: () => void;
}

interface Form {
  vendorId: string;
  invoiceNumber: string;
  memo: string;
  propertyId: string;
  unitId: string;
  // GL ref — exactly one is used depending on whether the property is concierge.
  qboItemId: string; // concierge → QBO passthrough Item id
  buildiumAccountId: string; // non-concierge → Buildium account id
  description: string;
}

type Outcome = "ok" | "skipped" | "error";

const emptyForm = (): Form => ({
  vendorId: "",
  invoiceNumber: "",
  memo: "",
  propertyId: "",
  unitId: "",
  qboItemId: "",
  buildiumAccountId: "",
  description: "",
});

const formatCents = (c: number): string =>
  (c / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });

// Quick-bill wizard: walk the selected unmatched statement charges one at a time,
// each as a focused Record-Bill-style form (searchable vendor / property / unit,
// invoice # + memo, and the SAME concierge-gated GL picker as Record Bill — a QBO
// passthrough Item for concierge properties, a Buildium account otherwise — no
// file upload). "Create bill" books + pays + pairs that charge, then advances.
// Vendor / property / unit / GL carry forward as defaults so a same-merchant run
// is mostly clicking Create.
export default function QuickBillBatchModal({
  open,
  onOpenChange,
  reconciliationID,
  rows,
  onDone,
}: Props) {
  const [vendors, setVendors] = useState<SearchSelectOption[]>([]);
  const [properties, setProperties] = useState<SearchSelectOption[]>([]);
  const [conciergeByProp, setConciergeByProp] = useState<
    Record<string, boolean>
  >({});
  const [unitsByProp, setUnitsByProp] = useState<
    Record<string, SearchSelectOption[]>
  >({});
  const [loadErr, setLoadErr] = useState<string | null>(null);

  const [idx, setIdx] = useState(0);
  const [form, setForm] = useState<Form>(emptyForm());
  const carry = useRef<Partial<Form>>({});

  const [submitting, setSubmitting] = useState(false);
  const [rowError, setRowError] = useState<string | null>(null);
  const [outcomes, setOutcomes] = useState<Record<number, Outcome>>({});

  // Load pickers + reset wizard whenever the modal opens.
  useEffect(() => {
    if (!open) return;
    setIdx(0);
    setForm(emptyForm());
    carry.current = {};
    setOutcomes({});
    setRowError(null);
    setSubmitting(false);
    setLoadErr(null);
    Promise.all([fetchJSON("/vendors?limit=5000"), fetchJSON("/properties")])
      .then(([v, p]: [any, any]) => {
        setVendors(
          (v as any[]).map((x) => ({ value: String(x.id), label: x.name })),
        );
        const concierge: Record<string, boolean> = {};
        setProperties(
          (p as any[]).map((x) => {
            concierge[String(x.id)] = x.property_type === "C";
            return {
              value: String(x.id),
              label: x.name || x.address_line1 || `Property ${x.id}`,
              hint: x.property_type === "C" ? "concierge" : undefined,
            };
          }),
        );
        setConciergeByProp(concierge);
      })
      .catch((e) =>
        setLoadErr(e instanceof Error ? e.message : "Failed to load pickers"),
      );
  }, [open]);

  // Initialize the form for the current charge: carry vendor/property/unit/GL
  // forward, default the description to the statement text, reset invoice + memo.
  useEffect(() => {
    if (!open || idx >= rows.length) return;
    const c = carry.current;
    setForm({
      vendorId: c.vendorId ?? "",
      propertyId: c.propertyId ?? "",
      unitId: c.unitId ?? "",
      qboItemId: c.qboItemId ?? "",
      buildiumAccountId: c.buildiumAccountId ?? "",
      invoiceNumber: "",
      memo: "",
      description: rows[idx]?.description ?? "",
    });
    setRowError(null);
    if (c.propertyId) void loadUnits(c.propertyId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, open, rows]);

  const loadUnits = async (pid: string) => {
    if (!pid || unitsByProp[pid]) return;
    try {
      const list = await fetchJSON(`/properties/${pid}/units`);
      const opts: SearchSelectOption[] = (list || [])
        .filter((u: any) => u.buildium_unit_id != null)
        .map((u: any) => ({
          value: String(u.buildium_unit_id),
          label: u.unit_name || `Unit ${u.buildium_unit_id}`,
        }));
      setUnitsByProp((prev) => ({ ...prev, [pid]: opts }));
    } catch {
      setUnitsByProp((prev) => ({ ...prev, [pid]: [] }));
    }
  };

  const unitOpts = form.propertyId ? unitsByProp[form.propertyId] ?? [] : [];
  const isConcierge = form.propertyId
    ? !!conciergeByProp[form.propertyId]
    : false;

  const counts = useMemo(() => {
    const v = Object.values(outcomes);
    return {
      ok: v.filter((o) => o === "ok").length,
      skipped: v.filter((o) => o === "skipped").length,
      error: v.filter((o) => o === "error").length,
    };
  }, [outcomes]);

  if (!open) return null;

  const done = idx >= rows.length;
  const current = rows[idx];
  const glChosen = isConcierge ? !!form.qboItemId : !!form.buildiumAccountId;
  const ready = !!(form.vendorId && form.propertyId && glChosen);

  const advance = () => setIdx((i) => i + 1);

  const skip = () => {
    if (!current) return;
    setOutcomes((o) => ({ ...o, [current.source_row]: "skipped" }));
    advance();
  };

  const createBill = async () => {
    if (!current || !ready || submitting) return;
    setSubmitting(true);
    setRowError(null);
    try {
      await createChargeFromStatementRow(reconciliationID, {
        statement_row: current,
        vendor_id: Number(form.vendorId),
        property_id: Number(form.propertyId),
        unit_id: form.unitId ? Number(form.unitId) : undefined,
        qbo_item_id: isConcierge ? form.qboItemId || undefined : undefined,
        buildium_account_id: isConcierge
          ? undefined
          : form.buildiumAccountId || undefined,
        invoice_number: form.invoiceNumber.trim() || undefined,
        description: form.description.trim() || undefined,
        memo: form.memo.trim() || undefined,
      });
      setOutcomes((o) => ({ ...o, [current.source_row]: "ok" }));
      carry.current = {
        vendorId: form.vendorId,
        propertyId: form.propertyId,
        unitId: form.unitId,
        qboItemId: form.qboItemId,
        buildiumAccountId: form.buildiumAccountId,
      };
      advance();
    } catch (e) {
      setOutcomes((o) => ({ ...o, [current.source_row]: "error" }));
      setRowError(e instanceof Error ? e.message : "Failed to create bill");
    } finally {
      setSubmitting(false);
    }
  };

  const close = () => {
    if (counts.ok > 0) onDone();
    onOpenChange(false);
  };

  const labelCls = "text-xs font-medium text-[#717179]";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[92vh] flex flex-col">
        <div className="px-5 py-3 border-b border-[#EEE] flex items-center justify-between">
          <div>
            <div className="text-base font-semibold text-[#303030]">
              Quick-bill charges
            </div>
            <div className="text-xs text-[#717179]">
              {done
                ? "All charges processed"
                : `Charge ${idx + 1} of ${rows.length}`}
              {(counts.ok > 0 || counts.skipped > 0 || counts.error > 0) && (
                <>
                  {" · "}
                  {counts.ok} booked
                  {counts.skipped ? `, ${counts.skipped} skipped` : ""}
                  {counts.error ? `, ${counts.error} failed` : ""}
                </>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={close}
            className="text-[#717179] hover:text-[#303030] text-lg leading-none"
          >
            ✕
          </button>
        </div>

        {loadErr && (
          <div className="m-4 border border-rose-200 bg-rose-50 text-rose-900 rounded px-3 py-2 text-sm">
            {loadErr}
          </div>
        )}

        {done ? (
          <div className="p-8 text-center flex-1 flex flex-col items-center justify-center gap-2">
            <div className="text-2xl">✓</div>
            <div className="text-sm text-[#303030] font-medium">
              {counts.ok} bill{counts.ok === 1 ? "" : "s"} created
              {counts.skipped ? `, ${counts.skipped} skipped` : ""}
              {counts.error ? `, ${counts.error} failed` : ""}
            </div>
            <div className="text-xs text-[#717179]">
              Booked charges are now matched and cleared on the reconciliation.
            </div>
          </div>
        ) : (
          <div className="px-5 py-4 overflow-auto flex-1 space-y-4">
            {/* The charge being booked */}
            <div className="rounded-md border border-[#E5E5E5] bg-[#FAFAFA] px-3 py-2 flex items-center justify-between">
              <div className="min-w-0">
                <div className="text-sm text-[#303030] truncate">
                  {current?.description || "—"}
                </div>
                <div className="text-xs text-[#A1A1A1]">
                  {current?.date} · row {current?.source_row}
                </div>
              </div>
              <div className="text-base font-semibold text-[#303030] tabular-nums shrink-0">
                {current ? formatCents(current.amount_cents) : ""}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-1">
                <div className={labelCls}>Vendor *</div>
                <SearchSelect
                  options={vendors}
                  value={form.vendorId}
                  onChange={(v) => setForm((f) => ({ ...f, vendorId: v }))}
                  placeholder="Search vendor…"
                />
              </label>
              <label className="space-y-1">
                <div className={labelCls}>Property *</div>
                <SearchSelect
                  options={properties}
                  value={form.propertyId}
                  onChange={(v) => {
                    setForm((f) => ({
                      ...f,
                      propertyId: v,
                      unitId: "",
                      // GL ref is property-type specific — reset on change.
                      qboItemId: "",
                      buildiumAccountId: "",
                    }));
                    void loadUnits(v);
                  }}
                  placeholder="Search property…"
                />
              </label>
              <label className="space-y-1">
                <div className={labelCls}>
                  GL account *{" "}
                  {form.propertyId && (
                    <span className="text-[#A1A1A1] font-normal">
                      ({isConcierge ? "concierge / QBO" : "Buildium"})
                    </span>
                  )}
                </div>
                {!form.propertyId ? (
                  <div className="w-full border border-dashed border-[#DDD] rounded px-2 py-1 text-sm text-[#A1A1A1]">
                    Pick a property first
                  </div>
                ) : isConcierge ? (
                  <ConciergeGLPicker
                    value={form.qboItemId}
                    onChange={(id) =>
                      setForm((f) => ({
                        ...f,
                        qboItemId: id,
                        buildiumAccountId: "",
                      }))
                    }
                  />
                ) : (
                  <BuildiumGLPicker
                    value={form.buildiumAccountId}
                    onChange={(id) =>
                      setForm((f) => ({
                        ...f,
                        buildiumAccountId: id,
                        qboItemId: "",
                      }))
                    }
                  />
                )}
              </label>
              <label className="space-y-1">
                <div className={labelCls}>Unit</div>
                <SearchSelect
                  options={unitOpts}
                  value={form.unitId}
                  onChange={(v) => setForm((f) => ({ ...f, unitId: v }))}
                  placeholder={
                    form.propertyId ? "Optional unit…" : "Pick a property first"
                  }
                  disabled={!form.propertyId || unitOpts.length === 0}
                />
              </label>
              <label className="space-y-1">
                <div className={labelCls}>Invoice #</div>
                <input
                  type="text"
                  value={form.invoiceNumber}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, invoiceNumber: e.target.value }))
                  }
                  placeholder="Optional"
                  className="w-full border border-[#DDD] rounded px-2 py-1 text-sm"
                />
              </label>
              <label className="space-y-1">
                <div className={labelCls}>Memo</div>
                <input
                  type="text"
                  value={form.memo}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, memo: e.target.value }))
                  }
                  placeholder="Optional"
                  className="w-full border border-[#DDD] rounded px-2 py-1 text-sm"
                />
              </label>
              <label className="space-y-1 col-span-2">
                <div className={labelCls}>Description</div>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  placeholder="Line description"
                  className="w-full border border-[#DDD] rounded px-2 py-1 text-sm"
                />
              </label>
            </div>

            {rowError && (
              <div className="border border-rose-200 bg-rose-50 text-rose-900 rounded px-3 py-2 text-sm">
                {rowError}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#EEE] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={close}
            disabled={submitting}
            className="px-3 py-1.5 text-sm rounded-md border border-[#DDD] text-[#717179] hover:bg-[#F8F8F8] disabled:opacity-40"
          >
            {done ? "Close" : "Cancel"}
          </button>
          {!done && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={skip}
                disabled={submitting}
                className="px-3 py-1.5 text-sm rounded-md border border-[#DDD] text-[#717179] hover:bg-[#F8F8F8] disabled:opacity-40"
              >
                Skip
              </button>
              <button
                type="button"
                onClick={createBill}
                disabled={!ready || submitting}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium rounded-md border",
                  ready && !submitting
                    ? "border-[#013764] bg-[#013764] text-white hover:bg-[#012a4e]"
                    : "border-[#E5E5E5] bg-white text-[#717179]",
                )}
                title={
                  ready
                    ? undefined
                    : "Vendor, property, and GL account are required"
                }
              >
                {submitting
                  ? "Creating…"
                  : idx + 1 >= rows.length
                    ? "Create bill"
                    : "Create bill → next"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
