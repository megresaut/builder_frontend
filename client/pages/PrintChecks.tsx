import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchJSON, authFetch } from "@/api/fetchJSON";
import { toast } from "sonner";
import PageTemplate from "@/layout/PageTemplate";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { ModalTemplate, ModalButtons } from "@/components/ui/ModalTemplate";
import { Input } from "@/components/ui/input";
import { FieldShell } from "@/components/forms/FieldShell";

interface QueuedCheck {
  payment_id: number;
  bill_id: number;
  bill_invoice_number: string | null;
  vendor_name: string;
  property_name: string;
  bank_account: string;
  bank_qbo_acct_id: string;
  amount_cents: number;
  memo: string | null;
  queued_at: string;
  qbo_billpayment_id: string | null;
}

interface CheckHistory {
  payment_id: number;
  bill_id: number;
  bill_invoice_number: string | null;
  vendor_name: string;
  property_name: string;
  bank_account: string;
  amount_cents: number;
  memo: string | null;
  print_status: "printed" | "voided" | string;
  check_number: string | null;
  printed_at: string | null;
  queued_at: string;
  qbo_billpayment_id: string | null;
}

type CheckTab = "queue" | "history";

const fmtUSD = (cents: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(cents / 100);

export default function PrintChecks() {
  const [tab, setTab] = useState<CheckTab>("queue");
  const [rows, setRows] = useState<QueuedCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [printPromptOpen, setPrintPromptOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [startingCheckNumber, setStartingCheckNumber] = useState<string>("");
  const [numberStatus, setNumberStatus] = useState<{
    buildium_last_number: string | null;
    buildium_last_date: string | null;
    platform_last_number: string | null;
    platform_last_date: string | null;
  } | null>(null);
  const [numberStatusLoading, setNumberStatusLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [voiding, setVoiding] = useState(false);

  const [history, setHistory] = useState<CheckHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [refreshingQBO, setRefreshingQBO] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchJSON("/vendors/checks/queue");
      const list: QueuedCheck[] = Array.isArray(data?.checks) ? data.checks : [];
      setRows(list);
      setSelected((prev) => new Set([...prev].filter((id) => list.some((r) => r.payment_id === id))));
    } catch (err: any) {
      setError(err?.message ?? String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const data = await fetchJSON("/vendors/checks/history");
      setHistory(Array.isArray(data?.checks) ? data.checks : []);
    } catch (err: any) {
      setHistoryError(err?.message ?? String(err));
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const refreshFromQBO = useCallback(async () => {
    setRefreshingQBO(true);
    try {
      const data = await fetchJSON("/vendors/checks/refresh-qbo", {
        method: "POST",
      });
      const refreshed = data?.refreshed ?? 0;
      const failed = data?.failed ?? 0;
      if (failed > 0) {
        toast.warning(`Synced ${refreshed} check(s) from QBO · ${failed} couldn't be reached.`);
      } else {
        toast.success(`Synced ${refreshed} check(s) from QBO.`);
      }
      await load();
      if (tab === "history") await loadHistory();
    } catch (err: any) {
      toast.error(`QBO refresh failed: ${err?.message ?? String(err)}`);
    } finally {
      setRefreshingQBO(false);
    }
  }, [load, loadHistory, tab]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (tab === "history") loadHistory();
  }, [tab, loadHistory]);

  const toggleSelect = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === rows.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(rows.map((r) => r.payment_id)));
    }
  };

  const selectedRows = useMemo(
    () => rows.filter((r) => selected.has(r.payment_id)),
    [rows, selected],
  );

  const selectedBanks = useMemo(() => {
    const banks = new Set<string>();
    for (const r of selectedRows) banks.add(r.bank_account);
    return [...banks];
  }, [selectedRows]);

  const handleOpenPrintPrompt = async () => {
    if (selectedRows.length === 0) {
      toast.error("Select at least one check to print.");
      return;
    }
    if (selectedBanks.length > 1) {
      toast.error("Select checks from a single bank account at a time.");
      return;
    }
    setPrintPromptOpen(true);
    setNumberStatus(null);
    setNumberStatusLoading(true);
    try {
      const qboAcctID = selectedRows[0].bank_qbo_acct_id;
      const data = await fetchJSON(
        `/vendors/checks/number-status?qbo_account_id=${encodeURIComponent(qboAcctID)}`,
      );
      setNumberStatus(data);
    } catch {
      setNumberStatus(null);
    } finally {
      setNumberStatusLoading(false);
    }
  };

  const handlePrint = async () => {
    const startNum = parseInt(startingCheckNumber, 10);
    if (!Number.isFinite(startNum) || startNum <= 0) {
      toast.error("Enter a valid starting check number.");
      return;
    }
    setPrinting(true);
    try {
      const res = await authFetch("/vendors/checks/print", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payment_ids: selectedRows.map((r) => r.payment_id),
          starting_check_number: startNum,
        }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Print failed (status ${res.status})`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
      setPrintPromptOpen(false);
      setConfirmOpen(true);
    } catch (err: any) {
      toast.error(`Print failed: ${err?.message ?? String(err)}`);
    } finally {
      setPrinting(false);
    }
  };

  const handleConfirmPrinted = async () => {
    const startNum = parseInt(startingCheckNumber, 10);
    if (!Number.isFinite(startNum) || startNum <= 0) {
      toast.error("Enter a valid starting check number.");
      return;
    }
    setSubmitting(true);
    try {
      const data = await fetchJSON("/vendors/checks/confirm-printed", {
        method: "POST",
        body: JSON.stringify({
          payment_ids: selectedRows.map((r) => r.payment_id),
          starting_check_number: startNum,
        }),
      });
      const results = Array.isArray(data?.results) ? data.results : [];
      const failures = results.filter((r: any) => r?.error);
      if (failures.length > 0) {
        toast.error(
          `${failures.length} of ${results.length} checks had errors. See console for details.`,
        );
        console.warn("[print-checks] partial failures", failures);
      } else {
        toast.success(`Recorded ${results.length} printed check(s).`);
      }
      setConfirmOpen(false);
      setStartingCheckNumber("");
      setSelected(new Set());
      await load();
      await loadHistory();
    } catch (err: any) {
      toast.error(`Confirm failed: ${err?.message ?? String(err)}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleVoid = async () => {
    if (selectedRows.length === 0) {
      toast.error("Select at least one check to void.");
      return;
    }
    if (!window.confirm(`Void ${selectedRows.length} queued check(s)? This deletes the QBO BillPayment.`)) {
      return;
    }
    setVoiding(true);
    try {
      const errors: string[] = [];
      for (const r of selectedRows) {
        try {
          await fetchJSON(`/vendors/checks/${r.payment_id}/void`, {
            method: "POST",
          });
        } catch (err: any) {
          errors.push(`#${r.payment_id}: ${err?.message ?? String(err)}`);
        }
      }
      if (errors.length > 0) {
        toast.error(`Some voids failed: ${errors.join("; ")}`);
      } else {
        toast.success(`Voided ${selectedRows.length} check(s).`);
      }
      setSelected(new Set());
      await load();
    } finally {
      setVoiding(false);
    }
  };

  return (
    <PageTemplate>
      <div className="flex flex-col gap-6 w-fit min-w-full">
        <PageHeader
          title="Print Checks"
          subtitle="Concierge bill payments queued for printing on Intuit voucher check stock."
        />

        <div className="flex items-center gap-1 border-b border-[#E5E5E5]">
          {([
            ["queue", "Queue"],
            ["history", "History"],
          ] as [CheckTab, string][]).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === key
                  ? "border-[#013764] text-[#013764]"
                  : "border-transparent text-[#717179] hover:text-[#303030]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "queue" && (
          <>
            <div className="flex items-center justify-between">
              <div className="text-sm text-[#717179]">
                {loading
                  ? "Loading…"
                  : `${rows.length} check${rows.length === 1 ? "" : "s"} queued · ${selected.size} selected`}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={refreshFromQBO}
                  disabled={refreshingQBO}
                  title="Re-pull check print status & numbers from QuickBooks"
                >
                  {refreshingQBO ? "Syncing…" : "Refresh from QBO"}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleVoid}
                  disabled={voiding || selected.size === 0}
                >
                  {voiding ? "Voiding…" : "Void Selected"}
                </Button>
                <Button
                  onClick={handleOpenPrintPrompt}
                  disabled={printing || selected.size === 0}
                >
                  {printing ? "Generating PDF…" : "Print Selected"}
                </Button>
              </div>
            </div>

            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="rounded-md border border-[#DADADA] bg-white overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-[#717179]">
                  <tr>
                    <th className="px-3 py-2 w-10">
                      <input
                        type="checkbox"
                        checked={rows.length > 0 && selected.size === rows.length}
                        onChange={toggleSelectAll}
                        disabled={rows.length === 0}
                      />
                    </th>
                    <th className="px-3 py-2">Vendor</th>
                    <th className="px-3 py-2">Property</th>
                    <th className="px-3 py-2">Bill #</th>
                    <th className="px-3 py-2 text-right">Amount</th>
                    <th className="px-3 py-2">Bank</th>
                    <th className="px-3 py-2">Queued</th>
                  </tr>
                </thead>
                <tbody>
                  {!loading && rows.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-3 py-6 text-center text-[#717179]">
                        No checks waiting to print.
                      </td>
                    </tr>
                  )}
                  {rows.map((r) => (
                    <tr
                      key={r.payment_id}
                      className="border-t border-[#EFEFEF] hover:bg-gray-50 cursor-pointer"
                      onClick={() => toggleSelect(r.payment_id)}
                    >
                      <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selected.has(r.payment_id)}
                          onChange={() => toggleSelect(r.payment_id)}
                        />
                      </td>
                      <td className="px-3 py-2 text-[#303030] font-medium">{r.vendor_name}</td>
                      <td className="px-3 py-2 text-[#303030]">{r.property_name}</td>
                      <td className="px-3 py-2 text-[#717179]">{r.bill_invoice_number || `#${r.bill_id}`}</td>
                      <td className="px-3 py-2 text-right text-[#303030]">{fmtUSD(r.amount_cents)}</td>
                      <td className="px-3 py-2 text-[#717179]">{r.bank_account}</td>
                      <td className="px-3 py-2 text-[#717179]">
                        {new Date(r.queued_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {tab === "history" && (
          <>
            <div className="flex items-center justify-between">
              <div className="text-sm text-[#717179]">
                {historyLoading
                  ? "Loading…"
                  : `${history.length} check${history.length === 1 ? "" : "s"} printed or voided`}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={refreshFromQBO}
                  disabled={refreshingQBO}
                  title="Re-pull check print status & numbers from QuickBooks"
                >
                  {refreshingQBO ? "Syncing…" : "Refresh from QBO"}
                </Button>
                <Button
                  variant="outline"
                  onClick={loadHistory}
                  disabled={historyLoading}
                >
                  {historyLoading ? "Refreshing…" : "Refresh"}
                </Button>
              </div>
            </div>

            {historyError && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {historyError}
              </div>
            )}

            <div className="rounded-md border border-[#DADADA] bg-white overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-[#717179]">
                  <tr>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Check #</th>
                    <th className="px-3 py-2">Vendor</th>
                    <th className="px-3 py-2">Property</th>
                    <th className="px-3 py-2">Bill #</th>
                    <th className="px-3 py-2 text-right">Amount</th>
                    <th className="px-3 py-2">Bank</th>
                    <th className="px-3 py-2">Printed</th>
                  </tr>
                </thead>
                <tbody>
                  {!historyLoading && history.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-3 py-6 text-center text-[#717179]">
                        No printed or voided checks yet.
                      </td>
                    </tr>
                  )}
                  {history.map((r) => (
                    <tr
                      key={r.payment_id}
                      className="border-t border-[#EFEFEF] hover:bg-gray-50"
                    >
                      <td className="px-3 py-2">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${
                            r.print_status === "printed"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              r.print_status === "printed" ? "bg-emerald-500" : "bg-gray-400"
                            }`}
                          />
                          {r.print_status === "printed" ? "Printed" : "Voided"}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-[#303030] font-medium">
                        {r.check_number ? `#${r.check_number}` : "—"}
                      </td>
                      <td className="px-3 py-2 text-[#303030] font-medium">{r.vendor_name}</td>
                      <td className="px-3 py-2 text-[#303030]">{r.property_name}</td>
                      <td className="px-3 py-2 text-[#717179]">{r.bill_invoice_number || `#${r.bill_id}`}</td>
                      <td className="px-3 py-2 text-right text-[#303030]">{fmtUSD(r.amount_cents)}</td>
                      <td className="px-3 py-2 text-[#717179]">{r.bank_account}</td>
                      <td className="px-3 py-2 text-[#717179]">
                        {r.printed_at ? new Date(r.printed_at).toLocaleString() : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <ModalTemplate
        open={printPromptOpen}
        onOpenChange={(o) => {
          if (printing) return;
          setPrintPromptOpen(o);
          if (!o) setStartingCheckNumber("");
        }}
        title="Print Checks"
        size="sm"
        footer={
          <ModalButtons
            onCancel={() => setPrintPromptOpen(false)}
            onConfirm={handlePrint}
            cancelLabel="Cancel"
            confirmLabel={printing ? "Generating PDF…" : "Print"}
            cancelDisabled={printing}
            confirmDisabled={printing || !startingCheckNumber.trim()}
          />
        }
      >
        <div className="mb-3 text-sm text-[#717179]">
          Assign sequential check numbers to{" "}
          <span className="text-[#303030] font-medium">{selectedRows.length}</span>{" "}
          check{selectedRows.length === 1 ? "" : "s"}
          {selectedBanks.length === 1 && (
            <>
              {" "}
              from{" "}
              <span className="text-[#303030] font-medium">{selectedBanks[0]}</span>
            </>
          )}
          . This number will be printed on the check itself, so make sure it
          matches the next check in the printer.
        </div>
        <div className="mb-3 rounded-md border border-[#DADADA] bg-gray-50 px-3 py-2 text-xs text-[#717179]">
          Buildium and this platform keep two separate sets of check numbers
          on the same bank account, so they never collide: Buildium keeps its
          own low numbers, and checks printed here start at{" "}
          <span className="font-medium text-[#303030]">20000</span>.
          <div className="mt-2 space-y-0.5">
            {numberStatusLoading ? (
              <div>Checking latest known numbers…</div>
            ) : numberStatus ? (
              <>
                <div>
                  Buildium is last known at{" "}
                  <span className="font-medium text-[#303030]">
                    {numberStatus.buildium_last_number
                      ? `#${numberStatus.buildium_last_number}`
                      : "no checks recorded yet"}
                  </span>
                  {numberStatus.buildium_last_date && (
                    <> (as of {numberStatus.buildium_last_date})</>
                  )}
                  .
                </div>
                <div>
                  This platform last printed{" "}
                  <span className="font-medium text-[#303030]">
                    {numberStatus.platform_last_number
                      ? `#${numberStatus.platform_last_number}`
                      : "no checks yet"}
                  </span>
                  {numberStatus.platform_last_date && (
                    <> (as of {numberStatus.platform_last_date})</>
                  )}
                  .
                </div>
              </>
            ) : (
              <div>Couldn't load the latest known numbers — proceed with caution.</div>
            )}
          </div>
        </div>
        <FieldShell label="Starting Check Number" htmlFor="check-start-print">
          <Input
            id="check-start-print"
            type="number"
            min={1}
            value={startingCheckNumber}
            onChange={(e) => setStartingCheckNumber(e.target.value)}
            placeholder="e.g. 20001"
            disabled={printing}
          />
        </FieldShell>
      </ModalTemplate>

      <ModalTemplate
        open={confirmOpen}
        onOpenChange={(o) => {
          if (submitting) return;
          setConfirmOpen(o);
        }}
        title="Confirm Printed Checks"
        size="sm"
        footer={
          <ModalButtons
            onCancel={() => setConfirmOpen(false)}
            onConfirm={handleConfirmPrinted}
            cancelLabel="Cancel"
            confirmLabel={submitting ? "Recording…" : "Confirm"}
            cancelDisabled={submitting}
            confirmDisabled={submitting || !startingCheckNumber.trim()}
          />
        }
      >
        <div className="mb-3 text-sm text-[#717179]">
          Confirming will assign check{" "}
          {selectedRows.length === 1 ? "number" : "numbers"} starting at{" "}
          <span className="text-[#303030] font-medium">#{startingCheckNumber}</span>{" "}
          to <span className="text-[#303030] font-medium">{selectedRows.length}</span>{" "}
          check{selectedRows.length === 1 ? "" : "s"} — the same number{selectedRows.length === 1 ? "" : "s"}{" "}
          already printed on the check{selectedRows.length === 1 ? "" : "s"}. Only confirm
          after verifying the checks printed correctly.
        </div>
        <FieldShell label="Starting Check Number" htmlFor="check-start-confirm">
          <Input
            id="check-start-confirm"
            type="number"
            min={1}
            value={startingCheckNumber}
            readOnly
            disabled
          />
        </FieldShell>
        <div className="mt-2 text-xs text-[#717179]">
          Confirm will:
          <ul className="list-disc list-inside mt-1 space-y-0.5">
            <li>Mark each QBO BillPayment as PrintComplete with its check #.</li>
            <li>Push the payment to Buildium.</li>
            <li>Stamp paid_on on the local bill.</li>
          </ul>
        </div>
      </ModalTemplate>
    </PageTemplate>
  );
}
