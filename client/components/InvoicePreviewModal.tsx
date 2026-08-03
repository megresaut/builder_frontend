import { Fragment, useRef, useState, useEffect, type CSSProperties } from "react";
import { flushSync } from "react-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent as AlertDialogContentRoot,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import html2pdf from "html2pdf.js";
import ExcelJS from "exceljs";
import { AVMRE_LOGO_DATA_URI } from "./invoicing/avmreLogo";

export interface InvoiceLineItem {
  id: number;
  vendor: string;
  description: string;
  amount: string;
  billDate?: string;
  billInvoiceNumber?: string;
  // FTO-hours metadata (blank for other line types).
  rate?: number;
  qty?: number;
  managerCount?: number;
  travelChargeCents?: number;
  // Raw backend source_type ("management_fee", "fto_hours", "vendor", ...).
  // Drives the summary/detail split: fto_hours lines are rolled up into a
  // single "Man Hours" summary line on page 1 and itemized in the page-2
  // Field Team breakdown.
  sourceType?: string;
}

// LifecycleStatus drives the lifecycle banner + Commit gating in the preview
// modal. 'draft' = at least one passthrough line has NO vendor bill recorded
// at all (payment_status unknown / not_booked) — the only hard send blocker;
// 'ready' = export unlocked, which may still include passthrough bills AVMRE
// hasn't paid yet (unpaid never blocks); 'sent' = already exported (record
// payment now); 'paid' = fully closed; 'void' = cancelled. Values mirror the
// backend's deriveStatusFor.
export type InvoiceLifecycleStatus =
  | "draft"
  | "ready"
  | "sent"
  | "paid"
  | "void"
  | undefined;

// One `payment_status="unpaid"` passthrough line (source_type vendor /
// utility / fto_expense): the vendor bill exists, AVMRE just hasn't paid it
// yet. Unpaid no longer blocks sending — these lines are itemized in the
// pre-send "Review before sending" confirmation instead. Shaped by the
// Invoicing page from GET /invoicing/line-items-expanded.
export interface UnpaidPassthroughLine {
  vendor: string;
  description: string;
  // Dollars, not cents — the API already converts, and this is the
  // merged/billed amount (base + any folded markup), not the vendor payable
  // — see the amount cell in the "Review before sending" dialog below.
  amount: number;
  // Populated for source_type="vendor" lines from the bill, and often for
  // "utility" (falls back to the utility account number) and "fto_expense"
  // (once linked to a bill) too — see GetLineItemsExpanded. Can still be
  // absent for any of these, in which case the table falls back to
  // `description`.
  billInvoiceNumber?: string | null;
  // Non-empty when someone paid out of pocket and is owed a reimbursement.
  payeeName?: string | null;
}

interface InvoicePreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyAddress: string;
  propertyLocation: string;
  billTo: string;
  invoiceDate: string;
  lineItems: InvoiceLineItem[];
  showCommitButton?: boolean;
  onCommit?: (pdfBlob: Blob) => void;
  /**
   * One entry per per-location document to render at commit time, in attachment
   * order (the admin location first). Empty or absent = a single combined PDF.
   */
  locationSplits?: Array<{
    key: string;
    label: string;
    locationId: number | null;
    lineItemIds: number[];
  }>;
  /**
   * Called instead of onCommit when locationSplits is non-empty. `combined` is
   * the full unfiltered invoice (the QBO/audit copy, which must reconcile against
   * the QBO invoice total); `splits` are the per-location documents, in the order
   * given, that get emailed to the owner.
   */
  onCommitSplits?: (
    combined: Blob,
    splits: Array<{
      key: string;
      label: string;
      locationId: number | null;
      blob: Blob;
    }>,
  ) => void;
  pendingUnapprovedCount?: number;
  rentalOwner?: string;
  // Lifecycle additions (Phase 3).
  derivedStatus?: InvoiceLifecycleStatus;
  // Unpaid-but-booked passthrough lines — the single source of truth for every
  // "unpaid" surface in this modal (status banner + pre-send review dialog).
  // Non-empty ⇒ the review dialog itemizes them; it never blocks the send.
  unpaidPassthroughLines?: UnpaidPassthroughLine[];
  onRecordPayment?: () => void;
  qboPushStatus?: string | null;
  qboLastError?: string | null;
  onRetryQBOSync?: () => void;
  // Line-void (migration 090). When the invoice is sent/paid and onVoidLine is
  // provided, the per-line remove control bubbles the backend
  // invoice_line_items.id up to the parent, which runs the void-confirm dialog
  // (base+markup preview, new total, close-out flag) instead of the draft-only
  // client-side remove.
  invoiceStatus?: InvoiceLifecycleStatus;
  onVoidLine?: (lineId: number) => void;
  // Auto re-export (after a void): when true, the modal renders the updated
  // invoice, generates a fresh PDF, and hands the blob to onReExport — the
  // parent uploads + re-attaches it to the QBO invoice, then closes the modal.
  autoReExport?: boolean;
  onReExport?: (pdfBlob: Blob) => void | Promise<void>;
  // Real DB invoice id, rendered as "Invoice#: INV-0042" in the header.
  invoiceId?: number | null;
  // Overpayment rolled over from a previous invoice and applied to this one
  // (cents). Renders a PAYMENTS row and reduces TOTAL.
  rolloverPaymentCents?: number | null;
  // Dispute credit rolled over from a previous invoice and applied to this
  // one (cents). Renders a CREDITS row and reduces TOTAL.
  disputeCreditCents?: number | null;
}

export default function InvoicePreviewModal({
  open,
  onOpenChange,
  propertyAddress,
  propertyLocation,
  billTo,
  invoiceDate,
  lineItems: initialLineItems,
  showCommitButton = false,
  onCommit,
  locationSplits,
  onCommitSplits,
  pendingUnapprovedCount = 0,
  rentalOwner,
  derivedStatus,
  unpaidPassthroughLines = [],
  onRecordPayment,
  qboPushStatus,
  qboLastError,
  onRetryQBOSync,
  invoiceStatus,
  onVoidLine,
  autoReExport,
  onReExport,
  invoiceId,
  rolloverPaymentCents,
  disputeCreditCents,
}: InvoicePreviewModalProps) {
  const invoiceRef = useRef<HTMLDivElement | null>(null);
  const [lineItems, setLineItems] =
    useState<InvoiceLineItem[]>(initialLineItems);
  const [activeAmountId, setActiveAmountId] = useState<number | null>(null);
  const [amountDraftById, setAmountDraftById] = useState<
    Record<number, string>
  >({});
  const [showCommitConfirm, setShowCommitConfirm] = useState(false);
  // Guards both commit paths (direct + reviewed) against a second click while
  // generatePdfBlob()/onCommit are in flight — see handleCommit and the
  // "Review before sending" confirm handler.
  const [committing, setCommitting] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  // Non-null only for the few milliseconds while the commit loop captures one
  // location's document: the rendered table is narrowed to that subset, then
  // restored. See paintSubset / runCommitSplits.
  const [renderSubsetIds, setRenderSubsetIds] = useState<number[] | null>(null);
  // Layout exploration: true renders AVMRE LLC lines in a full-column table
  // and all other vendors in a slim table (no Rate/Qty/Manager/Travel Charge).
  const [splitLayout, setSplitLayout] = useState(true);

  const normalizeAmountDraft = (value: string): string => {
    const cleaned = value.replace(/[^\d.]/g, "");
    const firstDot = cleaned.indexOf(".");
    if (firstDot === -1) return cleaned;

    const intPart = cleaned.slice(0, firstDot);
    const decPart = cleaned.slice(firstDot + 1).replace(/\./g, "");
    return `${intPart}.${decPart}`;
  };

  const toCanonicalAmount = (value: string): string => {
    const draft = normalizeAmountDraft(value);
    const num = parseFloat(draft);
    return Number.isFinite(num) ? num.toFixed(2) : "0.00";
  };

  // Format number as currency with commas (e.g., "1234.56" -> "$1,234.56")
  const formatCurrency = (value: string | number): string => {
    const num =
      typeof value === "string"
        ? parseFloat(value.replace(/[$,]/g, ""))
        : value;

    if (isNaN(num)) return "$0.00";

    return "$" + num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // FTO-hours metadata columns (Rate/Qty/Manager/Travel Charge) render as
  // plain numbers, no currency symbol — matches the reference template.
  const formatPlainNumber = (value: number | undefined): string => {
    if (value == null || isNaN(value)) return "";
    return Number.isInteger(value) ? String(value) : value.toFixed(2);
  };

  // Placeholder for cells with no value (e.g. the management-fee line has no
  // bill date or reference number) — an em dash reads cleaner than a blank.
  const EMPTY_CELL = "—";

  // Parses the date-only portion as local calendar components — `new
  // Date("2026-06-01")` parses as UTC midnight, which renders as the prior
  // day in any timezone behind UTC.
  const formatShortDate = (billDate: string | undefined): string => {
    if (!billDate) return "";
    const [year, month, day] = billDate.split("T")[0].split("-").map(Number);
    if (!year || !month || !day) return "";
    return `${month}/${day}`;
  };

  // FTO-hours descriptions are generated server-side with the date already
  // baked in (e.g. "6/13 Meeting with Dolce Plumbing (1.00 hrs)") — strip it
  // so it isn't shown twice now that Date has its own column.
  const stripLeadingDate = (description: string): string =>
    description.replace(/^\d{1,2}\/\d{1,2}\s+/, "");

  // Invoice number = a property/owner differentiator (from the Services
  // Provided To block: property street number + owner surname) plus a
  // month-year tail (e.g. Nov 2026 -> "1126"). e.g. INV-544SYKE-0626. The
  // tail falls back to the padded DB id if the invoice date can't be parsed,
  // and the differentiator is dropped when neither piece is available.
  const buildInvoiceNumber = (): string => {
    if (invoiceId == null) return "";
    const propNum = (propertyAddress.match(/\d+/)?.[0] ?? "").slice(0, 5);
    const surname = (rentalOwner || billTo || "").trim().split(/\s+/).pop() ?? "";
    const ownerTok = surname.replace(/[^A-Za-z]/g, "").toUpperCase().slice(0, 4);
    const diff = `${propNum}${ownerTok}`;

    let tail = String(invoiceId).padStart(4, "0");
    const d = new Date(invoiceDate);
    if (!isNaN(d.getTime())) {
      tail =
        String(d.getMonth() + 1).padStart(2, "0") +
        String(d.getFullYear() % 100).padStart(2, "0");
    }
    return diff ? `INV-${diff}-${tail}` : `INV-${tail}`;
  };

  // Sync state when props change
  useEffect(() => {
    setLineItems(
      initialLineItems.map((item) => ({
        ...item,
        amount: toCanonicalAmount(item.amount),
      })),
    );
    setActiveAmountId(null);
    setAmountDraftById({});
  }, [initialLineItems]);

  const calculateTotal = () => {
    return lineItems.reduce((sum, item) => {
      // Extract numeric value, handles both raw numbers and formatted currency
      const amount = parseFloat(item.amount.replace(/[^\d.]/g, "")) || 0;
      return sum + amount;
    }, 0);
  };

  const getNextLineItemId = () => {
    return lineItems.reduce((max, item) => Math.max(max, item.id), 0) + 1;
  };

  const handleAddLineItem = () => {
    const nextItem: InvoiceLineItem = {
      id: getNextLineItemId(),
      vendor: "",
      description: "",
      amount: "0.00",
    };

    setLineItems((prev) => [...prev, nextItem]);
  };

  const handleRemoveLineItem = (id: number) => {
    setLineItems(lineItems.filter((item) => item.id !== id));
  };

  // On an issued (sent/paid) invoice the per-line control voids server-side
  // rather than just dropping the row from the local PDF. The void recomputes
  // the total and re-syncs the reduced invoice to QBO; the parent reloads.
  const isIssuedInvoice =
    invoiceStatus === "sent" || invoiceStatus === "paid";
  const canVoidLines = isIssuedInvoice && typeof onVoidLine === "function";

  const handleLineRemoveOrVoid = (id: number) => {
    if (canVoidLines) {
      // Issued invoice: hand the backend line id to the parent, which opens the
      // void-confirm dialog (shows base+markup, new total, close-out) and calls
      // the void endpoint. Draft invoices fall through to the local remove.
      onVoidLine!(id);
      return;
    }
    handleRemoveLineItem(id);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.setData("text/plain", String(index));
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setDragImage(e.currentTarget, 0, 0);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);
    const dragIndex = draggedIndex;
    if (dragIndex == null || dragIndex === dropIndex) return;
    setLineItems((prev) => {
      const next = [...prev];
      const [removed] = next.splice(dragIndex, 1);
      // Insert so the dropped row ends up exactly at the highlighted row's position
      next.splice(dropIndex, 0, removed);
      return next;
    });
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleUpdateLineItem = (
    id: number,
    field: keyof InvoiceLineItem,
    value: string,
  ) => {
    setLineItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  };

  // Format amount with commas for final display
  const formatAmountWithCommas = (amount: string): string => {
    const num = parseFloat(amount.replace(/[^\d.]/g, "")) || 0;
    return "$" + num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Auto-grow the editable textareas so long vendor names / descriptions wrap
  // to the next line in the viewer instead of getting cut off.
  const autoResizeTextarea = (el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${el.scrollHeight}px`;
  };

  const isAvmreItem = (item: InvoiceLineItem) =>
    (item.vendor || "").trim().toUpperCase() === "AVMRE LLC";

  // AVMRE man-hour labor lines (source_type="fto_hours"). In the split layout
  // these are collapsed into a single "Man Hours" summary line on page 1 and
  // itemized in the page-2 Field Team breakdown.
  const isLaborItem = (item: InvoiceLineItem) =>
    (item.sourceType || "") === "fto_hours";

  const amountToNumber = (amount: string): number =>
    parseFloat(amount.replace(/[^\d.]/g, "")) || 0;

  // Rows keep their index into the underlying lineItems array so editing /
  // drag-reorder / removal keep working when the display is split in two.
  //
  // The subset filter is applied AFTER the map so each surviving row keeps its
  // original index — every downstream grouping and total derives from this one
  // array, so narrowing it here is what makes a per-location PDF a faithful view
  // of the same document rather than a separately-built one.
  const indexedLineItems = lineItems
    .map((item, index) => ({ item, index }))
    .filter(
      ({ item }) =>
        renderSubsetIds === null || renderSubsetIds.includes(item.id),
    );

  // Individual man-hour lines — rolled up on page 1, itemized on page 2.
  const laborRows = indexedLineItems.filter(({ item }) => isLaborItem(item));
  const laborTotalHours = laborRows.reduce(
    (sum, { item }) => sum + (item.qty ?? 0),
    0,
  );
  const laborTotalAmount = laborRows.reduce(
    (sum, { item }) => sum + amountToNumber(item.amount),
    0,
  );
  const laborSummary =
    splitLayout && laborRows.length > 0
      ? { hours: laborTotalHours, amount: laborTotalAmount }
      : null;

  // Split layout renders a single untitled table: AVMRE non-labor lines
  // (management fee, credits) first, then the collapsed "Man Hours" summary,
  // then the passthrough vendor charges. laborSummaryAfterCount marks where
  // the summary row is injected (right after the AVMRE rows). Single layout is
  // the flat, uncollapsed comparison view.
  const avmreNonLaborRows = indexedLineItems.filter(
    ({ item }) => isAvmreItem(item) && !isLaborItem(item),
  );
  const passthroughRows = indexedLineItems.filter(
    ({ item }) => !isAvmreItem(item),
  );
  const tableGroups = splitLayout
    ? [
        {
          key: "invoice",
          title: null,
          rows: [...avmreNonLaborRows, ...passthroughRows],
          laborSummary,
          laborSummaryAfterCount: avmreNonLaborRows.length,
        },
      ]
    : [
        {
          key: "all",
          title: null,
          rows: indexedLineItems,
          laborSummary: null as { hours: number; amount: number } | null,
          laborSummaryAfterCount: 0,
        },
      ];

  // Page 1's Service Provided column absorbs all the table's slack width, so its
  // text would otherwise hug the Date column and leave a wide gap before
  // Reference#. Indenting header + cells together sits the block in that space.
  const SERVICE_PROVIDED_PAD_LEFT = "60px";

  // Column headers carry the same alignment + edge padding as the cells below
  // them, so each label sits directly over its own data (left-aligned text
  // columns would otherwise read as centered over the wrong column).
  type InvoiceColumn = {
    label: string;
    width?: string;
    align?: CSSProperties["textAlign"];
    padLeft?: string;
    padRight?: string;
  };

  // Page 1 (the invoice itself) stays deliberately slim: the FTO-hours metadata
  // (Rate / Qty / Manager / Travel Charge) only belongs on the page-2 Field Team
  // breakdown, so it isn't repeated here.
  const invoiceColumns: InvoiceColumn[] = [
    { label: "Service Provider", width: "130px", align: "left", padLeft: "6px" },
    { label: "Date", width: "52px" },
    {
      label: "Service Provided",
      align: "left",
      padLeft: SERVICE_PROVIDED_PAD_LEFT,
    },
    { label: "Reference#", width: "80px" },
    { label: "Amount", width: "85px", align: "right", padRight: "6px" },
  ];

  // Page 2 — Field Team labor detail. Carries the metadata columns, drops
  // Reference# (man-hour lines have no vendor invoice behind them).
  const laborColumns: InvoiceColumn[] = [
    { label: "Service Provider", width: "110px", align: "left", padLeft: "6px" },
    { label: "Date", width: "52px" },
    { label: "Service Provided", align: "left", padLeft: "10px" },
    { label: "Rate", width: "38px" },
    { label: "Qty", width: "44px" },
    { label: "Manager", width: "48px" },
    { label: "Travel Charge", width: "60px" },
    { label: "Amount", width: "75px", align: "right", padRight: "6px" },
  ];

  const renderColumnHeader = (col: InvoiceColumn) => (
    <th
      key={col.label}
      style={{
        textAlign: col.align ?? "center",
        paddingTop: "6px",
        paddingBottom: "6px",
        paddingLeft: col.padLeft ?? "4px",
        paddingRight: col.padRight ?? "4px",
        borderTop: "1px solid #002060",
        borderBottom: "3px double #002060",
        font: "italic 700 9px/16.5px Arial, sans-serif",
        ...(col.width ? { width: col.width, minWidth: col.width } : {}),
      }}
    >
      {col.label}
    </th>
  );

  // Month label for the collapsed labor line, e.g. "May Hours". Derived from
  // the invoice date (mirrors the "May Management Fee" wording); falls back to
  // the first token of the date string, then to "Man".
  const invoiceMonthLabel = (() => {
    const d = new Date(invoiceDate);
    if (!isNaN(d.getTime())) {
      return d.toLocaleString("en-US", { month: "long" });
    }
    const first = (invoiceDate || "").trim().split(/\s+/)[0] ?? "";
    return /^[A-Za-z]+$/.test(first) ? first : "Man";
  })();

  // Collapsed month-hours line for the merged invoice table (e.g. "May Hours").
  // Read-only rollup of every fto_hours line; injected between the AVMRE rows
  // and the vendor charges. `stripeGray` continues the table's zebra striping.
  const renderManHoursSummaryRow = (
    summary: { hours: number; amount: number },
    stripeGray: boolean,
  ) => (
    <tr
      key="man-hours-summary"
      style={{ backgroundColor: stripeGray ? "#F5F6F8" : "#FFFFFF" }}
    >
      <td
        style={{
          paddingTop: "5px",
          paddingBottom: "5px",
          paddingLeft: "6px",
          verticalAlign: "middle",
          color: "#002060",
          font: "400 9px/16.5px Arial, sans-serif",
        }}
      >
        AVMRE LLC
      </td>
      <td
        style={{
          paddingTop: "5px",
          paddingBottom: "5px",
          textAlign: "center",
          verticalAlign: "middle",
          color: "#002060",
          font: "400 9px Arial, sans-serif",
          whiteSpace: "nowrap",
        }}
      >
        {EMPTY_CELL}
      </td>
      <td
        style={{
          paddingTop: "5px",
          paddingBottom: "5px",
          paddingLeft: SERVICE_PROVIDED_PAD_LEFT,
          paddingRight: "10px",
          textAlign: "left",
          verticalAlign: "middle",
          color: "#002060",
          font: "400 9px/16.5px Arial, sans-serif",
        }}
      >
        {`${invoiceMonthLabel} Hours`}
      </td>
      <td
        style={{
          paddingTop: "5px",
          paddingBottom: "5px",
          textAlign: "center",
          verticalAlign: "middle",
          color: "#002060",
          font: "400 8px/14px Arial, sans-serif",
        }}
      >
        {EMPTY_CELL}
      </td>
      <td
        style={{
          paddingTop: "5px",
          paddingBottom: "5px",
          paddingRight: "6px",
          paddingLeft: "8px",
          textAlign: "right",
          verticalAlign: "middle",
          color: "#002060",
          font: "400 9px/16.5px Arial, sans-serif",
        }}
      >
        {formatAmountWithCommas(String(summary.amount))}
      </td>
    </tr>
  );

  // Each rendered "page" is a letter-size sheet (816x1056px). On screen the
  // shadow + gap make the page splits visible; both are stripped from the PDF
  // clone (see handleDownloadPDF / generatePdfBlob) so exported pages stack
  // flush. minHeight (not fixed height) lets an over-long page grow rather
  // than clip — html2pdf then row-breaks it cleanly.
  const pageStyle: CSSProperties = {
    width: "816px",
    minHeight: "1056px",
    padding: "60px 72px",
    backgroundColor: "white",
    fontFamily: "Inter, -apple-system, Roboto, Helvetica, sans-serif",
    color: "#002060",
    boxSizing: "border-box",
    boxShadow: "0 1px 8px rgba(0,0,0,0.18)",
    marginBottom: "16px",
    // Flex column so the payment footer can sink to the bottom of each sheet
    // (marginTop:auto on the footer). In the PDF clone minHeight is removed, so
    // there's no free space and the footer sits directly under the content.
    display: "flex",
    flexDirection: "column",
  };

  // Rendered at the bottom of every page sheet so the payment terms repeat on
  // each page. A function (not a shared element) so each call is a fresh node.
  const renderFooter = () => (
    <div
      className="pdf-avoid-break"
      style={{
        marginTop: "auto",
        paddingTop: "24px",
        fontSize: "8px",
        lineHeight: "15px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div>Please make all checks payable to AVMRE LLC</div>
      <div>
        If you have any questions concerning this invoice, use the following
        contact information:
      </div>
      <div>203-987-7050</div>
      <div style={{ color: "#0563C1" }}>
        <a
          href="mailto:STAFF@AVMRE.COM"
          style={{ color: "inherit", textDecoration: "none" }}
        >
          STAFF@AVMRE.COM
        </a>
      </div>
      <div>THANK YOU FOR YOUR BUSINESS!</div>

      <div style={{ marginTop: "10px" }}>
        If you prefer to wire transfer the payment please use the following
        info:
      </div>
      <div>Bank: Connecticut Community Bank, N.A.</div>
      <div>ABA#: 021113251</div>
      <div>Account#: 1419944</div>
    </div>
  );

  const handleDownloadPDF = async () => {
    const invoiceNode = invoiceRef.current;
    if (!invoiceNode) return;

    const clone = invoiceNode.cloneNode(true) as HTMLElement;

    // Update print-only spans with formatted values
    clone
      .querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
        "input.edit-field, textarea.edit-field",
      )
      .forEach((input) => {
        const container = input.parentElement;
        const span =
          container?.querySelector<HTMLSpanElement>("span.print-only");
        if (!span) return;

        const field = input.dataset.field;
        span.textContent =
          field === "amount"
            ? formatAmountWithCommas(input.value)
            : input.value;
      });

    // Remove interactive elements
    clone.querySelectorAll(".no-print").forEach((el) => el.remove());
    clone.querySelectorAll(".edit-field").forEach((el) => el.remove());

    // Strip the on-screen page-sheet chrome (drop shadow + inter-page gap) so
    // exported pages stack flush and don't bleed shadows into the raster.
    // minHeight is cleared too: a sheet that exactly fills a PDF page plus the
    // forced page-break on the next sheet produced a blank page in between.
    // With natural height the break lands cleanly on the next page.
    clone.querySelectorAll<HTMLElement>(".invoice-page").forEach((el) => {
      el.style.boxShadow = "none";
      el.style.margin = "0";
      el.style.minHeight = "0";
    });

    // Make print-only content visible for screen rendering (PDF capture uses screen styles)
    clone.querySelectorAll<HTMLElement>(".print-only").forEach((el) => {
      el.classList.remove("print-only");
      if (!el.style.display) el.style.display = "inline";
    });

    const element = document.createElement("div");
    element.style.width = "816px";
    element.style.padding = "0";
    element.style.margin = "0";
    element.style.background = "white";
    element.appendChild(clone);

    const opt: any = {
      margin: 0,
      filename: "invoice.pdf",
      image: { type: "png", quality: 1 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: false,
        allowTaint: true,
        letterRendering: true,
        backgroundColor: "#ffffff",
      },
      jsPDF: {
        unit: "px",
        format: [816, 1056],
        orientation: "portrait",
        compress: true,
      },
      // Keep rows intact across page breaks, and push whole sections
      // (title + table), the totals block, and the footer to the next page
      // when they'd otherwise be sliced (only if they fit on one page —
      // over-long tables still flow with clean row-level breaks).
      pagebreak: {
        mode: ["css", "legacy"],
        before: [".pdf-page-break-before"],
        avoid: ["tr", ".pdf-avoid-break"],
      },
    };

    try {
      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  const handleExportToExcel = async () => {
    // Create workbook and worksheet matching the "Concierge Billing Invoice Template.xlsx" exactly
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("CURRENT MONTH", {
      views: [{ showGridLines: false }], // Hide gridlines to match template
    });

    // Define colors matching the template
    const darkBlueHex = "FF002060";
    const goldHex = "FFBF8F00";
    const lightGreyHex = "FFF2F2F2";
    const emailBlueHex = "FF0563C1";

    // Set column widths to match template layout exactly
    // Template has columns A (narrow), B (vendor/company), C (description), D (amount/property)
    worksheet.getColumn(1).width = 2.5;   // Column A - very narrow margin
    worksheet.getColumn(2).width = 22;    // Column B - Company info / Bill To / Vendors
    worksheet.getColumn(3).width = 50;    // Column C - Description (wider for merged content)
    worksheet.getColumn(4).width = 20;    // Column D - Invoice / Property / Amount

    // Helper function to set cell style
    const setCellStyle = (
      cell: ExcelJS.Cell,
      options: {
        bold?: boolean;
        fontSize?: number;
        color?: string;
        alignment?: Partial<ExcelJS.Alignment>;
        fill?: string;
        underline?: boolean;
        numFmt?: string;
        italic?: boolean;
      }
    ) => {
      cell.font = {
        name: "Calibri",
        bold: options.bold ?? false,
        size: options.fontSize ?? 11,
        color: options.color ? { argb: options.color } : { argb: darkBlueHex },
        underline: options.underline ? "single" : undefined,
        italic: options.italic ?? false,
      };
      if (options.alignment) {
        cell.alignment = { vertical: "middle", ...options.alignment };
      } else {
        cell.alignment = { vertical: "middle" };
      }
      if (options.fill) {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: options.fill },
        };
      }
      if (options.numFmt) {
        cell.numFmt = options.numFmt;
      }
    };

    // Set row heights to match template spacing
    worksheet.getRow(1).height = 21;  // Company name row
    worksheet.getRow(2).height = 15;  // Address line 1
    worksheet.getRow(3).height = 15;  // Address line 2
    worksheet.getRow(4).height = 15;  // City/State/Zip
    worksheet.getRow(5).height = 15;  // Phone
    worksheet.getRow(6).height = 10;  // Empty spacer
    worksheet.getRow(7).height = 10;  // Empty spacer
    worksheet.getRow(8).height = 18;  // Bill To / Property labels
    worksheet.getRow(9).height = 15;  // Name / Address line 1
    worksheet.getRow(10).height = 15; // Name / Address line 2
    worksheet.getRow(11).height = 10; // Empty spacer
    worksheet.getRow(12).height = 20; // Table headers

    // ========== ROW 1: Company Name & Invoice Title ==========
    // Merge B1:C1 for company name
    worksheet.mergeCells("B1:C1");
    worksheet.getCell("B1").value = "AVMRE LLC";
    setCellStyle(worksheet.getCell("B1"), {
      bold: true,
      fontSize: 18,
      color: darkBlueHex,
      alignment: { horizontal: "left" },
    });

    // D1: INVOICE
    worksheet.getCell("D1").value = "INVOICE";
    setCellStyle(worksheet.getCell("D1"), {
      bold: true,
      fontSize: 18,
      color: darkBlueHex,
      alignment: { horizontal: "right" },
    });

    // ========== ROW 2: Address Line 1 & Date ==========
    // Merge B2:C2 for address
    worksheet.mergeCells("B2:C2");
    worksheet.getCell("B2").value = "11 LARGO DRIVE SOUTH";
    setCellStyle(worksheet.getCell("B2"), { fontSize: 11, color: darkBlueHex });

    // D2: DATE: [Invoice Date]
    worksheet.getCell("D2").value = `DATE: ${invoiceDate}`;
    setCellStyle(worksheet.getCell("D2"), {
      fontSize: 11,
      color: darkBlueHex,
      alignment: { horizontal: "right" },
    });

    // ========== ROW 3: Address Line 2 ==========
    // Merge B3:C3 for address
    worksheet.mergeCells("B3:C3");
    worksheet.getCell("B3").value = "SUITE 200";
    setCellStyle(worksheet.getCell("B3"), { fontSize: 11, color: darkBlueHex });

    // ========== ROW 4: City/State/Zip ==========
    // Merge B4:C4 for address
    worksheet.mergeCells("B4:C4");
    worksheet.getCell("B4").value = "STAMFORD, CT 06907";
    setCellStyle(worksheet.getCell("B4"), { fontSize: 11, color: darkBlueHex });

    // ========== ROW 5: Phone ==========
    // Merge B5:C5 for phone
    worksheet.mergeCells("B5:C5");
    worksheet.getCell("B5").value = "203-987-7050";
    setCellStyle(worksheet.getCell("B5"), {
      bold: true,
      fontSize: 11,
      color: darkBlueHex,
    });

    // ========== ROW 6-7: Empty spacer rows ==========

    // ========== ROW 8: Bill To & Property Labels ==========
    // Merge B8:C8 for BILL TO label
    worksheet.mergeCells("B8:C8");
    worksheet.getCell("B8").value = "BILL TO:";
    setCellStyle(worksheet.getCell("B8"), {
      bold: true,
      fontSize: 11,
      color: darkBlueHex,
    });

    // D8: PROPERTY:
    worksheet.getCell("D8").value = "PROPERTY:";
    setCellStyle(worksheet.getCell("D8"), {
      bold: true,
      fontSize: 11,
      color: darkBlueHex,
      alignment: { horizontal: "right" },
    });

    // ========== ROW 9: Bill To Name Line 1 / Property Address ==========
    const ownerName = rentalOwner || billTo;
    // Split name if it contains "&" or comma for two-line display
    const ownerLines = ownerName.includes("&") 
      ? ownerName.split("&").map(s => s.trim())
      : ownerName.includes(",")
        ? ownerName.split(",").map(s => s.trim())
        : [ownerName];
    
    // Merge B9:C9 for name
    worksheet.mergeCells("B9:C9");
    worksheet.getCell("B9").value = ownerLines[0] + (ownerLines.length > 1 ? " &" : "");
    setCellStyle(worksheet.getCell("B9"), { fontSize: 11, color: darkBlueHex });

    // D9: Property Address
    worksheet.getCell("D9").value = propertyAddress;
    setCellStyle(worksheet.getCell("D9"), {
      fontSize: 11,
      color: darkBlueHex,
      alignment: { horizontal: "right" },
    });

    // ========== ROW 10: Bill To Name Line 2 / Property Location ==========
    // Merge B10:C10 for name continuation
    worksheet.mergeCells("B10:C10");
    if (ownerLines.length > 1) {
      worksheet.getCell("B10").value = ownerLines[1];
      setCellStyle(worksheet.getCell("B10"), { fontSize: 11, color: darkBlueHex });
    }

    // D10: Property Location (City, State Zip)
    if (propertyLocation) {
      worksheet.getCell("D10").value = propertyLocation;
      setCellStyle(worksheet.getCell("D10"), {
        fontSize: 11,
        color: darkBlueHex,
        alignment: { horizontal: "right" },
      });
    }

    // ========== ROW 11: Empty spacer ==========

    // ========== ROW 12: Table Headers ==========
    // B12: Vendor
    worksheet.getCell("B12").value = "Vendor";
    setCellStyle(worksheet.getCell("B12"), {
      bold: true,
      fontSize: 11,
      color: darkBlueHex,
    });
    worksheet.getCell("B12").border = {
      bottom: { style: "medium", color: { argb: goldHex } },
    };

    // C12: Description
    worksheet.getCell("C12").value = "Description";
    setCellStyle(worksheet.getCell("C12"), {
      bold: true,
      fontSize: 11,
      color: darkBlueHex,
    });
    worksheet.getCell("C12").border = {
      bottom: { style: "medium", color: { argb: goldHex } },
    };

    // D12: AMOUNT
    worksheet.getCell("D12").value = "AMOUNT";
    setCellStyle(worksheet.getCell("D12"), {
      bold: true,
      fontSize: 11,
      color: darkBlueHex,
      alignment: { horizontal: "right" },
    });
    worksheet.getCell("D12").border = {
      bottom: { style: "medium", color: { argb: goldHex } },
    };

    // ========== ROWS 13+: Line Items ==========
    let currentRow = 13;
    lineItems.forEach((item) => {
      // Set row height for line items
      worksheet.getRow(currentRow).height = 18;
      
      // Parse amount as number (remove $ and commas)
      const amount = parseFloat(item.amount.replace(/[^\d.]/g, "")) || 0;

      // Column B: Vendor
      worksheet.getCell(`B${currentRow}`).value = item.vendor;
      setCellStyle(worksheet.getCell(`B${currentRow}`), {
        fontSize: 11,
        color: darkBlueHex,
      });
      worksheet.getCell(`B${currentRow}`).border = {
        bottom: { style: "thin", color: { argb: goldHex } },
      };

      // Column C: Description
      worksheet.getCell(`C${currentRow}`).value = item.description;
      setCellStyle(worksheet.getCell(`C${currentRow}`), {
        fontSize: 11,
        color: darkBlueHex,
      });
      worksheet.getCell(`C${currentRow}`).border = {
        bottom: { style: "thin", color: { argb: goldHex } },
      };

      // Column D: Amount (as number with currency format)
      worksheet.getCell(`D${currentRow}`).value = amount;
      setCellStyle(worksheet.getCell(`D${currentRow}`), {
        fontSize: 11,
        color: darkBlueHex,
        alignment: { horizontal: "right" },
        fill: lightGreyHex,
        numFmt: '"$"#,##0.00',
      });
      worksheet.getCell(`D${currentRow}`).border = {
        bottom: { style: "thin", color: { argb: goldHex } },
      };

      currentRow++;
    });

    // ========== SEPARATOR ROW: Gold line after last line item ==========
    const separatorRow = currentRow;
    worksheet.getRow(separatorRow).height = 8; // Short separator row
    // Add a thick gold border spanning B to D (like in the template)
    worksheet.getCell(`B${separatorRow}`).border = {
      top: { style: "medium", color: { argb: goldHex } },
    };
    worksheet.getCell(`C${separatorRow}`).border = {
      top: { style: "medium", color: { argb: goldHex } },
    };
    worksheet.getCell(`D${separatorRow}`).border = {
      top: { style: "medium", color: { argb: goldHex } },
    };

    // ========== Empty row before total ==========
    const emptyRow = separatorRow + 1;
    worksheet.getRow(emptyRow).height = 12;

    // ========== TOTAL ROW ==========
    const totalRow = emptyRow + 1;
    worksheet.getRow(totalRow).height = 22;

    // C[totalRow]: TOTAL:
    worksheet.getCell(`C${totalRow}`).value = "TOTAL:";
    setCellStyle(worksheet.getCell(`C${totalRow}`), {
      bold: true,
      fontSize: 11,
      color: darkBlueHex,
      alignment: { horizontal: "right" },
    });

    // D[totalRow]: Total Amount (as number with gold border box)
    const total = calculateTotal();
    worksheet.getCell(`D${totalRow}`).value = total;
    setCellStyle(worksheet.getCell(`D${totalRow}`), {
      bold: true,
      fontSize: 11,
      color: darkBlueHex,
      alignment: { horizontal: "right" },
      fill: lightGreyHex,
      numFmt: '"$"#,##0.00',
    });
    worksheet.getCell(`D${totalRow}`).border = {
      top: { style: "medium", color: { argb: goldHex } },
      bottom: { style: "medium", color: { argb: goldHex } },
      left: { style: "medium", color: { argb: goldHex } },
      right: { style: "medium", color: { argb: goldHex } },
    };

    // ========== FOOTER ROWS ==========
    const footerStartRow = totalRow + 1;

    // Footer row 1: Please make all checks payable...
    worksheet.getRow(footerStartRow).height = 18;
    worksheet.mergeCells(`B${footerStartRow}:D${footerStartRow}`);
    worksheet.getCell(`B${footerStartRow}`).value = "Please make all checks payable to AVMRE LLC";
    setCellStyle(worksheet.getCell(`B${footerStartRow}`), {
      bold: true,
      fontSize: 10,
      color: darkBlueHex,
    });

    // Footer row 2: If you have any questions...
    worksheet.getRow(footerStartRow + 1).height = 18;
    worksheet.mergeCells(`B${footerStartRow + 1}:D${footerStartRow + 1}`);
    worksheet.getCell(`B${footerStartRow + 1}`).value =
      "If you have any questions concerning this invoice, use the following contact information:";
    setCellStyle(worksheet.getCell(`B${footerStartRow + 1}`), {
      fontSize: 10,
      color: darkBlueHex,
    });

    // Footer row 3: Phone
    worksheet.getRow(footerStartRow + 2).height = 18;
    worksheet.mergeCells(`B${footerStartRow + 2}:D${footerStartRow + 2}`);
    worksheet.getCell(`B${footerStartRow + 2}`).value = "203-987-7050";
    setCellStyle(worksheet.getCell(`B${footerStartRow + 2}`), {
      fontSize: 10,
      color: darkBlueHex,
    });

    // Footer row 4: Email (with hyperlink style)
    worksheet.getRow(footerStartRow + 3).height = 18;
    worksheet.mergeCells(`B${footerStartRow + 3}:D${footerStartRow + 3}`);
    worksheet.getCell(`B${footerStartRow + 3}`).value = {
      text: "STAFF@AVMRE.COM",
      hyperlink: "mailto:STAFF@AVMRE.COM",
    };
    setCellStyle(worksheet.getCell(`B${footerStartRow + 3}`), {
      fontSize: 10,
      color: emailBlueHex,
      underline: true,
    });

    // Footer row 5: Thank you
    worksheet.getRow(footerStartRow + 4).height = 18;
    worksheet.mergeCells(`B${footerStartRow + 4}:D${footerStartRow + 4}`);
    worksheet.getCell(`B${footerStartRow + 4}`).value = "THANK YOU FOR YOUR BUSINESS!";
    setCellStyle(worksheet.getCell(`B${footerStartRow + 4}`), {
      bold: true,
      fontSize: 10,
      color: darkBlueHex,
    });

    // ========== PAGE SETUP ==========
    // Set print area and page margins to match template
    worksheet.pageSetup = {
      paperSize: 9, // A4
      orientation: "portrait",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: {
        left: 0.5,
        right: 0.5,
        top: 0.5,
        bottom: 0.5,
        header: 0.3,
        footer: 0.3,
      },
    };

    // Generate filename
    const fileName = `invoice_${invoiceDate.replace(/\s+/g, "_")}.xlsx`;

    // Write file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const generatePdfBlob = async (): Promise<Blob> => {
    const invoiceNode = invoiceRef.current;
    if (!invoiceNode) {
      throw new Error("Invoice DOM not ready");
    }
  
    const clone = invoiceNode.cloneNode(true) as HTMLElement;
  
    clone.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
      "input.edit-field, textarea.edit-field",
    ).forEach((input) => {
      const span = document.createElement("span");
      const field = input.dataset.field;
      span.textContent =
        field === "amount"
          ? formatAmountWithCommas(input.value)
          : input.value;
  
      input.replaceWith(span);
    });
  
    clone.querySelectorAll(".no-print").forEach((el) => el.remove());

    // Strip on-screen page-sheet chrome so exported pages stack flush; clear
    // minHeight so a full-height sheet + forced break doesn't emit a blank page.
    clone.querySelectorAll<HTMLElement>(".invoice-page").forEach((el) => {
      el.style.boxShadow = "none";
      el.style.margin = "0";
      el.style.minHeight = "0";
    });

    const container = document.createElement("div");
    container.style.width = "816px";
    container.style.background = "white";
    container.appendChild(clone);
  
    // Typed as any because html2pdf.js's bundled type.d.ts omits the
    // pagebreak option its pagebreak plugin supports (same pattern as the
    // download handler's opt).
    const opt: any = {
      margin: 0,
      html2canvas: { scale: 2 },
      jsPDF: { unit: "px", format: [816, 1056] },
      pagebreak: {
        mode: ["css", "legacy"],
        before: [".pdf-page-break-before"],
        avoid: ["tr", ".pdf-avoid-break"],
      },
    };
    return await html2pdf()
      .set(opt)
      .from(container)
      .outputPdf("blob");
  };

  // Auto re-export after a void: once the modal is open with the updated lines
  // rendered, generate a fresh PDF and hand it to the parent (which re-attaches
  // it to QBO). The delay lets the invoice DOM settle with the new line set.
  useEffect(() => {
    if (!open || !autoReExport || typeof onReExport !== "function") return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const blob = await generatePdfBlob();
        if (!cancelled) await onReExport(blob);
      } catch (err) {
        console.error("[invoice] auto re-export failed", err);
      }
    }, 700);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // generatePdfBlob/onReExport are stable enough for this one-shot effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, autoReExport]);


  // Pre-send review. Two soft warnings share one dialog (never two sequential
  // confirms): passthrough lines whose bill AVMRE hasn't paid yet, and lines
  // still awaiting bill approval. Neither blocks sending — the only hard
  // blocker is a line with no vendor bill recorded at all, which the backend
  // reports as derivedStatus === "draft" and which disables the button.
  const hasUnpaidPassthrough = unpaidPassthroughLines.length > 0;
  const hasUnapprovedLines = pendingUnapprovedCount > 0;
  const needsPreSendReview = hasUnpaidPassthrough || hasUnapprovedLines;

  const unpaidPassthroughTotal = unpaidPassthroughLines.reduce(
    (sum, line) => sum + (Number(line.amount) || 0),
    0,
  );

  // Unreimbursed out-of-pocket expenses, summed per payee.
  const unpaidPayeeTotals = unpaidPassthroughLines.reduce<
    Record<string, number>
  >((acc, line) => {
    const payee = (line.payeeName ?? "").trim();
    if (!payee) return acc;
    acc[payee] = (acc[payee] ?? 0) + (Number(line.amount) || 0);
    return acc;
  }, {});
  const unpaidPayeeEntries = Object.entries(unpaidPayeeTotals);

  // Force the subset into the DOM and wait for the browser to actually paint it.
  //
  // flushSync is load-bearing, not defensive: React 18 batches state updates
  // inside async functions, so without it html2canvas photographs the PREVIOUS
  // subset and every location's PDF silently contains the wrong lines. The
  // double requestAnimationFrame then waits for the paint that follows the commit.
  const paintSubset = async (ids: number[] | null) => {
    flushSync(() => setRenderSubsetIds(ids));
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
  };

  // Renders the combined document plus one per location. The combined PDF is
  // captured with the subset cleared, so it is always the FULL invoice regardless
  // of any on-screen location filter — that PDF is attached to the QBO invoice and
  // has to reconcile against its total.
  const runCommitSplits = async () => {
    const splits = locationSplits ?? [];
    try {
      await paintSubset(null);
      const combined = await generatePdfBlob();

      const rendered: Array<{
        key: string;
        label: string;
        locationId: number | null;
        blob: Blob;
      }> = [];
      for (const split of splits) {
        await paintSubset(split.lineItemIds);
        rendered.push({
          key: split.key,
          label: split.label,
          locationId: split.locationId,
          blob: await generatePdfBlob(),
        });
      }
      return { combined, rendered };
    } finally {
      // Always restore the full view, even on a mid-loop failure, so the operator
      // is never left looking at a partial invoice they might mistake for the real
      // one.
      await paintSubset(null);
    }
  };

  const handleCommit = async () => {
    if (needsPreSendReview) {
      setShowCommitConfirm(true);
      return;
    }
    if (committing) return;

    setCommitting(true);
    try {
      const splits = locationSplits ?? [];
      if (splits.length > 0 && onCommitSplits) {
        const { combined, rendered } = await runCommitSplits();
        onCommitSplits(combined, rendered);
      } else {
        const pdfBlob = await generatePdfBlob();
        onCommit?.(pdfBlob);
      }
      onOpenChange(false);
    } catch (err) {
      console.error("Failed to generate PDF:", err);
    } finally {
      setCommitting(false);
    }
  };
  


  
  return (
    <>
      <style>{`
        @media screen {
          .print-only {
            display: none !important;
          }
        }
      `}</style>
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setShowCommitConfirm(false);
          }
          onOpenChange(nextOpen);
        }}
      >
        <DialogContent className="max-w-[95vw] md:max-w-[880px] max-h-[95vh] flex flex-col p-0">
          <DialogTitle className="sr-only">Invoice Preview</DialogTitle>

          {derivedStatus && (
            <div
              className={
                "no-print flex-shrink-0 px-6 py-3 text-sm font-medium border-b " +
                (derivedStatus === "draft"
                  ? "bg-amber-50 border-amber-200 text-amber-900"
                  : derivedStatus === "ready"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                  : derivedStatus === "sent"
                  ? "bg-blue-50 border-blue-200 text-blue-900"
                  : derivedStatus === "paid"
                  ? "bg-gray-100 border-gray-200 text-gray-700"
                  : "bg-rose-50 border-rose-200 text-rose-900")
              }
            >
              {/* DRAFT means a passthrough line has no vendor bill recorded at
                  all — the one hard blocker. Unpaid-but-booked bills are NOT a
                  blocker, so they only ever appear as a secondary note on the
                  READY banner. Copy mirrors the Invoicing page's status badge. */}
              {derivedStatus === "draft" && (
                <>
                  <span className="font-semibold">DRAFT</span> · A line item has
                  no vendor bill recorded. Cannot send until the bill is
                  recorded.
                </>
              )}
              {derivedStatus === "ready" && (
                <>
                  <span className="font-semibold">READY</span> · Ready to send.
                  {hasUnpaidPassthrough
                    ? ` ${unpaidPassthroughLines.length} passthrough bill${
                        unpaidPassthroughLines.length === 1 ? "" : "s"
                      } not yet paid by AVMRE — review before sending.`
                    : " All passthrough bills paid."}
                </>
              )}
              {derivedStatus === "sent" && (
                <span className="flex items-center justify-between gap-3">
                  <span>
                    <span className="font-semibold">SENT</span> · Invoice
                    exported. Record payment when received.
                  </span>
                  {onRecordPayment && (
                    <button
                      type="button"
                      onClick={onRecordPayment}
                      className="px-3 py-1 rounded-md bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
                    >
                      Record Payment
                    </button>
                  )}
                </span>
              )}
              {derivedStatus === "paid" && (
                <>
                  <span className="font-semibold">PAID</span> · Invoice closed.
                </>
              )}
              {derivedStatus === "void" && (
                <>
                  <span className="font-semibold">VOID</span> · Invoice
                  cancelled.
                </>
              )}
              {qboPushStatus === "failed" && (
                <div className="mt-1 text-xs text-rose-700 flex items-center gap-2">
                  <span>QBO sync failed{qboLastError ? `: ${qboLastError}` : ""}.</span>
                  {onRetryQBOSync && (
                    <button
                      type="button"
                      onClick={onRetryQBOSync}
                      className="underline hover:no-underline"
                    >
                      Retry sync
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex-1 overflow-y-auto bg-gray-200 flex flex-col items-center p-4">
            {/* Layout exploration toggle — lives outside the invoiceRef
                capture node, so it never appears in the generated PDF. */}
            <button
              type="button"
              onClick={() => setSplitLayout((v) => !v)}
              className="no-print mb-2 rounded border border-[#013764] px-3 py-1 text-xs font-medium text-[#013764] hover:bg-gray-50 bg-white"
            >
              {splitLayout
                ? "Layout: collapsed man-hours — click to expand all line items"
                : "Layout: all line items — click to collapse man-hours"}
            </button>
            {/* Invoice Container — holds one or more letter-size page sheets
                (816x1056px). Page 1 = invoice; page 2 = Field Team labor
                detail. The gray backdrop + per-page shadow make the page
                splits visible on screen (stripped from the exported PDF). */}
            <div
              ref={invoiceRef}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              {/* Page 1 */}
              <div className="invoice-page" style={pageStyle}>
              {/* Header Section: logo (left) / company info (right) */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "5px",
                }}
              >
                <img
                  src={AVMRE_LOGO_DATA_URI}
                  alt="Absolute Value Property Management"
                  style={{ width: "220px", height: "auto", marginTop: "2px" }}
                />

                <div style={{ textAlign: "right" }}>
                  <div style={{ font: "700 10px/15.4px Arial, sans-serif" }}>
                    AVMRE LLC
                  </div>
                  <div style={{ font: "700 10px/15.4px Arial, sans-serif" }}>
                    11 LARGO DRIVE SOUTH
                  </div>
                  <div style={{ font: "700 10px/15.4px Arial, sans-serif" }}>
                    SUITE 200
                  </div>
                  <div style={{ font: "700 10px/15.4px Arial, sans-serif" }}>
                    STAMFORD, CT 06907
                  </div>
                  <div style={{ font: "700 10px/15.4px Arial, sans-serif" }}>
                    203-987-7050
                  </div>
                </div>
              </div>

              {/* Services Provided To (left) \u2014 Invoice meta (right) */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: "30px",
                  marginBottom: "5px",
                }}
              >
                <div style={{ width: "300px" }}>
                  <div
                    style={{
                      marginBottom: "4px",
                      paddingBottom: "2px",
                      borderBottom: "1px solid #002060",
                      font: "700 9px/15px Arial, sans-serif",
                    }}
                  >
                    Services Provided To
                  </div>
                  <div style={{ font: "400 9px/16.5px Arial, sans-serif" }}>
                    {rentalOwner || billTo}
                  </div>
                  <div style={{ font: "400 9px/16.5px Arial, sans-serif" }}>
                    {propertyAddress}
                  </div>
                  <div style={{ font: "400 9px/16.5px Arial, sans-serif" }}>
                    {propertyLocation}
                  </div>
                </div>

                <div style={{ width: "220px" }}>
                  <div
                    style={{
                      paddingBottom: "4px",
                      marginBottom: "4px",
                      borderBottom: "1px solid #002060",
                      font: "700 11px/16px Arial, sans-serif",
                    }}
                  >
                    INVOICE
                  </div>
                  {invoiceId != null && (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        font: "400 10px/16px Arial, sans-serif",
                      }}
                    >
                      <span>Invoice#:</span>
                      <span>{buildInvoiceNumber()}</span>
                    </div>
                  )}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      font: "400 10px/16px Arial, sans-serif",
                    }}
                  >
                    <span>DATE:</span>
                    <span>{invoiceDate}</span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      font: "400 10px/16px Arial, sans-serif",
                    }}
                  >
                    <span>DUE DATE:</span>
                    <span>Upon Receipt</span>
                  </div>
                </div>
              </div>

              {/* Line-item table(s) — split layout renders AVMRE LLC rows in a
                  full-column table and passthrough vendor rows in a slim one,
                  each under its own section title. */}
              {tableGroups.map((group) => (
              <div
                key={group.key}
                className="pdf-avoid-break"
                style={{ marginBottom: "28px" }}
              >
                {group.title && (
                  <div
                    style={{
                      font: "italic 700 11px/16px Arial, sans-serif",
                      marginBottom: "3px",
                    }}
                  >
                    {group.title}
                  </div>
                )}
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  tableLayout: "fixed",
                }}
              >
                <thead>
                  <tr>
                    {invoiceColumns.map(renderColumnHeader)}
                  </tr>
                </thead>
                <tbody>
                  {/* Summary sits first when there are no AVMRE rows above it. */}
                  {group.laborSummary &&
                    group.laborSummaryAfterCount === 0 &&
                    renderManHoursSummaryRow(group.laborSummary, false)}
                  {group.rows.map(({ item, index }, localIdx) => {
                    // Visual position accounts for the injected summary row so
                    // the zebra striping stays alternating across the merge.
                    const visualIdx =
                      group.laborSummary &&
                      localIdx >= group.laborSummaryAfterCount
                        ? localIdx + 1
                        : localIdx;
                    return (
                    <Fragment key={item.id}>
                    <tr
                      draggable={false}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, index)}
                      style={{
                        opacity: draggedIndex === index ? 0.5 : 1,
                        backgroundColor:
                          dragOverIndex === index
                            ? "rgba(0, 45, 90, 0.06)"
                            : visualIdx % 2 === 1
                              ? "#F5F6F8"
                              : "#FFFFFF",
                        transition: "background-color 0.15s ease",
                      }}
                    >
                      <td
                        style={{
                          fontSize: "11px",
                          paddingTop: "5px",
                          paddingBottom: "5px",
                          paddingLeft: "6px",
                          verticalAlign: "middle",
                          position: "relative",
                          width: "130px",
                          minWidth: "130px",
                          maxWidth: "130px",
                        }}
                      >
                        <div
                          className="no-print"
                          draggable
                          onDragStart={(e) => handleDragStart(e, index)}
                          onDragEnd={handleDragEnd}
                          role="button"
                          tabIndex={0}
                          title="Drag to reorder row"
                          style={{
                            position: "absolute",
                            left: "-28px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            width: "28px",
                            height: "28px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: draggedIndex === index ? "grabbing" : "grab",
                            color: "#002060",
                            borderRadius: "6px",
                            border: "none",
                            background: "none",
                            zIndex: 2,
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "rgba(0, 45, 90, 0.08)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "";
                          }}
                          onKeyDown={(e) => {
                            if (e.key === " " || e.key === "Enter") {
                              e.preventDefault();
                              (e.currentTarget as HTMLDivElement).focus();
                            }
                          }}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                            <circle cx="9" cy="6" r="1.5" />
                            <circle cx="15" cy="6" r="1.5" />
                            <circle cx="9" cy="12" r="1.5" />
                            <circle cx="15" cy="12" r="1.5" />
                            <circle cx="9" cy="18" r="1.5" />
                            <circle cx="15" cy="18" r="1.5" />
                          </svg>
                        </div>
                        <textarea
                          rows={1}
                          value={item.vendor}
                          data-field="vendor"
                          ref={autoResizeTextarea}
                          onChange={(e) => {
                            autoResizeTextarea(e.target);
                            handleUpdateLineItem(
                              item.id,
                              "vendor",
                              e.target.value,
                            );
                          }}
                          className="edit-field"
                          style={{
                            display: "block",
                            width: "100%",
                            border: "none",
                            outline: "none",
                            background: "transparent",
                            color: "#002060",
                            font: "400 9px/16.5px Arial, sans-serif",
                            padding: 0,
                            resize: "none",
                            overflow: "hidden",
                            overflowWrap: "anywhere",
                          }}
                        />
                        <span
                          className="print-only"
                          style={{
                            display: "block",
                            width: "100%",
                            color: "#002060",
                            font: "400 9px/16.5px Arial, sans-serif",
                            overflowWrap: "anywhere",
                          }}
                        >
                          {item.vendor}
                        </span>
                      </td>
                      <td
                        style={{
                          fontSize: "11px",
                          paddingTop: "5px",
                          paddingBottom: "5px",
                          verticalAlign: "middle",
                          textAlign: "center",
                          color: "#002060",
                          font: "400 9px Arial, sans-serif",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {formatShortDate(item.billDate) || EMPTY_CELL}
                      </td>
                      <td
                        style={{
                          fontSize: "11px",
                          paddingTop: "5px",
                          paddingBottom: "5px",
                          paddingLeft: SERVICE_PROVIDED_PAD_LEFT,
                          paddingRight: "10px",
                          verticalAlign: "middle",
                        }}
                      >
                        <textarea
                          rows={1}
                          value={stripLeadingDate(item.description)}
                          data-field="description"
                          ref={autoResizeTextarea}
                          onChange={(e) => {
                            autoResizeTextarea(e.target);
                            handleUpdateLineItem(
                              item.id,
                              "description",
                              e.target.value,
                            );
                          }}
                          className="edit-field"
                          style={{
                            display: "block",
                            width: "100%",
                            border: "none",
                            outline: "none",
                            background: "transparent",
                            color: "#002060",
                            overflowWrap: "anywhere",
                            font: "400 9px/16.5px Arial, sans-serif",
                            padding: 0,
                            resize: "none",
                            overflow: "hidden",
                            textAlign: "left",
                          }}
                        />
                        <span
                          className="print-only"
                          style={{
                            display: "inline-block",
                            width: "100%",
                            color: "#002060",
                            overflowWrap: "anywhere",
                            font: "400 9px/16.5px Arial, sans-serif",
                            textAlign: "left",
                          }}
                        >
                          {stripLeadingDate(item.description)}
                        </span>
                      </td>
                      <td
                        style={{
                          fontSize: "11px",
                          paddingTop: "5px",
                          paddingBottom: "5px",
                          verticalAlign: "middle",
                          color: "#002060",
                          font: "400 8px/14px Arial, sans-serif",
                          overflowWrap: "anywhere",
                          textAlign: "center",
                        }}
                      >
                        {item.billInvoiceNumber || EMPTY_CELL}
                      </td>
                      <td
                        style={{
                          fontSize: "11px",
                          paddingTop: "5px",
                          paddingBottom: "5px",
                          textAlign: "right",
                          paddingRight: "6px",
                          paddingLeft: "8px",
                          verticalAlign: "middle",
                          position: "relative",
                          overflow: "visible",
                        }}
                      >
                        <input
                          type="text"
                          value={
                            activeAmountId === item.id
                              ? `$${amountDraftById[item.id] ?? normalizeAmountDraft(item.amount)}`
                              : formatAmountWithCommas(item.amount)
                          }
                          data-field="amount"
                          onChange={(e) => {
                            const nextDraft = normalizeAmountDraft(
                              e.target.value,
                            );
                            setAmountDraftById((prev) => ({
                              ...prev,
                              [item.id]: nextDraft,
                            }));
                            setLineItems((prev) =>
                              prev.map((lineItem) =>
                                lineItem.id === item.id
                                  ? { ...lineItem, amount: nextDraft }
                                  : lineItem,
                              ),
                            );
                          }}
                          onFocus={(e) => {
                            setActiveAmountId(item.id);
                            setAmountDraftById((prev) => ({
                              ...prev,
                              [item.id]: normalizeAmountDraft(item.amount),
                            }));
                            requestAnimationFrame(() => e.target.select());
                          }}
                          onMouseUp={(e) => {
                            e.preventDefault();
                          }}
                          onBlur={(e) => {
                            const canonical = toCanonicalAmount(e.target.value);
                            setLineItems((prev) =>
                              prev.map((lineItem) =>
                                lineItem.id === item.id
                                  ? { ...lineItem, amount: canonical }
                                  : lineItem,
                              ),
                            );
                            setAmountDraftById((prev) => {
                              const { [item.id]: _removed, ...rest } = prev;
                              return rest;
                            });
                            setActiveAmountId((current) =>
                              current === item.id ? null : current,
                            );
                          }}
                          placeholder="$0.00"
                          className="edit-field"
                          style={{
                            width: "100%",
                            border: "none",
                            outline: "none",
                            background: "transparent",
                            color: "#002060",
                            overflowWrap: "anywhere",
                            font: "400 9px Arial, sans-serif",
                            textAlign: "right",
                            padding: "0",
                          }}
                        />
                        <span
                          className="print-only"
                          style={{
                            display: "inline-block",
                            width: "100%",
                            color: "#002060",
                            overflowWrap: "anywhere",
                            font: "400 9px/16.5px Arial, sans-serif",
                            textAlign: "right",
                          }}
                        >
                          {formatAmountWithCommas(item.amount)}
                        </span>
                        <button
                          onClick={() => handleLineRemoveOrVoid(item.id)}
                          className="no-print"
                          style={{
                            position: "absolute",
                            right: "-18px",
                            zIndex: 2,
                            top: "50%",
                            transform: "translateY(-50%)",
                            border: "none",
                            background: "none",
                            color: "#ef4444",
                            cursor: "pointer",
                            fontSize: "18px",
                            fontWeight: "bold",
                            padding: "0 4px",
                            lineHeight: "1",
                          }}
                          title={canVoidLines ? "Void line item" : "Remove line item"}
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                    {group.laborSummary &&
                      localIdx === group.laborSummaryAfterCount - 1 &&
                      renderManHoursSummaryRow(
                        group.laborSummary,
                        group.laborSummaryAfterCount % 2 === 1,
                      )}
                    </Fragment>
                    );
                  })}
                  <tr>
                    <td
                      colSpan={invoiceColumns.length}
                      style={{
                        padding: 0,
                        height: "4px",
                        borderTop: "1px solid #002060",
                        borderBottom: "3px double #002060",
                      }}
                    />
                  </tr>
                </tbody>
              </table>
              </div>
              ))}

              {/* Summary: Subtotal / Payments-Credits / Total */}
              <div
                className="pdf-avoid-break"
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginBottom: "20px",
                }}
              >
                <div style={{ width: "220px" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "4px 6px",
                      borderBottom: "1px solid #002060",
                      font: "400 9px/16.5px Arial, sans-serif",
                    }}
                  >
                    <span>SUBTOTAL:</span>
                    <span>{formatCurrency(calculateTotal())}</span>
                  </div>
                  {(() => {
                    // Combined Payments/Credits line — always shown (even $0),
                    // matching the reference template. Sums the overpayment
                    // rollover and dispute credit into one figure.
                    const creditCents =
                      (rolloverPaymentCents ?? 0) + (disputeCreditCents ?? 0);
                    return (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          padding: "4px 6px",
                          borderBottom: "1px solid #002060",
                          font: "400 9px/16.5px Arial, sans-serif",
                        }}
                      >
                        <span>PAYMENTS/CREDITS:</span>
                        <span>
                          {creditCents > 0 ? "-" : ""}
                          {formatCurrency(creditCents / 100)}
                        </span>
                      </div>
                    );
                  })()}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "4px 6px",
                      borderBottom: "1px solid #002060",
                      font: "700 10px/16.5px Arial, sans-serif",
                    }}
                  >
                    <span>TOTAL:</span>
                    <span>
                      {formatCurrency(
                        calculateTotal() -
                          (rolloverPaymentCents ?? 0) / 100 -
                          (disputeCreditCents ?? 0) / 100,
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment footer repeats on every page. marginTop:auto sinks it
                  to the bottom of the sheet in the on-screen preview. */}
              {renderFooter()}
              </div>
              {/* end Page 1 sheet */}

              {/* Page 2 — Field Team labor breakdown, its own letter-size sheet.
                  Itemizes every man-hour the page-1 "Man Hours" line rolls up;
                  forced onto a fresh page via pdf-page-break-before. The payment
                  footer trails it as the true bottom of the document. */}
              {laborSummary && (
                <div
                  className="invoice-page pdf-page-break-before"
                  style={pageStyle}
                >
                  <div
                    style={{
                      font: "italic 700 11px/16px Arial, sans-serif",
                      marginBottom: "3px",
                    }}
                  >
                    Field Team — Labor Detail
                  </div>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      tableLayout: "fixed",
                    }}
                  >
                    <thead>
                      <tr>
                        {laborColumns.map(renderColumnHeader)}
                      </tr>
                    </thead>
                    <tbody>
                      {laborRows.map(({ item }, localIdx) => (
                        <tr
                          key={item.id}
                          style={{
                            backgroundColor:
                              localIdx % 2 === 1 ? "#F5F6F8" : "#FFFFFF",
                          }}
                        >
                          <td
                            style={{
                              paddingTop: "5px",
                              paddingBottom: "5px",
                              paddingLeft: "6px",
                              verticalAlign: "middle",
                              color: "#002060",
                              font: "400 9px/16.5px Arial, sans-serif",
                              overflowWrap: "anywhere",
                            }}
                          >
                            {item.vendor}
                          </td>
                          <td
                            style={{
                              paddingTop: "5px",
                              paddingBottom: "5px",
                              textAlign: "center",
                              verticalAlign: "middle",
                              color: "#002060",
                              font: "400 9px Arial, sans-serif",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {formatShortDate(item.billDate) || EMPTY_CELL}
                          </td>
                          <td
                            style={{
                              paddingTop: "5px",
                              paddingBottom: "5px",
                              paddingLeft: "10px",
                              paddingRight: "10px",
                              textAlign: "left",
                              verticalAlign: "middle",
                              color: "#002060",
                              font: "400 9px/16.5px Arial, sans-serif",
                              overflowWrap: "anywhere",
                            }}
                          >
                            {stripLeadingDate(item.description)}
                          </td>
                          <td
                            style={{
                              paddingTop: "5px",
                              paddingBottom: "5px",
                              paddingRight: "6px",
                              textAlign: "center",
                              verticalAlign: "middle",
                              color: "#002060",
                              font: "400 9px Arial, sans-serif",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {formatPlainNumber(item.rate) || EMPTY_CELL}
                          </td>
                          <td
                            style={{
                              paddingTop: "5px",
                              paddingBottom: "5px",
                              paddingRight: "6px",
                              textAlign: "center",
                              verticalAlign: "middle",
                              color: "#002060",
                              font: "400 9px Arial, sans-serif",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {formatPlainNumber(item.qty) || EMPTY_CELL}
                          </td>
                          <td
                            style={{
                              paddingTop: "5px",
                              paddingBottom: "5px",
                              paddingRight: "6px",
                              textAlign: "center",
                              verticalAlign: "middle",
                              color: "#002060",
                              font: "400 9px Arial, sans-serif",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {formatPlainNumber(item.managerCount) || EMPTY_CELL}
                          </td>
                          <td
                            style={{
                              paddingTop: "5px",
                              paddingBottom: "5px",
                              paddingRight: "6px",
                              textAlign: "center",
                              verticalAlign: "middle",
                              color: "#002060",
                              font: "400 9px Arial, sans-serif",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {formatPlainNumber(
                              item.travelChargeCents != null
                                ? item.travelChargeCents / 100
                                : undefined,
                            ) || EMPTY_CELL}
                          </td>
                          <td
                            style={{
                              paddingTop: "5px",
                              paddingBottom: "5px",
                              paddingRight: "6px",
                              paddingLeft: "8px",
                              textAlign: "right",
                              verticalAlign: "middle",
                              color: "#002060",
                              font: "400 9px/16.5px Arial, sans-serif",
                            }}
                          >
                            {formatAmountWithCommas(item.amount)}
                          </td>
                        </tr>
                      ))}
                      <tr>
                        <td
                          colSpan={8}
                          style={{
                            padding: 0,
                            height: "4px",
                            borderTop: "1px solid #002060",
                            borderBottom: "3px double #002060",
                          }}
                        />
                      </tr>
                      <tr>
                        <td
                          colSpan={4}
                          style={{
                            paddingTop: "5px",
                            paddingLeft: "6px",
                            color: "#002060",
                            font: "700 9px/16.5px Arial, sans-serif",
                          }}
                        >
                          Total Man Hours
                        </td>
                        <td
                          style={{
                            paddingTop: "5px",
                            paddingRight: "6px",
                            textAlign: "center",
                            color: "#002060",
                            font: "700 9px Arial, sans-serif",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {formatPlainNumber(laborTotalHours)}
                        </td>
                        <td colSpan={2} />
                        <td
                          style={{
                            paddingTop: "5px",
                            paddingRight: "6px",
                            paddingLeft: "8px",
                            textAlign: "right",
                            color: "#002060",
                            font: "700 9px/16.5px Arial, sans-serif",
                          }}
                        >
                          {formatAmountWithCommas(String(laborTotalAmount))}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  {renderFooter()}
                </div>
              )}
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="no-print flex-shrink-0 flex justify-end items-center gap-2.5 px-6 md:px-8 py-4 border-t border-[#E5E5E5] bg-white">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex h-9 justify-center items-center gap-2 px-4 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="text-[#303030] font-normal text-base capitalize">
                Cancel
              </span>
            </button>

            <button
              type="button"
              onClick={handleAddLineItem}
              className="flex h-9 items-center gap-2 px-4 rounded-lg border border-[#002D5A] bg-white text-[#002D5A] hover:bg-gray-50 transition-colors"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M10 4.1665V15.8332M4.16667 9.99984H15.8333"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="font-medium text-base">Add Line Item</span>
            </button>

            {showCommitButton && (
              <button
                type="button"
                onClick={handleCommit}
                disabled={derivedStatus === "draft" || committing}
                title={
                  derivedStatus === "draft"
                    ? "Cannot send — a line item has no vendor bill recorded. Resolve the underlying bills first."
                    : undefined
                }
                className="flex h-9 items-center gap-2 px-4 rounded-lg border border-white bg-[#013764] shadow-[0_0_0_1px_#002D5A,0_0_10px_-5px_rgba(0,0,0,0.2)] hover:bg-[#003a73] transition-colors disabled:opacity-50 disabled:pointer-events-none"
              >
                <span className="text-white font-medium text-base">
                  Send to QBO
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={handleDownloadPDF}
              className="flex h-9 items-center gap-2 px-4 rounded-lg border border-white bg-[#002D5A] shadow-[0_0_0_1px_#002D5A,0_0_10px_-5px_rgba(0,0,0,0.2)] hover:bg-[#003d7a] transition-colors"
            >
              <span className="text-white font-medium text-base">
                Download PDF
              </span>
            </button>

            <button
              type="button"
              onClick={handleExportToExcel}
              className="flex h-9 items-center gap-2 px-4 rounded-lg border border-white bg-[#002D5A] shadow-[0_0_0_1px_#002D5A,0_0_10px_-5px_rgba(0,0,0,0.2)] hover:bg-[#003d7a] transition-colors"
            >
              <span className="text-white font-medium text-base">
                Export to Excel
              </span>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showCommitConfirm} onOpenChange={setShowCommitConfirm}>
        <AlertDialogContentRoot>
          <AlertDialogHeader>
            <AlertDialogTitle>Review before sending</AlertDialogTitle>
            <AlertDialogDescription>
              This will finalize the invoice, attach the PDF, and push it to
              QuickBooks.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="max-h-[50vh] overflow-y-auto space-y-4 text-sm text-[#303030]">
            {hasUnpaidPassthrough && (
              <div>
                <p className="font-semibold">
                  Passthrough lines with unpaid bills
                </p>
                <p className="mt-1 text-muted-foreground">
                  AVMRE hasn't paid these vendor bills yet. Sending now bills
                  the owner ahead of payment. The amounts below are what's
                  invoiced to the owner for these lines — not necessarily what
                  AVMRE owes the vendor — and they lock in once sent; later
                  changes need a credit memo.
                </p>
                <table className="mt-2 w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b text-xs uppercase text-muted-foreground">
                      <th className="py-1 pr-2 font-medium">Vendor</th>
                      <th className="py-1 pr-2 font-medium">Invoice #</th>
                      <th className="py-1 text-right font-medium">
                        Amount invoiced
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {unpaidPassthroughLines.map((line, idx) => (
                      <tr
                        key={`${idx}-${line.vendor}`}
                        className="border-b"
                      >
                        <td className="py-1 pr-2 align-top">
                          {line.vendor || "—"}
                        </td>
                        <td className="py-1 pr-2 align-top">
                          {line.billInvoiceNumber?.trim() ||
                            line.description ||
                            "—"}
                        </td>
                        {/* This is the merged/billed amount (base passthrough
                            line + any folded vendor_credit/materials_markup —
                            see mergeMarkupIntoBase), i.e. what the owner is
                            invoiced. It is NOT what AVMRE owes the vendor.
                            Don't relabel this back to a vendor-payable figure. */}
                        <td className="py-1 text-right align-top tabular-nums">
                          {formatCurrency(line.amount)}
                        </td>
                      </tr>
                    ))}
                    <tr className="font-semibold">
                      <td className="py-1 pr-2">Total invoiced</td>
                      <td className="py-1 pr-2" />
                      <td className="py-1 text-right tabular-nums">
                        {formatCurrency(unpaidPassthroughTotal)}
                      </td>
                    </tr>
                  </tbody>
                </table>
                {unpaidPayeeEntries.map(([payee]) => (
                  <p key={payee} className="mt-2 italic text-muted-foreground">
                    {/* No dollar figure here on purpose: unpaidPayeeTotals sums
                        the merged/billed amount, which can include markup the
                        payee is not owed. State the actionable fact (who)
                        without asserting a reimbursement amount. */}
                    {`${payee} has an unreimbursed expense on this invoice.`}
                  </p>
                ))}
              </div>
            )}

            {hasUnapprovedLines && (
              <div>
                <p className="font-semibold">Unapproved lines</p>
                <p className="mt-1 text-muted-foreground">
                  There are unapproved bills outstanding — sending now will
                  lock those amounts in.
                </p>
              </div>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={committing}
              onClick={() => {
                if (committing) return;
                setCommitting(true);
                setShowCommitConfirm(false);
                // Same split/no-split branch as handleCommit — the reviewed path
                // must produce the identical document set, or which button the
                // operator pressed would change what the owner receives.
                const splits = locationSplits ?? [];
                const work =
                  splits.length > 0 && onCommitSplits
                    ? runCommitSplits().then(({ combined, rendered }) =>
                        onCommitSplits(combined, rendered),
                      )
                    : generatePdfBlob().then((blob) => onCommit?.(blob));
                work
                  .catch((err) =>
                    console.error("Failed to generate PDF:", err),
                  )
                  .finally(() => {
                    setCommitting(false);
                    onOpenChange(false);
                  });
              }}
            >
              Send to QBO
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContentRoot>
      </AlertDialog>
    </>
  );
}
