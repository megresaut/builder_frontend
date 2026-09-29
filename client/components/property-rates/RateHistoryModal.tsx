import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import RateImpactNotice from "./RateImpactNotice";
import {
  BASELINE_MONTH,
  deleteRateEntry,
  diffRates,
  fetchRateHistory,
  formatMonthLabel,
  monthKey,
  toRatesInput,
  updateRateEntry,
  type PropertyRates,
  type RateHistoryEntry,
  type RatesInput,
  type RatesResponse,
} from "@/data/propertyRates";

const inputClass =
  "w-full rounded-lg border border-[#DADADA] px-3 py-2 text-sm text-[#303030] focus:outline-none focus:ring-2 focus:ring-[#013764] disabled:bg-[#F5F5F5] disabled:text-[#A3A3A3]";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// Chronological order (oldest first) — the order rates take effect in.
function byEffectiveOrder(a: RateHistoryEntry, b: RateHistoryEntry): number {
  const m = a.effective_month.localeCompare(b.effective_month);
  return m !== 0 ? m : a.id - b.id;
}

type Draft = Record<keyof RatesInput, string> & { effective_month: string; note: string };

function toDraft(e: RateHistoryEntry): Draft {
  const r = toRatesInput(e);
  const s = (v: number | null) => (v == null ? "" : String(v));
  return {
    management_fee: s(r.management_fee),
    hourly_rate: s(r.hourly_rate),
    emergency_hourly_rate: s(r.emergency_hourly_rate),
    late_fee_pct: s(r.late_fee_pct),
    late_fee_flat: s(r.late_fee_flat),
    late_fee_grace_days: s(r.late_fee_grace_days),
    effective_month: monthKey(e.effective_month),
    note: e.note ?? "",
  };
}

function parseDraft(d: Draft): RatesInput {
  const n = (s: string) => {
    const t = s.trim();
    if (t === "") return null;
    const v = Number(t);
    return Number.isFinite(v) ? v : null;
  };
  const grace = n(d.late_fee_grace_days);
  return {
    management_fee: n(d.management_fee),
    hourly_rate: n(d.hourly_rate),
    emergency_hourly_rate: n(d.emergency_hourly_rate),
    late_fee_pct: n(d.late_fee_pct),
    late_fee_flat: n(d.late_fee_flat),
    late_fee_grace_days: grace == null ? null : Math.round(grace),
  };
}

export default function RateHistoryModal({
  propertyId,
  open,
  onClose,
  onRatesChanged,
}: {
  propertyId: number;
  open: boolean;
  onClose: () => void;
  // Called with the rates in effect today after any edit/delete, so the
  // Rates card can refresh.
  onRatesChanged: (rates: RatesResponse) => void;
}) {
  const [entries, setEntries] = useState<RateHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<RateHistoryEntry | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchRateHistory(propertyId);
      setEntries(res.entries ?? []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load rate history");
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    if (open) {
      setEditing(null);
      setDraft(null);
      load();
    }
  }, [open, load]);

  // What each entry changed relative to the rates in effect just before it.
  // Superseded entries (replaced by a later same-month entry) never took
  // effect, so they're skipped when working out "before".
  const changesById = useMemo(() => {
    const out = new Map<number, ReturnType<typeof diffRates>>();
    let prev: PropertyRates | null = null;
    for (const e of [...entries].sort(byEffectiveOrder)) {
      out.set(e.id, diffRates(e.is_baseline ? null : prev, e));
      if (!e.superseded) prev = e;
    }
    return out;
  }, [entries]);

  if (!open) return null;

  const startEdit = (e: RateHistoryEntry) => {
    setEditing(e);
    setDraft(toDraft(e));
    setError(null);
  };

  const saveEdit = async () => {
    if (!editing || !draft) return;
    const input = parseDraft(draft);
    const hasRate = (input.late_fee_pct ?? 0) > 0 || (input.late_fee_flat ?? 0) > 0;
    const hasGrace = (input.late_fee_grace_days ?? 0) > 0;
    if (hasRate !== hasGrace) {
      setError("Late fees need both an amount (percentage and/or flat) and a grace period in days.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await updateRateEntry(propertyId, editing.id, {
        ...input,
        effective_month: editing.is_baseline ? BASELINE_MONTH : draft.effective_month,
        note: draft.note,
      });
      onRatesChanged(res);
      toast.success("Rate entry updated");
      setEditing(null);
      setDraft(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update rate entry");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (e: RateHistoryEntry) => {
    if (!window.confirm(`Cancel the rate change scheduled for ${formatMonthLabel(e.effective_month)}?`)) return;
    try {
      const res = await deleteRateEntry(propertyId, e.id);
      onRatesChanged(res);
      toast.success("Scheduled rate change cancelled");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete rate entry");
    }
  };

  const field = (key: keyof Draft, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div className="grid gap-1">
      <label className="text-xs font-medium text-[#303030]">{label}</label>
      <input
        type="number"
        step="0.01"
        min="0"
        value={draft?.[key] ?? ""}
        onChange={(ev) => setDraft((d) => (d ? { ...d, [key]: ev.target.value } : d))}
        className={inputClass}
        {...props}
      />
    </div>
  );

  return createPortal(
    <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-[680px] max-h-[85vh] flex flex-col rounded-xl bg-white shadow-lg border border-[#E5E5E5]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E5E5]">
          <div>
            <div className="text-[#303030] font-medium text-lg">Rate History</div>
            <div className="text-xs text-[#737373]">
              Invoices bill the rates in effect for the month they cover.
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="h-9 w-9 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center text-[#525252]"
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-4 overflow-y-auto grid gap-3">
          {loading && entries.length === 0 && <div className="text-sm text-[#737373]">Loading…</div>}

          {[...entries].map((e) => {
            const changes = changesById.get(e.id) ?? [];
            const isEditing = editing?.id === e.id && draft;
            return (
              <div
                key={e.id}
                className={`rounded-lg border px-4 py-3 ${e.superseded ? "border-dashed border-[#D4D4D4] bg-[#FAFAFA]" : "border-[#E5E5E5]"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-[#303030]">
                      {e.is_baseline ? "Starting rates" : `From ${formatMonthLabel(e.effective_month)}`}
                      {e.superseded && (
                        <span className="ml-2 text-xs font-normal text-[#737373]">
                          Replaced by a later entry for the same month
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[#737373]">
                      {e.is_baseline && !e.created_by
                        ? "Rates on file before history was tracked"
                        : `Added ${formatDate(e.created_at)}${e.created_by ? ` by ${e.created_by}` : ""}`}
                    </div>
                  </div>
                  {!isEditing && (
                    <div className="flex gap-3 text-sm shrink-0">
                      <button onClick={() => startEdit(e)} className="text-[#2463EB]">
                        Edit
                      </button>
                      {e.deletable && (
                        <button onClick={() => remove(e)} className="text-[#B42318]">
                          Delete
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {!isEditing && (
                  <>
                    <ul className="mt-2 grid gap-0.5 text-sm text-[#303030]">
                      {changes.length === 0 && <li className="text-[#737373]">No rate changes</li>}
                      {changes.map((c) => (
                        <li key={c.label}>
                          <span className="text-[#737373]">{c.label}:</span>{" "}
                          {c.from && <span className="line-through text-[#A3A3A3] mr-1">{c.from}</span>}
                          {c.to}
                        </li>
                      ))}
                    </ul>
                    {e.note && <div className="mt-2 text-xs text-[#525252]">Note: {e.note}</div>}
                    {e.edits.length > 0 && (
                      <div className="mt-2 border-t border-[#F0F0F0] pt-2 grid gap-1">
                        {e.edits.map((ed, i) => {
                          const diffs = diffRates(ed.before, ed.after);
                          const monthMoved = ed.before.effective_month !== ed.after.effective_month;
                          return (
                            <div key={i} className="text-xs text-[#737373]">
                              Edited {formatDate(ed.edited_at)}
                              {ed.edited_by ? ` by ${ed.edited_by}` : ""}:{" "}
                              {[
                                ...diffs.map((d) => `${d.label} ${d.from} → ${d.to}`),
                                ...(monthMoved
                                  ? [`effective ${formatMonthLabel(ed.before.effective_month)} → ${formatMonthLabel(ed.after.effective_month)}`]
                                  : []),
                              ].join("; ") || "note updated"}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}

                {isEditing && draft && (
                  <div className="mt-3 grid gap-3">
                    <div className="grid grid-cols-3 gap-3">
                      {field("management_fee", "Monthly rate ($)")}
                      {field("hourly_rate", "Default rate ($/hr)")}
                      {field("emergency_hourly_rate", "Emergency rate ($/hr)")}
                      {field("late_fee_pct", "Late fee (%)", { max: 100 })}
                      {field("late_fee_flat", "Late fee flat ($)")}
                      {field("late_fee_grace_days", "Grace (days)", { step: 1 })}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="grid gap-1">
                        <label className="text-xs font-medium text-[#303030]">Effective from</label>
                        <input
                          type="month"
                          value={e.is_baseline ? "" : draft.effective_month}
                          disabled={e.is_baseline}
                          placeholder={e.is_baseline ? "Always (starting rates)" : undefined}
                          onChange={(ev) => setDraft((d) => (d ? { ...d, effective_month: ev.target.value } : d))}
                          className={inputClass}
                        />
                      </div>
                      <div className="grid gap-1">
                        <label className="text-xs font-medium text-[#303030]">Note</label>
                        <input
                          type="text"
                          value={draft.note}
                          onChange={(ev) => setDraft((d) => (d ? { ...d, note: ev.target.value } : d))}
                          placeholder="e.g. typo fix"
                          className={inputClass}
                        />
                      </div>
                    </div>
                    <RateImpactNotice
                      propertyId={propertyId}
                      effectiveMonth={e.is_baseline ? BASELINE_MONTH : draft.effective_month}
                      entryId={e.id}
                    />
                    <p className="text-xs text-[#737373]">
                      Corrections also apply to later entries that were carrying
                      the old value forward. The previous values are kept in
                      this entry's edit log.
                    </p>
                    {error && <div className="text-sm text-[#B42318]">{error}</div>}
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setEditing(null);
                          setDraft(null);
                        }}
                        className="h-8 px-3 rounded-lg text-sm hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={saveEdit}
                        disabled={saving}
                        className="h-8 px-3 rounded-lg text-sm text-white bg-[#013764] hover:bg-[#003a73] disabled:opacity-60"
                      >
                        {saving ? "Saving…" : "Save correction"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>,
    document.body,
  );
}
