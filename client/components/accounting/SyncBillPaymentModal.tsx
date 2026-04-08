import { useState } from "react";
import {
  ModalTemplate,
  ModalButtons,
} from "@/components/ui/ModalTemplate";
import { accountingAPI } from "@/api/accounting";
import { toast } from "sonner";

export interface BillPaymentRow {
  id: number;
  transaction_date: string;
  description: string;
  amount_cents: number;
  vendor_name: string;
  property_name: string;
  expense_category: string;
}

interface SyncBillPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  transactions: BillPaymentRow[];
}

function formatCents(cents: number): string {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function SyncBillPaymentModal({
  isOpen,
  onClose,
  onSuccess,
  transactions,
}: SyncBillPaymentModalProps) {
  const [syncing, setSyncing] = useState(false);
  const [results, setResults] = useState<{ id: number; success: boolean; error?: string }[]>([]);
  const [done, setDone] = useState(false);

  const totalCents = transactions.reduce((sum, t) => sum + t.amount_cents, 0);
  const isSingle = transactions.length === 1;

  const handleClose = () => {
    setResults([]);
    setDone(false);
    onClose();
  };

  const handleSync = async () => {
    setSyncing(true);
    setResults([]);
    try {
      if (isSingle) {
        await accountingAPI.syncBillPaymentToQBO(transactions[0].id);
        setResults([{ id: transactions[0].id, success: true }]);
        toast.success("Bill payment synced to QuickBooks");
      } else {
        const ids = transactions.map((t) => t.id);
        const result = await accountingAPI.bulkSyncBillPaymentsToQBO(ids);
        const resultList: { id: number; success: boolean; error?: string }[] =
          (result?.results || []).map((r: any) => ({
            id: r.id,
            success: r.success,
            error: r.error,
          }));
        setResults(resultList);
        const successCount = resultList.filter((r) => r.success).length;
        const failCount = resultList.filter((r) => !r.success).length;
        if (failCount === 0) {
          toast.success(`${successCount} bill payment${successCount !== 1 ? "s" : ""} synced to QuickBooks`);
        } else {
          toast.warning(`${successCount} synced, ${failCount} failed`);
        }
      }
      setDone(true);
      onSuccess();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <ModalTemplate
      open={isOpen}
      onOpenChange={(open) => { if (!open) handleClose(); }}
      title={isSingle ? "Sync Bill Payment to QBO" : `Sync ${transactions.length} Bill Payments to QBO`}
      size="md"
      footer={
        done ? (
          <ModalButtons
            onCancel={handleClose}
            cancelLabel="Close"
            onConfirm={handleClose}
            confirmLabel="Done"
          />
        ) : (
          <ModalButtons
            onCancel={handleClose}
            onConfirm={handleSync}
            confirmLabel={syncing ? "Syncing..." : `Sync to QuickBooks`}
            cancelDisabled={syncing}
          />
        )
      }
    >
      {!done ? (
        <>
          {/* What this does */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm font-medium text-blue-900 mb-1">What happens when you sync</p>
            <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
              <li>A <strong>QBO Bill</strong> (AP record) is created for each vendor expense</li>
              <li>A <strong>QBO BillPayment</strong> is created marking the bill as paid</li>
              <li>The transaction will be marked as synced and cannot be re-synced</li>
            </ul>
          </div>

          {/* Summary */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">
              {transactions.length} transaction{transactions.length !== 1 ? "s" : ""} to sync
            </span>
            <span className="text-sm font-semibold text-gray-900">{formatCents(totalCents)} total</span>
          </div>

          {/* Transaction list */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left py-2 px-3 font-medium text-gray-500">Date</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-500">Vendor</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-500">Property</th>
                  <th className="text-right py-2 px-3 font-medium text-gray-500">Amount</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((txn) => (
                  <tr key={txn.id} className="border-b border-gray-100 last:border-0">
                    <td className="py-2 px-3 text-gray-600">{formatDate(txn.transaction_date)}</td>
                    <td className="py-2 px-3 text-gray-900">{txn.vendor_name || "-"}</td>
                    <td className="py-2 px-3 text-gray-700">{txn.property_name || "-"}</td>
                    <td className="py-2 px-3 text-right font-medium text-gray-900">
                      {formatCents(txn.amount_cents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        /* Results after sync */
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700 mb-3">Sync results</p>
          {results.map((r) => {
            const txn = transactions.find((t) => t.id === r.id);
            return (
              <div
                key={r.id}
                className={`flex items-center justify-between rounded-lg px-3 py-2 ${
                  r.success ? "bg-green-50" : "bg-red-50"
                }`}
              >
                <span className="text-sm text-gray-700">
                  {txn?.vendor_name || `Transaction #${r.id}`}
                  {txn ? ` — ${formatDate(txn.transaction_date)}` : ""}
                </span>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    r.success
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {r.success ? "Synced" : `Failed: ${r.error || "unknown"}`}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </ModalTemplate>
  );
}
