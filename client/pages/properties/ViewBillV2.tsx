import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight, Menu, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { fetchJSON, authFetch } from "@/api/fetchJSON";
import { fetchChartOfAccounts } from "@/data/chartOfAccounts";
import { convertFiletoPdf } from "@/utils/convertFiletoPdf";
import { PageTemplate } from "@/layout/PageTemplate";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConciergeGLPicker } from "@/components/ConciergeGLPicker";
import { BuildiumGLPicker } from "@/components/BuildiumGLPicker";
import { SelectFieldCell } from "@/components/forms/SelectFieldCell";
import { TextField } from "@/components/forms/TextField";
import { DateField } from "@/components/forms/DateField";
import { TextAreaField } from "@/components/forms/TextAreaField";
import PayBillModal from "@/components/PayBillModal";
import EditPaymentModal from "@/components/EditPaymentModal";

/**
 * ViewBillV2 — a redesigned "view bill" page modeled on the Buildium bill
 * detail layout (two-column: details on the left, money summary on the right).
 * It reads the same approved-bill endpoints the legacy view uses:
 *   GET /utilities/bills/{id}            — core bill + line items
 *   GET /vendors/bills/{id}/payments     — payment history
 *   GET /vendors/bills/{id}/attachments  — all files (primary + additional)
 *
 * Edit happens IN PLACE on this page (no navigation to RecordBill): clicking
 * Edit flips local `editing` so the bill fields + line items become editable
 * using the same field components RecordBill uses, and Save calls
 * PATCH /vendors/bills/{id} which dual-pushes to QBO + Buildium (rollback on
 * Buildium failure) — exactly the old "Save & Re-export" behavior.
 *
 * Navigate to it with:  /bills/view?billId=123
 */

// ── theme tokens (match the rest of the app) ───────────────────────────────
const NAVY = "#013764";
const TEXT_DARK = "#303030";
const TEXT_MUTED = "#717179";

// ── server payload shapes (mirror of the approved-bill DTO) ─────────────────
interface ApiLineItem {
  line_id?: number;
  property_id?: number;
  location_id?: number | null;
  location_name?: string | null;
  unit?: string;
  unit_name?: string;
  work_order_ref?: string;
  description?: string;
  gl_account_id?: number;
  gl_account_name?: string;
  qbo_item_id?: string;
  qbo_item_name?: string;
  buildium_account_id?: string;
  buildium_account_name?: string;
  upcharge_cents?: number;
  amount_cents?: number;
}

interface ApiBill {
  id: number;
  vendor_id?: number | null;
  vendor_name?: string | null;
  property_id?: number | null;
  property_address?: string | null;
  property_type?: string | null;
  invoice_number?: string | null;
  statement_date?: string | null;
  due_date?: string | null;
  memo?: string | null;
  line_items?: ApiLineItem[];
  amount_cents: number;
  push_status?: string;
  qbo_total_cents?: number | null;
  qbo_balance_cents?: number | null;
  qbo_paid_at?: string | null;
  created_at?: string;
  provider_gl_account_name?: string | null;
}

interface ApiPayment {
  id: number;
  amount_cents: number;
  paid_on: string;
  paid_from_name?: string | null;
  paid_from_qbo_account_id?: string | null;
  paid_doc_number?: string | null;
  paid_memo?: string | null;
  created_at?: string;
}

// One file on a bill, from GET /vendors/bills/{id}/attachments. id is "primary"
// (the original bills.pdf_object_key) or a bill_attachments.id.
interface AttachmentItem {
  id: string;
  filename: string;
  mime: string;
  size_bytes: number;
  download_url: string;
}

interface Vendor {
  id: number;
  name: string;
  phone: string;
  email: string;
  notes: string;
}

interface PropertyOption {
  id: number;
  name: string;
  property_type?: string | null;
}

interface PropertyUnit {
  id: number;
  property_id: number;
  buildium_unit_id: number | null;
  unit_name: string;
}

// Editable line item — mirrors RecordBill's LineItem shape so the same field
// components and PATCH payload builder work unchanged.
interface EditLineItem {
  id: number;
  property: string; // property_id as string
  unit: string; // buildium_unit_id as string, "__property__", or ""
  unitName: string;
  description: string;
  glAccount: string; // chart_of_accounts.id (legacy/AVMRE)
  qboItemId?: string; // Concierge (type='C')
  qboItemName?: string;
  buildiumAccountId?: string; // non-Concierge direct Buildium id
  buildiumAccountName?: string;
  upcharge: string;
  total: string;
  workOrder?: string;
}

// ── helpers ─────────────────────────────────────────────────────────────────
const money = (cents: number | null | undefined) =>
  `$${((cents ?? 0) / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const fmtDate = (iso: string | null | undefined) => {
  if (!iso) return "--";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "--";
  return format(d, "M/d/yyyy");
};

const toCents = (value: string): number => {
  if (!value) return 0;
  const clean = value.replace("$", "").replace(/,/g, "");
  const num = parseFloat(clean);
  if (isNaN(num)) return 0;
  return Math.round(num * 100);
};

/** YYYY-MM-DD from a Date (local) — the format QBO + Buildium expect. */
const ymd = (d: Date | null): string | null => {
  if (!d || Number.isNaN(d.getTime())) return null;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

/** Natural sort comparator — "1","2","10","A","1A", etc. */
const naturalSort = (a: string, b: string): number => {
  const ax: (string | number)[] = [];
  const bx: (string | number)[] = [];
  a.replace(/(\d+)|(\D+)/g, (_, d, s) => {
    ax.push(d ? +d : s);
    return "";
  });
  b.replace(/(\d+)|(\D+)/g, (_, d, s) => {
    bx.push(d ? +d : s);
    return "";
  });
  for (let i = 0; i < Math.max(ax.length, bx.length); i++) {
    const ai = ax[i] ?? "";
    const bi = bx[i] ?? "";
    if (typeof ai === "number" && typeof bi === "number") {
      if (ai !== bi) return ai - bi;
    } else {
      const cmp = String(ai).localeCompare(String(bi), undefined, {
        sensitivity: "base",
      });
      if (cmp !== 0) return cmp;
    }
  }
  return 0;
};

// ── small presentational primitives ─────────────────────────────────────────
function Panel({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-[#E5E5E5] bg-white overflow-hidden">
      <div className="flex items-center justify-between bg-[#F7F8FA] border-b border-[#E5E5E5] px-5 py-3">
        <h2 className="text-sm font-semibold" style={{ color: TEXT_DARK }}>
          {title}
        </h2>
        {action}
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div
        className="text-[11px] font-semibold uppercase tracking-wide mb-1"
        style={{ color: TEXT_MUTED }}
      >
        {label}
      </div>
      <div className="text-sm" style={{ color: TEXT_DARK }}>
        {children}
      </div>
    </div>
  );
}

function HeaderButton({
  children,
  onClick,
  primary,
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  primary?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={
        primary
          ? "h-9 px-4 rounded-md text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          : "h-9 px-4 rounded-md text-sm font-medium border border-[#DADADA] bg-white transition-colors hover:bg-gray-50 disabled:opacity-50"
      }
      style={primary ? { backgroundColor: NAVY } : { color: TEXT_DARK }}
    >
      {children}
    </button>
  );
}

// ── page ──────────────────────────────────────────────────────────────────
export function ViewBillV2() {
  const [params] = useSearchParams();
  const billId = params.get("billId");

  const [bill, setBill] = useState<ApiBill | null>(null);
  const [payments, setPayments] = useState<ApiPayment[]>([]);
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openingId, setOpeningId] = useState<string | null>(null);

  // Pay flow
  const [showPayBillModal, setShowPayBillModal] = useState(false);

  // Edit payment flow
  const [editPaymentOpen, setEditPaymentOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<ApiPayment | null>(null);

  // Edit-in-place flow
  const [editing, setEditing] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  // Editable form state
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [referenceNumber, setReferenceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState<Date | null>(null);
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [memo, setMemo] = useState("");
  const [editLineItems, setEditLineItems] = useState<EditLineItem[]>([]);

  // New files staged in edit mode. Each is uploaded immediately to get an
  // object key; the set is sent as new_attachments in the PATCH so they're
  // recorded + attached to QBO + Buildium on Save & Re-export.
  const [newPdfs, setNewPdfs] = useState<
    { pdf_object_key: string; sha256_pdf: string; filename: string }[]
  >([]);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Dropdown data (loaded lazily when entering edit mode)
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [glAccountOptions, setGLAccountOptions] = useState<
    { id: number; name: string }[]
  >([]);
  const [unitsByProperty, setUnitsByProperty] = useState<
    Record<string, PropertyUnit[]>
  >({});

  // Vendor dropdown search/pagination
  const vendorPageSize = 50;
  const vendorRequestIdRef = useRef(0);
  const [vendorSearch, setVendorSearch] = useState("");
  const [vendorOffset, setVendorOffset] = useState(0);
  const [vendorHasMore, setVendorHasMore] = useState(true);
  const [vendorLoading, setVendorLoading] = useState(false);
  const [isVendorDropdownOpen, setIsVendorDropdownOpen] = useState(false);
  const [propertySearch, setPropertySearch] = useState("");
  const [glSearch, setGlSearch] = useState("");

  const fetchAttachments = useCallback(async () => {
    const res = await fetchJSON(`/vendors/bills/${billId}/attachments`).catch(
      () => ({ attachments: [] }),
    );
    setAttachments(res?.attachments ?? []);
  }, [billId]);

  // ── load the bill + side data ─────────────────────────────────────────────
  const loadBill = useCallback(async (): Promise<ApiBill | null> => {
    const b: ApiBill = await fetchJSON(`/utilities/bills/${billId}`);
    setBill(b);
    const pay = await fetchJSON(`/vendors/bills/${billId}/payments`).catch(
      () => ({ payments: [] }),
    );
    setPayments(pay?.payments ?? []);
    await fetchAttachments();
    return b;
  }, [billId, fetchAttachments]);

  useEffect(() => {
    if (!billId) {
      setError("No billId provided. Use /bills/view?billId=123");
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const b: ApiBill = await fetchJSON(`/utilities/bills/${billId}`);
        if (cancelled) return;
        setBill(b);

        const pay = await fetchJSON(`/vendors/bills/${billId}/payments`).catch(
          () => ({ payments: [] }),
        );
        if (!cancelled) setPayments(pay?.payments ?? []);

        const att = await fetchJSON(
          `/vendors/bills/${billId}/attachments`,
        ).catch(() => ({ attachments: [] }));
        if (!cancelled) setAttachments(att?.attachments ?? []);
      } catch (err: any) {
        if (!cancelled) setError(err?.message || "Failed to load bill");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [billId]);

  const paidCents = useMemo(
    () => payments.reduce((sum, p) => sum + (p.amount_cents || 0), 0),
    [payments],
  );

  const initialCents = bill?.qbo_total_cents ?? bill?.amount_cents ?? 0;
  const remainingCents =
    bill?.qbo_balance_cents ?? Math.max(initialCents - paidCents, 0);

  const openPdf = async (att: AttachmentItem) => {
    setOpeningId(att.id);
    try {
      const res = await authFetch(att.download_url);
      if (!res.ok) throw new Error(`(${res.status})`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error("Failed to open attachment", err);
    } finally {
      setOpeningId(null);
    }
  };

  // ── edit-mode dropdown loaders ─────────────────────────────────────────────
  const fetchVendorsPage = useCallback(
    async (search: string, offset: number, append: boolean) => {
      const requestId = ++vendorRequestIdRef.current;
      setVendorLoading(true);
      try {
        const qp = new URLSearchParams();
        qp.set("limit", vendorPageSize.toString());
        if (offset > 0) qp.set("offset", offset.toString());
        const trimmed = search.trim();
        if (trimmed) qp.set("search", trimmed);
        const list: Vendor[] = await fetchJSON(`/vendors?${qp.toString()}`);
        if (requestId !== vendorRequestIdRef.current) return;
        setVendors((prev) => (append ? [...prev, ...list] : list));
        setVendorHasMore(list.length === vendorPageSize);
        setVendorOffset(offset + list.length);
      } catch (err) {
        if (requestId !== vendorRequestIdRef.current) return;
        if (!append) setVendors([]);
        setVendorHasMore(false);
      } finally {
        if (requestId === vendorRequestIdRef.current) setVendorLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (!isVendorDropdownOpen) return;
    const t = window.setTimeout(() => {
      fetchVendorsPage(vendorSearch, 0, false);
    }, 250);
    return () => window.clearTimeout(t);
  }, [vendorSearch, isVendorDropdownOpen, fetchVendorsPage]);

  // Keep the currently-selected vendor in the list so its label renders.
  useEffect(() => {
    if (!selectedVendor || vendorSearch.trim()) return;
    setVendors((prev) =>
      prev.some((v) => v.id === selectedVendor.id)
        ? prev
        : [selectedVendor, ...prev],
    );
  }, [selectedVendor, vendorSearch]);

  const handleVendorScroll = useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      if (!vendorHasMore || vendorLoading) return;
      const target = event.currentTarget;
      if (target.scrollTop + target.clientHeight >= target.scrollHeight - 24) {
        fetchVendorsPage(vendorSearch, vendorOffset, true);
      }
    },
    [vendorHasMore, vendorLoading, vendorSearch, vendorOffset, fetchVendorsPage],
  );

  const loadUnitsForProperty = useCallback(
    async (propertyIdStr: string) => {
      const pid = Number(propertyIdStr);
      if (!pid) return;
      if (unitsByProperty[propertyIdStr]) return; // already loaded
      try {
        const list = await fetchJSON(`/properties/${pid}/units`);
        const units: PropertyUnit[] = (list || []).map((u: any) => ({
          id: u.id,
          property_id: u.property_id,
          buildium_unit_id: u.buildium_unit_id ?? null,
          unit_name: u.unit_name,
        }));
        setUnitsByProperty((prev) => ({ ...prev, [propertyIdStr]: units }));
      } catch (err) {
        console.error("Failed loading units for property", pid, err);
      }
    },
    [unitsByProperty],
  );

  // Lazily load properties + chart of accounts the first time the user edits.
  const editDataLoadedRef = useRef(false);
  const ensureEditData = useCallback(() => {
    if (editDataLoadedRef.current) return;
    editDataLoadedRef.current = true;

    fetchJSON("/properties")
      .then((list: any[]) => {
        setProperties(
          list.map((p) => ({
            id: p.id,
            name: p.name || p.address_line1 || `Property ${p.id}`,
            property_type: p.property_type ?? null,
          })),
        );
      })
      .catch((err) => console.error("Failed loading properties", err));

    fetchChartOfAccounts({ activeOnly: true })
      .then((accounts) => {
        setGLAccountOptions(
          accounts
            .filter(
              (a) =>
                a.account_type === "expense" &&
                a.qbo_id !== null &&
                a.qbo_id !== "" &&
                a.buildium_id !== null,
            )
            .map((a) => ({ id: a.id, name: a.name })),
        );
      })
      .catch((err) => console.error("Failed to load chart of accounts:", err));
  }, []);

  // ── enter / exit edit mode ────────────────────────────────────────────────
  const beginEdit = () => {
    if (!bill) return;
    ensureEditData();

    setSelectedVendor(
      bill.vendor_id
        ? {
            id: bill.vendor_id,
            name: bill.vendor_name || `Vendor #${bill.vendor_id}`,
            phone: "",
            email: "",
            notes: "",
          }
        : null,
    );
    setReferenceNumber(bill.invoice_number || "");
    setInvoiceDate(bill.statement_date ? new Date(bill.statement_date) : null);
    setDueDate(bill.due_date ? new Date(bill.due_date) : null);
    setMemo(bill.memo || "");

    // Convert the bill's line items into the editable shape. Scraped utility
    // bills carry no line items — synthesize a single row from the bill so the
    // table isn't empty and the charge stays editable.
    const source: ApiLineItem[] =
      bill.line_items && bill.line_items.length > 0
        ? bill.line_items
        : [
            {
              property_id: bill.property_id ?? undefined,
              description: bill.memo || bill.invoice_number || "",
              amount_cents: bill.amount_cents,
            },
          ];

    const items: EditLineItem[] = source.map((li, idx) => ({
      id: idx + 1,
      property: String(li.property_id ?? bill.property_id ?? ""),
      unit: li.unit || "",
      unitName: li.unit_name || li.unit || "",
      description: li.description || "",
      glAccount: li.gl_account_id ? String(li.gl_account_id) : "",
      qboItemId: li.qbo_item_id ? String(li.qbo_item_id) : "",
      qboItemName: li.qbo_item_name || "",
      buildiumAccountId: li.buildium_account_id
        ? String(li.buildium_account_id)
        : "",
      buildiumAccountName: li.buildium_account_name || "",
      upcharge:
        typeof li.upcharge_cents === "number" && li.upcharge_cents > 0
          ? `$${(li.upcharge_cents / 100).toFixed(2)}`
          : "",
      total:
        li.amount_cents != null ? `$${(li.amount_cents / 100).toFixed(2)}` : "",
      workOrder: li.work_order_ref || "",
    }));
    setEditLineItems(items);

    // Preload units for properties already referenced.
    new Set(items.map((i) => i.property).filter(Boolean)).forEach((pid) =>
      loadUnitsForProperty(pid),
    );

    setNewPdfs([]);
    setPdfError(null);
    setEditing(true);
  };

  const cancelEdit = () => {
    if (savingEdit) return;
    setNewPdfs([]);
    setPdfError(null);
    setEditing(false);
  };

  // ── line item editing helpers ──────────────────────────────────────────────
  const updateLineItem = (
    id: number,
    field: keyof EditLineItem,
    value: string,
  ) => {
    setEditLineItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated: EditLineItem = { ...item, [field]: value };
        if (field === "property") {
          const prop = properties.find((p) => String(p.id) === value);
          if (prop?.property_type === "C") {
            updated.unit = "__property__";
            updated.unitName = "Property Level";
            updated.glAccount = "";
            updated.buildiumAccountId = "";
            updated.buildiumAccountName = "";
          } else {
            updated.unit = "";
            updated.unitName = "";
            updated.glAccount = "";
            updated.qboItemId = "";
            updated.qboItemName = "";
          }
          loadUnitsForProperty(value);
        }
        return updated;
      }),
    );
  };

  const addLineItem = () => {
    setEditLineItems((prev) => [
      ...prev,
      {
        id: prev.length > 0 ? Math.max(...prev.map((i) => i.id)) + 1 : 1,
        property: "",
        unit: "",
        unitName: "",
        description: "",
        glAccount: "",
        upcharge: "",
        total: "",
        workOrder: "",
      },
    ]);
  };

  const deleteLineItem = (id: number) => {
    setEditLineItems((prev) => prev.filter((i) => i.id !== id));
  };

  // Upload a newly-chosen bill file. Images are converted to PDF first (the
  // upload-pdf endpoint only accepts PDF / .msg / .eml). The returned object
  // key is staged and sent with the next Save & Re-export. Shared by the file
  // picker and the drag-and-drop zone.
  const uploadPickedFile = async (file: File) => {
    setPdfError(null);
    setUploadingPdf(true);
    try {
      const lower = file.name.toLowerCase();
      const isImage = [".jpg", ".jpeg", ".png"].some((x) => lower.endsWith(x));
      const accepted =
        isImage || [".pdf", ".msg", ".eml"].some((x) => lower.endsWith(x));
      if (!accepted) {
        throw new Error("Unsupported file type. Use PDF, JPG, PNG, .msg or .eml.");
      }
      const toUpload = isImage ? await convertFiletoPdf(file) : file;
      const displayName = isImage
        ? file.name.replace(/\.[^.]+$/, ".pdf")
        : file.name;

      const form = new FormData();
      form.append("file", toUpload);
      const res = await authFetch("/vendors/bills/upload-pdf", {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Upload failed (status ${res.status})`);
      }
      const data = await res.json();
      setNewPdfs((prev) => [
        ...prev,
        {
          pdf_object_key: data.pdf_object_key,
          sha256_pdf: data.sha256_pdf,
          filename: displayName,
        },
      ]);
    } catch (err: any) {
      setPdfError(err?.message ?? String(err));
    } finally {
      setUploadingPdf(false);
    }
  };

  const handlePdfChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    e.target.value = ""; // allow re-selecting the same file
    if (file) await uploadPickedFile(file);
  };

  const handlePdfDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (uploadingPdf || savingEdit) return;
    const file = e.dataTransfer.files?.[0];
    if (file) await uploadPickedFile(file);
  };

  // Delete one synced file from the platform, QBO, and Buildium.
  const handleDeleteAttachment = async (att: AttachmentItem) => {
    if (!bill) return;
    if (
      !window.confirm(
        `Delete "${att.filename}"? It will also be removed from QuickBooks and Buildium.`,
      )
    ) {
      return;
    }
    setDeletingId(att.id);
    try {
      const res = await authFetch(
        `/vendors/bills/${bill.id}/attachments/${att.id}`,
        { method: "DELETE" },
      );
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Delete failed (status ${res.status})`);
      }
      const data = await res.json().catch(() => ({}));
      const warnings: string[] = Array.isArray(data?.warnings)
        ? data.warnings
        : [];
      warnings.forEach((wmsg) => toast.warning(wmsg, { duration: 8000 }));
      if (warnings.length === 0) {
        toast.success("File deleted from QuickBooks, Buildium, and the platform.");
      }
      await fetchAttachments();
    } catch (err: any) {
      toast.error(err?.message ?? String(err), { duration: 8000 });
    } finally {
      setDeletingId(null);
    }
  };

  const editTotalCents = useMemo(
    () => editLineItems.reduce((sum, i) => sum + toCents(i.total), 0),
    [editLineItems],
  );

  const filteredProperties = properties
    .filter((p) => p.name.toLowerCase().includes(propertySearch.toLowerCase()))
    .sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
    );
  const filteredGLAccounts = glAccountOptions.filter((gl) =>
    gl.name.toLowerCase().includes(glSearch.toLowerCase()),
  );

  // ── save (PATCH → dual-push to QBO + Buildium) ──────────────────────────────
  const handleSaveAndReexport = async () => {
    if (!bill) return;
    if (!selectedVendor) {
      toast.error("Please select a vendor.");
      return;
    }
    const firstPropertyId = Number(editLineItems[0]?.property) || 0;
    if (!firstPropertyId) {
      toast.error("Each line item needs a property.");
      return;
    }
    for (const li of editLineItems) {
      if (!Number(li.property)) {
        toast.error("Each line item needs a property.");
        return;
      }
      if (!li.glAccount && !li.qboItemId && !li.buildiumAccountId) {
        toast.error("Each line item needs a GL account.");
        return;
      }
    }

    setSavingEdit(true);
    try {
      const patchBody: Record<string, unknown> = {
        vendor_id: selectedVendor.id,
        property_id: firstPropertyId,
        invoice_number: referenceNumber || null,
        statement_date: ymd(invoiceDate),
        due_date: ymd(dueDate),
        memo: memo || null,
        // Newly-uploaded files are recorded + attached to QBO + Buildium on
        // the backend (in addition to existing attachments).
        ...(newPdfs.length > 0
          ? {
              new_attachments: newPdfs.map((p) => ({
                object_key: p.pdf_object_key,
                sha256: p.sha256_pdf,
                filename: p.filename,
              })),
            }
          : {}),
        line_items: editLineItems.map((item, idx) => {
          const gl = glAccountOptions.find(
            (g) => g.id.toString() === item.glAccount,
          );
          const usesQboItem = Boolean(item.qboItemId);
          const usesBuildiumDirect =
            !usesQboItem && Boolean(item.buildiumAccountId);
          return {
            line_id: item.id ?? idx + 1,
            property_id: Number(item.property) || 0,
            unit: item.unit || "",
            unit_name: item.unitName || "",
            work_order_ref: item.workOrder || "",
            description: item.description || "",
            gl_account_id:
              usesQboItem || usesBuildiumDirect ? "" : gl?.id.toString() || "",
            gl_account_name:
              usesQboItem || usesBuildiumDirect ? "" : gl?.name || "",
            qbo_item_id: usesQboItem ? item.qboItemId! : "",
            qbo_item_name: usesQboItem ? item.qboItemName || "" : "",
            buildium_account_id: usesBuildiumDirect ? item.buildiumAccountId! : "",
            buildium_account_name: usesBuildiumDirect
              ? item.buildiumAccountName || ""
              : "",
            amount_cents: toCents(item.total),
            upcharge_cents: toCents(item.upcharge),
          };
        }),
      };

      const res = await fetchJSON(`/vendors/bills/${bill.id}`, {
        method: "PATCH",
        body: JSON.stringify(patchBody),
      });

      toast.success(
        res?.no_op
          ? "No changes to save"
          : "Bill updated and re-exported to QuickBooks + Buildium",
      );
      // Attachment re-export is best-effort on the backend — surface any
      // per-system attach warnings so the user knows if the file didn't land.
      const warnings: string[] = Array.isArray(res?.warnings)
        ? res.warnings
        : [];
      warnings.forEach((wmsg) => toast.warning(wmsg, { duration: 8000 }));
      // Refresh from the server so the read-only view reflects the saved edit.
      await loadBill().catch(() => {});
      setNewPdfs([]);
      setEditing(false);
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg, { duration: 10000 });
    } finally {
      setSavingEdit(false);
    }
  };

  if (loading) {
    return (
      <PageTemplate>
        <div className="flex items-center gap-2 text-sm" style={{ color: TEXT_MUTED }}>
          <Loader2 className="h-4 w-4 animate-spin" /> Loading bill…
        </div>
      </PageTemplate>
    );
  }

  if (error || !bill) {
    return (
      <PageTemplate>
        <div className="rounded-lg border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error || "Bill not found."}
        </div>
      </PageTemplate>
    );
  }

  // Read-only line items: synthesize one row for scraped utility bills.
  const lineItems: ApiLineItem[] =
    bill.line_items && bill.line_items.length > 0
      ? bill.line_items
      : [
          {
            description: bill.memo || bill.invoice_number || "Utility charge",
            gl_account_name: bill.provider_gl_account_name || undefined,
            amount_cents: bill.amount_cents,
          },
        ];
  const vendorName = bill.vendor_name || `Vendor #${bill.vendor_id ?? ""}`;
  const accountName = (li: ApiLineItem) =>
    li.gl_account_name || li.qbo_item_name || li.buildium_account_name || "--";

  // Pay-modal "outstanding": Concierge bills use the QBO balance; everything
  // else falls back to the bill total minus locally-recorded payments.
  const payOutstandingCents =
    bill.property_type === "C"
      ? bill.qbo_balance_cents ?? remainingCents
      : remainingCents;

  return (
    <div className="bg-[#F2F3F5] min-h-screen">
      <PageTemplate className="!bg-transparent">
        {/* ── header ───────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-semibold" style={{ color: TEXT_DARK }}>
              {vendorName}
            </h1>
            <div className="mt-1 text-sm" style={{ color: TEXT_MUTED }}>
              Bill <span className="mx-1 text-[#CBCBCB]">|</span>
              {money(initialCents)}
              <span className="mx-1 text-[#CBCBCB]">|</span>
              Due: {fmtDate(bill.due_date)}
              {!editing && (
                <button
                  onClick={beginEdit}
                  className="ml-3 font-medium hover:underline"
                  style={{ color: NAVY }}
                >
                  Edit
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {editing ? (
              <>
                <HeaderButton onClick={cancelEdit} disabled={savingEdit}>
                  Cancel edit
                </HeaderButton>
                <HeaderButton
                  primary
                  onClick={handleSaveAndReexport}
                  disabled={savingEdit}
                >
                  {savingEdit ? "Re-exporting…" : "Save & Re-export"}
                </HeaderButton>
              </>
            ) : (
              <>
                <HeaderButton
                  primary
                  onClick={() => setShowPayBillModal(true)}
                  disabled={!!bill.qbo_paid_at && remainingCents <= 0}
                >
                  Pay bill
                </HeaderButton>
                <HeaderButton>Enter charges</HeaderButton>
                <HeaderButton>Request owner contribution</HeaderButton>
                <HeaderButton>Duplicate bill</HeaderButton>
                <HeaderButton onClick={() => window.print()}>Print</HeaderButton>
                <div className="flex items-center rounded-md border border-[#DADADA] bg-white">
                  <button className="h-9 px-2 text-[#9A9A9A] hover:bg-gray-50">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button className="h-9 px-2 border-l border-[#DADADA] text-[#9A9A9A] hover:bg-gray-50">
                    <Menu className="h-4 w-4" />
                  </button>
                  <button className="h-9 px-2 border-l border-[#DADADA] text-[#9A9A9A] hover:bg-gray-50">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── two-column body ──────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* left / main */}
          <div className="lg:col-span-2 space-y-6">
            {editing ? (
              <>
                <Panel title="Bill details">
                  <div className="space-y-5">
                    {/* Vendor */}
                    <div>
                      <label
                        className="text-sm font-medium block mb-1"
                        style={{ color: TEXT_DARK }}
                      >
                        Vendor <span className="text-red-500">*</span>
                      </label>
                      <Select
                        value={selectedVendor?.id.toString() || ""}
                        onValueChange={(vendorId) => {
                          const v = vendors.find(
                            (x) => x.id.toString() === vendorId,
                          );
                          setSelectedVendor(v || null);
                          setVendorSearch("");
                        }}
                        onOpenChange={(open) => {
                          setIsVendorDropdownOpen(open);
                          if (!open) setVendorSearch("");
                        }}
                      >
                        <SelectTrigger className="w-full rounded-md border border-[#E5E5E5] px-3 py-2 text-sm">
                          <SelectValue placeholder="Select vendor..." />
                        </SelectTrigger>
                        <SelectContent
                          className="bg-white border border-[#E5E7EB] shadow-md p-0"
                          onKeyDown={(e) => {
                            const t = e.target as HTMLElement;
                            if (t.tagName === "INPUT") e.stopPropagation();
                          }}
                        >
                          <div className="p-2 border-b border-[#E5E7EB]">
                            <input
                              autoFocus
                              placeholder="Type to search…"
                              value={vendorSearch}
                              onChange={(e) => setVendorSearch(e.target.value)}
                              onKeyDown={(e) => e.stopPropagation()}
                              onFocus={(e) => e.stopPropagation()}
                              className="w-full rounded-md border px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-[#013764]"
                            />
                          </div>
                          <div
                            className="max-h-[240px] overflow-y-auto"
                            onScroll={handleVendorScroll}
                          >
                            {vendorLoading && vendors.length === 0 && (
                              <div className="px-3 py-2 text-sm text-gray-400">
                                Loading vendors…
                              </div>
                            )}
                            {!vendorLoading && vendors.length === 0 && (
                              <div className="px-3 py-2 text-sm text-gray-400">
                                No vendors found
                              </div>
                            )}
                            {vendors.map((v) => (
                              <SelectItem key={v.id} value={v.id.toString()}>
                                {v.name}
                              </SelectItem>
                            ))}
                            {vendorLoading && vendors.length > 0 && (
                              <div className="px-3 py-2 text-xs text-gray-400">
                                Loading more…
                              </div>
                            )}
                          </div>
                        </SelectContent>
                      </Select>
                    </div>

                    <TextField
                      label="Reference Number"
                      value={referenceNumber}
                      onChange={(e) => setReferenceNumber(e.target.value)}
                      placeholder="INV-2024-001"
                    />

                    <div className="flex gap-5">
                      <div className="flex-1">
                        <DateField
                          label="Invoice Date"
                          required
                          value={invoiceDate}
                          onChange={(d) =>
                            setInvoiceDate(d instanceof Date ? d : d ? new Date(d) : null)
                          }
                          placeholder="mm/dd/yyyy"
                        />
                      </div>
                      <div className="flex-1">
                        <DateField
                          label="Due Date"
                          required
                          value={dueDate}
                          onChange={(d) =>
                            setDueDate(d instanceof Date ? d : d ? new Date(d) : null)
                          }
                          placeholder="mm/dd/yyyy"
                        />
                      </div>
                    </div>

                    <TextAreaField
                      label="Memo/Notes"
                      value={memo}
                      onChange={(e) => setMemo(e.target.value)}
                      placeholder="Additional notes..."
                      autoGrow
                    />
                  </div>
                </Panel>

                <Panel title="Item details">
                  <div className="overflow-x-auto">
                    <div className="min-w-[760px]">
                      {/* header */}
                      <div className="flex items-center text-[11px] font-semibold uppercase tracking-wide border-b border-[#E5E5E5] pb-2" style={{ color: TEXT_MUTED }}>
                        <div className="w-[160px] px-2">
                          Property <span className="text-red-500">*</span>
                        </div>
                        <div className="w-[120px] px-2">
                          Unit <span className="text-red-500">*</span>
                        </div>
                        <div className="flex-1 px-2">Description</div>
                        <div className="w-[170px] px-2">
                          GL Account <span className="text-red-500">*</span>
                        </div>
                        <div className="w-[100px] px-2">Upcharge</div>
                        <div className="w-[100px] px-2 text-right">
                          Total <span className="text-red-500">*</span>
                        </div>
                        <div className="w-[40px] px-2" />
                      </div>

                      {/* rows */}
                      {editLineItems.map((item) => {
                        const prop = properties.find(
                          (p) => String(p.id) === item.property,
                        );
                        const isConcierge = prop?.property_type === "C";
                        const hasNonConciergeProp =
                          !!prop && prop.property_type !== "C";
                        const propertyUnits = unitsByProperty[item.property] || [];
                        const unitOptions = (() => {
                          const base = [
                            { value: "__property__", label: "Property Level" },
                            ...propertyUnits
                              .slice()
                              .sort((a, b) =>
                                naturalSort(a.unit_name, b.unit_name),
                              )
                              .map((u) => ({
                                value:
                                  u.buildium_unit_id?.toString() ??
                                  `internal-${u.id}`,
                                label: u.unit_name,
                              })),
                          ];
                          const stored = item.unit;
                          if (
                            stored &&
                            stored !== "__property__" &&
                            !base.some((o) => o.value === stored)
                          ) {
                            base.push({
                              value: stored,
                              label: item.unitName || stored,
                            });
                          }
                          return base;
                        })();

                        return (
                          <div
                            key={item.id}
                            className="flex items-center border-b border-[#F0F0F0] py-2"
                            style={{ color: TEXT_DARK }}
                          >
                            {/* Property */}
                            <div className="w-[160px] px-2">
                              <Select
                                value={item.property}
                                onValueChange={(value) => {
                                  updateLineItem(item.id, "property", value);
                                  setPropertySearch("");
                                }}
                                onOpenChange={(open) => {
                                  if (!open) setPropertySearch("");
                                }}
                              >
                                <SelectTrigger className="w-full h-auto px-0 py-1 text-[13px] border-0 bg-transparent">
                                  <SelectValue placeholder="Select a Property" />
                                </SelectTrigger>
                                <SelectContent
                                  className="bg-white border border-[#E5E7EB] shadow-md p-0"
                                  onKeyDown={(e) => {
                                    if (e.key === "Escape") e.stopPropagation();
                                    const t = e.target as HTMLElement;
                                    if (t.tagName === "INPUT") e.stopPropagation();
                                  }}
                                >
                                  <div className="p-2 border-b border-[#E5E7EB]">
                                    <input
                                      autoFocus
                                      placeholder="Type to search…"
                                      value={propertySearch}
                                      onChange={(e) =>
                                        setPropertySearch(e.target.value)
                                      }
                                      onKeyDown={(e) => e.stopPropagation()}
                                      onFocus={(e) => e.stopPropagation()}
                                      className="w-full rounded-md border px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-[#013764]"
                                    />
                                  </div>
                                  <div className="max-h-[240px] overflow-y-auto">
                                    {filteredProperties.length === 0 && (
                                      <div className="px-3 py-2 text-sm text-gray-400">
                                        No properties found
                                      </div>
                                    )}
                                    {filteredProperties.map((p) => (
                                      <SelectItem
                                        key={p.id}
                                        value={p.id.toString()}
                                      >
                                        {p.name}
                                      </SelectItem>
                                    ))}
                                  </div>
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Unit */}
                            <div className="w-[120px] px-2">
                              <SelectFieldCell
                                value={item.unit}
                                onChange={(value) => {
                                  if (value === "__property__") {
                                    updateLineItem(item.id, "unit", "__property__");
                                    setEditLineItems((prev) =>
                                      prev.map((li) =>
                                        li.id === item.id
                                          ? { ...li, unitName: "Property Level" }
                                          : li,
                                      ),
                                    );
                                  } else {
                                    const selected = propertyUnits.find(
                                      (u) =>
                                        (u.buildium_unit_id?.toString() ??
                                          `internal-${u.id}`) === value,
                                    );
                                    updateLineItem(item.id, "unit", value);
                                    if (selected) {
                                      setEditLineItems((prev) =>
                                        prev.map((li) =>
                                          li.id === item.id
                                            ? { ...li, unitName: selected.unit_name }
                                            : li,
                                        ),
                                      );
                                    }
                                  }
                                }}
                                placeholder={
                                  !item.property
                                    ? "Select property first"
                                    : "Select a Unit"
                                }
                                options={unitOptions}
                                disabled={!item.property}
                              />
                            </div>

                            {/* Description */}
                            <div className="flex-1 px-2">
                              <input
                                type="text"
                                value={item.description}
                                onChange={(e) =>
                                  updateLineItem(
                                    item.id,
                                    "description",
                                    e.target.value,
                                  )
                                }
                                placeholder="Enter description"
                                className="w-full bg-transparent outline-none text-[13px] placeholder-[#A1A1A9]"
                              />
                            </div>

                            {/* GL Account */}
                            <div className="w-[170px] px-2">
                              {isConcierge ? (
                                <ConciergeGLPicker
                                  value={item.qboItemId || ""}
                                  onChange={(qboItemId, displayName) => {
                                    setEditLineItems((prev) =>
                                      prev.map((li) =>
                                        li.id === item.id
                                          ? {
                                              ...li,
                                              qboItemId,
                                              qboItemName: displayName,
                                              glAccount: "",
                                              buildiumAccountId: "",
                                              buildiumAccountName: "",
                                            }
                                          : li,
                                      ),
                                    );
                                  }}
                                />
                              ) : hasNonConciergeProp ? (
                                <BuildiumGLPicker
                                  value={item.buildiumAccountId || ""}
                                  onChange={(buildiumAccountId, displayName) => {
                                    setEditLineItems((prev) =>
                                      prev.map((li) =>
                                        li.id === item.id
                                          ? {
                                              ...li,
                                              buildiumAccountId,
                                              buildiumAccountName: displayName,
                                              glAccount: "",
                                              qboItemId: "",
                                              qboItemName: "",
                                            }
                                          : li,
                                      ),
                                    );
                                  }}
                                />
                              ) : (
                                <Select
                                  value={item.glAccount}
                                  onValueChange={(value) => {
                                    updateLineItem(item.id, "glAccount", value);
                                    setGlSearch("");
                                  }}
                                  onOpenChange={(open) => {
                                    if (!open) setGlSearch("");
                                  }}
                                >
                                  <SelectTrigger className="w-full h-auto px-0 py-1 text-[13px] border-0 bg-transparent">
                                    <SelectValue placeholder="Select an Account" />
                                  </SelectTrigger>
                                  <SelectContent
                                    className="bg-white border border-[#E5E7EB] shadow-md p-0"
                                    onKeyDown={(e) => {
                                      if (e.key === "Escape") e.stopPropagation();
                                      const t = e.target as HTMLElement;
                                      if (t.tagName === "INPUT")
                                        e.stopPropagation();
                                    }}
                                  >
                                    <div className="p-2 border-b border-[#E5E7EB]">
                                      <input
                                        autoFocus
                                        placeholder="Type to search…"
                                        value={glSearch}
                                        onChange={(e) =>
                                          setGlSearch(e.target.value)
                                        }
                                        onKeyDown={(e) => e.stopPropagation()}
                                        onFocus={(e) => e.stopPropagation()}
                                        className="w-full rounded-md border px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-[#013764]"
                                      />
                                    </div>
                                    <div className="max-h-[240px] overflow-y-auto">
                                      {filteredGLAccounts.length === 0 && (
                                        <div className="px-3 py-2 text-sm text-gray-400">
                                          No accounts found
                                        </div>
                                      )}
                                      {filteredGLAccounts.map((gl) => (
                                        <SelectItem
                                          key={gl.id}
                                          value={gl.id.toString()}
                                        >
                                          {gl.name}
                                        </SelectItem>
                                      ))}
                                    </div>
                                  </SelectContent>
                                </Select>
                              )}
                            </div>

                            {/* Upcharge */}
                            <div className="w-[100px] px-2">
                              <input
                                type="text"
                                value={item.upcharge}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  if (
                                    value === "" ||
                                    /^\$?[\d,]*\.?\d{0,2}$/.test(value)
                                  ) {
                                    updateLineItem(
                                      item.id,
                                      "upcharge",
                                      value.startsWith("$") ? value : "$" + value,
                                    );
                                  }
                                }}
                                placeholder="$0.00"
                                className="w-full bg-transparent outline-none text-[13px] placeholder-[#A1A1A9]"
                              />
                            </div>

                            {/* Total */}
                            <div className="w-[100px] px-2">
                              <input
                                type="text"
                                value={item.total}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  if (
                                    value === "" ||
                                    /^\$?[\d,]*\.?\d{0,2}$/.test(value)
                                  ) {
                                    updateLineItem(
                                      item.id,
                                      "total",
                                      value.startsWith("$") ? value : "$" + value,
                                    );
                                  }
                                }}
                                placeholder="$0.00"
                                className="w-full bg-transparent outline-none text-[13px] text-right placeholder-[#A1A1A9]"
                              />
                            </div>

                            {/* Delete */}
                            <div className="w-[40px] px-2 text-center">
                              <button
                                onClick={() => deleteLineItem(item.id)}
                                className="text-[#525252] hover:text-[#303030] transition-colors text-lg leading-none"
                                title="Delete row"
                              >
                                ×
                              </button>
                            </div>
                          </div>
                        );
                      })}

                      <div className="flex items-center justify-between pt-3">
                        <button
                          onClick={addLineItem}
                          className="text-sm font-medium hover:underline"
                          style={{ color: NAVY }}
                        >
                          + Add Line Item
                        </button>
                        <div className="text-sm font-semibold" style={{ color: TEXT_DARK }}>
                          Total: {money(editTotalCents)}
                        </div>
                      </div>
                    </div>
                  </div>
                </Panel>

                <Panel title="File attachments">
                  <div className="space-y-3">
                    {/* Existing synced files — each can be opened or deleted
                        (delete removes it from QBO + Buildium too). */}
                    {attachments.map((att) => (
                      <div
                        key={att.id}
                        className="flex items-center gap-3 rounded-md border border-[#E5E5E5] px-3 py-2"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded border border-[#E5E5E5] bg-[#FAFAFA] text-[#B0413E]">
                          {openingId === att.id ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <FileText className="h-5 w-5" />
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => openPdf(att)}
                          className="flex-1 text-left text-sm hover:underline"
                          style={{ color: NAVY }}
                        >
                          {att.filename}
                          <span className="ml-2 text-xs" style={{ color: TEXT_MUTED }}>
                            (synced)
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteAttachment(att)}
                          disabled={deletingId !== null || savingEdit}
                          className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
                        >
                          {deletingId === att.id ? "Deleting…" : "Delete"}
                        </button>
                      </div>
                    ))}

                    {/* Newly staged files (re-export on save) */}
                    {newPdfs.map((p, idx) => (
                      <div
                        key={`${p.pdf_object_key}-${idx}`}
                        className="flex items-center gap-3 rounded-md border border-[#E5E5E5] px-3 py-2"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded border border-[#E5E5E5] bg-[#FAFAFA] text-[#B0413E]">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div className="flex-1 text-sm" style={{ color: TEXT_DARK }}>
                          {p.filename}
                          <span className="ml-2 text-xs" style={{ color: TEXT_MUTED }}>
                            (will export on save)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setNewPdfs((prev) => prev.filter((_, i) => i !== idx))
                          }
                          className="text-xs font-medium hover:underline"
                          style={{ color: NAVY }}
                        >
                          Remove
                        </button>
                      </div>
                    ))}

                    {/* Drag & drop / click-to-browse zone */}
                    <label
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsDragActive(true);
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsDragActive(false);
                      }}
                      onDrop={handlePdfDrop}
                      className={`flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed px-4 py-6 text-center cursor-pointer transition-colors ${
                        isDragActive
                          ? "border-[#013764] bg-[#013764]/5"
                          : "border-[#DADADA] hover:bg-gray-50"
                      } ${uploadingPdf || savingEdit ? "opacity-50 pointer-events-none" : ""}`}
                    >
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.msg,.eml,application/pdf,image/png,image/jpeg"
                        disabled={uploadingPdf || savingEdit}
                        onChange={handlePdfChange}
                        className="hidden"
                      />
                      {uploadingPdf ? (
                        <div className="flex items-center gap-2 text-sm" style={{ color: TEXT_MUTED }}>
                          <Loader2 className="h-4 w-4 animate-spin" /> Uploading…
                        </div>
                      ) : (
                        <>
                          <div className="text-sm" style={{ color: TEXT_DARK }}>
                            Drag &amp; drop a file here, or{" "}
                            <span className="font-medium" style={{ color: NAVY }}>
                              browse
                            </span>
                          </div>
                          <div className="text-xs" style={{ color: TEXT_MUTED }}>
                            PDF, JPG, PNG, .msg, .eml. Re-attaches to QuickBooks +
                            Buildium when you Save &amp; Re-export.
                          </div>
                        </>
                      )}
                    </label>
                    {pdfError && (
                      <div className="text-xs text-red-600">{pdfError}</div>
                    )}
                  </div>
                </Panel>
              </>
            ) : (
              <>
                <Panel title="Bill details">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-5 gap-x-6">
                    <Field label="Date">{fmtDate(bill.statement_date)}</Field>
                    <Field label="Due">{fmtDate(bill.due_date)}</Field>
                    <Field label="Pay to">
                      <span style={{ color: NAVY }}>{vendorName}</span>
                    </Field>
                    <Field label="Reference number">
                      {bill.invoice_number || "--"}
                    </Field>
                    <Field label="Work order">
                      {lineItems.find((li) => li.work_order_ref)?.work_order_ref ||
                        "--"}
                    </Field>
                    <div />
                    <div className="sm:col-span-3">
                      <Field label="Memo">{bill.memo || "--"}</Field>
                    </div>
                  </div>
                </Panel>

                <Panel
                  title="Approval"
                  action={
                    <button className="text-sm font-medium" style={{ color: NAVY }}>
                      Add approval
                    </button>
                  }
                >
                  <div
                    className="text-center text-sm py-6"
                    style={{ color: TEXT_MUTED }}
                  >
                    This bill does not have a recorded approval.
                  </div>
                </Panel>

                <Panel title="Item details">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr
                          className="text-left text-[11px] font-semibold uppercase tracking-wide border-b border-[#E5E5E5]"
                          style={{ color: TEXT_MUTED }}
                        >
                          <th className="py-2 pr-4 font-semibold">
                            Property or company
                          </th>
                          <th className="py-2 pr-4 font-semibold">Unit</th>
                          <th className="py-2 pr-4 font-semibold">Account</th>
                          <th className="py-2 pr-4 font-semibold">Description</th>
                          <th className="py-2 pr-4 font-semibold text-right">
                            Upcharge
                          </th>
                          <th className="py-2 pr-4 font-semibold text-right">
                            Initial amount
                          </th>
                          <th className="py-2 font-semibold text-right">
                            Remaining amount
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {lineItems.map((li, idx) => (
                          <tr
                            key={li.line_id ?? idx}
                            className="border-b border-[#F0F0F0]"
                            style={{ color: TEXT_DARK }}
                          >
                            <td className="py-3 pr-4 align-top">
                              <div>{bill.property_address || "--"}</div>
                              {li.location_name && (
                                <div className="text-xs mt-0.5" style={{ color: TEXT_MUTED }}>
                                  {li.location_name}
                                </div>
                              )}
                            </td>
                            <td className="py-3 pr-4 align-top">
                              {li.unit === "__property__"
                                ? "Property Level"
                                : li.unit_name || li.unit || "--"}
                            </td>
                            <td className="py-3 pr-4 align-top">{accountName(li)}</td>
                            <td className="py-3 pr-4 align-top">
                              {li.description || "--"}
                            </td>
                            <td className="py-3 pr-4 align-top text-right" style={{ color: TEXT_MUTED }}>
                              {li.upcharge_cents && li.upcharge_cents > 0
                                ? money(li.upcharge_cents)
                                : "--"}
                            </td>
                            <td className="py-3 pr-4 align-top text-right">
                              {money(li.amount_cents)}
                            </td>
                            <td className="py-3 align-top text-right">
                              {money(li.amount_cents)}
                            </td>
                          </tr>
                        ))}
                        {(() => {
                          const totalUpchargeCents = lineItems.reduce(
                            (s, li) => s + (li.upcharge_cents || 0),
                            0,
                          );
                          return (
                            <tr className="font-semibold" style={{ color: TEXT_DARK }}>
                              <td className="py-3 pr-4">Total</td>
                              <td className="py-3 pr-4" />
                              <td className="py-3 pr-4" />
                              <td className="py-3 pr-4" />
                              <td className="py-3 pr-4 text-right" style={{ color: TEXT_MUTED }}>
                                {totalUpchargeCents > 0 ? money(totalUpchargeCents) : "--"}
                              </td>
                              <td className="py-3 pr-4 text-right">
                                {money(initialCents)}
                              </td>
                              <td className="py-3 text-right">{money(remainingCents)}</td>
                            </tr>
                          );
                        })()}
                      </tbody>
                    </table>
                  </div>
                </Panel>

                <Panel title="Payment history">
                  {payments.length === 0 ? (
                    <div
                      className="text-center text-sm py-4"
                      style={{ color: TEXT_MUTED }}
                    >
                      No payments recorded.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr
                            className="text-left text-[11px] font-semibold uppercase tracking-wide border-b border-[#E5E5E5]"
                            style={{ color: TEXT_MUTED }}
                          >
                            <th className="py-2 pr-4 font-semibold">Bank account</th>
                            <th className="py-2 pr-4 font-semibold">Date</th>
                            <th className="py-2 pr-4 font-semibold">Method</th>
                            <th className="py-2 font-semibold text-right">
                              Amount paid
                            </th>
                            <th className="py-2 pl-4" />
                          </tr>
                        </thead>
                        <tbody>
                          {payments.map((p) => (
                            <tr
                              key={p.id}
                              className="border-b border-[#F0F0F0] hover:bg-[#F8F8F8]"
                              style={{ color: TEXT_DARK }}
                            >
                              <td className="py-3 pr-4">
                                <span style={{ color: NAVY }}>
                                  {p.paid_from_name || "--"}
                                </span>
                              </td>
                              <td className="py-3 pr-4">{fmtDate(p.paid_on)}</td>
                              <td className="py-3 pr-4">
                                {p.paid_doc_number ? "Check" : "Payment"}
                              </td>
                              <td className="py-3 text-right">
                                {money(p.amount_cents)}
                              </td>
                              <td className="py-3 pl-4 text-right">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingPayment(p);
                                    setEditPaymentOpen(true);
                                  }}
                                  className="text-xs font-medium px-2 py-1 rounded border border-[#E5E5E5] text-[#525252] hover:border-[#013764] hover:text-[#013764] transition-colors"
                                >
                                  Edit
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Panel>

                <Panel title="File attachments">
                  {attachments.length > 0 ? (
                    <div className="space-y-2">
                      {attachments.map((att) => (
                        <button
                          key={att.id}
                          onClick={() => openPdf(att)}
                          disabled={openingId === att.id}
                          className="flex items-center gap-3 text-left w-full hover:bg-gray-50 rounded-md p-2 -m-2 transition-colors"
                        >
                          <div className="flex h-10 w-10 items-center justify-center rounded border border-[#E5E5E5] bg-[#FAFAFA] text-[#B0413E]">
                            {openingId === att.id ? (
                              <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                              <FileText className="h-5 w-5" />
                            )}
                          </div>
                          <div>
                            <div className="text-sm" style={{ color: NAVY }}>
                              {att.filename}
                            </div>
                            <div className="text-xs" style={{ color: TEXT_MUTED }}>
                              {(att.size_bytes / 1024).toFixed(0)} KB · {att.mime}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div
                      className="text-center text-sm py-4"
                      style={{ color: TEXT_MUTED }}
                    >
                      No file attachments.
                    </div>
                  )}
                </Panel>
              </>
            )}
          </div>

          {/* right / summary */}
          <div className="space-y-6">
            <Panel title="Bill amount">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span
                    className="text-[11px] font-semibold uppercase tracking-wide"
                    style={{ color: TEXT_MUTED }}
                  >
                    Initial
                  </span>
                  <span style={{ color: TEXT_DARK }}>{money(initialCents)}</span>
                </div>
                <div className="flex justify-between">
                  <span
                    className="text-[11px] font-semibold uppercase tracking-wide"
                    style={{ color: TEXT_MUTED }}
                  >
                    Paid
                  </span>
                  <span style={{ color: TEXT_DARK }}>{money(paidCents)}</span>
                </div>
                <div className="flex justify-between border-t border-[#E5E5E5] pt-3">
                  <span
                    className="text-[11px] font-semibold uppercase tracking-wide"
                    style={{ color: TEXT_MUTED }}
                  >
                    Remaining
                  </span>
                  <span className="text-base font-semibold" style={{ color: TEXT_DARK }}>
                    {money(remainingCents)}
                  </span>
                </div>
              </div>
            </Panel>

            <Panel title="Markup">
              {(() => {
                const totalUpchargeCents = lineItems.reduce(
                  (s, li) => s + (li.upcharge_cents || 0),
                  0,
                );
                if (totalUpchargeCents === 0) {
                  return (
                    <div className="text-center text-sm py-2" style={{ color: TEXT_MUTED }}>
                      This bill has no markup.
                    </div>
                  );
                }
                return (
                  <div className="space-y-2">
                    {lineItems
                      .filter((li) => li.upcharge_cents && li.upcharge_cents > 0)
                      .map((li, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span style={{ color: TEXT_MUTED }} className="truncate pr-2">
                            {li.description || "Line item"}
                          </span>
                          <span style={{ color: TEXT_DARK }} className="font-medium shrink-0">
                            {money(li.upcharge_cents!)}
                          </span>
                        </div>
                      ))}
                    <div
                      className="flex justify-between text-sm font-semibold border-t border-[#E5E5E5] pt-2"
                      style={{ color: TEXT_DARK }}
                    >
                      <span>Total markup</span>
                      <span>{money(totalUpchargeCents)}</span>
                    </div>
                  </div>
                );
              })()}
            </Panel>

            <Panel title="Available credits">
              <div className="flex flex-col items-center justify-center py-4 gap-3">
                <div className="text-sm" style={{ color: TEXT_MUTED }}>
                  No vendor credits
                </div>
                <button className="h-9 px-4 rounded-md text-sm font-medium border border-[#DADADA] bg-white hover:bg-gray-50">
                  Add a credit
                </button>
              </div>
            </Panel>
          </div>
        </div>
      </PageTemplate>

      {/* ── Pay Bill modal (same component + states the old Record Bill page used) ── */}
      {showPayBillModal && (
        <PayBillModal
          open={showPayBillModal}
          onOpenChange={setShowPayBillModal}
          bill={{
            id: bill.id,
            vendorName,
            propertyName: bill.property_address ?? "",
            referenceNumber: bill.invoice_number || undefined,
            qboBalanceCents: payOutstandingCents,
            propertyType: bill.property_type ?? null,
          }}
          onPaid={() => {
            // Re-pull the bill + payment history so the right-column money
            // summary and Payment history table reflect the new payment.
            loadBill().catch(() => {});
          }}
        />
      )}

      {editingPayment && (
        <EditPaymentModal
          open={editPaymentOpen}
          onOpenChange={(o) => {
            setEditPaymentOpen(o);
            if (!o) setEditingPayment(null);
          }}
          payment={{
            id: editingPayment.id,
            amount_cents: editingPayment.amount_cents,
            paid_on: editingPayment.paid_on,
            paid_from_qbo_account_id: editingPayment.paid_from_qbo_account_id ?? null,
            paid_doc_number: editingPayment.paid_doc_number ?? null,
            paid_memo: editingPayment.paid_memo ?? null,
          }}
          bill={{
            vendorName: vendorName,
            referenceNumber: bill.invoice_number || undefined,
          }}
          onSaved={() => loadBill().catch(() => {})}
          onVoided={() => loadBill().catch(() => {})}
        />
      )}
    </div>
  );
}

export default ViewBillV2;
