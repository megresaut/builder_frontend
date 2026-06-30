import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { fetchJSON } from "@/api/fetchJSON";
import { uploadPdf } from "@/api/upload";
import SearchSelect, { type SearchSelectOption } from "@/components/SearchSelect";
import { ConciergeGLPicker } from "@/components/ConciergeGLPicker";
import { BuildiumGLPicker } from "@/components/BuildiumGLPicker";
import {
  createChargeFromStatementRow,
  setStatementAction,
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
}

interface LineItem {
  propertyId: string;
  unitId: string;
  amount: string;
  qboItemId: string;
  buildiumAccountId: string;
  description: string;
}

type Outcome = "ok" | "skipped" | "error" | "pending";

const emptyForm = (): Form => ({ vendorId: "", invoiceNumber: "", memo: "" });

const emptyLineItem = (defaultAmount = ""): LineItem => ({
  propertyId: "",
  unitId: "",
  amount: defaultAmount,
  qboItemId: "",
  buildiumAccountId: "",
  description: "",
});

const formatCents = (c: number): string =>
  (c / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });

// Tokenize and fuzzy-score: fraction of vendor name tokens found in the description.
// Returns the best matching vendor id, or "" if nothing clears the threshold.
function fuzzyMatchVendor(description: string, vendors: SearchSelectOption[]): string {
  if (!description || vendors.length === 0) return "";
  const STOP = new Set(["com", "llc", "inc", "ltd", "the", "and", "for"]);
  const tok = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(t => t.length >= 3 && !STOP.has(t));
  const descSet = new Set(tok(description));
  let bestId = "", bestScore = 0;
  for (const v of vendors) {
    const vToks = tok(v.label);
    if (!vToks.length) continue;
    const hits = vToks.filter(t => descSet.has(t)).length;
    const score = hits / vToks.length;
    if (score > bestScore && score >= 0.5) { bestScore = score; bestId = v.value; }
  }
  return bestId;
}

export default function QuickBillBatchModal({
  open,
  onOpenChange,
  reconciliationID,
  rows,
  onDone,
}: Props) {
  const [vendors, setVendors] = useState<SearchSelectOption[]>([]);
  const [properties, setProperties] = useState<SearchSelectOption[]>([]);
  const [conciergeByProp, setConciergeByProp] = useState<Record<string, boolean>>({});
  const [unitsByProp, setUnitsByProp] = useState<Record<string, SearchSelectOption[]>>({});
  const [loadErr, setLoadErr] = useState<string | null>(null);

  const [idx, setIdx] = useState(0);
  const [form, setForm] = useState<Form>(emptyForm());
  const [lineItems, setLineItems] = useState<LineItem[]>([emptyLineItem()]);
  const [activeLineIdx, setActiveLineIdx] = useState(0);
  const carry = useRef<Partial<Form & LineItem>>({});

  const [outcomes, setOutcomes] = useState<Record<number, Outcome>>({});
  const [rowErrors, setRowErrors] = useState<Record<number, string>>({});

  const [attachFile, setAttachFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  // Build / revoke blob URL for PDF preview
  useEffect(() => {
    if (!attachFile) { setPdfUrl(null); return; }
    const url = URL.createObjectURL(attachFile);
    setPdfUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [attachFile]);

  // Load pickers + reset wizard whenever the modal opens.
  useEffect(() => {
    if (!open) return;
    setIdx(0);
    setForm(emptyForm());
    carry.current = {};
    setOutcomes({});
    setRowErrors({});
    setLoadErr(null);
    Promise.all([fetchJSON("/vendors?limit=5000"), fetchJSON("/properties")])
      .then(([v, p]: [any, any]) => {
        setVendors((v as any[]).map((x) => ({ value: String(x.id), label: x.name })));
        const concierge: Record<string, boolean> = {};
        setProperties(
          (p as any[]).map((x) => {
            concierge[String(x.id)] = x.property_type === "C";
            const rawLabel = x.name || x.address_line1 || `Property ${x.id}`;
            return {
              value: String(x.id),
              label: rawLabel.replace(/^\([A-Z]+\)\s*/, ""),
            };
          }),
        );
        setConciergeByProp(concierge);
      })
      .catch((e) => setLoadErr(e instanceof Error ? e.message : "Failed to load pickers"));
  }, [open]);

  // Initialize form for the current charge.
  useEffect(() => {
    if (!open || idx >= rows.length) return;
    const c = carry.current;
    const row = rows[idx];
    setForm({ vendorId: c.vendorId ?? "", invoiceNumber: "", memo: "" });
    setLineItems([{
      propertyId: c.propertyId ?? "",
      unitId: c.unitId ?? "",
      amount: row ? (row.amount_cents / 100).toFixed(2) : "",
      qboItemId: c.qboItemId ?? "",
      buildiumAccountId: c.buildiumAccountId ?? "",
      description: row?.description ?? "",
    }]);
    setActiveLineIdx(0);
    setAttachFile(null);
    if (c.propertyId) void loadUnits(c.propertyId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, open, rows]);

  // Auto-fill vendor from statement description via fuzzy matching (only when empty / no carry-forward).
  useEffect(() => {
    if (!open || idx >= rows.length || vendors.length === 0) return;
    const matched = fuzzyMatchVendor(rows[idx]?.description ?? "", vendors);
    if (matched) setForm(f => f.vendorId ? f : { ...f, vendorId: matched });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendors, idx, open]);

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

  const activeLI = lineItems[activeLineIdx] ?? lineItems[0] ?? emptyLineItem();
  const updateActiveLI = (patch: Partial<LineItem>) =>
    setLineItems(prev => prev.map((li, i) => i === activeLineIdx ? { ...li, ...patch } : li));
  const isConcierge = activeLI.propertyId ? !!conciergeByProp[activeLI.propertyId] : false;
  const unitOpts = activeLI.propertyId ? unitsByProp[activeLI.propertyId] ?? [] : [];

  const counts = useMemo(() => {
    const v = Object.values(outcomes);
    return {
      ok: v.filter((o) => o === "ok").length,
      skipped: v.filter((o) => o === "skipped").length,
      error: v.filter((o) => o === "error").length,
      pending: v.filter((o) => o === "pending").length,
    };
  }, [outcomes]);

  if (!open) return null;

  const done = idx >= rows.length;
  const current = rows[idx];
  const allLinesReady = lineItems.every(li => {
    const liConcierge = li.propertyId ? !!conciergeByProp[li.propertyId] : false;
    return li.propertyId && (liConcierge ? !!li.qboItemId : !!li.buildiumAccountId);
  });
  const ready = !!(form.vendorId && allLinesReady);
  const hasPdf = attachFile !== null;
  const totalAmountCents = lineItems.reduce((s, li) => s + (Math.round(parseFloat(li.amount || "0") * 100) || 0), 0);

  const advance = () => setIdx((i) => i + 1);

  const skip = async () => {
    if (!current) return;
    try {
      await setStatementAction(reconciliationID, { source_row: current.source_row, action: "defer" });
    } catch { /* best-effort */ }
    setOutcomes((o) => ({ ...o, [current.source_row]: "skipped" }));
    advance();
  };

  const createBill = () => {
    if (!current || !ready) return;
    if (outcomes[current.source_row] === "pending") return; // already in-flight

    // Capture everything before state changes on advance
    const capturedRow = current;
    const capturedForm = { ...form };
    const capturedItems = lineItems.map(li => ({ ...li }));
    const capturedFile = attachFile;

    // Update carry-forward, mark pending, advance immediately
    carry.current = {
      vendorId: capturedForm.vendorId,
      propertyId: capturedItems[0]?.propertyId ?? "",
      unitId: capturedItems[0]?.unitId ?? "",
      qboItemId: capturedItems[0]?.qboItemId ?? "",
      buildiumAccountId: capturedItems[0]?.buildiumAccountId ?? "",
    };
    setOutcomes(o => ({ ...o, [capturedRow.source_row]: "pending" }));
    advance();

    // Fire in background — errors surface in the done screen
    void (async () => {
      try {
        let pdfObjectKey: string | undefined;
        let sha256Pdf: string | undefined;
        if (capturedFile) {
          const up = await uploadPdf(capturedFile);
          pdfObjectKey = up.storage_path;
          sha256Pdf = up.sha256;
        }
        for (const li of capturedItems) {
          const liConcierge = li.propertyId ? !!conciergeByProp[li.propertyId] : false;
          const overrideAmountCents = Math.round(parseFloat(li.amount || "0") * 100) || capturedRow.amount_cents;
          await createChargeFromStatementRow(reconciliationID, {
            statement_row: { ...capturedRow, amount_cents: overrideAmountCents },
            vendor_id: Number(capturedForm.vendorId),
            property_id: Number(li.propertyId),
            unit_id: li.unitId ? Number(li.unitId) : undefined,
            qbo_item_id: liConcierge ? li.qboItemId || undefined : undefined,
            buildium_account_id: liConcierge ? undefined : li.buildiumAccountId || undefined,
            invoice_number: capturedForm.invoiceNumber.trim() || undefined,
            description: li.description.trim() || undefined,
            memo: capturedForm.memo.trim() || undefined,
            pdf_object_key: pdfObjectKey,
            sha256_pdf: sha256Pdf,
          });
        }
        setOutcomes(o => ({ ...o, [capturedRow.source_row]: "ok" }));
      } catch (e) {
        setOutcomes(o => ({ ...o, [capturedRow.source_row]: "error" }));
        setRowErrors(prev => ({ ...prev, [capturedRow.source_row]: e instanceof Error ? e.message : "Failed to create bill" }));
      }
    })();
  };

  const hasPending = counts.pending > 0;

  const close = () => {
    if (hasPending) return; // wait for in-flight requests
    if (counts.ok > 0 || counts.skipped > 0) onDone();
    onOpenChange(false);
  };

  const lbl = "block text-xs font-medium text-[#717179] mb-1";
  const inp = "w-full h-8 px-2.5 rounded-lg border border-[#e5e5e5] bg-white text-sm text-[#303030] focus:outline-none focus:border-[#c0c0c0]";
  const navBtn = "flex items-center justify-center w-6 h-6 rounded border border-[#e5e5e5] bg-white text-[#717179] hover:bg-[#f5f5f5] disabled:opacity-30 disabled:cursor-not-allowed";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        className={cn(
          "bg-white rounded-xl shadow-2xl w-full flex flex-col max-h-[92vh] transition-all duration-200",
          hasPdf ? "max-w-5xl" : "max-w-2xl",
        )}
      >
        {/* Header */}
        <div className="px-5 py-3 border-b border-[#EBEBEB] flex items-center justify-between shrink-0">
          <div>
            <div className="text-base font-semibold text-[#303030]">Quick-bill charges</div>
            <div className="text-xs text-[#717179]">
              {done ? "All charges processed" : `Charge ${idx + 1} of ${rows.length}`}
              {(counts.ok > 0 || counts.skipped > 0 || counts.error > 0 || counts.pending > 0) && (
                <>
                  {" · "}
                  {counts.pending > 0 && <span className="text-blue-500">{counts.pending} saving…</span>}
                  {counts.ok > 0 && <span className="text-emerald-600">{counts.pending > 0 ? ", " : ""}{counts.ok} booked</span>}
                  {counts.skipped > 0 && <span className="text-[#717179]">, {counts.skipped} skipped</span>}
                  {counts.error > 0 && <span className="text-rose-600">, {counts.error} failed</span>}
                </>
              )}
            </div>
          </div>
          <button type="button" onClick={close} disabled={hasPending} className="text-[#717179] hover:text-[#303030] text-lg leading-none w-7 h-7 flex items-center justify-center rounded hover:bg-[#f5f5f5] disabled:opacity-30 disabled:cursor-not-allowed">
            ✕
          </button>
        </div>

        {loadErr && (
          <div className="mx-4 mt-3 border border-rose-200 bg-rose-50 text-rose-900 rounded px-3 py-2 text-sm shrink-0">
            {loadErr}
          </div>
        )}

        {done ? (
          <div className="p-10 text-center flex-1 flex flex-col items-center justify-center gap-3 overflow-y-auto">
            {hasPending ? (
              <>
                <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-xl animate-spin">⟳</div>
                <div className="text-sm text-[#303030] font-medium">{counts.pending} saving in background…</div>
                <div className="text-xs text-[#717179]">Booking to QBO and Buildium. This window will update when complete.</div>
              </>
            ) : (
              <>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${counts.error > 0 ? "bg-rose-50 border-rose-200 text-rose-600" : "bg-emerald-50 border-emerald-200 text-emerald-600"} border`}>
                  {counts.error > 0 ? "!" : "✓"}
                </div>
                <div className="text-sm text-[#303030] font-medium">
                  {counts.ok > 0 && <>{counts.ok} bill{counts.ok === 1 ? "" : "s"} created</>}
                  {counts.skipped > 0 && <>{counts.ok > 0 ? ", " : ""}{counts.skipped} skipped</>}
                  {counts.error > 0 && <span className="text-rose-600">{counts.ok + counts.skipped > 0 ? ", " : ""}{counts.error} failed</span>}
                </div>
                {counts.error > 0 && (
                  <div className="w-full max-w-sm text-left space-y-1 mt-1">
                    {Object.entries(rowErrors).map(([src, msg]) => (
                      <div key={src} className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded px-2 py-1.5">
                        <span className="font-medium">Row {src}:</span> {msg}
                      </div>
                    ))}
                  </div>
                )}
                {counts.ok > 0 && <div className="text-xs text-[#717179]">Booked charges are matched and cleared on the reconciliation.</div>}
                <button onClick={close} className="mt-2 px-4 py-1.5 rounded-lg bg-[#013764] text-white text-sm font-medium hover:bg-[#012A4E]">
                  Done
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="flex flex-row flex-1 overflow-hidden min-h-0">
            {/* ── Form panel ── */}
            <div className="flex-1 min-w-0 overflow-y-auto px-5 py-4 space-y-4">
              {/* Charge card */}
              <div className="rounded-lg border border-[#E5E5E5] bg-[#FAFAFA] px-3 py-2.5 flex items-center justify-between">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-[#303030] truncate">{current?.description || "—"}</div>
                  <div className="text-xs text-[#A1A1A1] mt-0.5">{current?.date} · row {current?.source_row}</div>
                </div>
                <div className="text-base font-semibold text-[#303030] tabular-nums shrink-0 ml-3">
                  {current ? formatCents(current.amount_cents) : ""}
                </div>
              </div>

              {/* Vendor */}
              <div>
                <label className={lbl}>Vendor <span className="text-rose-400">*</span></label>
                <SearchSelect
                  options={vendors}
                  value={form.vendorId}
                  onChange={(v) => setForm((f) => ({ ...f, vendorId: v }))}
                  placeholder="Search vendor…"
                />
              </div>

              {/* Invoice # | Memo */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Invoice #</label>
                  <input
                    type="text"
                    value={form.invoiceNumber}
                    onChange={(e) => setForm((f) => ({ ...f, invoiceNumber: e.target.value }))}
                    placeholder="Optional"
                    className={inp}
                  />
                </div>
                <div>
                  <label className={lbl}>Memo</label>
                  <input
                    type="text"
                    value={form.memo}
                    onChange={(e) => setForm((f) => ({ ...f, memo: e.target.value }))}
                    placeholder="Optional"
                    className={inp}
                  />
                </div>
              </div>

              {/* Line item section */}
              <div className="border-t border-[#EBEBEB] pt-4 space-y-3">
                {/* Navigation header */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#717179] uppercase tracking-wide">
                    Line item {activeLineIdx + 1} of {lineItems.length}
                  </span>
                  <div className="flex items-center gap-1">
                    <button type="button" className={navBtn} disabled={activeLineIdx === 0}
                      onClick={() => setActiveLineIdx(i => Math.max(0, i - 1))}>
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M6.5 1.5L3 5l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                    <button type="button" className={navBtn} disabled={activeLineIdx === lineItems.length - 1}
                      onClick={() => setActiveLineIdx(i => Math.min(lineItems.length - 1, i + 1))}>
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M3.5 1.5L7 5l-3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                    {lineItems.length > 1 && (
                      <button type="button" onClick={() => {
                        setLineItems(prev => prev.filter((_, i) => i !== activeLineIdx));
                        setActiveLineIdx(i => Math.max(0, i - 1));
                      }} className="ml-1 text-xs text-rose-400 hover:text-rose-600 px-1">✕ Remove</button>
                    )}
                  </div>
                </div>

                {/* Property | Unit */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={lbl}>Property <span className="text-rose-400">*</span></label>
                    <SearchSelect
                      options={properties}
                      value={activeLI.propertyId}
                      onChange={(v) => {
                        updateActiveLI({ propertyId: v, unitId: "", qboItemId: "", buildiumAccountId: "" });
                        void loadUnits(v);
                      }}
                      placeholder="Search property…"
                    />
                  </div>
                  <div>
                    <label className={lbl}>Unit</label>
                    <SearchSelect
                      options={unitOpts}
                      value={activeLI.unitId}
                      onChange={(v) => updateActiveLI({ unitId: v })}
                      placeholder={activeLI.propertyId ? "Optional unit…" : "Select property first"}
                      disabled={!activeLI.propertyId || unitOpts.length === 0}
                    />
                  </div>
                </div>

                {/* Amount | Description */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={lbl}>Amount ($) <span className="text-rose-400">*</span></label>
                    <input type="number" step="0.01" value={activeLI.amount}
                      onChange={(e) => updateActiveLI({ amount: e.target.value })}
                      placeholder="0.00" className={inp} />
                  </div>
                  <div>
                    <label className={lbl}>Description</label>
                    <input type="text" value={activeLI.description}
                      onChange={(e) => updateActiveLI({ description: e.target.value })}
                      placeholder="Optional" className={inp} />
                  </div>
                </div>

                {/* GL Account */}
                <div>
                  <label className={lbl}>
                    GL Account <span className="text-rose-400">*</span>
                    {activeLI.propertyId && (
                      <span className="font-normal text-[#A1A1A1] ml-1">
                        ({isConcierge ? "concierge / QBO" : "Buildium"})
                      </span>
                    )}
                  </label>
                  {!activeLI.propertyId ? (
                    <div className="w-full rounded-lg border border-dashed border-[#DDD] px-2.5 h-8 flex items-center text-sm text-[#A1A1A1]">
                      Select a property first
                    </div>
                  ) : isConcierge ? (
                    <ConciergeGLPicker
                      value={activeLI.qboItemId}
                      onChange={(id) => updateActiveLI({ qboItemId: id, buildiumAccountId: "" })}
                    />
                  ) : (
                    <BuildiumGLPicker
                      value={activeLI.buildiumAccountId}
                      onChange={(id) => updateActiveLI({ buildiumAccountId: id, qboItemId: "" })}
                    />
                  )}
                </div>
              </div>

              {/* Attachment */}
              <div className="border-t border-[#EBEBEB] pt-4">
                <label className={lbl}>
                  Attachment <span className="font-normal text-[#A1A1A1]">(optional)</span>
                </label>
                {attachFile ? (
                  <div className="flex items-center gap-2 border border-[#E5E5E5] rounded-lg px-3 py-2 bg-[#FAFAFA]">
                    <span className="text-sm text-[#303030] truncate flex-1">{attachFile.name}</span>
                    <span className="text-xs text-[#A1A1A1]">{(attachFile.size / 1024).toFixed(0)} KB</span>
                    <button
                      type="button"
                      onClick={() => setAttachFile(null)}
                      className="text-[#A1A1A1] hover:text-[#303030] text-base leading-none ml-1 w-5 h-5 flex items-center justify-center"
                    >✕</button>
                  </div>
                ) : (
                  <div
                    className={cn(
                      "border-2 border-dashed rounded-lg px-4 py-5 text-center cursor-pointer transition-colors",
                      dragOver ? "border-[#013764] bg-[#EBF3FB]" : "border-[#E5E5E5] hover:border-[#C0C0C0] bg-[#FAFAFA]",
                    )}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOver(false);
                      const f = e.dataTransfer.files[0];
                      if (f) setAttachFile(f);
                    }}
                  >
                    <div className="text-sm text-[#717179]">Drop a receipt or invoice here</div>
                    <div className="text-xs text-[#A1A1A1] mt-0.5">
                      or <span className="text-[#013764] underline">click to browse</span> · PDF, JPG, PNG
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.eml,.msg"
                      className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) setAttachFile(f); }}
                    />
                  </div>
                )}
              </div>

              {/* Subtotal / Total */}
              <div className="border-t border-[#EBEBEB] pt-3 flex items-center justify-between text-sm">
                <span className="text-[#717179]">Subtotal {formatCents(totalAmountCents)}</span>
                <span className="font-semibold text-[#303030]">Total {formatCents(totalAmountCents)}</span>
              </div>

            </div>

            {/* ── PDF panel ── */}
            {hasPdf && pdfUrl && (
              <div className="w-[480px] shrink-0 border-l border-[#EBEBEB] bg-[#F5F5F5] flex flex-col overflow-hidden">
                <div className="px-4 py-2 border-b border-[#EBEBEB] bg-white flex items-center justify-between">
                  <span className="text-xs font-medium text-[#717179] truncate max-w-[360px]">{attachFile?.name}</span>
                  <button
                    type="button"
                    onClick={() => setAttachFile(null)}
                    className="text-[#A1A1A1] hover:text-[#303030] text-sm leading-none ml-2 shrink-0"
                  >✕</button>
                </div>
                <div className="flex-1 overflow-hidden">
                  {attachFile?.type.startsWith("image/") ? (
                    <img src={pdfUrl} alt="attachment" className="w-full h-full object-contain" />
                  ) : (
                    <iframe
                      src={pdfUrl}
                      title="attachment"
                      className="w-full h-full border-none"
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#EBEBEB] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button type="button" onClick={close} disabled={hasPending}
              className="px-3 py-1.5 text-sm rounded-lg border border-[#DDD] text-[#717179] hover:bg-[#F8F8F8] disabled:opacity-40">
              {done ? "Close" : "Cancel"}
            </button>
            {!done && (
              <button type="button"
                onClick={() => {
                  setLineItems(prev => [...prev, emptyLineItem()]);
                  setActiveLineIdx(lineItems.length);
                }}
                className="px-3 py-1.5 text-sm rounded-lg border border-[#013764] text-[#013764] hover:bg-[#EBF3FB]">
                + Add Line Item
              </button>
            )}
          </div>
          {!done && (
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => void skip()}
                title="Defer this charge (mark it decided) and move to the next"
                className="px-3 py-1.5 text-sm rounded-lg border border-[#DDD] text-[#717179] hover:bg-[#F8F8F8]">
                Skip (defer)
              </button>
              <button type="button" onClick={createBill} disabled={!ready || outcomes[current?.source_row ?? -1] === "pending"}
                title={ready ? undefined : "Vendor, property, and GL account are required for all line items"}
                className={cn(
                  "px-4 py-1.5 text-sm font-medium rounded-lg border",
                  ready && outcomes[current?.source_row ?? -1] !== "pending"
                    ? "border-[#013764] bg-[#013764] text-white hover:bg-[#012a4e]"
                    : "border-[#E5E5E5] bg-white text-[#717179] cursor-not-allowed",
                )}>
                {idx + 1 >= rows.length ? "Create bill" : "Create bill → next"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
