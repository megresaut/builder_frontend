import { fetchJSON } from "@/api/fetchJSON";

export type AccountType = "asset" | "liability" | "equity" | "income" | "expense";

export interface ChartAccount {
  id: number;
  name: string;
  description: string | null;
  account_type: AccountType;

  buildium_id: number | null;
  buildium_name: string | null;
  buildium_type: string | null;

  qbo_id: string | null;
  qbo_name: string | null;
  qbo_account_type: string | null;
  qbo_detail_type: string | null;

  is_active: boolean;
  buildium_synced_at: string | null;
  qbo_synced_at: string | null;

  created_at: string;
  updated_at: string;
}

export interface ListChartAccountsParams {
  type?: AccountType;
  search?: string;
  activeOnly?: boolean;
}

export async function fetchChartOfAccounts(
  params: ListChartAccountsParams = {},
): Promise<ChartAccount[]> {
  const qs = new URLSearchParams();
  if (params.type) qs.set("type", params.type);
  if (params.search) qs.set("q", params.search);
  if (params.activeOnly) qs.set("active_only", "1");
  const path = qs.toString()
    ? `/chart-of-accounts?${qs.toString()}`
    : "/chart-of-accounts";
  const res = await fetchJSON(path);
  return res.accounts ?? [];
}
