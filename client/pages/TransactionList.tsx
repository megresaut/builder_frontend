import { useCallback, useEffect, useState } from "react";
import PageTemplate from "@/layout/PageTemplate";
import { PageHeader } from "@/components/BillsPageHeader";
import { QBOReportView } from "@/components/QBOReportView";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import {
  fetchTransactionList,
  isQBOOAuthExpired,
  type QBOReportEnvelope,
} from "@/data/qboReports";

const monthStartYMD = (): string => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
};

const monthEndYMD = (): string => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);
};

export default function TransactionList() {
  const [startDate, setStartDate] = useState(monthStartYMD());
  const [endDate, setEndDate] = useState(monthEndYMD());
  const [refreshTick, setRefreshTick] = useState(0);
  const [data, setData] = useState<QBOReportEnvelope | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [oauthExpired, setOauthExpired] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setOauthExpired(false);
    try {
      const res = await fetchTransactionList(startDate, endDate);
      setData(res);
    } catch (e) {
      if (isQBOOAuthExpired(e)) {
        setOauthExpired(true);
      }
      setError(e instanceof Error ? e.message : "Failed to load report");
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    void load();
  }, [load, refreshTick]);

  return (
    <PageTemplate>
      <div className="flex flex-col gap-5 w-fit min-w-full">
        <PageHeader
          title="Transaction List"
          description="Read-only QBO Transaction List for the selected date range. Flat view of every transaction."
        />

        <DateRangeFilter
          startDate={startDate}
          endDate={endDate}
          onChange={(s, e) => {
            setStartDate(s);
            setEndDate(e);
          }}
          onRefresh={() => setRefreshTick((t) => t + 1)}
          loading={loading}
        />

        {error && !oauthExpired && (
          <div className="border border-rose-200 bg-rose-50 text-rose-700 rounded-md px-4 py-3 text-sm flex items-center justify-between gap-4">
            <span>{error || "Unable to load from QBO. Retry?"}</span>
            <button
              type="button"
              onClick={() => setRefreshTick((t) => t + 1)}
              className="px-3 py-1.5 text-sm font-medium rounded-md border border-rose-300 bg-white text-rose-700 hover:bg-rose-100"
            >
              Retry
            </button>
          </div>
        )}

        {oauthExpired && (
          <div className="border border-amber-200 bg-amber-50 text-amber-900 rounded-md px-4 py-3 text-sm">
            QBO authorization has expired. Reconnect the QBO integration to continue viewing reports.
          </div>
        )}

        {!loading && !error && data && (
          <QBOReportView report={data.report} collapsible={false} />
        )}
      </div>
    </PageTemplate>
  );
}
