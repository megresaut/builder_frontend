// BuildiumGLPicker — GL Account dropdown for non-Concierge bill lines
// (property_type ∈ R, OR, HOA, COMM). Reads /buildium/chart-of-accounts,
// which is backed by BUILDUM_CHART_CSV. The selected buildium_account_id is
// pushed straight to Buildium at bill-save time — no chart_of_accounts
// indirection — and QBO push is skipped for non-Concierge bills entirely.
import { useEffect, useState } from "react";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchJSON } from "@/api/fetchJSON";

interface BuildiumAccount {
  buildium_account_id: number;
  name: string;
  type: string;
  number?: string;
}

interface ListResponse {
  accounts: BuildiumAccount[];
}

let cached: BuildiumAccount[] | null = null;
let inflight: Promise<BuildiumAccount[]> | null = null;

async function loadAccounts(): Promise<BuildiumAccount[]> {
  if (cached) return cached;
  if (inflight) return inflight;
  inflight = fetchJSON("/buildium/chart-of-accounts")
    .then((resp: ListResponse) => {
      cached = resp.accounts || [];
      return cached;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

interface Props {
  value: string; // selected buildium_account_id as string
  disabled?: boolean;
  onChange: (buildiumAccountId: string, name: string) => void;
}

export function BuildiumGLPicker({ value, disabled, onChange }: Props) {
  const [accounts, setAccounts] = useState<BuildiumAccount[]>(cached ?? []);
  const [loading, setLoading] = useState<boolean>(!cached);
  const [search, setSearch] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (cached) {
      setLoading(false);
      return;
    }
    loadAccounts()
      .then((a) => {
        if (!cancelled) {
          setAccounts(a);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : String(err));
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const term = search.trim().toLowerCase();
  const filtered = term
    ? accounts.filter((a) => a.name.toLowerCase().includes(term))
    : accounts;

  // Group by Type for visual scannability. Order is preserved because the
  // backend already returns accounts in Expense → Income → Asset → ...
  // → Alphabetical order.
  const groups: { type: string; items: BuildiumAccount[] }[] = [];
  for (const a of filtered) {
    const last = groups[groups.length - 1];
    if (last && last.type === a.type) {
      last.items.push(a);
    } else {
      groups.push({ type: a.type, items: [a] });
    }
  }

  return (
    <Select
      value={value}
      disabled={disabled}
      onValueChange={(id) => {
        if (disabled) return;
        const hit = accounts.find(
          (a) => a.buildium_account_id.toString() === id,
        );
        onChange(id, hit?.name ?? "");
        setSearch("");
      }}
      onOpenChange={(open) => {
        if (!open) setSearch("");
      }}
    >
      <SelectTrigger className="w-full h-auto px-0 py-0 text-[13px] border-0 bg-transparent">
        <SelectValue placeholder="Select an Account" />
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
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.stopPropagation()}
            onFocus={(e) => e.stopPropagation()}
            className="w-full rounded-md border px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-[#013764]"
          />
        </div>

        <div className="max-h-[280px] overflow-y-auto">
          {loadError && (
            <div className="px-3 py-2 text-sm text-red-500">
              Failed to load accounts: {loadError}
            </div>
          )}

          {!loadError && groups.length === 0 && (
            <div className="px-3 py-2 text-sm text-gray-400">
              {loading
                ? "Loading…"
                : accounts.length === 0
                  ? "No accounts found — check BUILDUM_CHART_CSV"
                  : "No accounts match"}
            </div>
          )}

          {groups.map((g) => (
            <SelectGroup key={g.type}>
              <SelectLabel className="px-3 pt-2 pb-1 text-[11px] uppercase tracking-wide text-gray-500">
                {g.type}
              </SelectLabel>
              {g.items.map((a) => (
                <SelectItem
                  key={a.buildium_account_id}
                  value={a.buildium_account_id.toString()}
                >
                  {a.name}
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
        </div>
      </SelectContent>
    </Select>
  );
}
