import { useEffect, useState } from "react";
import {
  fetchRateChangeImpact,
  formatMonthLabel,
  type RateChangeImpact,
} from "@/data/propertyRates";

// Tells the user, before saving, which invoices a rate change effective from
// `effectiveMonth` covers: sent/paid invoices are never rewritten, drafts pick
// the change up the next time they're generated.
export default function RateImpactNotice({
  propertyId,
  effectiveMonth,
  entryId,
}: {
  propertyId: number;
  effectiveMonth: string; // "YYYY-MM"
  entryId?: number;
}) {
  const [impact, setImpact] = useState<RateChangeImpact | null>(null);

  useEffect(() => {
    if (!/^\d{4}-\d{2}$/.test(effectiveMonth)) {
      setImpact(null);
      return;
    }
    let cancelled = false;
    fetchRateChangeImpact(propertyId, effectiveMonth, entryId)
      .then((res) => {
        if (!cancelled) setImpact(res);
      })
      .catch(() => {
        // Informational only; never block the form on it.
        if (!cancelled) setImpact(null);
      });
    return () => {
      cancelled = true;
    };
  }, [propertyId, effectiveMonth, entryId]);

  if (!impact) return null;
  const { locked, drafts, snapshotted_fto_submissions } = impact.impact;
  if (locked.length === 0 && drafts.length === 0 && snapshotted_fto_submissions === 0) {
    return null;
  }

  const fmt = (inv: { invoice_month: string; total_amount: number; status: string }) =>
    `${formatMonthLabel(inv.invoice_month)} (${inv.status}, $${inv.total_amount.toFixed(2)})`;

  return (
    <div className="rounded-lg border border-[#FEDF89] bg-[#FFFAEB] px-3 py-2 text-xs text-[#93370D] grid gap-1">
      {locked.length > 0 && (
        <div>
          <span className="font-medium">Won't change:</span>{" "}
          {locked.map(fmt).join(", ")} — already sent. Correct those on the
          invoice itself if needed.
        </div>
      )}
      {drafts.length > 0 && (
        <div>
          <span className="font-medium">Will update when regenerated:</span>{" "}
          {drafts.map((d) => formatMonthLabel(d.invoice_month)).join(", ")} (draft).
        </div>
      )}
      {snapshotted_fto_submissions > 0 && (
        <div>
          {snapshotted_fto_submissions} field team submission
          {snapshotted_fto_submissions === 1 ? "" : "s"} in this period already
          locked in an hourly rate when submitted and will keep it.
        </div>
      )}
      {impact.until_month && (
        <div className="text-[#B54708]">
          Applies until {formatMonthLabel(impact.until_month)}, when a later
          change takes over.
        </div>
      )}
    </div>
  );
}
