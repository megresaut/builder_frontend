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
  bank_coa_id: number;
  amount_cents: number;
  memo: string | null;
  queued_at: string;
  qbo_billpayment_id: string | null;
}

const fmtUSD = (cents: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(cents / 100);

export default function PrintChecks() {
  const [rows, setRows] = useState<QueuedCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [startingCheckNumber, setStartingCheckNumber] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [voiding, setVoiding] = useState(false);

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

  useEffect(() => {
    load();
  }, [load]);

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

  const handlePrint = async () => {
    if (selectedRows.length === 0) {
      toast.error("Select at least one check to print.");
      return;
    }
    if (selectedBanks.length > 1) {
      toast.error("Select checks from a single bank account at a time.");
      return;
    }
    setPrinting(true);
    try {
      const res = await authFetch("/vendors/checks/print", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payment_ids: selectedRows.map((r) => r.payment_id),
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

        <div className="flex items-center justify-between">
          <div className="text-sm text-[#717179]">
            {loading
              ? "Loading…"
              : `${rows.length} check${rows.length === 1 ? "" : "s"} queued · ${selected.size} selected`}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleVoid}
              disabled={voiding || selected.size === 0}
            >
              {voiding ? "Voiding…" : "Void Selected"}
            </Button>
            <Button
              onClick={handlePrint}
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
      </div>

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
          You're about to assign sequential check numbers to{" "}
          <span className="text-[#303030] font-medium">{selectedRows.length}</span>{" "}
          check{selectedRows.length === 1 ? "" : "s"}
          {selectedBanks.length === 1 && (
            <>
              {" "}
              from{" "}
              <span className="text-[#303030] font-medium">{selectedBanks[0]}</span>
            </>
          )}
          .
        </div>
        <FieldShell label="Starting Check Number" htmlFor="check-start">
          <Input
            id="check-start"
            type="number"
            min={1}
            value={startingCheckNumber}
            onChange={(e) => setStartingCheckNumber(e.target.value)}
            placeholder="e.g. 5001"
            disabled={submitting}
          />
        </FieldShell>
        <div className="mt-2 text-xs text-[#717179]">
          Each subsequent check uses the next sequential number. Confirm will:
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
