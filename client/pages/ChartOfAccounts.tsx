import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import PageTemplate from "@/layout/PageTemplate";
import { PageHeader } from "@/components/BillsPageHeader";
import { cn } from "@/lib/utils";
import { SearchableSelect } from "@/components/SearchableSelect";
import {
  fetchLiveChartOfAccounts,
  fetchLiveQBOItems,
  fetchChartOfAccounts,
  createChartAccount,
  updateChartAccount,
  deactivateChartAccount,
  activateChartAccount,
  syncChartOfAccountsFromQBO,
  createQBOItem,
  updateQBOItem,
  deactivateQBOItem,
  activateQBOItem,
  type AccountType,
  type ChartAccount,
  type QBOLiveAccount,
  type QBOLiveItem,
  type CreateChartAccountInput,
  type CreateQBOItemInput,
  type UpdateQBOItemInput,
} from "@/data/chartOfAccounts";

// ─── QBO type/subtype option maps ──────────────────────────────────────────

type TabKey = "all" | "Asset" | "Liability" | "Equity" | "Income" | "Expense" | "Other";

const QBO_TYPE_TO_TAB: Record<string, TabKey> = {
  Bank: "Asset",
  "Accounts Receivable": "Asset",
  "Other Current Asset": "Asset",
  "Fixed Asset": "Asset",
  "Other Asset": "Asset",
  "Accounts Payable": "Liability",
  "Credit Card": "Liability",
  "Long Term Liability": "Liability",
  "Other Current Liability": "Liability",
  Equity: "Equity",
  Income: "Income",
  "Other Income": "Income",
  "Cost of Goods Sold": "Expense",
  Expense: "Expense",
  "Other Expense": "Expense",
};

const TABS: { id: TabKey; label: string }[] = [
  { id: "all", label: "All" },
  { id: "Asset", label: "Asset" },
  { id: "Liability", label: "Liability" },
  { id: "Equity", label: "Equity" },
  { id: "Income", label: "Income" },
  { id: "Expense", label: "Expense" },
  { id: "Other", label: "Other" },
];

const TAB_BADGE: Record<TabKey, string> = {
  all: "bg-gray-200 text-gray-700",
  Asset: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Liability: "bg-amber-50 text-amber-700 border-amber-200",
  Equity: "bg-violet-50 text-violet-700 border-violet-200",
  Income: "bg-sky-50 text-sky-700 border-sky-200",
  Expense: "bg-rose-50 text-rose-700 border-rose-200",
  Other: "bg-gray-100 text-gray-600 border-gray-200",
};

function accountTab(qboType: string): TabKey {
  return QBO_TYPE_TO_TAB[qboType] ?? "Other";
}

function formatBalance(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(n);
}

// ─── QBO account type options for create modal ─────────────────────────────

const LOCAL_TYPE_LABEL: Record<AccountType, string> = {
  asset: "Asset",
  liability: "Liability",
  equity: "Equity",
  income: "Income",
  expense: "Expense",
};

// Account Type + Detail Type options are derived LIVE from QBO (the accounts that
// already exist in the company file) — see buildQBOOptions() below. QBO exposes no
// endpoint for the full catalog of valid types, so the only authoritative live source
// is the existing chart of accounts. Maps QBO's Classification onto our local category.
const CLASSIFICATION_TO_CATEGORY: Record<string, AccountType> = {
  Asset: "asset",
  Liability: "liability",
  Equity: "equity",
  Revenue: "income",
  Expense: "expense",
};

// QBO returns AccountSubType as a PascalCase enum (e.g. "RepairMaintenance").
// Turn it into a readable label ("Repair Maintenance") for the dropdown.
function humanizeSubType(s: string): string {
  return s
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .trim();
}

interface QBOOptions {
  // local category -> QBO account types available under it
  typesByCategory: Record<AccountType, { type: string; label: string }[]>;
  // QBO account type -> detail types (AccountSubType) available under it
  detailsByType: Record<string, { type: string; label: string }[]>;
}

// Build the create-modal dropdown options from live QBO accounts. Only types/detail
// types actually present in QBO are offered (no hand-maintained catalog).
function buildQBOOptions(accounts: QBOLiveAccount[]): QBOOptions {
  const typeSets: Record<string, Set<string>> = {}; // category -> account types
  const detailSets: Record<string, Set<string>> = {}; // account type -> detail types
  for (const a of accounts) {
    const category = CLASSIFICATION_TO_CATEGORY[a.Classification];
    if (!a.AccountType || !category) continue;
    (typeSets[category] ??= new Set()).add(a.AccountType);
    if (a.AccountSubType) {
      (detailSets[a.AccountType] ??= new Set()).add(a.AccountSubType);
    }
  }
  const typesByCategory = {} as Record<AccountType, { type: string; label: string }[]>;
  for (const [cat, set] of Object.entries(typeSets)) {
    typesByCategory[cat as AccountType] = [...set]
      .sort()
      .map((t) => ({ type: t, label: t }));
  }
  const detailsByType: Record<string, { type: string; label: string }[]> = {};
  for (const [type, set] of Object.entries(detailSets)) {
    detailsByType[type] = [...set]
      .sort()
      .map((t) => ({ type: t, label: humanizeSubType(t) }));
  }
  return { typesByCategory, detailsByType };
}


// ─── Edit Account Modal ────────────────────────────────────────────────────

interface EditAccountModalProps {
  live: QBOLiveAccount;
  local: ChartAccount;
  onClose: () => void;
  onSaved: () => void;
}

function EditAccountModal({ live, local, onClose, onSaved }: EditAccountModalProps) {
  const [name, setName] = useState(live.Name);
  const [description, setDescription] = useState(live.Description ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) { setError("Name is required"); return; }
    setSaving(true);
    try {
      await updateChartAccount(local.id, {
        name: name.trim(),
        description: description.trim() || null,
      });
      onSaved();
    } catch (err: any) {
      setError(err?.message ?? "Failed to update account");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-[#303030] font-semibold text-lg">Edit Account</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#303030]">Name <span className="text-rose-500">*</span></label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="h-10 px-3 rounded-lg border border-[#DADADA] text-sm outline-none focus:ring-2 focus:ring-[#013764]/20 focus:border-[#013764]" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#303030]">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="px-3 py-2 rounded-lg border border-[#DADADA] text-sm outline-none focus:ring-2 focus:ring-[#013764]/20 focus:border-[#013764] resize-none" placeholder="Optional" />
          </div>
          <p className="text-xs text-[#717179] bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
            Account Type and Detail Type are immutable in QBO and cannot be changed after creation.
          </p>
          {error && <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 px-3 py-2 rounded-lg">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="h-9 px-4 rounded-lg border border-[#DADADA] text-sm font-medium text-[#303030] hover:bg-gray-50 transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="h-9 px-4 rounded-lg bg-[#013764] text-white text-sm font-medium hover:bg-[#012a4d] transition-colors disabled:opacity-60">
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Create Account Modal ──────────────────────────────────────────────────

interface CreateModalProps {
  onClose: () => void;
  onCreated: () => void;
}

function CreateModal({ onClose, onCreated }: CreateModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [accountType, setAccountType] = useState<AccountType>("expense");
  const [qboAccountType, setQBOAccountType] = useState("");
  const [qboDetailType, setQBODetailType] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Account Type + Detail Type options are derived live from the QBO chart of accounts.
  const [liveAccounts, setLiveAccounts] = useState<QBOLiveAccount[] | null>(null);
  const [optionsError, setOptionsError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchLiveChartOfAccounts()
      .then((accts) => { if (!cancelled) setLiveAccounts(accts); })
      .catch((err) => {
        if (!cancelled) setOptionsError(err?.message ?? "Failed to load account types from QBO");
      });
    return () => { cancelled = true; };
  }, []);

  const { typesByCategory, detailsByType } = useMemo(
    () => buildQBOOptions(liveAccounts ?? []),
    [liveAccounts],
  );
  const loadingOptions = liveAccounts === null && optionsError === null;
  const qboTypeOptions = typesByCategory[accountType] ?? [];
  const detailOptions = detailsByType[qboAccountType] ?? [];

  const handleAccountTypeChange = (t: AccountType) => {
    setAccountType(t);
    setQBOAccountType("");
    setQBODetailType("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) { setError("Name is required"); return; }
    if (!qboAccountType || !qboDetailType) {
      setError("QBO Account Type and Detail Type are required");
      return;
    }
    setSaving(true);
    try {
      const input: CreateChartAccountInput = {
        name: name.trim(),
        description: description.trim() || null,
        account_type: accountType,
        qbo_account_type: qboAccountType,
        qbo_detail_type: qboDetailType,
      };
      await createChartAccount(input);
      onCreated();
    } catch (err: any) {
      setError(err?.message ?? "Failed to create account");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-[#303030] font-semibold text-lg">New Account</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#303030]">Name <span className="text-rose-500">*</span></label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="h-10 px-3 rounded-lg border border-[#DADADA] text-sm outline-none focus:ring-2 focus:ring-[#013764]/20 focus:border-[#013764]" placeholder="Account name" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#303030]">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="px-3 py-2 rounded-lg border border-[#DADADA] text-sm outline-none focus:ring-2 focus:ring-[#013764]/20 focus:border-[#013764] resize-none" placeholder="Optional" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#303030]">Category <span className="text-rose-500">*</span></label>
            <SearchableSelect
              value={accountType}
              onChange={(v) => handleAccountTypeChange((v || "expense") as AccountType)}
              options={(Object.keys(LOCAL_TYPE_LABEL) as AccountType[]).map((t) => ({ value: t, label: LOCAL_TYPE_LABEL[t] }))}
              allLabel="Select…"
              className="h-10 rounded-lg border-[#DADADA] w-full"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#303030]">Account Type <span className="text-rose-500">*</span></label>
            <SearchableSelect
              value={qboAccountType}
              onChange={(v) => { setQBOAccountType(v); setQBODetailType(""); }}
              options={qboTypeOptions.map((o) => ({ value: o.type, label: o.label }))}
              allLabel={loadingOptions ? "Loading from QBO…" : "Select…"}
              disabled={loadingOptions || !!optionsError}
              className="h-10 rounded-lg border-[#DADADA] w-full"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#303030]">Detail Type <span className="text-rose-500">*</span></label>
            <SearchableSelect
              value={qboDetailType}
              onChange={setQBODetailType}
              options={detailOptions.map((o) => ({ value: o.type, label: o.label }))}
              allLabel={loadingOptions ? "Loading from QBO…" : "Select…"}
              disabled={loadingOptions || !!optionsError || !qboAccountType}
              className="h-10 rounded-lg border-[#DADADA] w-full"
            />
          </div>
          {optionsError && <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 px-3 py-2 rounded-lg">Couldn't load account types from QBO: {optionsError}</p>}
          {error && <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 px-3 py-2 rounded-lg">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="h-9 px-4 rounded-lg border border-[#DADADA] text-sm font-medium text-[#303030] hover:bg-gray-50 transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="h-9 px-4 rounded-lg bg-[#013764] text-white text-sm font-medium hover:bg-[#012a4d] transition-colors disabled:opacity-60">
              {saving ? "Creating…" : "Create Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Item CRUD Modal ───────────────────────────────────────────────────────

const ITEM_TYPES = ["Service", "NonInventory", "Inventory", "Group", "Category"] as const;

interface ItemModalProps {
  mode: "create" | "edit";
  item?: QBOLiveItem;
  parentItems: QBOLiveItem[]; // top-level items for parent picker
  onClose: () => void;
  onSaved: () => void;
}

function ItemModal({ mode, item, parentItems, onClose, onSaved }: ItemModalProps) {
  const [name, setName] = useState(item?.Name ?? "");
  const [itemType, setItemType] = useState(item?.Type ?? "Service");
  const [description, setDescription] = useState(item?.Description ?? "");
  const [expenseAccountId, setExpenseAccountId] = useState(item?.ExpenseAccountRef?.value ?? "");
  const [incomeAccountId, setIncomeAccountId] = useState(item?.IncomeAccountRef?.value ?? "");
  const [parentId, setParentId] = useState(item?.ParentRef?.value ?? "");

  const [accounts, setAccounts] = useState<QBOLiveAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLiveChartOfAccounts()
      .then(setAccounts)
      .catch(() => {/* non-fatal: pickers just stay empty */})
      .finally(() => setLoadingAccounts(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) { setError("Name is required"); return; }
    if (mode === "create" && !itemType) { setError("Type is required"); return; }
    setSaving(true);
    try {
      if (mode === "create") {
        const input: CreateQBOItemInput = {
          name: name.trim(),
          type: itemType,
          description: description.trim() || undefined,
          expense_account_id: expenseAccountId || undefined,
          income_account_id: incomeAccountId || undefined,
          parent_id: parentId || undefined,
        };
        await createQBOItem(input);
      } else {
        const input: UpdateQBOItemInput = {
          name: name.trim(),
          description: description.trim(),
          expense_account_id: expenseAccountId || undefined,
          income_account_id: incomeAccountId || undefined,
        };
        await updateQBOItem(item!.Id, input);
      }
      onSaved();
    } catch (err: any) {
      setError(err?.message ?? `Failed to ${mode === "create" ? "create" : "update"} item`);
    } finally {
      setSaving(false);
    }
  };

  const expenseAccounts = accounts.filter((a) =>
    a.Active && ["Expense", "Other Expense", "Cost of Goods Sold"].includes(a.AccountType),
  );
  const incomeAccounts = accounts.filter((a) =>
    a.Active && ["Income", "Other Income"].includes(a.AccountType),
  );
  const otherAccounts = accounts.filter((a) =>
    a.Active && !["Expense", "Other Expense", "Cost of Goods Sold", "Income", "Other Income"].includes(a.AccountType),
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
          <h2 className="text-[#303030] font-semibold text-lg">
            {mode === "create" ? "New Item" : "Edit Item"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4 overflow-y-auto">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#303030]">Name <span className="text-rose-500">*</span></label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10 px-3 rounded-lg border border-[#DADADA] text-sm outline-none focus:ring-2 focus:ring-[#013764]/20 focus:border-[#013764]"
              placeholder="Item name"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#303030]">
              Type {mode === "create" && <span className="text-rose-500">*</span>}
              {mode === "edit" && <span className="ml-1 text-xs font-normal text-[#717179]">(immutable after creation)</span>}
            </label>
            <SearchableSelect
              value={itemType}
              onChange={(v) => setItemType(v || "Service")}
              options={ITEM_TYPES.map((t) => ({ value: t, label: t }))}
              allLabel="Select…"
              disabled={mode === "edit"}
              className="h-10 rounded-lg border-[#DADADA] w-full"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#303030]">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="px-3 py-2 rounded-lg border border-[#DADADA] text-sm outline-none focus:ring-2 focus:ring-[#013764]/20 focus:border-[#013764] resize-none"
              placeholder="Optional"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#303030]">
              Expense Account
              <span className="ml-1 text-xs font-normal text-[#717179]">→ bills land here</span>
            </label>
            <SearchableSelect
              value={expenseAccountId}
              onChange={setExpenseAccountId}
              options={[
                ...expenseAccounts.map((a) => ({ value: a.Id, label: a.Name })),
                ...incomeAccounts.map((a) => ({ value: a.Id, label: a.Name })),
                ...otherAccounts.map((a) => ({ value: a.Id, label: `${a.Name} (${a.AccountType})` })),
              ]}
              allLabel={loadingAccounts ? "Loading…" : "None"}
              disabled={loadingAccounts}
              className="h-10 rounded-lg border-[#DADADA] w-full"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#303030]">
              Income Account
              <span className="ml-1 text-xs font-normal text-[#717179]">→ invoices land here</span>
            </label>
            <SearchableSelect
              value={incomeAccountId}
              onChange={setIncomeAccountId}
              options={[
                ...incomeAccounts.map((a) => ({ value: a.Id, label: a.Name })),
                ...expenseAccounts.map((a) => ({ value: a.Id, label: a.Name })),
                ...otherAccounts.map((a) => ({ value: a.Id, label: `${a.Name} (${a.AccountType})` })),
              ]}
              allLabel={loadingAccounts ? "Loading…" : "None"}
              disabled={loadingAccounts}
              className="h-10 rounded-lg border-[#DADADA] w-full"
            />
          </div>

          {mode === "create" && parentItems.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#303030]">Parent Item</label>
              <SearchableSelect
                value={parentId}
                onChange={setParentId}
                options={parentItems.map((it) => ({ value: it.Id, label: it.Name }))}
                allLabel="None (top-level)"
                className="h-10 rounded-lg border-[#DADADA] w-full"
              />
            </div>
          )}

          {error && <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 px-3 py-2 rounded-lg">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="h-9 px-4 rounded-lg border border-[#DADADA] text-sm font-medium text-[#303030] hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="h-9 px-4 rounded-lg bg-[#013764] text-white text-sm font-medium hover:bg-[#012a4d] transition-colors disabled:opacity-60">
              {saving ? (mode === "create" ? "Creating…" : "Saving…") : (mode === "create" ? "Create Item" : "Save Changes")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Items Tab ─────────────────────────────────────────────────────────────

function ItemsView() {
  const [items, setItems] = useState<QBOLiveItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editItem, setEditItem] = useState<QBOLiveItem | null>(null);
  const [confirmItem, setConfirmItem] = useState<{ item: QBOLiveItem; action: "deactivate" | "activate" } | null>(null);
  const [actioning, setActioning] = useState(false);
  const [menuItemId, setMenuItemId] = useState<string | null>(null);
  const [menuItemPos, setMenuItemPos] = useState({ top: 0, right: 0 });
  const menuItemRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuItemId) return;
    const handler = (e: MouseEvent) => {
      if (menuItemRef.current?.contains(e.target as Node)) return;
      setMenuItemId(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuItemId]);

  const reload = () => {
    setLoading(true);
    setError(null);
    fetchLiveQBOItems()
      .then(setItems)
      .catch((err) => setError(err?.message ?? "Failed to load items"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { reload(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((it) => {
      if (!showInactive && !it.Active) return false;
      if (!q) return true;
      return (
        it.FullyQualifiedName.toLowerCase().includes(q) ||
        (it.ExpenseAccountRef?.name ?? "").toLowerCase().includes(q) ||
        (it.IncomeAccountRef?.name ?? "").toLowerCase().includes(q)
      );
    });
  }, [items, search, showInactive]);

  // Group by parent (top-level name before the colon)
  const grouped = useMemo(() => {
    const map = new Map<string, QBOLiveItem[]>();
    for (const it of filtered) {
      const colon = it.FullyQualifiedName.indexOf(":");
      const group = colon > 0 ? it.FullyQualifiedName.slice(0, colon) : "(Top level)";
      if (!map.has(group)) map.set(group, []);
      map.get(group)!.push(it);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  // Top-level items for the parent picker in create modal
  const topLevelItems = useMemo(
    () => items.filter((it) => !it.FullyQualifiedName.includes(":") && it.Active),
    [items],
  );

  const handleConfirmAction = async () => {
    if (!confirmItem) return;
    setActioning(true);
    try {
      if (confirmItem.action === "deactivate") {
        await deactivateQBOItem(confirmItem.item.Id);
        toast.success(`"${confirmItem.item.Name}" deactivated in QuickBooks`);
      } else {
        await activateQBOItem(confirmItem.item.Id);
        toast.success(`"${confirmItem.item.Name}" activated in QuickBooks`);
      }
      setConfirmItem(null);
      reload();
    } catch (err: any) {
      toast.error(err?.message ?? "Action failed");
    } finally {
      setActioning(false);
    }
  };

  return (
    <div className="w-full border border-gray-200 bg-white rounded-lg overflow-hidden">
      <div className="flex justify-between items-center px-6 py-3 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <h2 className="text-[#303030] font-medium text-[22px] leading-6">Items</h2>
          <span className="text-sm text-[#717179]">
            {loading ? "Loading from QuickBooks…" : `${filtered.length} items`}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex h-9 items-center gap-2 px-3 rounded-lg border border-[#DADADA] bg-white">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M17.5 17.5L13.875 13.875M15.8333 9.16667C15.8333 12.8486 12.8486 15.8333 9.16667 15.8333C5.48477 15.8333 2.5 12.8486 2.5 9.16667C2.5 5.48477 5.48477 2.5 9.16667 2.5C12.8486 2.5 15.8333 5.48477 15.8333 9.16667Z" stroke="#303030" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            <input type="text" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} className="text-sm bg-transparent border-none outline-none placeholder:text-[#717179] w-40" />
          </div>
          <label className="flex items-center gap-1.5 text-sm text-[#717179] cursor-pointer select-none">
            <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
            Show inactive
          </label>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex h-9 items-center gap-1.5 px-3 rounded-lg bg-[#013764] text-white text-sm font-medium hover:bg-[#012a4d] transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
            New Item
          </button>
        </div>
      </div>

      {error && (
        <div className="px-6 py-4 text-sm text-rose-600 bg-rose-50 border-b border-rose-100">{error}</div>
      )}

      {loading ? (
        <div className="px-6 py-12 text-center text-sm text-[#717179]">Loading from QuickBooks…</div>
      ) : filtered.length === 0 ? (
        <div className="px-6 py-12 text-center text-sm text-[#717179]">No items match your filters.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 h-11">
                <th className="px-4 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                  <span className="font-medium text-sm text-gray-600">Item</span>
                </th>
                <th className="px-4 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                  <span className="font-medium text-sm text-gray-600">Expense Account</span>
                  <span className="ml-1 text-xs text-[#717179] font-normal">→ bills land here</span>
                </th>
                <th className="px-4 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                  <span className="font-medium text-sm text-gray-600">Income Account</span>
                  <span className="ml-1 text-xs text-[#717179] font-normal">→ invoices land here</span>
                </th>
                <th className="px-4 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                  <span className="font-medium text-sm text-gray-600">Status</span>
                </th>
                <th className="px-4 py-3 text-left whitespace-nowrap">
                  <span className="font-medium text-sm text-gray-600">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {grouped.map(([group, groupItems]) => (
                <>
                  <tr key={`group-${group}`} className="bg-gray-50 border-b border-gray-200">
                    <td colSpan={5} className="px-4 py-2">
                      <span className="text-xs font-semibold text-[#717179] uppercase tracking-wide">{group}</span>
                    </td>
                  </tr>
                  {groupItems.map((it) => {
                    const expAcct = it.ExpenseAccountRef?.name;
                    const incAcct = it.IncomeAccountRef?.name;
                    const childName = it.FullyQualifiedName.includes(":")
                      ? it.FullyQualifiedName.slice(it.FullyQualifiedName.indexOf(":") + 1)
                      : it.FullyQualifiedName;
                    return (
                      <tr key={it.Id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 border-r border-gray-100">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900">{childName}</span>
                            <span className="text-xs text-[#717179] bg-gray-100 px-1.5 py-0.5 rounded font-mono">{it.Type}</span>
                          </div>
                          {it.Description && (
                            <div className="text-xs text-[#717179] mt-0.5 max-w-[280px] truncate">{it.Description}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 border-r border-gray-100">
                          {expAcct ? (
                            <span className="inline-flex items-center gap-1.5 text-sm text-gray-800">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                              {expAcct}
                            </span>
                          ) : (
                            <span className="text-gray-300 text-sm">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 border-r border-gray-100">
                          {incAcct ? (
                            <span className="inline-flex items-center gap-1.5 text-sm text-gray-800">
                              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0" />
                              {incAcct}
                            </span>
                          ) : (
                            <span className="text-gray-300 text-sm">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 border-r border-gray-100">
                          <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium", it.Active ? "text-emerald-700" : "text-gray-400")}>
                            <span className={cn("w-1.5 h-1.5 rounded-full", it.Active ? "bg-emerald-500" : "bg-gray-300")} />
                            {it.Active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={(e) => {
                              const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
                              setMenuItemPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
                              setMenuItemId(menuItemId === it.Id ? null : it.Id);
                            }}
                            className="flex items-center justify-center w-7 h-7 rounded border border-[#DADADA] text-gray-500 hover:bg-gray-50 transition-colors"
                          >
                            <svg width="3" height="14" viewBox="0 0 3 14" fill="currentColor">
                              <circle cx="1.5" cy="1.5" r="1.5" /><circle cx="1.5" cy="7" r="1.5" /><circle cx="1.5" cy="12.5" r="1.5" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Row actions menu portal */}
      {menuItemId && createPortal(
        <div
          ref={menuItemRef}
          className="bg-white rounded-lg border border-gray-200 py-1 min-w-[140px]"
          style={{ position: "fixed", top: menuItemPos.top, right: menuItemPos.right, zIndex: 9999, boxShadow: "0 8px 24px 0 rgba(0,0,0,0.12)" }}
        >
          {(() => {
            const it = items.find((i) => i.Id === menuItemId);
            if (!it) return null;
            return (
              <>
                <button
                  onClick={() => { setEditItem(it); setMenuItemId(null); }}
                  className="w-full text-left px-4 py-2 text-sm text-[#303030] hover:bg-gray-50 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => { setConfirmItem({ item: it, action: it.Active ? "deactivate" : "activate" }); setMenuItemId(null); }}
                  className={cn(
                    "w-full text-left px-4 py-2 text-sm transition-colors",
                    it.Active ? "text-rose-600 hover:bg-rose-50" : "text-emerald-600 hover:bg-emerald-50",
                  )}
                >
                  {it.Active ? "Deactivate" : "Activate"}
                </button>
              </>
            );
          })()}
        </div>,
        document.body,
      )}

      {/* Create modal */}
      {showCreateModal && (
        <ItemModal
          mode="create"
          parentItems={topLevelItems}
          onClose={() => setShowCreateModal(false)}
          onSaved={() => {
            setShowCreateModal(false);
            toast.success("Item created in QuickBooks");
            reload();
          }}
        />
      )}

      {/* Edit modal */}
      {editItem && (
        <ItemModal
          mode="edit"
          item={editItem}
          parentItems={topLevelItems}
          onClose={() => setEditItem(null)}
          onSaved={() => {
            setEditItem(null);
            toast.success("Item updated in QuickBooks");
            reload();
          }}
        />
      )}

      {/* Deactivate / Activate confirm */}
      {confirmItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
            <div className="px-6 py-5">
              <h3 className="text-[#303030] font-semibold text-base mb-2">
                {confirmItem.action === "deactivate" ? "Deactivate item?" : "Activate item?"}
              </h3>
              <p className="text-sm text-[#717179]">
                {confirmItem.action === "deactivate"
                  ? `"${confirmItem.item.Name}" will be marked inactive in QuickBooks. It won't appear in item pickers until re-activated.`
                  : `"${confirmItem.item.Name}" will be re-activated in QuickBooks.`}
              </p>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200">
              <button
                onClick={() => setConfirmItem(null)}
                disabled={actioning}
                className="h-9 px-4 rounded-lg border border-[#DADADA] text-sm font-medium text-[#303030] hover:bg-gray-50 transition-colors disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                disabled={actioning}
                className={cn(
                  "h-9 px-4 rounded-lg text-white text-sm font-medium transition-colors disabled:opacity-60",
                  confirmItem.action === "deactivate"
                    ? "bg-rose-600 hover:bg-rose-700"
                    : "bg-emerald-600 hover:bg-emerald-700",
                )}
              >
                {actioning
                  ? (confirmItem.action === "deactivate" ? "Deactivating…" : "Activating…")
                  : (confirmItem.action === "deactivate" ? "Deactivate" : "Activate")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────

export default function ChartOfAccounts() {
  const [accounts, setAccounts] = useState<QBOLiveAccount[]>([]);
  const [localAccounts, setLocalAccounts] = useState<ChartAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [view, setView] = useState<"accounts" | "items">("accounts");
  const [selectedTab, setSelectedTab] = useState<TabKey>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showInactive, setShowInactive] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [showPageSizeDropdown, setShowPageSizeDropdown] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const dropdownButtonRef = useRef<HTMLButtonElement>(null);
  const dropdownMenuRef = useRef<HTMLDivElement>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const [editAccount, setEditAccount] = useState<{ live: QBOLiveAccount; local: ChartAccount } | null>(null);
  const [confirmAccount, setConfirmAccount] = useState<{ live: QBOLiveAccount; local: ChartAccount; action: "deactivate" | "activate" } | null>(null);
  const [actioning, setActioning] = useState(false);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
  const menuRef = useRef<HTMLDivElement>(null);

  const localByQBOId = useMemo(() => {
    const map = new Map<string, ChartAccount>();
    for (const a of localAccounts) {
      if (a.qbo_id) map.set(a.qbo_id, a);
    }
    return map;
  }, [localAccounts]);

  const reload = () => {
    setLoading(true);
    setError(null);
    Promise.all([fetchLiveChartOfAccounts(), fetchChartOfAccounts()])
      .then(([live, local]) => {
        setAccounts(live);
        setLocalAccounts(local);
      })
      .catch((err) => setError(err?.message ?? "Failed to load accounts from QuickBooks"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!menuId) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current?.contains(e.target as Node)) return;
      setMenuId(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuId]);

  useEffect(() => { reload(); }, []);

  const tabCounts = useMemo(() => {
    const counts: Record<TabKey, number> = { all: 0, Asset: 0, Liability: 0, Equity: 0, Income: 0, Expense: 0, Other: 0 };
    for (const a of accounts) {
      if (!showInactive && !a.Active) continue;
      counts.all += 1;
      counts[accountTab(a.AccountType)] += 1;
    }
    return counts;
  }, [accounts, showInactive]);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return accounts.filter((a) => {
      if (!showInactive && !a.Active) return false;
      if (selectedTab !== "all" && accountTab(a.AccountType) !== selectedTab) return false;
      if (!q) return true;
      return (
        a.Name.toLowerCase().includes(q) ||
        a.AccountType.toLowerCase().includes(q) ||
        a.AccountSubType.toLowerCase().includes(q) ||
        (a.AcctNum || "").toLowerCase().includes(q)
      );
    });
  }, [accounts, selectedTab, searchTerm, showInactive]);

  useEffect(() => { setCurrentPage(1); }, [selectedTab, searchTerm, showInactive]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);
  const start = filtered.length === 0 ? 0 : startIndex + 1;
  const end = Math.min(startIndex + paginated.length, filtered.length);

  const getPaginationNumbers = (): number[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const windowSize = 7;
    let s = Math.max(1, currentPage - 2);
    let e = s + windowSize - 1;
    if (e > totalPages) { e = totalPages; s = Math.max(1, e - windowSize + 1); }
    return Array.from({ length: e - s + 1 }, (_, i) => s + i);
  };

  useEffect(() => {
    let raf: number;
    const MENU_HEIGHT = 156;
    const update = () => {
      if (showPageSizeDropdown && dropdownButtonRef.current) {
        const rect = dropdownButtonRef.current.getBoundingClientRect();
        const flipUp = window.innerHeight - rect.bottom < MENU_HEIGHT + 16;
        setDropdownPos({ top: flipUp ? rect.top - MENU_HEIGHT - 8 : rect.bottom + 8, left: rect.left });
      }
      if (showPageSizeDropdown) raf = requestAnimationFrame(update);
    };
    if (showPageSizeDropdown) update();
    return () => { if (raf) cancelAnimationFrame(raf); };
  }, [showPageSizeDropdown]);

  useEffect(() => {
    if (!showPageSizeDropdown) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (dropdownButtonRef.current?.contains(t) || dropdownMenuRef.current?.contains(t)) return;
      setShowPageSizeDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showPageSizeDropdown]);

  const handleConfirmAccountAction = async () => {
    if (!confirmAccount) return;
    setActioning(true);
    try {
      if (confirmAccount.action === "deactivate") {
        await deactivateChartAccount(confirmAccount.local.id);
        toast.success(`"${confirmAccount.live.Name}" deactivated`);
      } else {
        await activateChartAccount(confirmAccount.local.id);
        toast.success(`"${confirmAccount.live.Name}" activated`);
      }
      setConfirmAccount(null);
      reload();
    } catch (err: any) {
      toast.error(err?.message ?? "Action failed");
    } finally {
      setActioning(false);
    }
  };

  const handleSyncLocal = async () => {
    setSyncing(true);
    try {
      const result = await syncChartOfAccountsFromQBO();
      toast.success(`Local mapping updated — ${result.synced} accounts synced`);
    } catch (err: any) {
      toast.error(err?.message ?? "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  const handleCreated = () => {
    setShowCreateModal(false);
    toast.success("Account created in QuickBooks");
    reload();
  };

  const tab = selectedTab;

  return (
    <PageTemplate>
      <div className="flex flex-col gap-6 w-fit min-w-full">
        <div className="flex items-start justify-between">
          <PageHeader
            title="Chart of Accounts"
            description="Live from QuickBooks Online"
          />
          {/* View switcher */}
          <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg mt-1">
            {(["accounts", "items"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  "h-8 px-4 rounded-md text-sm font-medium transition-colors capitalize",
                  view === v
                    ? "bg-white text-[#303030] shadow-sm"
                    : "text-[#717179] hover:text-[#303030]",
                )}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {view === "items" && <ItemsView />}

        {view === "accounts" && <>

        {/* Tab bar */}
        <div className="flex gap-1 border-b border-[#E5E5E5]">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelectedTab(t.id)}
              className={cn(
                "px-4 py-2.5 text-sm font-medium transition-colors relative",
                tab === t.id ? "text-[#013764]" : "text-[#717179] hover:text-[#303030]",
              )}
            >
              {t.label}
              <span className="ml-1.5 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-gray-200 text-xs font-medium text-gray-700">
                {tabCounts[t.id]}
              </span>
              {tab === t.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#013764]" />}
            </button>
          ))}
        </div>

        {error && (
          <div className="px-4 py-3 rounded-lg border border-rose-200 bg-rose-50 text-sm text-rose-700">{error}</div>
        )}

        <div className="w-full border border-gray-200 bg-white rounded-lg overflow-hidden">
          {/* Card header */}
          <div className="flex justify-between items-center px-6 py-3 border-b border-gray-200 bg-white">
            <div className="flex items-center gap-4">
              <h2 className="text-[#303030] font-medium text-[22px] leading-6">Accounts</h2>
              <span className="text-sm text-[#717179]">
                {loading ? "Loading from QuickBooks…" : `${filtered.length} accounts`}
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              {/* Search */}
              <div className="flex h-9 items-center gap-2 px-3 rounded-lg border border-[#DADADA] bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.03)]">
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M17.5 17.5L13.875 13.875M15.8333 9.16667C15.8333 12.8486 12.8486 15.8333 9.16667 15.8333C5.48477 15.8333 2.5 12.8486 2.5 9.16667C2.5 5.48477 5.48477 2.5 9.16667 2.5C12.8486 2.5 15.8333 5.48477 15.8333 9.16667Z" stroke="#303030" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                <input type="text" placeholder="Search…" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="text-[#303030] text-sm bg-transparent border-none outline-none placeholder:text-[#717179] w-40" />
              </div>
              {/* Show inactive toggle */}
              <label className="flex items-center gap-1.5 text-sm text-[#717179] cursor-pointer select-none">
                <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} className="rounded" />
                Show inactive
              </label>
              {/* Sync local mapping */}
              <button
                onClick={handleSyncLocal}
                disabled={syncing}
                title="Update local bill-booking mapping from QBO"
                className="flex h-9 items-center gap-1.5 px-3 rounded-lg border border-[#DADADA] bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] hover:bg-gray-50 transition-colors text-sm font-medium text-[#303030] disabled:opacity-60"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={syncing ? "animate-spin" : ""}>
                  <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" />
                  <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" /><path d="M16 16h5v5" />
                </svg>
                {syncing ? "Syncing…" : "Sync mapping"}
              </button>
              {/* New account */}
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex h-9 items-center gap-1.5 px-3 rounded-lg bg-[#013764] text-white text-sm font-medium hover:bg-[#012a4d] transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
                New Account
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 h-11">
                  <th className="px-4 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                    <span className="font-medium text-sm text-gray-600">Name</span>
                  </th>
                  <th className="px-4 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                    <span className="font-medium text-sm text-gray-600">Account Type</span>
                  </th>
                  <th className="px-4 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                    <span className="font-medium text-sm text-gray-600">Detail Type</span>
                  </th>
                  <th className="px-4 py-3 text-right border-r border-gray-200 whitespace-nowrap">
                    <span className="font-medium text-sm text-gray-600">Balance</span>
                  </th>
                  <th className="px-4 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                    <span className="font-medium text-sm text-gray-600">Status</span>
                  </th>
                  <th className="px-4 py-3 text-left whitespace-nowrap">
                    <span className="font-medium text-sm text-gray-600">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-[#717179] text-sm">
                      Loading from QuickBooks…
                    </td>
                  </tr>
                )}
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-[#717179] text-sm">
                      No accounts match your filters.
                    </td>
                  </tr>
                )}
                {paginated.map((a) => {
                  const tabKey = accountTab(a.AccountType);
                  return (
                    <tr key={a.Id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 border-r border-gray-100 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-900 text-sm font-medium">{a.Name}</span>
                          {a.AcctNum && (
                            <span className="text-xs text-[#717179] font-mono">#{a.AcctNum}</span>
                          )}
                        </div>
                        {a.Description && (
                          <div className="text-xs text-[#717179] mt-0.5 max-w-[260px] truncate">{a.Description}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 border-r border-gray-100 whitespace-nowrap">
                        <span className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-medium",
                          TAB_BADGE[tabKey],
                        )}>
                          {a.AccountType}
                        </span>
                      </td>
                      <td className="px-4 py-3 border-r border-gray-100 whitespace-nowrap text-sm text-gray-700">
                        {a.AccountSubType || <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-4 py-3 border-r border-gray-100 whitespace-nowrap text-right">
                        <span className={cn(
                          "text-sm font-mono",
                          a.CurrentBalance < 0 ? "text-rose-600" : "text-gray-900",
                        )}>
                          {formatBalance(a.CurrentBalance)}
                        </span>
                      </td>
                      <td className="px-4 py-3 border-r border-gray-100 whitespace-nowrap">
                        <span className={cn(
                          "inline-flex items-center gap-1.5 text-xs font-medium",
                          a.Active ? "text-emerald-700" : "text-gray-400",
                        )}>
                          <span className={cn("w-1.5 h-1.5 rounded-full", a.Active ? "bg-emerald-500" : "bg-gray-300")} />
                          {a.Active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {localByQBOId.has(a.Id) && (
                          <button
                            onClick={(e) => {
                              const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
                              setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
                              setMenuId(menuId === a.Id ? null : a.Id);
                            }}
                            className="flex items-center justify-center w-7 h-7 rounded border border-[#DADADA] text-gray-500 hover:bg-gray-50 transition-colors"
                          >
                            <svg width="3" height="14" viewBox="0 0 3 14" fill="currentColor">
                              <circle cx="1.5" cy="1.5" r="1.5" /><circle cx="1.5" cy="7" r="1.5" /><circle cx="1.5" cy="12.5" r="1.5" />
                            </svg>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center px-6 py-4 bg-white gap-4" style={{ position: "relative", zIndex: 1, overflow: "visible" }}>
            <div className="flex items-center gap-2">
              <span className="text-gray-700 text-sm font-medium">Showing</span>
              <button
                ref={dropdownButtonRef}
                onClick={() => setShowPageSizeDropdown(!showPageSizeDropdown)}
                className="flex items-center gap-1.5 h-9 px-3 border rounded-lg bg-white hover:bg-gray-50 text-gray-900 font-medium text-sm"
                style={{ borderColor: "rgb(218,218,218)", boxShadow: "rgba(0,0,0,0.03) 0px 1px 3px 0px" }}
              >
                {start}–{end}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m6 9 6 6 6-6" /></svg>
              </button>
              <span className="text-gray-700 text-sm font-medium">of {filtered.length}</span>
            </div>
            <div className="flex items-center rounded-lg border bg-white overflow-hidden" style={{ borderColor: "rgb(218,218,218)", boxShadow: "rgba(0,0,0,0.03) 0px 1px 3px 0px" }}>
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                className={cn("flex items-center gap-1 h-9 px-3 transition-colors border-r border-gray-200", currentPage === 1 ? "opacity-40 cursor-not-allowed" : "hover:bg-gray-50")}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></svg>
                <span className="text-sm font-medium text-gray-700">Prev</span>
              </button>
              {getPaginationNumbers().map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className="flex items-center justify-center h-9 min-w-[36px] border-r border-gray-200 hover:bg-gray-50 transition-colors"
                  style={{ backgroundColor: currentPage === page ? "#f9fafb" : undefined }}
                >
                  <span className={cn("text-sm font-medium", currentPage === page ? "text-[#013764]" : "text-gray-500")}>{page}</span>
                </button>
              ))}
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
                className={cn("flex items-center gap-1 h-9 px-3 transition-colors", currentPage === totalPages ? "opacity-40 cursor-not-allowed" : "hover:bg-gray-50")}
              >
                <span className="text-sm font-medium text-gray-700">Next</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
              </button>
            </div>
          </div>
        </div>

        </> /* end accounts view */}
      </div>

      {/* Row actions menu portal */}
      {menuId && createPortal(
        <div
          ref={menuRef}
          className="bg-white rounded-lg border border-gray-200 py-1 min-w-[140px]"
          style={{ position: "fixed", top: menuPos.top, right: menuPos.right, zIndex: 9999, boxShadow: "0 8px 24px 0 rgba(0,0,0,0.12)" }}
        >
          {(() => {
            const live = accounts.find((a) => a.Id === menuId);
            const local = localByQBOId.get(menuId);
            if (!live || !local) return null;
            return (
              <>
                <button
                  onClick={() => { setEditAccount({ live, local }); setMenuId(null); }}
                  className="w-full text-left px-4 py-2 text-sm text-[#303030] hover:bg-gray-50 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    setConfirmAccount({ live, local, action: live.Active ? "deactivate" : "activate" });
                    setMenuId(null);
                  }}
                  className={cn(
                    "w-full text-left px-4 py-2 text-sm transition-colors",
                    live.Active ? "text-rose-600 hover:bg-rose-50" : "text-emerald-600 hover:bg-emerald-50",
                  )}
                >
                  {live.Active ? "Deactivate" : "Activate"}
                </button>
              </>
            );
          })()}
        </div>,
        document.body,
      )}

      {/* Edit account modal */}
      {editAccount && (
        <EditAccountModal
          live={editAccount.live}
          local={editAccount.local}
          onClose={() => setEditAccount(null)}
          onSaved={() => {
            setEditAccount(null);
            toast.success("Account updated in QuickBooks");
            reload();
          }}
        />
      )}

      {/* Deactivate / Activate confirm */}
      {confirmAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
            <div className="px-6 py-5">
              <h3 className="text-[#303030] font-semibold text-base mb-2">
                {confirmAccount.action === "deactivate" ? "Deactivate account?" : "Activate account?"}
              </h3>
              <p className="text-sm text-[#717179]">
                {confirmAccount.action === "deactivate"
                  ? `"${confirmAccount.live.Name}" will be marked inactive in QuickBooks.`
                  : `"${confirmAccount.live.Name}" will be re-activated in QuickBooks.`}
              </p>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200">
              <button
                onClick={() => setConfirmAccount(null)}
                disabled={actioning}
                className="h-9 px-4 rounded-lg border border-[#DADADA] text-sm font-medium text-[#303030] hover:bg-gray-50 transition-colors disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAccountAction}
                disabled={actioning}
                className={cn(
                  "h-9 px-4 rounded-lg text-white text-sm font-medium transition-colors disabled:opacity-60",
                  confirmAccount.action === "deactivate"
                    ? "bg-rose-600 hover:bg-rose-700"
                    : "bg-emerald-600 hover:bg-emerald-700",
                )}
              >
                {actioning
                  ? (confirmAccount.action === "deactivate" ? "Deactivating…" : "Activating…")
                  : (confirmAccount.action === "deactivate" ? "Deactivate" : "Activate")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page-size portal */}
      {showPageSizeDropdown && createPortal(
        <div ref={dropdownMenuRef} className="bg-white overflow-hidden" style={{ border: "0.5px solid #DADADA", borderRadius: "8px", boxShadow: "0 14px 8px 0 rgba(0,0,0,0.04), 0 6px 6px 0 rgba(0,0,0,0.06)", zIndex: 99999, width: "56px", position: "fixed", top: dropdownPos.top + "px", left: dropdownPos.left + "px" }}>
          {[10, 25, 50].map((size, i) => (
            <button key={size} onClick={() => { setItemsPerPage(size); setCurrentPage(1); setShowPageSizeDropdown(false); }} className={cn("w-full px-4 py-3 text-center text-sm transition-colors", itemsPerPage === size ? "bg-gray-50 font-medium text-gray-900" : "text-[#303030] hover:bg-gray-50")} style={{ borderRadius: i === 2 ? "0 0 8px 8px" : "0" }}>
              {size}
            </button>
          ))}
        </div>,
        document.body,
      )}

      {showCreateModal && (
        <CreateModal onClose={() => setShowCreateModal(false)} onCreated={handleCreated} />
      )}
    </PageTemplate>
  );
}
