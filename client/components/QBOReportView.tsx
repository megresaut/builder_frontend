import { Fragment, useState } from "react";
import { cn } from "@/lib/utils";
import type {
  QBOColDatum,
  QBOReport,
  QBOReportColumn,
  QBOReportRow,
} from "@/data/qboReports";

interface QBOReportViewProps {
  report: QBOReport;
  // Empty-state message when the report has no rows.
  emptyMessage?: string;
  // When true, top-level sections render with a chevron and can collapse.
  // The flat Transaction List has only a single wrapper section, so it can
  // pass `collapsible={false}` to keep things flat.
  collapsible?: boolean;
}

// QBOReportView renders QBO's native Report structure (Header + Columns + Rows).
// Each row is either a Section (with a nested header / rows / summary) or a
// Data row. The renderer walks the tree recursively so it works for both the
// flat Transaction List and the deeply-nested General Ledger.
//
// Visual conventions:
//   - top-level Sections render as collapsible "account" cards with a colored
//     left rule, bold header, and a subtotal footer
//   - inner Data rows alternate (zebra) for scannability
//   - numeric columns (ColType contains "amount"/"money") are right-aligned
//     with tabular-nums; negative values render in rose
//   - "Beginning Balance" and similar QBO marker rows are italic / muted
//   - the column header is sticky so it stays visible while scrolling
export function QBOReportView({
  report,
  emptyMessage,
  collapsible = true,
}: QBOReportViewProps) {
  const columns: QBOReportColumn[] = report.Columns?.Column ?? [];
  const rows: QBOReportRow[] = report.Rows?.Row ?? [];

  if (columns.length === 0) {
    return (
      <div className="text-sm text-[#717179] py-8 text-center border border-dashed border-[#E5E5E5] rounded-md">
        QBO returned no columns for this report.
      </div>
    );
  }

  if (!rowsHaveData(rows)) {
    return (
      <div className="text-sm text-[#717179] py-8 text-center border border-dashed border-[#E5E5E5] rounded-md">
        {emptyMessage ?? "No transactions in this date range."}
      </div>
    );
  }

  return (
    <div className="border border-[#E5E5E5] rounded-lg overflow-hidden bg-white shadow-sm">
      <div className="overflow-x-auto max-h-[calc(100vh-280px)] overflow-y-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-[#F8F9FB] sticky top-0 z-10 shadow-[0_1px_0_0_#E5E5E5]">
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={cn(
                    "px-3 py-2.5 text-left font-semibold text-[#525252] text-xs uppercase tracking-wide whitespace-nowrap",
                    isNumericColType(col.ColType) && "text-right",
                  )}
                >
                  {col.ColTitle ?? ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <ReportRow
                key={idx}
                row={row}
                columns={columns}
                depth={0}
                collapsible={collapsible}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface ReportRowProps {
  row: QBOReportRow;
  columns: QBOReportColumn[];
  depth: number;
  collapsible: boolean;
}

function ReportRow({ row, columns, depth, collapsible }: ReportRowProps) {
  if (row.type === "Section") {
    return (
      <SectionRow
        row={row}
        columns={columns}
        depth={depth}
        collapsible={collapsible}
      />
    );
  }
  return <DataRow row={row} columns={columns} depth={depth} />;
}

function SectionRow({ row, columns, depth, collapsible }: ReportRowProps) {
  const headerCells = row.Header?.ColData ?? [];
  const summaryCells = row.Summary?.ColData ?? [];
  const childRows = row.Rows?.Row ?? [];

  // Only the top-level section gets the chevron treatment — nested groups
  // (sub-accounts) inherit collapsed state with their parent.
  const isTopLevel = depth === 0;
  const canCollapse = collapsible && isTopLevel && childRows.length > 0;
  const [open, setOpen] = useState(true);

  const sectionTitle =
    headerCells.find((c) => c?.value && c.value.trim() !== "")?.value ?? "";

  if (
    headerCells.length === 0 &&
    summaryCells.length === 0 &&
    childRows.length === 0
  ) {
    return null;
  }

  const isOpen = canCollapse ? open : true;

  return (
    <Fragment>
      {headerCells.length > 0 && (
        <tr
          className={cn(
            "border-t border-[#E5E5E5]",
            isTopLevel
              ? "bg-[#F4F7FB]"
              : depth === 1
                ? "bg-[#FAFBFD]"
                : "bg-white",
            canCollapse && "cursor-pointer hover:bg-[#EEF3F9]",
          )}
          onClick={canCollapse ? () => setOpen((v) => !v) : undefined}
        >
          {columns.map((col, idx) => {
            const cell = headerCells[idx];
            const isFirst = idx === 0;
            return (
              <td
                key={idx}
                className={cn(
                  "px-3 py-2 font-semibold whitespace-nowrap",
                  isTopLevel ? "text-[#013764]" : "text-[#303030]",
                  isFirst && isTopLevel && "border-l-[3px] border-l-[#013764]",
                  isNumericColType(col.ColType) && "text-right tabular-nums",
                  amountClass(col.ColType, cell?.value),
                )}
                style={
                  isFirst
                    ? { paddingLeft: indentPx(depth, isTopLevel) }
                    : undefined
                }
                title={isFirst ? sectionTitle : undefined}
              >
                {isFirst && canCollapse ? (
                  <span className="inline-flex items-center gap-2">
                    <Chevron open={isOpen} />
                    <span>{cell?.value ?? ""}</span>
                  </span>
                ) : (
                  displayValue(col.ColType, cell?.value)
                )}
              </td>
            );
          })}
        </tr>
      )}

      {isOpen &&
        childRows.map((child, idx) => (
          <ReportRow
            key={idx}
            row={child}
            columns={columns}
            depth={depth + 1}
            collapsible={collapsible}
          />
        ))}

      {isOpen && summaryCells.length > 0 && (
        <tr
          className={cn(
            "border-t border-[#E5E5E5]",
            isTopLevel ? "bg-[#F8F9FB]" : "bg-[#FAFAFA]",
          )}
        >
          {columns.map((col, idx) => {
            const cell = summaryCells[idx];
            const isFirst = idx === 0;
            return (
              <td
                key={idx}
                className={cn(
                  "px-3 py-2 font-semibold text-[#303030] whitespace-nowrap",
                  isFirst && isTopLevel && "border-l-[3px] border-l-[#013764]",
                  isNumericColType(col.ColType) && "text-right tabular-nums",
                  amountClass(col.ColType, cell?.value),
                )}
                style={
                  isFirst
                    ? { paddingLeft: indentPx(depth, isTopLevel) }
                    : undefined
                }
              >
                {displayValue(col.ColType, cell?.value)}
              </td>
            );
          })}
        </tr>
      )}
    </Fragment>
  );
}

function DataRow({
  row,
  columns,
  depth,
}: {
  row: QBOReportRow;
  columns: QBOReportColumn[];
  depth: number;
}) {
  const data = row.ColData ?? [];
  if (data.length === 0) return null;

  const firstCellValue = data[0]?.value ?? "";
  const isMarkerRow = isBeginningOrTotalMarker(firstCellValue);

  return (
    <tr
      className={cn(
        "border-t border-[#F1F1F1] transition-colors",
        isMarkerRow
          ? "bg-[#FBFBFC] italic text-[#717179]"
          : "hover:bg-[#F8FAFC] even:bg-[#FCFCFD]",
      )}
    >
      {columns.map((col, idx) => {
        const cell: QBOColDatum | undefined = data[idx];
        const isFirst = idx === 0;
        return (
          <td
            key={idx}
            className={cn(
              "px-3 py-1.5 text-[#303030] whitespace-nowrap",
              isNumericColType(col.ColType) && "text-right tabular-nums",
              amountClass(col.ColType, cell?.value),
            )}
            style={
              isFirst ? { paddingLeft: indentPx(depth + 1, false) } : undefined
            }
          >
            {displayValue(col.ColType, cell?.value)}
          </td>
        );
      })}
    </tr>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      className={cn(
        "transition-transform text-[#013764]",
        open ? "rotate-90" : "rotate-0",
      )}
      aria-hidden="true"
    >
      <path
        d="M4 2.5L7.5 6L4 9.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// formatAmount adds thousands separators to a QBO money string while keeping
// QBO's exact decimal layout. QBO occasionally emits ".00" (no leading zero)
// for zero — preserved as-is. Negatives via leading "-" or surrounding parens
// are both preserved. Non-numeric strings (e.g. "-Split-") pass through.
function formatAmount(raw: string | undefined): string {
  if (!raw) return "";
  const trimmed = raw.trim();
  if (!trimmed) return raw;

  let isParen = false;
  let body = trimmed;
  if (/^\(.+\)$/.test(body)) {
    isParen = true;
    body = body.slice(1, -1);
  }

  const m = body.match(/^(-?)(\d*)(\.\d+)?$/);
  if (!m) return raw;

  const sign = m[1] ?? "";
  const intPart = m[2] ?? "";
  const fracPart = m[3] ?? "";
  if (!intPart && !fracPart) return raw;

  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const out = `${sign}${grouped}${fracPart}`;
  return isParen ? `(${out})` : out;
}

// displayValue formats numeric-column cells with thousands separators and
// otherwise passes the value through unchanged.
function displayValue(colType: string | undefined, raw: string | undefined): string {
  if (raw === undefined || raw === null) return "";
  if (!isNumericColType(colType)) return raw;
  return formatAmount(raw);
}

function isNumericColType(colType?: string): boolean {
  if (!colType) return false;
  const t = colType.toLowerCase();
  return (
    t.includes("amount") ||
    t.includes("money") ||
    t === "rjnfamt" || // QBO's running balance
    t === "balance" ||
    t === "debt" ||
    t === "credit" ||
    t === "debit"
  );
}

// Color negative amounts rose. QBO ships money values as plain strings like
// "-75.35" or "350.00" — leading minus or surrounding parens both indicate
// negative, per QBO's standard formatting.
function amountClass(colType: string | undefined, value: string | undefined) {
  if (!isNumericColType(colType) || !value) return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("-") || /^\(.+\)$/.test(trimmed)) {
    return "text-rose-700";
  }
  return "";
}

// 12px caller indent for top-level rows; each Section nesting adds 16px. The
// top-level header row gets less left-pad because the colored rule already
// provides visual indent.
function indentPx(depth: number, isTopLevelHeader: boolean): number {
  if (isTopLevelHeader) return 16;
  return 16 + depth * 16;
}

// QBO emits "Beginning Balance", "Total for X", "Total — Y" rows mixed in
// with normal data rows. Distinguish them so the report scans as a balanced
// ledger rather than a wall of equal-weight rows.
function isBeginningOrTotalMarker(firstCell: string): boolean {
  const s = firstCell.toLowerCase().trim();
  if (!s) return false;
  return (
    s.startsWith("beginning balance") ||
    s.startsWith("ending balance") ||
    s.startsWith("total for") ||
    s.startsWith("total ") ||
    s === "total"
  );
}

function rowsHaveData(rows: QBOReportRow[]): boolean {
  for (const r of rows) {
    if (r.type === "Section") {
      const headerCells = r.Header?.ColData ?? [];
      const summaryCells = r.Summary?.ColData ?? [];
      const childRows = r.Rows?.Row ?? [];
      if (headerCells.length > 0 || summaryCells.length > 0) return true;
      if (rowsHaveData(childRows)) return true;
    } else if ((r.ColData ?? []).length > 0) {
      return true;
    }
  }
  return false;
}

