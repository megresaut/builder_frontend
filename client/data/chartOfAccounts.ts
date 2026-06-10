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

// Live QBO account — shape returned directly from QBO API (no local mapping).
export interface QBOLiveAccount {
  Id: string;
  Name: string;
  AccountType: string;
  AccountSubType: string;
  AcctNum: string;
  Description: string;
  Active: boolean;
  CurrentBalance: number;
}

// Live QBO item — includes expense/income account refs.
export interface QBOLiveItem {
  Id: string;
  SyncToken: string;
  Name: string;
  FullyQualifiedName: string;
  Active: boolean;
  Type: string;
  Description: string;
  ParentRef: { value: string; name: string };
  ExpenseAccountRef: { value: string; name: string };
  IncomeAccountRef: { value: string; name: string };
}

export interface ListChartAccountsParams {
  type?: AccountType;
  search?: string;
  activeOnly?: boolean;
}

export interface CreateChartAccountInput {
  name: string;
  description?: string | null;
  account_type: AccountType;
  qbo_account_type: string;
  qbo_detail_type: string;
}

export interface UpdateChartAccountInput {
  name?: string;
  description?: string | null;
}

export interface CreateQBOItemInput {
  name: string;
  type: string;
  description?: string;
  expense_account_id?: string;
  income_account_id?: string;
  parent_id?: string;
}

export interface UpdateQBOItemInput {
  name?: string;
  description?: string;
  expense_account_id?: string;
  income_account_id?: string;
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

export async function fetchChartAccount(id: number): Promise<ChartAccount> {
  return fetchJSON(`/chart-of-accounts/${id}`);
}

export async function createChartAccount(input: CreateChartAccountInput): Promise<ChartAccount> {
  return fetchJSON("/chart-of-accounts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export async function updateChartAccount(
  id: number,
  input: UpdateChartAccountInput,
): Promise<ChartAccount> {
  return fetchJSON(`/chart-of-accounts/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export async function deactivateChartAccount(id: number): Promise<void> {
  await fetchJSON(`/chart-of-accounts/${id}`, { method: "DELETE" });
}

export async function activateChartAccount(id: number): Promise<void> {
  await fetchJSON(`/chart-of-accounts/${id}/activate`, { method: "POST" });
}

export async function syncChartOfAccountsFromQBO(): Promise<{ synced: number }> {
  return fetchJSON("/chart-of-accounts/sync", { method: "POST" });
}

export async function fetchLiveChartOfAccounts(): Promise<QBOLiveAccount[]> {
  const res = await fetchJSON("/chart-of-accounts/live");
  return res.accounts ?? [];
}

export async function fetchLiveQBOItems(): Promise<QBOLiveItem[]> {
  const res = await fetchJSON("/chart-of-accounts/items/live");
  return res.items ?? [];
}

export async function createQBOItem(input: CreateQBOItemInput): Promise<QBOLiveItem> {
  return fetchJSON("/chart-of-accounts/items", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export async function updateQBOItem(
  qboId: string,
  input: UpdateQBOItemInput,
): Promise<QBOLiveItem> {
  return fetchJSON(`/chart-of-accounts/items/${qboId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export async function deactivateQBOItem(qboId: string): Promise<QBOLiveItem> {
  return fetchJSON(`/chart-of-accounts/items/${qboId}`, { method: "DELETE" });
}

export async function activateQBOItem(qboId: string): Promise<QBOLiveItem> {
  return fetchJSON(`/chart-of-accounts/items/${qboId}/activate`, { method: "POST" });
}
