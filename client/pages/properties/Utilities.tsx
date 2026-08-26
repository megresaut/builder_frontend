import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  StatusBadge,
  BillStatusBadge,
  AIInsightBadge,
  ActionButton,
} from "../Utilities_wrong";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchJSON } from "@/api/fetchJSON";
import { useParams } from "react-router-dom";
import EditUtilityAccountModal from "@/components/EditUtilityAccountModal";
import ManualBillUploadModal from "@/components/ManualBillUploadModal";
import { toast } from "sonner";
import { openAuthPdf } from "@/api/openAuthPdf";

interface UtilityAccount {
  id: number;
  provider: string;
  account: string;
  serviceAddress: string;
  status: "active" | "inactive" | "owner_managed";
  lastBillDate: string;
  lastBillAmount: string;
  lastImport: string;
  icon?: React.ReactNode;
  username: string;
}

interface Bill {
  id: number;
  provider: string;
  date: string;
  aiUsageInsight: "High" | "Normal" | "Low";
  changeFromLastBill: string;
  status: "Pushed" | "Push Failed";
  amount: string;
  icon?: React.ReactNode;
}
type MappedAccount = {
  id: number;
  provider: string;
  account: string;
  status: "active" | "inactive" | "owner_managed";
  lastBillDate: string;
  lastBillAmount: string;
  lastImport: string;
  icon?: React.ReactNode;
  type: string | null | undefined;
  nextScheduledScrapeAt?: string | null;
};

type MappedBill = {
  id: number;
  provider: string;
  date: string;
  aiUsageInsight: "Normal" | "High" | "Low";
  changeFromLastBill: string;
  status: "Pushed" | "Push Failed";
  amount: string;
  icon?: React.ReactNode;
  type: string | null | undefined;
};

// Local badge for the 3-way utility account status. Kept separate from the
// shared StatusBadge in Utilities_wrong.tsx, which AllProperties.tsx also
// uses for an unrelated (property-level) active/inactive status.
const UtilityAccountStatusBadge = ({
  status,
}: {
  status: "active" | "inactive" | "owner_managed";
}) => {
  if (status === "owner_managed") {
    return (
      <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
        Owner Managed
      </span>
    );
  }
  return <StatusBadge status={status} />;
};

const API_BASE = "/api";
// const API_BASE = "http://localhost:8080";   

// --- Utilities import types & helpers ---

// Simple delay helper for polling
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Types for the utilities job endpoints
type UtilityJobEnqueueResponse = {
  job_id: number;
  status: string;
  account?: number;
  period?: string;
  requested_by?: string;
};

type UtilityJobStatusDTO = {
  job_id: number;
  status: "queued" | "running" | "succeeded" | "failed" | string;
  provider?: string;
  ts?: string;
  message?: string | null;
};

// ----------------------
// LOCAL STORAGE HELPERS
// ----------------------

const JOB_STORAGE_KEY = "utility-import-jobs";

type StoredJobMap = Record<
  number,
  {
    jobId: number;
    startedAt: number;
  }
>;

const loadStoredJobs = (): StoredJobMap => {
  try {
    const raw = localStorage.getItem(JOB_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const saveStoredJobs = (jobs: StoredJobMap) => {
  localStorage.setItem(JOB_STORAGE_KEY, JSON.stringify(jobs));
};

const removeStoredJob = (accountId: number) => {
  const jobs = loadStoredJobs();
  delete jobs[accountId];
  saveStoredJobs(jobs);
};


/**
 * Check if an error message indicates a duplicate bill.
 */
const isDuplicateBillError = (msg: string | null | undefined): boolean => {
  if (!msg) return false;
  const lower = msg.toLowerCase();
  return (
    lower.includes("already been imported") ||
    lower.includes("already exists") ||
    (lower.includes("duplicate key") && lower.includes("bill"))
  );
};

/**
 * Turn a raw job error string into a friendly message.
 * - If it's the duplicate-bill unique constraint → "The bill for this cycle has already been pulled"
 * - Otherwise → generic scrape failure message.
 */
const prettifyImportError = (msg: string | null | undefined): string => {
  if (isDuplicateBillError(msg)) {
    return "The bill for this cycle has already been pulled";
  }

  return "Scrape failed. Please try again. If you’ve already tried this twice, contact support.";
};

// Poll a utilities job until it is succeeded/failed or times out
const pollJobStatus = async (
  jobId: number,
  intervalMs = 2000,
): Promise<UtilityJobStatusDTO> => {
  while (true) {
    const job = await fetchJSON(`/utilities/jobs/${jobId}`);

    if (
      job.status === "succeeded" ||
      job.status === "pushed" ||
      job.status === "skipped" ||
      job.status === "failed" ||
      job.status === "push_failed"
    ) {
      return job;
    }

    await delay(intervalMs);
  }
};


// Poll a batch until it's done
const pollBatchStatus = async (
  batchId: number,
  timeoutMs = 60000,
  intervalMs = 2000,
): Promise<{
  status: string;
  done: number;
  total: number;
  failed: number;
}> => {
  const start = Date.now();

  while (true) {
    const batch = await fetchJSON(`/utilities/import/batch/${batchId}`);

    const done = batch.done_items ?? 0;
    const total = batch.total_items ?? 0;
    const failed = batch.failed ?? 0;
    const status = batch.status ?? "running";

    if (status === "succeeded" || status === "partial") {
      return { status, done, total, failed };
    }

    if (Date.now() - start > timeoutMs) {
      return { status, done, total, failed };
    }

    await delay(intervalMs);
  }
};

const getCategoryIcon = (category: string | null | undefined) => {
  switch (category) {
    case "gas":
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M10 1.5C10 1.5 16 6 16 11C16 15 13 18.5 10 18.5C7 18.5 4 15 4 11C4 6 10 1.5 10 1.5Z"
            fill="#BC423E"
          />
        </svg>
      );

    case "electric":
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M11 1L4 11H10L9 19L16 9H10L11 1Z"
            fill="#EBA524"
          />
        </svg>
      );

    case "water":
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M10 1C10 1 15 7 15 11.5C15 15.6421 12.0899 18.5 8.5 18.5C4.91015 18.5 2 15.6421 2 11.5C2 7 10 1 10 1Z"
            fill="#2463EB"
          />
        </svg>
      );

    case "internet":
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="8" stroke="#059669" strokeWidth="2" />
          <circle cx="10" cy="10" r="3" fill="#059669" />
        </svg>
      );

    default:
      return (
        <div className="h-5 w-5 rounded-full bg-gray-300" />
      );
  }
};

// Helper to render message with clickable links
const renderMessageWithLinks = (message: string) => {
  return message.split('https://').map((part, index) => {
    if (index === 0) return <span key={index}>{part}</span>;
    const url = 'https://' + part.split(' ')[0];
    const rest = part.substring(part.split(' ')[0].length);
    return (
      <span key={index}>
        {' '}
        <a 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 underline hover:text-blue-800"
        >
          {url}
        </a>
        {rest}
      </span>
    );
  });
};

// Provider type for dropdown
type ProviderDTO = {
  id: number;
  display_name: string;
};

interface CreateAccountModalProps {
  propertyId: number;
  propertyAddress: string;
  onClose: () => void;
  onCreated: (account: any) => void;
}

const CreateAccountModal: React.FC<CreateAccountModalProps> = ({
  propertyId, 
  propertyAddress,
  onClose,
  onCreated,
}) => {
  const [providers, setProviders] = useState<ProviderDTO[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(false);

  const [providerId, setProviderId] = useState<number | "">("");
  const [accountNumber, setAccountNumber] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [active, setActive] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);


  const [serviceAddress, setServiceAddress] = useState(propertyAddress || "");
  useEffect(() => {
    setServiceAddress(propertyAddress || "");
  }, [propertyAddress]);
  // load providers on open
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoadingProviders(true);
        const data = await fetchJSON("/providers");
        if (!cancelled) {
          setProviders(data);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to load providers", err);
          setError("Failed to load providers.");
        }
      } finally {
        if (!cancelled) {
          setLoadingProviders(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!providerId) {
      setError("Please select a provider.");
      return;
    }
    if (!accountNumber || !serviceAddress || !username || !password) {
      setError("Please fill in all fields.");
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        provider_id: providerId,
        property_id: propertyId,
        account_number: accountNumber.trim(),
        service_address: serviceAddress.trim(),
        username: username.trim(),
        password,
        active,
      };

      const created = await fetchJSON("/utilities/accounts", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      onCreated(created);
    } catch (err: any) {
      console.error("Failed to create utility account", err);
      const msg =
        err?.message && typeof err.message === "string"
          ? err.message
          : "Failed to create account.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };
  

  return (
    <div
      className="modal-backdrop"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
      }}
      onClick={onClose}
    >
      <div
        className="modal"
        style={{
          background: "var(--bg-card, #ffffff)",
          borderRadius: "0.75rem",
          border: "1px solid var(--border-subtle, #e5e7eb)",
          padding: "1.5rem",
          width: "100%",
          maxWidth: 520,
          boxShadow: "0 18px 45px rgba(15, 23, 42, 0.35)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: "1rem",
          }}
        >
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: "1.05rem",
                fontWeight: 600,
                color: "var(--text-main, #111827)",
              }}
            >
              Add utility account
            </h3>
            <p
              style={{
                margin: 0,
                marginTop: 4,
                fontSize: "0.85rem",
                color: "var(--text-muted, #6b7280)",
              }}
            >
              Connect a provider so AVM can automatically pull bills.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost"
            style={{ padding: "0 0.25rem", fontSize: 18 }}
          >
            ×
          </button>
        </div>

        {error && (
          <div
            style={{
              marginBottom: "0.75rem",
              padding: "0.5rem 0.75rem",
              borderRadius: 6,
              border: "1px solid var(--danger, #b91c1c)",
              background: "var(--danger-soft, #fef2f2)",
              color: "var(--danger, #b91c1c)",
              fontSize: "0.8rem",
            }}
          >
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: "0.75rem",
          }}
        >
          {/* Provider */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label
              style={{
                fontSize: "0.8rem",
                fontWeight: 500,
                color: "var(--text-muted, #6b7280)",
              }}
            >
              Provider
            </label>
            <select
              value={providerId}
              onChange={(e) =>
                setProviderId(
                  e.target.value ? Number(e.target.value) : ("" as "")
                )
              }
              disabled={loadingProviders}
              style={{
                height: 36,
                borderRadius: 8,
                border: "1px solid var(--border-subtle, #e5e7eb)",
                padding: "0 0.5rem",
                fontSize: "0.85rem",
              }}
            >
              <option value="">
                {loadingProviders ? "Loading providers…" : "Select provider"}
              </option>
              {providers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.display_name}
                </option>
              ))}
            </select>
          </div>

          {/* Account number */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label
              style={{
                fontSize: "0.8rem",
                fontWeight: 500,
                color: "var(--text-muted, #6b7280)",
              }}
            >
              Account number
            </label>
            <input
              type="text"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="e.g. 123456789"
              style={{
                height: 36,
                borderRadius: 8,
                border: "1px solid var(--border-subtle, #e5e7eb)",
                padding: "0 0.5rem",
                fontSize: "0.85rem",
              }}
            />
          </div>

          {/* Service address */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label
              style={{
                fontSize: "0.8rem",
                fontWeight: 500,
                color: "var(--text-muted, #6b7280)",
              }}
            >
              Service address
            </label>
            <input
              type="text"
              value={serviceAddress}
              onChange={(e) => setServiceAddress(e.target.value)}
              placeholder="e.g. 3 Hekma Rd, Greenwich CT 06831"
              style={{
                height: 36,
                borderRadius: 8,
                border: "1px solid var(--border-subtle, #e5e7eb)",
                padding: "0 0.5rem",
                fontSize: "0.85rem",
              }}
            />
          </div>

          {/* Username */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label
              style={{
                fontSize: "0.8rem",
                fontWeight: 500,
                color: "var(--text-muted, #6b7280)",
              }}
            >
              Portal username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Login username for this account"
              style={{
                height: 36,
                borderRadius: 8,
                border: "1px solid var(--border-subtle, #e5e7eb)",
                padding: "0 0.5rem",
                fontSize: "0.85rem",
              }}
            />
          </div>

          {/* Password */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label
              style={{
                fontSize: "0.8rem",
                fontWeight: 500,
                color: "var(--text-muted, #6b7280)",
              }}
            >
              Portal password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Login password for this account"
              style={{
                height: 36,
                borderRadius: 8,
                border: "1px solid var(--border-subtle, #e5e7eb)",
                padding: "0 0.5rem",
                fontSize: "0.85rem",
              }}
            />
          </div>

          {/* Active toggle */}
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: "0.8rem",
              color: "var(--text-muted, #6b7280)",
              marginTop: 2,
            }}
          >
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
            />
            Mark account as active
          </label>

          {/* Actions */}
          <div
            style={{
              marginTop: "0.5rem",
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
            }}
          >
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting || loadingProviders}
            >
              {submitting ? "Saving…" : "Save account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


interface UtilitiesProps {
  propertyAddress: string;
  propertyType: string;
  propertyUnits: number;
}

export const Utilities: React.FC<UtilitiesProps> = ({
  propertyAddress,
  propertyType,
  propertyUnits,
}) => {
  const navigate = useNavigate();
  const [openUtilityMenuId, setOpenUtilityMenuId] = useState<number | null>(
    null,
  );
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
// ----------------------
// BASE PAGE STATE
// ----------------------
const { propertyId } = useParams<{ propertyId: string }>();
const [error, setError] = useState<string | null>(null);

// ----------------------
// IMPORT STATES
// ----------------------
const [importingAccountId, setImportingAccountId] = useState<number | null>(null);

// Batch import
const [batchImporting, setBatchImporting] = useState(false);
const [batchId, setBatchId] = useState<number | null>(null);
const [batchJobs, setBatchJobs] = useState<Record<string, number>>({});
const [batchErrors, setBatchErrors] = useState<
  { accountId: number; provider: string; message: string }[]
>([]);

// Track if Frontier import was attempted
const [showFrontierBanner, setShowFrontierBanner] = useState(false);
// Track if Starlink import was attempted
const [showStarlinkBanner, setShowStarlinkBanner] = useState(false);

// ----------------------
// LOAD DATA
// ----------------------
const { data: utilityAccounts = [], isLoading: utilLoading } = useQuery({
  queryKey: ["utility-accounts", propertyId],
  queryFn: () => fetchJSON(`/utilities/accounts/${propertyId}`),
});

const { data: bills = [], isLoading: billsLoading } = useQuery({
  queryKey: ["utility-bills", propertyId],
  queryFn: () =>
    fetchJSON(
      `/utilities/bills${propertyId ? `?property_id=${propertyId}` : ""}`,
    ),
});

// Safety wrappers
const safeAccounts = Array.isArray(utilityAccounts) ? utilityAccounts : [];
const safeBills = Array.isArray(bills) ? bills : [];

// ----------------------
// MAP ACCOUNTS
// ----------------------
const mappedAccounts = safeAccounts.map((ua: any) => ({
  id: ua.id,
  provider: ua.provider_name,
  account: ua.account_number,
  serviceAddress: ua.service_address,
  status: (ua.owner_managed
    ? "owner_managed"
    : ua.active
      ? "active"
      : "inactive") as "active" | "inactive" | "owner_managed",
  lastBillDate: ua.last_bill_date
    ? new Date(ua.last_bill_date).toLocaleDateString()
    : "—",
  lastBillAmount: ua.last_bill_amount_cents
    ? `$${(ua.last_bill_amount_cents / 100).toFixed(2)}`
    : "—",
  lastImport: ua.last_import_at
    ? new Date(ua.last_import_at).toLocaleString()
    : "—",
  icon: getCategoryIcon(ua.provider_category),
  type: ua.provider_category,
  username: ua.username ?? "",
  // next_scheduled_scrape_at lets the per-row Import button grey itself out
  // when this cycle's bill is already in. A future value = bill present,
  // cron will fetch the next one on its own.
  nextScheduledScrapeAt: ua.next_scheduled_scrape_at ?? null,
}));

// Rows visible on the Utilities tab: actively-tracked accounts plus
// owner-managed accounts kept on file for reference. True "inactive"
// (deleted/deactivated) accounts stay hidden, only reflected in the count.
const activeMappedAccounts = mappedAccounts.filter(
  (a) => a.status === "active" || a.status === "owner_managed"
);

// ----------------------
// MAP BILLS
// ----------------------
const providerCategoryMap: Record<string, string | null | undefined> = {};
safeAccounts.forEach((ua: any) => {
  providerCategoryMap[ua.provider_name] = ua.provider_category;
});

const filteredBills = safeBills.filter(
  (b: any) => b.provider_name && b.provider_name.trim() !== "",
);

const mappedBills = filteredBills.map((b: any) => {
  const category = providerCategoryMap[b.provider_name] || null;
  return {
    id: b.id,
    provider: b.provider_name,
    date: b.statement_date
      ? new Date(b.statement_date).toLocaleDateString()
      : "—",
    aiUsageInsight: "Normal",
    changeFromLastBill: "—",
    status: "Pushed",
    amount: b.amount_cents
      ? `$${(b.amount_cents / 100).toFixed(2)}`
      : "—",
    icon: getCategoryIcon(category),
    type: category,
  };
});

// Helper function to find bill ID by matching last bill amount
const findBillIdByAmount = (lastBillAmountCents: number | null | undefined): number | null => {
  if (!lastBillAmountCents) return null;
  
  // Find all bills with matching amount
  const matchingBills = filteredBills.filter((b: any) => b.amount_cents === lastBillAmountCents);
  
  if (matchingBills.length === 0) return null;
  
  // If multiple matches, pick the most recent one (by statement_date)
  const sortedBills = matchingBills.sort((a: any, b: any) => {
    const dateA = a.statement_date ? new Date(a.statement_date).getTime() : 0;
    const dateB = b.statement_date ? new Date(b.statement_date).getTime() : 0;
    return dateB - dateA; // Most recent first
  });
  
  return sortedBills[0].id;
};

const [accountLastImport, setAccountLastImport] = useState<Record<number, string>>({});

// Controls the main Import button state
const [importStatus, setImportStatus] = useState<
  "idle" | "importing" | "imported" | "failed"
>("idle");

// Bills table action menu (right-side dropdown)
const [openBillsMenuId, setOpenBillsMenuId] = useState<number | null>(null);
// ----------------------
// KPI CALCULATIONS
// ----------------------
const lastBillImported = filteredBills.length
  ? new Date(
      Math.max(
        ...filteredBills
          .filter((b: any) => b.statement_date)
          .map((b: any) => new Date(b.statement_date).getTime()),
      ),
    ).toLocaleDateString()
  : "—";

const activeAccounts = mappedAccounts.filter((a) => a.status === "active").length;
const inactiveAccounts = mappedAccounts.filter(
  (a) => a.status === "inactive",
).length;

// Check for Frontier accounts
const frontierAccounts = safeAccounts.filter(
  (ua: any) => ua.provider_name?.toLowerCase() === "frontier" && ua.active
);
const hasFrontierAccounts = frontierAccounts.length > 0;
const frontierImportMessage =
  "Automated import unavailable for Frontier. Please go to frontier.com to complete billing.";

// Check for Starlink accounts
const starlinkAccounts = safeAccounts.filter(
  (ua: any) => ua.provider_name?.toLowerCase() === "starlink" && ua.active
);
const starlinkImportMessage =
  "Automated import unavailable for Starlink. Please go to starlink.com to complete billing.";

const totalSpendCents = filteredBills.reduce(
  (sum: number, b: any) => sum + (b.amount_cents || 0),
  0,
);
const totalSpend = `$${(totalSpendCents / 100).toFixed(2)}`;

// ----------------------
// IMPORT HANDLERS
// ----------------------
const queryClient = useQueryClient();

const handleImportAccount = async (utilityAccountId: number) => {
  if (!utilityAccountId) return;

  // Check if provider is Frontier
  const account = safeAccounts.find((ua: any) => ua.id === utilityAccountId);
  if (account && account.provider_name?.toLowerCase() === "frontier") {
    setShowFrontierBanner(true);
    setAccountImportStatus(prev => ({
      ...prev,
      [utilityAccountId]: { 
        state: "failed", 
        message: frontierImportMessage
      }
    }));
    return;
  }

  // Check if provider is Starlink
  if (account && account.provider_name?.toLowerCase() === "starlink") {
    setShowStarlinkBanner(true);
    setAccountImportStatus(prev => ({
      ...prev,
      [utilityAccountId]: { 
        state: "failed", 
        message: starlinkImportMessage
      }
    }));
    return;
  }

  // inline row status
  setAccountImportStatus(prev => {
    const existing = prev[utilityAccountId];
    if (existing?.state === "failed") return prev; // do NOT override failure
  
    return {
      ...prev,
      [utilityAccountId]: { state: "importing" }
    };
  });

  try {
    setImportingAccountId(utilityAccountId);
    setError(null);

    // 1) enqueue job
    const enqueue = await fetchJSON(`/utilities/import/${utilityAccountId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        billing_period: "latest",
        requested_by: "admin",
      }),
    });

    const jobId = enqueue.job_id;
    if (!jobId) {
      const msg = "Unable to start import. Try again.";
      setAccountImportStatus(prev => ({
        ...prev,
        [utilityAccountId]: { state: "failed", message: msg }
      }));
      return;
    }
    const existing = loadStoredJobs();
    existing[utilityAccountId] = {
      jobId,
      startedAt: Date.now(),
    };
    saveStoredJobs(existing);
    
    // 2) poll job
    const job = await pollJobStatus(jobId);

    if (job.status === "failed") {
      const pretty = prettifyImportError(job.message);

      setAccountImportStatus(prev => ({
        ...prev,
        [utilityAccountId]: { state: "failed", message: pretty }
      }));

      return;
    }

    // 3) refresh
    if (propertyId) {
      await queryClient.invalidateQueries({ queryKey: ["utility-bills", propertyId] });
      await queryClient.invalidateQueries({ queryKey: ["utility-accounts", propertyId] });
    }

    // 4) success
    setAccountImportStatus(prev => ({
      ...prev,
      [utilityAccountId]: { state: "imported" }
    }));
    removeStoredJob(utilityAccountId);
  } catch (err: any) {
    const pretty = prettifyImportError(err?.message ?? null);

    setAccountImportStatus(prev => ({
      ...prev,
      [utilityAccountId]: { state: "failed", message: pretty }
    }));  
    removeStoredJob(utilityAccountId);
  } finally {
    setImportingAccountId(null);
  }
};


const handleBatchImport = async () => {
  if (!propertyId) return;

  // Check for Frontier accounts and filter them out
  const frontierAccountsBatch = safeAccounts.filter(
    (ua: any) => ua.provider_name?.toLowerCase() === "frontier" && ua.active
  );

  if (frontierAccountsBatch.length > 0) {
    // Show banner when Frontier import is attempted
    setShowFrontierBanner(true);
    
    // Set error state for Frontier accounts
    frontierAccountsBatch.forEach((ua: any) => {
      setAccountImportStatus(prev => ({
        ...prev,
        [ua.id]: { 
          state: "failed", 
          message: frontierImportMessage
        }
      }));
    });

    return;
  }

  // Check for Starlink accounts and filter them out
  const starlinkAccountsBatch = safeAccounts.filter(
    (ua: any) => ua.provider_name?.toLowerCase() === "starlink" && ua.active
  );

  if (starlinkAccountsBatch.length > 0) {
    // Show banner when Starlink import is attempted
    setShowStarlinkBanner(true);
    
    // Set error state for Starlink accounts
    starlinkAccountsBatch.forEach((ua: any) => {
      setAccountImportStatus(prev => ({
        ...prev,
        [ua.id]: { 
          state: "failed", 
          message: starlinkImportMessage
        }
      }));
    });

    return;
  }

  try {
    setBatchImporting(true);
    setError(null);
    setBatchErrors([]);

    // 1) Enqueue batch (job factory ONLY)
    const resp = await fetchJSON(`/utilities/import/batch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scope: "property",
        ref_id: Number(propertyId),
        billing_period: "latest",
        requested_by: "admin",
      }),
    });

    // Normalize jobs into accountId → jobId map
    const jobs: Record<number, number> = {};

    if (Array.isArray(resp.jobs)) {
      for (const j of resp.jobs) {
        jobs[j.account_id] = j.job_id;
      }
    } else {
      Object.entries(resp.jobs).forEach(([k, v]) => {
        jobs[Number(k)] = Number(v);
      });
    }

    let remaining = Object.keys(jobs).length;

    Object.entries(jobs).forEach(([accountIdStr, jobId]) => {
      const accountId = Number(accountIdStr);

      // optimistic UI
      setAccountImportStatus(prev => ({
        ...prev,
        [accountId]: { state: "importing" },
      }));

      // persist for reload safety
      const stored = loadStoredJobs();
      stored[accountId] = {
        jobId,
        startedAt: Date.now(),
      };
      saveStoredJobs(stored);

      // 🔁 poll the SAME endpoint as single import
      pollJobStatus(jobId)
        .then(job => {
          if (job.status === "failed" || job.status === "push_failed") {
            const pretty = prettifyImportError(job.message);

            setAccountImportStatus(prev => ({
              ...prev,
              [accountId]: { state: "failed", message: pretty },
            }));

            setBatchErrors(prev => [
              ...prev,
              {
                accountId,
                provider:
                  safeAccounts.find(a => a.id === accountId)?.provider_name ??
                  "Unknown",
                message: pretty,
              },
            ]);
          } else {
            setAccountImportStatus(prev => ({
              ...prev,
              [accountId]: { state: "imported" },
            }));
          }
        })
        .finally(async () => {
          removeStoredJob(accountId);
          remaining -= 1;

          // When ALL jobs finish → refresh once
          if (remaining === 0) {
            if (propertyId) {
              await queryClient.invalidateQueries({
                queryKey: ["utility-bills", propertyId],
              });
              await queryClient.invalidateQueries({
                queryKey: ["utility-accounts", propertyId],
              });
            }

            setBatchImporting(false);
          }
        });
    });
  } catch (err: any) {
    setBatchImporting(false);
    setError(
      err?.message && typeof err.message === "string"
        ? err.message
        : "Batch import failed unexpectedly.",
    );
  }
};



// const [showCreateModal, setShowCreateModal] = useState(false);

// ======================================================================
// UI ENHANCEMENTS FROM BUILDER-SYNC (ADDED BELOW, DO NOT REPLACE ANY LOGIC)
// ======================================================================

// Pagination + page-size UI
const [billsCurrentPage, setBillsCurrentPage] = useState<number>(1);
const [billsItemsPerPage, setBillsItemsPerPage] = useState<number>(10);
const [showBillsPageSizeDropdown, setShowBillsPageSizeDropdown] =
  useState<boolean>(false);

const billsDropdownButtonRef = useRef<HTMLButtonElement>(null);
const billsDropdownMenuRef = useRef<HTMLDivElement>(null);

const [billsDropdownPos, setBillsDropdownPos] = useState({ top: 0, left: 0 });

// Utility modal UI
const [isEditUtilityModalOpen, setIsEditUtilityModalOpen] =
  useState<boolean>(false);
const [editingUtilityAccount, setEditingUtilityAccount] =
  useState<UtilityAccount | null>(null);
const [utilityModalMode, setUtilityModalMode] =
  useState<"add" | "edit">("edit");

// Manual-bill upload modal (per-row "Upload manually" action).
// Tracks which account the modal is open for; null = closed.
const [manualBillAccount, setManualBillAccount] = useState<{
  id: number;
  provider: string;
  account: string;
} | null>(null);

// Account-level import UI (optional, not tied to backend)
const [accountImportStatus, setAccountImportStatus] = useState<
  Record<number, { state: "idle" | "importing" | "imported" | "failed"; message?: string }>
>({});
// Dropdown position update effect
useEffect(() => {
  let animationFrameId: number;

  const updateDropdownPos = () => {
    if (showBillsPageSizeDropdown && billsDropdownButtonRef.current) {
      const rect = billsDropdownButtonRef.current.getBoundingClientRect();
      setBillsDropdownPos({
        top: rect.bottom + 8,
        left: rect.left,
      });
    }

    if (showBillsPageSizeDropdown) {
      animationFrameId = requestAnimationFrame(updateDropdownPos);
    }
  };

  if (showBillsPageSizeDropdown) {
    updateDropdownPos();
  }

  return () => {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
  };
}, [showBillsPageSizeDropdown]);

// Close dropdown when clicking outside
useEffect(() => {
  if (!showBillsPageSizeDropdown) return;

  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as Node;
    if (
      billsDropdownMenuRef.current &&
      billsDropdownButtonRef.current &&
      !billsDropdownMenuRef.current.contains(target) &&
      !billsDropdownButtonRef.current.contains(target)
    ) {
      setShowBillsPageSizeDropdown(false);
    }
  };

  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
}, [showBillsPageSizeDropdown]);

// Pagination calculation
const billsTotalPages = Math.ceil(filteredBills.length / billsItemsPerPage);

const getBillsPaginationNumbers = () => {
  const pages: (number | string)[] = [];
  if (billsTotalPages <= 1) return [1];

  if (billsTotalPages <= 7) {
    for (let i = 1; i <= billsTotalPages; i++) pages.push(i);
    return pages;
  }

  const windowSize = 7;
  let start = Math.max(1, billsCurrentPage - 2);
  let end = start + windowSize - 1;

  if (end > billsTotalPages) {
    end = billsTotalPages;
    start = Math.max(1, end - windowSize + 1);
  }

  for (let i = start; i <= end; i++) pages.push(i);
  return pages;
};


// ----------------------
// RESTORE IN-FLIGHT IMPORTS ON PAGE LOAD
// ----------------------
useEffect(() => {
  const stored = loadStoredJobs();

  Object.entries(stored).forEach(([accountIdStr, info]) => {
    const accountId = Number(accountIdStr);
    const jobId = info.jobId;

    // show importing immediately
    setAccountImportStatus(prev => ({
      ...prev,
      [accountId]: { state: "importing" },
    }));

    // poll once to resolve
    pollJobStatus(jobId).then(job => {
      if (job.status === "failed") {
        const pretty = prettifyImportError(job.message);
        setAccountImportStatus(prev => ({
          ...prev,
          [accountId]: { state: "failed", message: pretty },
        }));
      } else {
        setAccountImportStatus(prev => ({
          ...prev,
          [accountId]: { state: "imported" },
        }));
      }

      removeStoredJob(accountId);
    });
  });
}, []);



  return (
    <div className="flex flex-col gap-6">
      {/* Frontier Banner - Only show when import is attempted */}
      {showFrontierBanner && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
          <div className="flex items-start gap-2">
            <svg
              className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div className="flex-1">
              <p className="font-medium text-amber-800 mb-1">
                Automated import unavailable for Frontier
              </p>
              <p className="text-amber-700">
                Please go to{" "}
                <a
                  href="https://frontier.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline hover:text-blue-800 font-medium"
                >
                  frontier.com
                </a>{" "}
                to complete billing.
              </p>
            </div>
            <button
              onClick={() => setShowFrontierBanner(false)}
              className="text-amber-600 hover:text-amber-800 ml-2"
              aria-label="Close banner"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Starlink Banner - Only show when import is attempted */}
      {showStarlinkBanner && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
          <div className="flex items-start gap-2">
            <svg
              className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div className="flex-1">
              <p className="font-medium text-amber-800 mb-1">
                Automated import unavailable for Starlink
              </p>
              <p className="text-amber-700">
                Please go to{" "}
                <a
                  href="https://www.starlink.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline hover:text-blue-800 font-medium"
                >
                  starlink.com
                </a>{" "}
                to complete billing.
              </p>
            </div>
            <button
              onClick={() => setShowStarlinkBanner(false)}
              className="text-amber-600 hover:text-amber-800 ml-2"
              aria-label="Close banner"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error.split('https://').map((part, index) => {
            if (index === 0) return <span key={index}>{part}</span>;
            const url = 'https://' + part.split(' ')[0];
            const rest = part.substring(part.split(' ')[0].length);
            return (
              <span key={index}>
                {' '}
                <a 
                  href={url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 underline hover:text-blue-800"
                >
                  {url}
                </a>
                {rest}
              </span>
            );
          })}
        </div>
      )}

      {/* <div
        className="flex justify-between items-center self-stretch rounded-2xl border border-[#E5E5FF] px-4 py-3"
        style={{
          boxShadow:
            "4px -4px 14px 0 rgba(0, 28, 237, 0.07) inset, -4px 4px 14px 0 rgba(237, 0, 217, 0.07) inset",
        }}
      >
        <div className="flex items-center gap-2.5">
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g clipPath="url(#clip0_star)">
              <path
                d="M3 14.6668V11.3335M3 4.66683V1.3335M1.33333 3.00016H4.66667M1.33333 13.0002H4.66667M8.66667 2.00016L7.51047 5.00607C7.32246 5.49489 7.22845 5.7393 7.08227 5.94489C6.95271 6.12709 6.79352 6.28629 6.61131 6.41585C6.40572 6.56203 6.16131 6.65604 5.67249 6.84404L2.66659 8.00016L5.67249 9.15628C6.16131 9.34429 6.40572 9.43829 6.61131 9.58448C6.79352 9.71404 6.95271 9.87323 7.08227 10.0554C7.22845 10.261 7.32246 10.5054 7.51047 10.9943L8.66659 14.0002L9.8227 10.9943C10.0107 10.5054 10.1047 10.261 10.2509 10.0554C10.3805 9.87323 10.5397 9.71404 10.7219 9.58448C10.9274 9.43829 11.1719 9.34429 11.6607 9.15628L14.6666 8.00016L11.6607 6.84404C11.1719 6.65604 10.9274 6.56203 10.7219 6.41585C10.5397 6.28629 10.3805 6.12709 10.2509 5.94489C10.1047 5.7393 10.0107 5.49489 9.8227 5.00607L8.66667 2.00016Z"
                stroke="#1D407F"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
            <defs>
              <clipPath id="clip0_star">
                <rect width="16" height="16" fill="white" />
              </clipPath>
            </defs>
          </svg>
          <div className="font-medium text-base leading-[140%] tracking-[-0.32px] capitalize">
            <span className="font-bold">High Usage</span>
            <span>
              {" "}
              -Electric usage increased 23% compared to last month. Consider
              energy audit.
            </span>
          </div>
        </div>
        <a
          href="#"
          className="text-[#013764] font-medium text-base leading-[140%] tracking-[-0.32px] capitalize underline hover:no-underline"
        >
          View All Insights
        </a>
      </div> */}

      {/* Metrics Cards */}
      <div className="flex items-start content-start gap-4 self-stretch flex-wrap">
        {/* Last Bill Imported Card */}
        <div
          className="flex w-[307px] h-[116px] flex-col items-start gap-4 p-4 rounded-xl border border-[#E9EFF4] shadow-[0_1px_3px_0_rgba(25,54,73,0.03)]"
          style={{ backgroundColor: "#f3f1fe" }}
        >
          <div className="flex items-center self-stretch">
            <div className="flex-1 text-[#717179] font-medium text-base leading-[18px]">
              Last Bill Imported
            </div>
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M7.99992 8.6665C8.36811 8.6665 8.66659 8.36803 8.66659 7.99984C8.66659 7.63165 8.36811 7.33317 7.99992 7.33317C7.63173 7.33317 7.33325 7.63165 7.33325 7.99984C7.33325 8.36803 7.63173 8.6665 7.99992 8.6665Z"
                stroke="#303030"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M7.99992 3.99984C8.36811 3.99984 8.66659 3.70136 8.66659 3.33317C8.66659 2.96498 8.36811 2.6665 7.99992 2.6665C7.63173 2.6665 7.33325 2.96498 7.33325 3.33317C7.33325 3.70136 7.63173 3.99984 7.99992 3.99984Z"
                stroke="#303030"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M7.99992 13.3332C8.36811 13.3332 8.66659 13.0347 8.66659 12.6665C8.66659 12.2983 8.36811 11.9998 7.99992 11.9998C7.63173 11.9998 7.33325 12.2983 7.33325 12.6665C7.33325 13.0347 7.63173 13.3332 7.99992 13.3332Z"
                stroke="#303030"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="flex items-center gap-1.5 self-stretch">
            <div className="text-[#303030] font-medium text-[26px] leading-[34px]">
              {lastBillImported}
            </div>
          </div>
        </div>

        {/* Active Accounts Card */}
        <div className="flex h-[116px] flex-col items-start gap-4 flex-1 p-4 rounded-xl border border-[#E5E5E5] shadow-[0_1px_3px_0_rgba(0,0,0,0.03)]">
          <div className="flex items-center self-stretch">
            <div className="flex-1 text-[#717179] font-medium text-base leading-[18px]">
              Active Accounts
            </div>
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M7.99992 8.6665C8.36811 8.6665 8.66659 8.36803 8.66659 7.99984C8.66659 7.63165 8.36811 7.33317 7.99992 7.33317C7.63173 7.33317 7.33325 7.63165 7.33325 7.99984C7.33325 8.36803 7.63173 8.6665 7.99992 8.6665Z"
                stroke="#303030"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M7.99992 3.99984C8.36811 3.99984 8.66659 3.70136 8.66659 3.33317C8.66659 2.96498 8.36811 2.6665 7.99992 2.6665C7.63173 2.6665 7.33325 2.96498 7.33325 3.33317C7.33325 3.70136 7.63173 3.99984 7.99992 3.99984Z"
                stroke="#303030"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M7.99992 13.3332C8.36811 13.3332 8.66659 13.0347 8.66659 12.6665C8.66659 12.2983 8.36811 11.9998 7.99992 11.9998C7.63173 11.9998 7.33325 12.2983 7.33325 12.6665C7.33325 13.0347 7.63173 13.3332 7.99992 13.3332Z"
                stroke="#303030"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="flex items-end gap-2 self-stretch">
            <div className="text-[#303030] font-medium text-[26px] leading-[28px]">
              {activeAccounts} Accounts
            </div>
            <div className="text-[#717179] font-normal text-sm leading-5">
              {inactiveAccounts} account inactive
            </div>
          </div>
        </div>

        {/* Total YoY Utility Spend Card */}
        <div className="flex flex-col items-start gap-3 flex-1 p-4 rounded-xl border border-[#E5E5E5] shadow-[0_1px_3px_0_rgba(0,0,0,0.03)]">
          <div className="flex items-center self-stretch">
            <div className="flex-1 text-[#717179] font-medium text-base leading-[18px]">
              Total Spend
            </div>
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M7.99992 8.6665C8.36811 8.6665 8.66659 8.36803 8.66659 7.99984C8.66659 7.63165 8.36811 7.33317 7.99992 7.33317C7.63173 7.33317 7.33325 7.63165 7.33325 7.99984C7.33325 8.36803 7.63173 8.6665 7.99992 8.6665Z"
                stroke="#303030"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M7.99992 3.99984C8.36811 3.99984 8.66659 3.70136 8.66659 3.33317C8.66659 2.96498 8.36811 2.6665 7.99992 2.6665C7.63173 2.6665 7.33325 2.96498 7.33325 3.33317C7.33325 3.70136 7.63173 3.99984 7.99992 3.99984Z"
                stroke="#303030"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M7.99992 13.3332C8.36811 13.3332 8.66659 13.0347 8.66659 12.6665C8.66659 12.2983 8.36811 11.9998 7.99992 11.9998C7.63173 11.9998 7.33325 12.2983 7.33325 12.6665C7.33325 13.0347 7.63173 13.3332 7.99992 13.3332Z"
                stroke="#303030"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="flex items-end self-stretch">
            <div className="flex flex-col justify-center items-start gap-1">
              <div className="text-[#303030] font-medium text-[26px] leading-[34px]">
                {totalSpend}
              </div>
              <div className="flex items-start gap-1.5">
                <div className="flex items-center">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M2.0347 4.36018C2.06908 4.25359 2.12733 4.16248 2.20206 4.09837C2.2768 4.03426 2.36467 4.00002 2.45457 4H11.5451C11.6351 3.99991 11.723 4.03407 11.7978 4.09816C11.8726 4.16224 11.9309 4.25338 11.9654 4.36002C11.9998 4.46666 12.0088 4.58401 11.9912 4.69722C11.9737 4.81043 11.9303 4.9144 11.8667 4.99598L7.32142 10.8289C7.27921 10.8832 7.22908 10.9262 7.1739 10.9555C7.11872 10.9849 7.05957 11 6.99984 11C6.94011 11 6.88096 10.9849 6.82578 10.9555C6.7706 10.9262 6.72048 10.8832 6.67826 10.8289L2.13299 4.99598C2.06944 4.91436 2.02619 4.81039 2.00869 4.69721C1.99119 4.58404 2.00024 4.46675 2.0347 4.36018Z"
                      fill="#FFFFFF"
                    />
                  </svg>
                  <div className="text-[#982740] font-medium text-xs leading-normal">
                     
                  </div>
                </div>
                <div className="text-[#717179] font-normal text-sm leading-4">
                   
                </div>
              </div>
            </div>
            <div className="flex justify-center items-center flex-1 relative" />
          </div>
        </div>
      </div>

      {/* Utility Accounts Table */}
      <div className="w-full border border-gray-200 bg-white rounded-lg overflow-hidden">
        {/* Table Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-4">
            <h2 className="text-[#303030] font-medium text-[22px] leading-6">
              Utility Accounts
            </h2>
          </div>
          <div className="flex items-start gap-2.5">
            <button className="flex h-9 justify-center items-center gap-2 px-3 rounded-lg border border-[#DADADA] bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] hover:bg-gray-50 transition-colors">
              <span className="text-[#303030] font-normal text-base leading-[140%] tracking-[-0.32px] capitalize">
                Filter
              </span>
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M4.5 6.75L9 11.25L13.5 6.75"
                  stroke="#303030"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              onClick={() => {
                setEditingUtilityAccount(null);     // no prefill
                setUtilityModalMode("add");         // 👈 ADD MODE
                setIsEditUtilityModalOpen(true);
              }}
              className="flex h-9 justify-center items-center gap-2 px-3 rounded-lg border ..."
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-[#303030] w-5 h-5"
              >
                <path d="M5 12h14" />
                <path d="M12 5v14" />
              </svg>
              Add Account
            </button>
            {/* Top-level Import button removed: per-account scheduling now runs
                the scrape automatically the day after each expected
                period_end. Per-row Import remains as an ops override. */}
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 h-12">
                <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                  <span className="flex items-center gap-2 font-medium text-sm text-gray-700">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M9.49968 1.3335H5.66264C5.54298 1.3335 5.48316 1.3335 5.43034 1.35171C5.38363 1.36783 5.34109 1.39412 5.30579 1.42869C5.26587 1.46778 5.23912 1.5213 5.18561 1.62832L2.38561 7.22831C2.25782 7.48389 2.19393 7.61167 2.20927 7.71555C2.22268 7.80625 2.27285 7.88743 2.34798 7.93998C2.43403 8.00016 2.5769 8.00016 2.86264 8.00016H6.99968L4.99968 14.6668L13.1284 6.23703C13.4027 5.95263 13.5398 5.81043 13.5478 5.68875C13.5548 5.58313 13.5112 5.48049 13.4303 5.41218C13.3371 5.3335 13.1396 5.3335 12.7445 5.3335H7.99968L9.49968 1.3335Z"
                        stroke="#525252"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Provider
                  </span>
                </th>
                <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                  <span className="flex items-center gap-2 font-medium text-sm text-gray-700">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M6.33267 2L4.33267 14M11.666 2L9.66599 14M13.666 5.33333H2.33268M12.9993 10.6667H1.66602"
                        stroke="#525252"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Account
                  </span>
                </th>
                <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                  <span className="flex items-center gap-2 font-medium text-sm text-gray-700">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <g clipPath="url(#clip0_status)">
                        <path
                          d="M8.00065 10.6668V8.00016M8.00065 5.3335H8.00732M14.6673 8.00016C14.6673 11.6821 11.6825 14.6668 8.00065 14.6668C4.31875 14.6668 1.33398 11.6821 1.33398 8.00016C1.33398 4.31826 4.31875 1.3335 8.00065 1.3335C11.6825 1.3335 14.6673 4.31826 14.6673 8.00016Z"
                          stroke="#525252"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </g>
                      <defs>
                        <clipPath id="clip0_status">
                          <rect width="16" height="16" fill="white" />
                        </clipPath>
                      </defs>
                    </svg>
                    Status
                  </span>
                </th>
                <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                  <span className="flex items-center gap-2 font-medium text-sm text-gray-700">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M14 6.66683H2M10.6667 1.3335V4.00016M5.33333 1.3335V4.00016M5.2 14.6668H10.8C11.9201 14.6668 12.4802 14.6668 12.908 14.4488C13.2843 14.2571 13.5903 13.9511 13.782 13.5748C14 13.147 14 12.5869 14 11.4668V5.86683C14 4.74672 14 4.18667 13.782 3.75885C13.5903 3.38252 13.2843 3.07656 12.908 2.88482C12.4802 2.66683 11.9201 2.66683 10.8 2.66683H5.2C4.0799 2.66683 3.51984 2.66683 3.09202 2.88482C2.71569 3.07656 2.40973 3.38252 2.21799 3.75885C2 4.18667 2 4.74672 2 5.86683V11.4668C2 12.5869 2 13.147 2.21799 13.5748C2.40973 13.9511 2.71569 14.2571 3.09202 14.4488C3.51984 14.6668 4.0799 14.6668 5.2 14.6668Z"
                        stroke="#525252"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Last Bill Date
                  </span>
                </th>
                <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                  <span className="flex items-center gap-2 font-medium text-sm text-gray-700">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M4 10.6668C4 12.1396 5.19391 13.3335 6.66667 13.3335H9.33333C10.8061 13.3335 12 12.1396 12 10.6668C12 9.19407 10.8061 8.00016 9.33333 8.00016H6.66667C5.19391 8.00016 4 6.80626 4 5.3335C4 3.86074 5.19391 2.66683 6.66667 2.66683H9.33333C10.8061 2.66683 12 3.86074 12 5.3335M8 1.3335V14.6668"
                        stroke="#525252"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Last Bill Amount
                  </span>
                </th>
                <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                  <span className="flex items-center gap-2 font-medium text-sm text-gray-700">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M15.1333 9L13.8004 7.66667L12.4666 9M14 8C14 11.3137 11.3137 14 8 14C4.68629 14 2 11.3137 2 8C2 4.68629 4.68629 2 8 2C10.2013 2 12.1257 3.18542 13.1697 4.95273M8 4.66667V8L10 9.33333"
                        stroke="#525252"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Last Import
                  </span>
                </th>
                <th className="sticky right-0 px-2 py-3 text-center w-20">
                  <span className="font-medium text-sm text-gray-700">
                    Actions
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {activeMappedAccounts.map((account, index) => (
                <tr
                  key={account.id}
                  className={cn(
                    "hover:bg-gray-50 transition-colors h-12",
                    index === (mappedAccounts?.length || 0) - 1
                      ? "border-b-0"
                      : "border-b border-gray-200",
                  )}
                >
                  <td className="px-3 py-3 border-r border-gray-200 whitespace-nowrap">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100">
                        {account.icon}
                      </div>
                      <span className="text-gray-900 font-normal text-base">
                        {account.provider}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3 border-r border-gray-200 whitespace-nowrap">
                    <span className="text-gray-900 font-normal text-base">
                      {account.account}
                    </span>
                  </td>
                  <td className="px-3 py-3 border-r border-gray-200 whitespace-nowrap">
                    <UtilityAccountStatusBadge status={account.status} />
                  </td>
                  <td className="px-3 py-3 border-r border-gray-200 whitespace-nowrap">
                    <span className="text-gray-900 font-normal text-base">
                      {account.lastBillDate}
                    </span>
                  </td>
                  <td className="px-3 py-3 border-r border-gray-200 whitespace-nowrap">
                    <span className="text-gray-900 font-normal text-base">
                      {account.lastBillAmount}
                    </span>
                  </td>
                  <td className="px-3 py-3 border-r border-gray-200 whitespace-nowrap">
                    {/* IMPORTING */}
                    {accountImportStatus[account.id]?.state === "importing" && (
                      <span className="inline-flex items-center gap-1.5 text-blue-600">
                        <div className="h-3 w-3 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
                        Importing…
                      </span>
                    )}

                    {/* IMPORTED SUCCESS */}
                    {accountImportStatus[account.id]?.state === "imported" && (
                      <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                        ✓ Imported
                      </span>
                    )}

                    {/* FAILED */}
                    {accountImportStatus[account.id]?.state === "failed" && (
                      <div className="flex items-start gap-3 max-w-[400px]">
                        {/* Badge - blue for duplicates, red for errors */}
                        {(() => {
                          const errorMsg = accountImportStatus[account.id]?.message || "";
                          const isDuplicate = isDuplicateBillError(errorMsg);
                          
                          if (isDuplicate) {
                            return (
                              <span className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full text-sm font-medium whitespace-nowrap">
                                ℹ Already pulled
                              </span>
                            );
                          }
                          
                          return (
                            <span className="inline-flex items-center gap-1.5 bg-red-100 text-red-700 px-2.5 py-1 rounded-full text-sm font-medium whitespace-nowrap">
                              ✕ Failed
                            </span>
                          );
                        })()}

                        {/* Multi-line message — cleaner formatting */}
                        <div className="flex flex-col leading-snug mt-[2px]">
                          {(() => {
                            const errorMsg = accountImportStatus[account.id]?.message || "";
                            const isDuplicate = isDuplicateBillError(errorMsg);
                            
                            if (isDuplicate) {
                              return (
                                <span className="text-xs text-blue-600 font-medium">
                                  {errorMsg || "The bill for this cycle has already been pulled"}
                                </span>
                              );
                            }
                            
                            return (
                              <>
                                <span className="text-xs text-red-600 font-medium">
                                  {errorMsg || "Scrape failed"}
                                </span>
                                <span className="text-xs text-red-500 mt-0.5">
                                  Please try again. If issue persists, contact support.
                                </span>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    )}
                    {/* DEFAULT (no import triggered yet) */}
                    {!accountImportStatus[account.id] && (
                      <span className="text-gray-900 text-base">{account.lastImport}</span>
                    )}
                  </td>

                  <td
                    className="sticky right-0 px-2 py-3 flex items-center justify-center"
                    style={{
                      borderLeftWidth: "2px",
                      width: "80px",
                      border:
                        "1px none rgb(226, 232, 240) rgb(226, 232, 240) rgb(226, 232, 240) rgb(210, 209, 207)",
                      borderLeftColor: "transparent",
                    }}
                  >
                  <ActionButton
                    propertyId={account.id}
                    openMenuId={openUtilityMenuId}
                    setOpenMenuId={setOpenUtilityMenuId}

                    onView={async () => {
                      // Find the raw account data to get last_bill_amount_cents
                      const rawAccount = safeAccounts.find((ua: any) => ua.id === account.id);
                      if (!rawAccount) return;

                      // Find matching bill ID by amount
                      const billId = findBillIdByAmount(rawAccount.last_bill_amount_cents);

                      if (billId) {
                        // Use the same link format as the bills table
                        await openAuthPdf(`/utilities/pdf/bills/${billId}`).catch(() => {});
                      } else {
                        // Fallback to the old link if no match found
                        navigate(`/utilities/accounts/${account.id}`);
                      }
                    }}

                    onEdit={() => {
                      setEditingUtilityAccount(account);
                      setUtilityModalMode("edit");
                      setIsEditUtilityModalOpen(true);
                    }}

                    onImport={() => handleImportAccount(account.id)}
                    importDisabled={
                      !!account.nextScheduledScrapeAt &&
                      new Date(account.nextScheduledScrapeAt) > new Date()
                    }
                    importDisabledReason="Bill already imported for this account"

                    onUploadManual={() =>
                      setManualBillAccount({
                        id: account.id,
                        provider: account.provider,
                        account: account.account,
                      })
                    }

                    onDelete={async () => {
                      await fetchJSON(`/utilities/accounts/${account.id}`, {
                        method: "DELETE",
                      });

                      // Refresh the utility accounts list
                      await queryClient.invalidateQueries({
                        queryKey: ["utility-accounts", propertyId],
                      });
                    }}
                  />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bills Table */}
      <div className="w-full border border-gray-200 bg-white rounded-lg overflow-hidden">
        {/* Table Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-4">
            <h2 className="text-[#303030] font-medium text-[22px] leading-6">
              Bills Exported to Buildium
            </h2>
          </div>
          <div className="flex items-start gap-2.5">
            <div className="flex h-9 items-center gap-2 px-3 rounded-lg border border-[#DADADA] bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.03)]">
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M17.5 17.5L13.875 13.875M15.8333 9.16667C15.8333 12.8486 12.8486 15.8333 9.16667 15.8333C5.48477 15.8333 2.5 12.8486 2.5 9.16667C2.5 5.48477 5.48477 2.5 9.16667 2.5C12.8486 2.5 15.8333 5.48477 15.8333 9.16667Z"
                  stroke="#303030"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <input
                type="text"
                placeholder="Search..."
                className="text-[#303030] font-normal text-base leading-[140%] tracking-[-0.32px] capitalize bg-transparent border-none outline-none placeholder:text-[#303030] w-32 sm:w-48"
              />
            </div>

            {/* Filter */}
            <button className="flex h-9 justify-center items-center gap-2 px-3 rounded-lg border border-[#DADADA] bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] hover:bg-gray-50 transition-colors">
              <span className="text-[#303030] font-normal text-base leading-[140%] tracking-[-0.32px] capitalize">
                Filter
              </span>
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M4.5 6.75L9 11.25L13.5 6.75"
                  stroke="#303030"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>



            {/* Import (secondary)
            <button
              className={cn(
                "flex h-9 items-center gap-2 px-4 rounded-lg border border-[#DADADA] bg-white text-[#303030] hover:bg-gray-50 transition-colors",
                batchImporting && "opacity-70 cursor-not-allowed",
              )}
              onClick={handleBatchImport}
              disabled={batchImporting}
            >
              <span className="text-sm font-medium">
                {batchImporting ? "Importing…" : "Import"}
              </span>
            </button> */}
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 h-12">
                <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                  <span className="flex items-center gap-2 font-medium text-sm text-gray-700">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M9.49968 1.3335H5.66264C5.54298 1.3335 5.48316 1.3335 5.43034 1.35171C5.38363 1.36783 5.34109 1.39412 5.30579 1.42869C5.26587 1.46778 5.23912 1.5213 5.18561 1.62832L2.38561 7.22831C2.25782 7.48389 2.19393 7.61167 2.20927 7.71555C2.22268 7.80625 2.27285 7.88743 2.34798 7.93998C2.43403 8.00016 2.5769 8.00016 2.86264 8.00016H6.99968L4.99968 14.6668L13.1284 6.23703C13.4027 5.95263 13.5398 5.81043 13.5478 5.68875C13.5548 5.58313 13.5112 5.48049 13.4303 5.41218C13.3371 5.3335 13.1396 5.3335 12.7445 5.3335H7.99968L9.49968 1.3335Z"
                        stroke="#525252"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Provider
                  </span>
                </th>
                <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                  <span className="flex items-center gap-2 font-medium text-sm text-gray-700">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M14 6.66683H2M10.6667 1.3335V4.00016M5.33333 1.3335V4.00016M5.2 14.6668H10.8C11.9201 14.6668 12.4802 14.6668 12.908 14.4488C13.2843 14.2571 13.5903 13.9511 13.782 13.5748C14 13.147 14 12.5869 14 11.4668V5.86683C14 4.74672 14 4.18667 13.782 3.75885C13.5903 3.38252 13.2843 3.07656 12.908 2.88482C12.4802 2.66683 11.9201 2.66683 10.8 2.66683H5.2C4.0799 2.66683 3.51984 2.66683 3.09202 2.88482C2.71569 3.07656 2.40973 3.38252 2.21799 3.75885C2 4.18667 2 4.74672 2 5.86683V11.4668C2 12.5869 2 13.147 2.21799 13.5748C2.40973 13.9511 2.71569 14.2571 3.09202 14.4488C3.51984 14.6668 4.0799 14.6668 5.2 14.6668Z"
                        stroke="#525252"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Statement Date
                  </span>
                </th>
                {/* <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                  <span className="flex items-center gap-2 font-medium text-sm text-gray-700">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M3.66602 1.33317C3.66602 0.964981 3.36754 0.666504 2.99935 0.666504C2.63116 0.666504 2.33268 0.964981 2.33268 1.33317V2.33317H1.33268C0.964492 2.33317 0.666016 2.63165 0.666016 2.99984C0.666016 3.36803 0.964492 3.6665 1.33268 3.6665H2.33268V4.6665C2.33268 5.03469 2.63116 5.33317 2.99935 5.33317C3.36754 5.33317 3.66602 5.03469 3.66602 4.6665V3.6665H4.66602C5.03421 3.6665 5.33268 3.36803 5.33268 2.99984C5.33268 2.63165 5.03421 2.33317 4.66602 2.33317H3.66602V1.33317ZM3.66602 11.3332C3.66602 10.965 3.36754 10.6665 2.99935 10.6665C2.63116 10.6665 2.33268 10.965 2.33268 11.3332V12.3332H1.33268C0.964492 12.3332 0.666016 12.6316 0.666016 12.9998C0.666016 13.368 0.964492 13.6665 1.33268 13.6665H2.33268V14.6665C2.33268 15.0347 2.63116 15.3332 2.99935 15.3332C3.36754 15.3332 3.66602 15.0347 3.66602 14.6665V13.6665H4.66602C5.03421 13.6665 5.33268 13.368 5.33268 12.9998C5.33268 12.6316 5.03421 12.3332 4.66602 12.3332H3.66602V11.3332ZM9.28825 1.76052C9.18922 1.50306 8.94186 1.33317 8.66602 1.33317C8.39017 1.33317 8.14281 1.50306 8.04378 1.76052L6.88767 4.76643C6.6874 5.28712 6.62447 5.43717 6.53838 5.55823C6.45201 5.6797 6.34588 5.78583 6.22441 5.87221C6.10335 5.95829 5.9533 6.02122 5.4326 6.22149L2.4267 7.37761C2.16923 7.47663 1.99935 7.72399 1.99935 7.99984C1.99935 8.27569 2.16923 8.52304 2.4267 8.62207L5.43261 9.77819C5.9533 9.97845 6.10335 10.0414 6.22441 10.1275C6.34588 10.2138 6.45201 10.32 6.53838 10.4414C6.62447 10.5625 6.6874 10.7126 6.88767 11.2332L8.04379 14.2392C8.14281 14.4966 8.39017 14.6665 8.66602 14.6665C8.94186 14.6665 9.18922 14.4966 9.28825 14.2392L10.4444 11.2332C10.6446 10.7126 10.7076 10.5625 10.7936 10.4414C10.88 10.32 10.9862 10.2138 11.1076 10.1275C11.2287 10.0414 11.3787 9.97845 11.8994 9.77819L14.9053 8.62207C15.1628 8.52304 15.3327 8.27569 15.3327 7.99984C15.3327 7.72399 15.1628 7.47663 14.9053 7.37761L11.8994 6.22149C11.3787 6.02122 11.2287 5.95829 11.1076 5.87221C10.9861 5.78583 10.88 5.6797 10.7936 5.55823C10.7076 5.43717 10.6446 5.28712 10.4444 4.76643L9.28825 1.76052Z"
                        fill="#037DFF"
                      />
                    </svg>
                    AI Usage Insight
                  </span>
                </th> */}
                {/* <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                  <span className="flex items-center gap-2 font-medium text-sm text-gray-700">
                    <img
                      loading="lazy"
                      src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/f3223e08811539f2913d760c3f845a57c3ae8328?placeholderIfAbsent=true"
                      alt=""
                      className="w-4 h-4 object-contain"
                    />
                    Change from Last Bill
                  </span>
                </th> */}
                <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                  <span className="flex items-center gap-2 font-medium text-sm text-gray-700">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <g clipPath="url(#clip0_status)">
                        <path
                          d="M8.00065 10.6668V8.00016M8.00065 5.3335H8.00732M14.6673 8.00016C14.6673 11.6821 11.6825 14.6668 8.00065 14.6668C4.31875 14.6668 1.33398 11.6821 1.33398 8.00016C1.33398 4.31826 4.31875 1.3335 8.00065 1.3335C11.6825 1.3335 14.6673 4.31826 14.6673 8.00016Z"
                          stroke="#525252"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </g>
                      <defs>
                        <clipPath id="clip0_status">
                          <rect width="16" height="16" fill="white" />
                        </clipPath>
                      </defs>
                    </svg>
                    Status
                  </span>
                </th>
                <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                  <span className="flex items-center gap-2 font-medium text-sm text-gray-700">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M4 10.6668C4 12.1396 5.19391 13.3335 6.66667 13.3335H9.33333C10.8061 13.3335 12 12.1396 12 10.6668C12 9.19407 10.8061 8.00016 9.33333 8.00016H6.66667C5.19391 8.00016 4 6.80626 4 5.3335C4 3.86074 5.19391 2.66683 6.66667 2.66683H9.33333C10.8061 2.66683 12 3.86074 12 5.3335M8 1.3335V14.6668"
                        stroke="#525252"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Amount
                  </span>
                </th>
                <th className="sticky right-0 px-2 py-3 text-center w-20">
                  <span className="font-medium text-sm text-gray-700">
                    Actions
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
            {mappedBills
              .slice(
                (billsCurrentPage - 1) * billsItemsPerPage,
                billsCurrentPage * billsItemsPerPage,
              )
              .map((bill, index) => (
                <tr
                  key={bill.id}
                  className={cn(
                    "hover:bg-gray-50 transition-colors h-12",
                    index ===
                      mappedBills.slice(
                        (billsCurrentPage - 1) * billsItemsPerPage,
                        billsCurrentPage * billsItemsPerPage,
                      ).length -
                        1
                      ? "border-b-0"
                      : "border-b border-gray-200",
                  )}
                >
                  <td className="px-3 py-3 border-r border-gray-200 whitespace-nowrap">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100">
                        {bill.icon}
                      </div>
                      <span className="text-gray-900 font-normal text-base">
                        {bill.provider}
                      </span>
                    </div>
                  </td>

                  <td className="px-3 py-3 border-r border-gray-200 whitespace-nowrap">
                    <span className="text-gray-900 font-normal text-base">
                      {bill.date}
                    </span>
                  </td>
{/* 
                  <td className="px-3 py-3 border-r border-gray-200">
                    <AIInsightBadge
                      insight={bill.aiUsageInsight as "Normal" | "High" | "Low"}
                    />
                  </td> */}
{/* 
                  <td className="px-3 py-3 border-r border-gray-200 whitespace-nowrap">
                    <span
                      className={cn(
                        "text-sm font-medium",
                        bill.changeFromLastBill.startsWith("↑")
                          ? "text-red-600"
                          : "text-green-600",
                      )}
                    >
                      {bill.changeFromLastBill}
                    </span>
                  </td> */}

                  <td className="px-3 py-3 border-r border-gray-200">
                    <BillStatusBadge
                      status={bill.status as "Pushed" | "Push Failed"}
                    />
                  </td>

                  <td className="px-3 py-3 border-r border-gray-200 whitespace-nowrap">
                    <span className="text-gray-900 font-normal text-base">
                      {bill.amount}
                    </span>
                  </td>

                  <td
                    className="sticky right-0 px-2 py-3 flex items-center justify-center"
                    style={{
                      borderLeftWidth: "2px",
                      width: "80px",
                      border:
                        "1px none rgb(226, 232, 240) rgb(226, 232, 240) rgb(226, 232, 240) rgb(210, 209, 207)",
                      borderLeftColor: "transparent",
                    }}
                  >
                    <ActionButton
                      propertyId={bill.id}
                      openMenuId={openBillsMenuId}
                      setOpenMenuId={setOpenBillsMenuId}
                      onView={async () => {
                        await openAuthPdf(`/utilities/pdf/bills/${bill.id}`).catch(() => {});
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div
          className="flex justify-between items-center px-6 py-4 bg-white gap-4 relative border-t border-gray-200"
          style={{ position: "relative", zIndex: 1, overflow: "visible" }}
        >
          <div className="flex items-center gap-2">
            <span className="text-gray-700 text-sm font-medium">Showing</span>
            <div
              className="relative"
              style={{ position: "relative", zIndex: 10 }}
            >
              <button
                ref={billsDropdownButtonRef}
                onClick={() =>
                  setShowBillsPageSizeDropdown(!showBillsPageSizeDropdown)
                }
                className="flex items-center justify-center gap-2 h-10 px-3 border rounded-lg bg-white hover:bg-gray-50 transition-colors text-gray-900 font-medium text-sm relative"
                style={{
                  borderColor: "rgb(218, 218, 218)",
                  borderWidth: "0.909091px",
                  boxShadow:
                    "rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.03) 0px 1px 3px 0px",
                }}
              >
                <div className="text-gray-900 font-medium text-sm">
                  {billsItemsPerPage}
                </div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
            </div>
            <span className="text-gray-700 text-sm font-medium">
              of {bills?.length || 0}
            </span>
          </div>
          <div
            className="flex items-center rounded-lg border bg-white overflow-hidden"
            style={{
              borderColor: "rgb(218, 218, 218)",
              borderWidth: "0.909091px",
              boxShadow:
                "rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.03) 0px 1px 3px 0px",
            }}
          >
            <button
              disabled={billsCurrentPage === 1}
              onClick={() =>
                setBillsCurrentPage(Math.max(1, billsCurrentPage - 1))
              }
              className={cn(
                "flex items-center justify-center gap-1.5 h-10 px-3 transition-colors",
                billsCurrentPage === 1
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-gray-50",
              )}
              style={{
                borderRightWidth: "0.909091px",
                borderRightColor: "rgb(229, 229, 229)",
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke={
                  billsCurrentPage === 1 ? "rgb(163, 163, 163)" : "currentColor"
                }
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m12 19-7-7 7-7" />
                <path d="M19 12H5" />
              </svg>
              <div
                className={cn(
                  "font-medium text-sm",
                  billsCurrentPage === 1 ? "text-gray-400" : "text-gray-700",
                )}
              >
                Previous
              </div>
            </button>
            {getBillsPaginationNumbers().map((page, idx) => {
              if (page === "...") {
                return (
                  <button
                    key={`ellipsis-${idx}`}
                    disabled
                    className="flex items-center justify-center h-10 min-w-10 opacity-50 cursor-not-allowed"
                    style={{
                      borderRightWidth: "0.909091px",
                      borderRightColor: "rgb(229, 229, 229)",
                      backgroundColor: "rgba(0, 0, 0, 0)",
                    }}
                  >
                    <div className="text-gray-500 font-medium text-sm">...</div>
                  </button>
                );
              }

              return (
                <button
                  key={page}
                  onClick={() => setBillsCurrentPage(page as number)}
                  className={cn(
                    "flex items-center justify-center h-10 min-w-10 transition-colors",
                    billsCurrentPage === page
                      ? "hover:bg-gray-50"
                      : "hover:bg-gray-50",
                  )}
                  style={{
                    borderRightWidth: "0.909091px",
                    borderRightColor: "rgb(229, 229, 229)",
                    backgroundColor:
                      billsCurrentPage === page ? "white" : "rgba(0, 0, 0, 0)",
                  }}
                >
                  <div
                    className={cn(
                      "font-medium text-sm",
                      billsCurrentPage === page
                        ? "text-gray-900 font-bold"
                        : "text-gray-500",
                    )}
                  >
                    {page}
                  </div>
                </button>
              );
            })}
            <button
              onClick={() => setBillsCurrentPage(billsCurrentPage + 1)}
              className={cn(
                "flex items-center justify-center gap-1.5 h-10 px-3 transition-colors hover:bg-gray-50",
              )}
              style={{
                backgroundColor: "rgba(0, 0, 0, 0)",
              }}
            >
              <div className={cn("font-medium text-sm text-gray-700")}>
                Next
              </div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke={
                  billsCurrentPage === billsTotalPages
                    ? "rgb(163, 163, 163)"
                    : "currentColor"
                }
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      {/* {showCreateModal && propertyId && (
        <CreateAccountModal
          propertyId={Number(propertyId)}
          propertyAddress={propertyAddress}
          onClose={() => setShowCreateModal(false)}
          onCreated={(_acct) => {
            queryClient.invalidateQueries({
              queryKey: ["utility-accounts", propertyId],
            });
            setShowCreateModal(false);
          }}
        />
      )} */}

      {/* Bills Page Size Dropdown (UI enhancement from builder-sync) */}
      {showBillsPageSizeDropdown &&
        createPortal(
          <div
            ref={billsDropdownMenuRef}
            className="bg-white overflow-hidden"
            style={{
              border: "0.5px solid #DADADA",
              borderRadius: "8px",
              boxShadow:
                "0 38px 11px 0 rgba(0, 0, 0, 0.00), 0 24px 10px 0 rgba(0, 0, 0, 0.01), 0 14px 8px 0 rgba(0, 0, 0, 0.04), 0 6px 6px 0 rgba(0, 0, 0, 0.06), 0 2px 3px 0 rgba(0, 0, 0, 0.07)",
              zIndex: 99999,
              minWidth: "56px",
              width: "56px",
              position: "fixed",
              top: billsDropdownPos.top + "px",
              left: billsDropdownPos.left + "px",
              pointerEvents: "auto",
            }}
            onMouseLeave={() => setShowBillsPageSizeDropdown(false)}
          >
            {[10, 25, 50].map((size) => (
              <button
                key={size}
                onClick={() => {
                  setBillsItemsPerPage(size);
                  setBillsCurrentPage(1);
                  setShowBillsPageSizeDropdown(false);
                }}
                className="w-full px-3 py-2 text-left hover:bg-gray-100 text-gray-700 font-medium text-sm"
              >
                {size}
              </button>
            ))}
          </div>,
          document.body
        )}

      {/* Manual Bill Upload Modal — opened by per-row "Upload manually" */}
      <ManualBillUploadModal
        open={manualBillAccount !== null}
        onOpenChange={(open) => {
          if (!open) setManualBillAccount(null);
        }}
        account={manualBillAccount}
        onSuccess={(result) => {
          const nextLabel = result.next_scheduled_scrape_at
            ? new Date(result.next_scheduled_scrape_at).toLocaleDateString()
            : "—";
          toast.success(
            `Bill booked (${result.push_status}). Next scrape: ${nextLabel}`
          );
          queryClient.invalidateQueries({
            queryKey: ["utility-accounts", propertyId],
          });
          queryClient.invalidateQueries({
            queryKey: ["utility-bills", propertyId],
          });
        }}
      />

      {/* Edit Utility Account Modal */}
      <EditUtilityAccountModal
        open={isEditUtilityModalOpen}
        onOpenChange={(open) => {
          setIsEditUtilityModalOpen(open);
          if (!open) {
            setEditingUtilityAccount(null);
            setUtilityModalMode("edit");
          }
        }}
        mode={utilityModalMode}
        editData={
          editingUtilityAccount
            ? {
                provider: editingUtilityAccount.provider,
                serviceAddress: editingUtilityAccount.serviceAddress,
                accountNumber: editingUtilityAccount.account,
                status: editingUtilityAccount.status,
                username: editingUtilityAccount.username,
                password: "",
              }
            : null
        }
        onSave={async (payload) => {
          if (!propertyId) return;

          if (utilityModalMode === "add") {
            await fetchJSON("/utilities/accounts", {
              method: "POST",
              body: JSON.stringify({
                provider_id: payload.provider_id,
                property_id: Number(propertyId),
                account_number: payload.account_number,
                service_address: payload.service_address,
                username: payload.username,
                password: payload.password ?? "",
                active: payload.active,
                owner_managed: payload.owner_managed,
              }),
            });
          } else {
            if (!editingUtilityAccount) return;
            const res = await fetchJSON(`/utilities/accounts/${editingUtilityAccount.id}`, {
              method: "PATCH",
              body: JSON.stringify(payload),
            });
            if (res?.cascaded_count > 0) {
              toast.success(
                `Password also updated for ${res.cascaded_count} other account${res.cascaded_count === 1 ? "" : "s"}`
              );
            }
          }

          await queryClient.invalidateQueries({
            queryKey: ["utility-accounts", propertyId],
          });
        }}        
      />

    </div>
  );
};