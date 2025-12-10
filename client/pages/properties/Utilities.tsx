import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  StatusBadge,
  BillStatusBadge,
  AIInsightBadge,
  ActionButton,
} from "../Utilities";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchJSON } from "@/api/fetchJSON";
import { useParams } from "react-router-dom";

interface UtilityAccount {
  id: number;
  provider: string;
  account: string;
  status: "active" | "inactive";
  lastBillDate: string;
  lastBillAmount: string;
  lastImport: string;
  icon?: React.ReactNode;
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
  status: "active" | "inactive";
  lastBillDate: string;
  lastBillAmount: string;
  lastImport: string;
  icon?: React.ReactNode;
  type: string | null | undefined;
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

/**
 * Turn a raw job error string into a friendly message.
 * - If it's the duplicate-bill unique constraint → "Bill already scraped and pushed to Buildium."
 * - Otherwise → generic scrape failure message.
 */
const prettifyImportError = (msg: string | null | undefined): string => {
  if (msg) {
    const lower = msg.toLowerCase();

    const isDuplicate =
      lower.includes("duplicate key value violates unique constraint") &&
      lower.includes(
        "bills_utility_account_id_provider_id_statement_date_amount__key".toLowerCase(),
      );

    if (isDuplicate) {
      return "Bill already scraped and pushed to Buildium.";
    }
  }

  return "Scrape failed. Please try again. If you’ve already tried this twice, contact support.";
};

// Poll a utilities job until it is succeeded/failed or times out
const pollJobStatus = async (
  jobId: number,
  timeoutMs = 60000,
  intervalMs = 2000,
): Promise<UtilityJobStatusDTO> => {
  const start = Date.now();

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const job = await fetchJSON(
      `/utilities/jobs/${jobId}`,
    );

    if (job.status === "succeeded" || job.status === "failed") {
      return job;
    }

    if (Date.now() - start > timeoutMs) {
      // Timed out; return the last seen status
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

// Provider type for dropdown
type ProviderDTO = {
  id: number;
  display_name: string;
};

interface CreateAccountModalProps {
  propertyId: number;
  onClose: () => void;
  onCreated: (account: any) => void;
}

const CreateAccountModal: React.FC<CreateAccountModalProps> = ({
  propertyId,
  onClose,
  onCreated,
}) => {
  const [providers, setProviders] = useState<ProviderDTO[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(false);

  const [providerId, setProviderId] = useState<number | "">("");
  const [accountNumber, setAccountNumber] = useState("");
  const [serviceAddress, setServiceAddress] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [active, setActive] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
  const [openUtilityMenuId, setOpenUtilityMenuId] = useState<number | null>(
    null,
  );
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const { propertyId } = useParams<{ propertyId: string }>();
  const [error, setError] = useState<string | null>(null);

  // per-account import state
  const [importingAccountId, setImportingAccountId] = useState<number | null>(
    null,
  );

  // batch import state
  const [batchImporting, setBatchImporting] = useState(false);
  const [batchId, setBatchId] = useState<number | null>(null);
  const [batchJobs, setBatchJobs] = useState<Record<string, number>>({});
  const [batchErrors, setBatchErrors] = useState<
    { accountId: number; provider: string; message: string }[]
  >([]);

  const { data: utilityAccounts = [], isLoading: utilLoading } = useQuery({
    queryKey: ["utility-accounts", propertyId],
    queryFn: () =>
      fetchJSON(`/utilities/accounts/${propertyId}`),
  });
  
  const { data: bills = [], isLoading: billsLoading } = useQuery({
    queryKey: ["utility-bills", propertyId],
    queryFn: () =>
      fetchJSON(
        `/utilities/bills${propertyId ? `?property_id=${propertyId}` : ""}`
      ),
  });
  
  const safeAccounts = Array.isArray(utilityAccounts)
  ? utilityAccounts
  : [];

const safeBills = Array.isArray(bills)
  ? bills
  : [];

  const mappedAccounts = safeAccounts.map((ua: any) => ({
    id: ua.id,
    provider: ua.provider_name,
    account: ua.account_number,
    status: (ua.active ? "active" : "inactive") as "active" | "inactive",
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
  }));

  // Build a quick provider lookup so bills can inherit category from accounts
  const providerCategoryMap: Record<string, string | null | undefined> = {};
  safeAccounts.forEach((ua: any) => {
    providerCategoryMap[ua.provider_name] = ua.provider_category;
  });


  const filteredBills = safeBills.filter((b: any) => {
    return b.provider_name && b.provider_name.trim() !== "";
  });
  

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

    // ----- KPI VALUES -----

  // 1. Most recent bill date
  const lastBillImported = filteredBills.length
  ? new Date(
      Math.max(
        ...filteredBills
          .filter((b: any) => b.statement_date)
          .map((b: any) => new Date(b.statement_date).getTime())
      )
    ).toLocaleDateString()
  : "—";

  // 2. Active / inactive account counts
  const activeAccounts = mappedAccounts.filter((a) => a.status === "active").length;
  const inactiveAccounts = mappedAccounts.filter((a) => a.status === "inactive").length;

  // 3. Total utility spend
  const totalSpendCents = filteredBills.reduce((sum: number, b: any) => {
  return sum + (b.amount_cents || 0);
  }, 0);

  const totalSpend = `$${(totalSpendCents / 100).toFixed(2)}`;
  const handleImportAccount = async (utilityAccountId: number) => {
    if (!utilityAccountId) return;

    try {
      setImportingAccountId(utilityAccountId);
      setError(null);

      // 1) Enqueue the job and get the job_id back
      const enqueue = await fetchJSON(
        `/utilities/import/${utilityAccountId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            billing_period: "latest",
            requested_by: "admin", // TODO: use current user when auth wired
          }),
        },
      );

      const jobId = enqueue.job_id;

      if (!jobId) {
        setError(
          "Scrape failed. Please try again. If you’ve already tried this twice, contact support.",
        );
        return;
      }

      // 2) Poll until done
      const job = await pollJobStatus(jobId);

      if (job.status === "failed") {
        const friendly = prettifyImportError(job.message ?? null);
        setError(friendly);
        return;
      }

      // 3) On success, refresh bills/accounts via react-query
      if (propertyId) {
        await queryClient.invalidateQueries({
          queryKey: ["utility-bills", propertyId],
        });
        await queryClient.invalidateQueries({
          queryKey: ["utility-accounts", propertyId],
        });
      }

      setError(null);
      alert("Import completed for this account.");
    } catch (err: any) {
      const raw =
        err?.message && typeof err.message === "string" ? err.message : null;
      setError(prettifyImportError(raw));
    } finally {
      setImportingAccountId(null);
    }
  };

  const handleBatchImport = async () => {
    if (!propertyId) return;

    try {
      setBatchImporting(true);
      setError(null);
      setBatchErrors([]);
      setBatchId(null);
      setBatchJobs({});

      // 1) Trigger batch import
      const resp = await fetchJSON(
        `/utilities/import/batch`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            scope: "property",
            ref_id: Number(propertyId),
            billing_period: "latest",
            requested_by: "admin",
          }),
        }
      );

      const id = resp.batch_id;
      setBatchId(id);
      setBatchJobs(resp.jobs || {});

      // 2) Poll until done
      const result = await pollBatchStatus(id);

      // 3) Determine which jobs failed
      const failures: {
        accountId: number;
        provider: string;
        message: string;
      }[] = [];

      for (const [accountIdStr, jobId] of Object.entries(resp.jobs || {})) {
        const accountId = Number(accountIdStr);

        const jobStatus = await fetchJSON(`/utilities/jobs/${jobId}`);

        if (jobStatus.status === "failed") {
          const acct = safeAccounts.find((a: any) => a.id === accountId);
          failures.push({
            accountId,
            provider: acct ? acct.provider_name : "Unknown",
            message: prettifyImportError(jobStatus.message),
          });
        }
      }

      setBatchErrors(failures);

      // 4) Refresh bills/accounts
      if (propertyId) {
        await queryClient.invalidateQueries({
          queryKey: ["utility-bills", propertyId],
        });
        await queryClient.invalidateQueries({
          queryKey: ["utility-accounts", propertyId],
        });
      }

      // 5) Error / success message
      if (failures.length > 0) {
        setError(
          `Some accounts failed (${failures.length}). Check details or try again.`,
        );
      } else {
        setError(null);
        alert("Import completed for all accounts.");
      }
    } catch (err: any) {
      const msg =
        err?.message && typeof err.message === "string"
          ? err.message
          : "Batch import failed unexpectedly.";
      setError(msg);
    } finally {
      setBatchImporting(false);
    }
  };

  const [showCreateModal, setShowCreateModal] = useState(false);
  const queryClient = useQueryClient();


  return (
    <div className="flex flex-col gap-6">
      {/* High Usage Insight Banner */}
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

      <div
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
      </div>

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
              Total YoY Utility Spend Change Spend
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
                      fill="#982740"
                    />
                  </svg>
                  <div className="text-[#982740] font-medium text-xs leading-normal">
                    -12.3%
                  </div>
                </div>
                <div className="text-[#717179] font-normal text-sm leading-4">
                  vs last month
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
        <div className="flex justify-between items-center px-6 py-3 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-4">
            <h2 className="text-[#303030] font-medium text-[22px] leading-6">
              Utility Accounts
            </h2>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Search */}
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

            {/* Add Account (primary blue pill) */}
            <button
              className="flex h-9 items-center gap-2 px-3 rounded-lg bg-[#0A2A57] text-white hover:bg-[#0C3A75] transition-colors border border-[#0A2A57]"
              onClick={() => setShowCreateModal(true)}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M8 3.333v9.334M3.333 8h9.334"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-sm font-medium">Add Account</span>
            </button>


            {/* Import (secondary) */}
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
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 h-12">
                <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                  <span className="font-medium text-sm text-gray-700">
                    Provider
                  </span>
                </th>
                <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                  <span className="font-medium text-sm text-gray-700">
                    Type
                  </span>
                </th>
                <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                  <span className="font-medium text-sm text-gray-700">
                    Account
                  </span>
                </th>
                <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                  <span className="font-medium text-sm text-gray-700">
                    Status
                  </span>
                </th>
                <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                  <span className="font-medium text-sm text-gray-700">
                    Last Bill Date
                  </span>
                </th>
                <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                  <span className="font-medium text-sm text-gray-700">
                    Last Bill Amount
                  </span>
                </th>
                <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                  <span className="font-medium text-sm text-gray-700">
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
              {mappedAccounts.map((account, index) => (
                <tr
                  key={account.id}
                  className={cn(
                    "hover:bg-gray-50 transition-colors h-12",
                    index === safeAccounts.length - 1
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
                      {account.type || "—"}
                    </span>
                  </td>
                  <td className="px-3 py-3 border-r border-gray-200 whitespace-nowrap">
                    <span className="text-gray-900 font-normal text-base">
                      {account.account}
                    </span>
                  </td>
                  <td className="px-3 py-3 border-r border-gray-200 whitespace-nowrap">
                    <StatusBadge status={account.status} />
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
                    <span className="text-gray-900 font-normal text-base">
                      {account.lastImport}
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
                      propertyId={account.id}
                      openMenuId={openUtilityMenuId}
                      setOpenMenuId={setOpenUtilityMenuId}
                      onImport={handleImportAccount}  
                      importing={importingAccountId === account.id}
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
        <div className="flex justify-between items-center px-6 py-3 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-4">
            <h2 className="text-[#303030] font-medium text-[22px] leading-6">
              Bills
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
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 h-12">
                <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                  <span className="font-medium text-sm text-gray-700">
                    Provider
                  </span>
                </th>
                <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                  <span className="font-medium text-sm text-gray-700">
                    Date
                  </span>
                </th>
                <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                  <span className="font-medium text-sm text-gray-700">
                    AI Usage Insight
                  </span>
                </th>
                <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                  <span className="font-medium text-sm text-gray-700">
                    Change from Last Bill
                  </span>
                </th>
                <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                  <span className="font-medium text-sm text-gray-700">
                    Status
                  </span>
                </th>
                <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                  <span className="font-medium text-sm text-gray-700">
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
              {mappedBills.map((bill, index) => (
                <tr
                  key={bill.id}
                  className={cn(
                    "hover:bg-gray-50 transition-colors h-12",
                    index === safeBills.length - 1
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
                  <td className="px-3 py-3 border-r border-gray-200">
                    <AIInsightBadge insight={bill.aiUsageInsight as "Normal" | "High" | "Low"} />
                  </td>
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
                  </td>
                  <td className="px-3 py-3 border-r border-gray-200">
                    <BillStatusBadge status={bill.status as "Pushed" | "Push Failed"} />
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
                      openMenuId={openMenuId}
                      setOpenMenuId={setOpenMenuId}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {showCreateModal && propertyId && (
        <CreateAccountModal
          propertyId={Number(propertyId)}
          onClose={() => setShowCreateModal(false)}
          onCreated={(_acct) => {
            // re-fetch accounts so the new one shows up
            queryClient.invalidateQueries({
              queryKey: ["utility-accounts", propertyId],
            });
            setShowCreateModal(false);
          }}
        />
      )}
    </div>
  );
};
