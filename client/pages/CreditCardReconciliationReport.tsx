import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { getReport, type Report } from "@/data/credit-card-reconciliation";

const formatCents = (cents: number): string =>
  (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });

// formatDateTime renders an ISO timestamp in the user's local timezone. The
// backend hands us UTC ISO strings; we leave the date intact and use the
// browser locale for the time portion.
const formatDateTime = (iso: string | undefined): string => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
};

const STATUS_BADGE: Record<string, string> = {
  in_progress: "bg-amber-50 text-amber-700 border-amber-200",
  finalized: "bg-emerald-50 text-emerald-700 border-emerald-200",
  needs_review: "bg-rose-50 text-rose-700 border-rose-200",
};

const STATUS_LABEL: Record<string, string> = {
  in_progress: "In progress",
  finalized: "Finalized",
  needs_review: "Needs review",
};

export default function CreditCardReconciliationReport() {
  const { recId } = useParams<{ recId: string }>();
  const navigate = useNavigate();
  const id = recId ? Number(recId) : NaN;

  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!Number.isFinite(id) || id <= 0) {
      setError("Invalid reconciliation id");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const r = await getReport(id);
      setReport(r);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load report");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading && !report) {
    return <div className="p-6 text-sm text-[#717179]">Loading report…</div>;
  }
  if (error && !report) {
    return (
      <div className="p-6">
        <div className="border border-rose-200 bg-rose-50 text-rose-900 rounded-md px-4 py-3 text-sm">
          {error}
        </div>
        <button
          type="button"
          onClick={() => navigate("/reconciliation")}
          className="mt-3 text-sm text-[#013764] underline"
        >
          ← Back to reconciliation
        </button>
      </div>
    );
  }
  if (!report) return null;

  const { reconciliation: rec, account, totals } = report;
  const tied = totals.difference_cents === 0;
  const isInProgress = rec.status === "in_progress";

  return (
    <div className="printable-root flex flex-col gap-6 p-6 max-w-[1400px] print:max-w-none print:p-0 print:gap-4">
      {/*
        Print CSS. The browser's native print dialog turns this view into a
        PDF/paper artifact. We rely on Tailwind's print: variants for hide/show
        utilities and add a small <style> block for things Tailwind can't express
        directly (page margins, page-break rules, hiding the surrounding
        ShellLayout chrome from outside this component).
      */}
      <style>{`
        @media print {
          @page { margin: 0.5in; }
          html, body {
            background: #ffffff !important;
            color: #000000 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            overflow: visible !important;
            height: auto !important;
          }
          /* Hide the ShellLayout chrome (sidebar + header) without touching
             those components directly. They render as <aside> and <header>. */
          aside, header, nav { display: none !important; }
          /* Strip flex/overflow constraints from the layout wrappers so the
             report content can flow naturally onto paper. */
          body *, body *::before, body *::after {
            overflow: visible !important;
          }
          /* Force the main scroll container to expand to content height. */
          [data-testid="main-content"] {
            height: auto !important;
            max-height: none !important;
            overflow: visible !important;
            border-left: none !important;
          }
          /* Tables: allow breaks between rows but not within a row. */
          table { page-break-inside: auto; break-inside: auto; }
          tr { page-break-inside: avoid; break-inside: avoid; }
          thead { display: table-header-group; }
          tfoot { display: table-footer-group; }
          /* Each top-level section should ideally start without splitting its
             heading from its body. */
          section { page-break-inside: auto; break-inside: auto; }
          /* Don't let truncate ellipsize text in print — show the whole note. */
          .printable-root .truncate {
            white-space: normal !important;
            overflow: visible !important;
            text-overflow: clip !important;
            max-width: none !important;
          }
        }
      `}</style>

      <div className="flex items-center justify-between gap-2 flex-wrap print:hidden">
        <div className="flex items-center gap-4 flex-wrap">
          <Link
            to="/reconciliation"
            className="text-sm text-[#013764] hover:underline"
          >
            ← Back to reconciliation
          </Link>
          <Link
            to={`/reconciliations/${rec.id}`}
            className="text-sm text-[#013764] hover:underline"
          >
            ← Workspace
          </Link>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="px-3 py-1.5 text-sm font-medium rounded-md border border-[#E5E5E5] bg-white text-[#303030] hover:bg-[#F8F8F8]"
          title="Print or save as PDF"
        >
          Print
        </button>
      </div>

      {/* Header: account + period + status. */}
      <div className="border border-[#E5E5E5] rounded-md p-4 bg-white">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="text-xs uppercase tracking-wide text-[#A1A1A1] font-medium">
              Reconciliation Report
            </div>
            <div className="text-lg font-semibold text-[#303030] mt-1">
              {account.qbo_name}
            </div>
            <div className="text-sm text-[#717179] mt-0.5">
              {rec.period_start} → {rec.period_end}
              {rec.statement_date && (
                <span className="ml-2 text-[#A1A1A1]">
                  (statement {rec.statement_date})
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isInProgress && (
              <span className="text-[10px] uppercase tracking-wide text-amber-700 font-medium">
                Preview
              </span>
            )}
            <span
              className={cn(
                "px-2 py-1 text-xs font-medium border rounded-md",
                STATUS_BADGE[rec.status] ?? "bg-slate-50 text-slate-700",
              )}
            >
              {STATUS_LABEL[rec.status] ?? rec.status}
            </span>
          </div>
        </div>
      </div>

      {/* Totals table. */}
      <section className="border border-[#E5E5E5] rounded-md bg-white">
        <div className="px-4 py-3 border-b border-[#F0F0F0]">
          <div className="text-sm font-semibold text-[#303030]">Balance summary</div>
          <div className="text-xs text-[#717179] mt-0.5">
            Difference = beginning + cleared − ending. Should be {formatCents(0)} when the
            reconciliation ties.
          </div>
        </div>
        <table className="w-full text-sm">
          <tbody>
            <tr className="border-b border-[#F0F0F0]">
              <td className="px-4 py-2 text-[#717179]">Beginning balance</td>
              <td className="px-4 py-2 text-right tabular-nums text-[#303030]">
                {formatCents(totals.beginning_cents)}
              </td>
            </tr>
            <tr className="border-b border-[#F0F0F0]">
              <td className="px-4 py-2 text-[#717179]">Cleared total</td>
              <td className="px-4 py-2 text-right tabular-nums text-[#303030]">
                {formatCents(totals.cleared_cents)}
              </td>
            </tr>
            <tr className="border-b border-[#F0F0F0]">
              <td className="px-4 py-2 text-[#717179]">Ending balance</td>
              <td className="px-4 py-2 text-right tabular-nums text-[#303030]">
                {formatCents(totals.ending_cents)}
              </td>
            </tr>
            <tr>
              <td className="px-4 py-2 font-semibold text-[#303030]">Difference</td>
              <td
                className={cn(
                  "px-4 py-2 text-right tabular-nums font-semibold",
                  tied ? "text-emerald-700" : "text-rose-700",
                )}
              >
                {formatCents(totals.difference_cents)}
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* Cleared lines. */}
      <section className="border border-[#E5E5E5] rounded-md bg-white">
        <div className="px-4 py-3 border-b border-[#F0F0F0] flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-[#303030]">
              Cleared transactions ({report.cleared_lines.length})
            </div>
            <div className="text-xs text-[#717179] mt-0.5">
              QBO transactions confirmed as cleared against this reconciliation.
            </div>
          </div>
          <div className="text-sm text-[#717179] tabular-nums">
            {formatCents(totals.cleared_cents)}
          </div>
        </div>
        {report.cleared_lines.length === 0 ? (
          <div className="p-6 text-sm text-[#717179] text-center">
            No transactions cleared.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#FAFAFA] text-xs text-[#717179] uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">Date</th>
                  <th className="px-4 py-2 text-left font-medium">Source</th>
                  <th className="px-4 py-2 text-left font-medium">Type</th>
                  <th className="px-4 py-2 text-left font-medium">Doc #</th>
                  <th className="px-4 py-2 text-left font-medium">Vendor</th>
                  <th className="px-4 py-2 text-left font-medium">Memo</th>
                  <th className="px-4 py-2 text-right font-medium">Amount</th>
                  <th className="px-4 py-2 text-left font-medium">Match</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F0F0]">
                {report.cleared_lines.map((line) => {
                  const isForced = line.match_confidence === "forced";
                  return (
                    <tr key={line.id} className="hover:bg-[#F8F8F8]">
                      <td className="px-4 py-2 text-[#303030] whitespace-nowrap">
                        {line.txn_date}
                      </td>
                      <td className="px-4 py-2 text-[#303030] uppercase text-xs">
                        {line.source_system === "buildium" ? "Buildium" : "QBO"}
                      </td>
                      <td className="px-4 py-2 text-[#303030]">
                        {line.qbo_txn_type}
                      </td>
                      <td className="px-4 py-2 text-[#717179] tabular-nums">
                        {line.qbo_doc_num || "—"}
                      </td>
                      <td className="px-4 py-2 text-[#303030]">
                        {line.qbo_vendor || "—"}
                      </td>
                      <td className="px-4 py-2 text-[#717179] max-w-[280px] truncate">
                        {line.qbo_memo || "—"}
                      </td>
                      <td className="px-4 py-2 text-right text-[#303030] tabular-nums whitespace-nowrap">
                        {formatCents(line.amount_cents)}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[#717179]">
                            {line.match_confidence}
                          </span>
                          {isForced && (
                            <span
                              className="px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide rounded border border-amber-200 bg-amber-50 text-amber-800"
                              title={
                                line.force_clear_reason ||
                                "Force-cleared without statement counterpart"
                              }
                            >
                              forced
                            </span>
                          )}
                        </div>
                        {isForced && line.force_clear_reason && (
                          <div className="text-xs text-[#A1A1A1] mt-0.5 italic max-w-[220px]">
                            {line.force_clear_reason}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Resolved statement rows. */}
      <section className="border border-[#E5E5E5] rounded-md bg-white">
        <div className="px-4 py-3 border-b border-[#F0F0F0]">
          <div className="text-sm font-semibold text-[#303030]">
            Resolved statement rows ({report.resolved_statement_rows.length})
          </div>
          <div className="text-xs text-[#717179] mt-0.5">
            Statement rows explicitly deferred or disputed by the operator.
          </div>
        </div>
        {report.resolved_statement_rows.length === 0 ? (
          <div className="p-6 text-sm text-[#717179] text-center">
            No resolved statement rows.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#FAFAFA] text-xs text-[#717179] uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">Date</th>
                  <th className="px-4 py-2 text-left font-medium">Description</th>
                  <th className="px-4 py-2 text-right font-medium">Amount</th>
                  <th className="px-4 py-2 text-left font-medium">Action</th>
                  <th className="px-4 py-2 text-left font-medium">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F0F0]">
                {report.resolved_statement_rows.map((r) => {
                  const isDispute = r.action === "dispute";
                  const badgeClass = isDispute
                    ? "border-rose-200 bg-rose-50 text-rose-800"
                    : "border-amber-200 bg-amber-50 text-amber-800";
                  return (
                    <tr
                      key={`${r.source_row}-${r.date}-${r.amount_cents}`}
                      className="hover:bg-[#F8F8F8]"
                    >
                      <td className="px-4 py-2 text-[#303030] whitespace-nowrap">
                        {r.date}
                      </td>
                      <td className="px-4 py-2 text-[#303030] max-w-[360px] truncate">
                        {r.description || "—"}
                      </td>
                      <td className="px-4 py-2 text-right text-[#303030] tabular-nums whitespace-nowrap">
                        {formatCents(r.amount_cents)}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <span
                          className={cn(
                            "px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide rounded border",
                            badgeClass,
                          )}
                        >
                          {r.action ?? "—"}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-[#717179] max-w-[320px] truncate">
                        {r.action_note || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Statement file + signoffs. */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border border-[#E5E5E5] rounded-md bg-white p-4">
          <div className="text-sm font-semibold text-[#303030] mb-2">
            Statement file
          </div>
          {report.statement_file ? (
            <div className="text-sm text-[#303030]">
              <div className="font-medium truncate">
                {report.statement_file.filename || report.statement_file.object_key}
              </div>
              {report.statement_file.mime && (
                <div className="text-xs text-[#A1A1A1] mt-0.5">
                  {report.statement_file.mime}
                </div>
              )}
              {report.statement_file.uploaded_at && (
                <div className="text-xs text-[#717179] mt-1">
                  Uploaded {formatDateTime(report.statement_file.uploaded_at)}
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-[#717179]">No statement uploaded.</div>
          )}
        </div>

        <div className="border border-[#E5E5E5] rounded-md bg-white p-4">
          <div className="text-sm font-semibold text-[#303030] mb-2">Signoff</div>
          <dl className="text-sm space-y-2">
            <div className="flex justify-between gap-4">
              <dt className="text-[#717179]">Created</dt>
              <dd className="text-right text-[#303030]">
                {report.created_by ? (
                  <>
                    {formatDateTime(report.created_by.at)}
                    {report.created_by.user_id != null && (
                      <span className="ml-2 text-[#A1A1A1]">
                        (user #{report.created_by.user_id})
                      </span>
                    )}
                  </>
                ) : (
                  "—"
                )}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[#717179]">Finalized</dt>
              <dd className="text-right text-[#303030]">
                {report.finalized_by ? (
                  <>
                    {formatDateTime(report.finalized_by.at)}
                    {report.finalized_by.user_id != null && (
                      <span className="ml-2 text-[#A1A1A1]">
                        (user #{report.finalized_by.user_id})
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-[#A1A1A1]">Not finalized</span>
                )}
              </dd>
            </div>
            {rec.notes && (
              <div className="pt-2 border-t border-[#F0F0F0]">
                <dt className="text-[#717179] mb-1">Notes</dt>
                <dd className="text-xs text-[#303030] whitespace-pre-wrap">
                  {rec.notes}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </section>
    </div>
  );
}
