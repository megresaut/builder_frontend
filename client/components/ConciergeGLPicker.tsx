// ConciergeGLPicker — GL Account dropdown variant used on Record Bill (and
// Edit Bill) for lines whose property is a Concierge property (type='C').
//
// Sources its options from /concierge/passthrough-items, which returns the
// 61 QBO passthrough Items pre-grouped under Utilities / Vendor / Materials.
// Selecting an option writes the QBO Item id; the backend resolves the
// matching Buildium GL via concierge_buildium_mapping at dual-push time.
import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";

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

interface PassthroughItem {
  qbo_item_id: string;
  display_name: string;
}

interface PassthroughGroup {
  parent_name: string;
  items: PassthroughItem[];
}

interface PassthroughResponse {
  groups: PassthroughGroup[];
}

// Module-level cache — passthrough items never change during a session.
let cachedGroups: PassthroughGroup[] | null = null;
let inflight: Promise<PassthroughGroup[]> | null = null;

async function loadPassthroughItems(): Promise<PassthroughGroup[]> {
  if (cachedGroups) return cachedGroups;
  if (inflight) return inflight;
  inflight = fetchJSON("/concierge/passthrough-items")
    .then((resp: PassthroughResponse) => {
      cachedGroups = resp.groups || [];
      return cachedGroups;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

interface Props {
  value: string;            // selected qbo_item_id
  disabled?: boolean;
  onChange: (qboItemId: string, displayName: string) => void;
}

export function ConciergeGLPicker({ value, disabled, onChange }: Props) {
  const [groups, setGroups] = useState<PassthroughGroup[]>(cachedGroups ?? []);
  // Track loading explicitly — a successful fetch that returns 0 items must
  // render "No items found", not a perpetual "Loading…" (which it did before
  // because we used groups.length === 0 as the loading proxy).
  const [loading, setLoading] = useState<boolean>(!cachedGroups);
  const [search, setSearch] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (cachedGroups) {
      setLoading(false);
      return;
    }
    loadPassthroughItems()
      .then((g) => {
        if (!cancelled) {
          setGroups(g);
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
  const filtered: PassthroughGroup[] = term
    ? groups
        .map((g) => ({
          ...g,
          items: g.items.filter((it) =>
            it.display_name.toLowerCase().includes(term),
          ),
        }))
        .filter((g) => g.items.length > 0)
    : groups;

  return (
    <Select
      value={value}
      disabled={disabled}
      onValueChange={(qboItemId) => {
        if (disabled) return;
        // Find the display label so the caller can persist both id + name
        // for stable re-rendering on page reload.
        let displayName = "";
        for (const g of groups) {
          const hit = g.items.find((it) => it.qbo_item_id === qboItemId);
          if (hit) {
            displayName = hit.display_name;
            break;
          }
        }
        onChange(qboItemId, displayName);
        setSearch("");
      }}
      onOpenChange={(open) => {
        if (!open) setSearch("");
      }}
    >
      <SelectTrigger className="w-full h-auto px-0 py-0 text-[13px] border-0 bg-transparent">
        <SelectValue placeholder="Select an Item" />
      </SelectTrigger>
      <SelectContent
        className="bg-white border border-[#E5E7EB] shadow-md p-0"
        style={{ minWidth: "380px" }}
        onKeyDown={(e) => {
          if (e.key === "Escape") e.stopPropagation();
          const t = e.target as HTMLElement;
          if (t.tagName === "INPUT") e.stopPropagation();
        }}
      >
        <div className="p-2 border-b border-[#E5E7EB]">
          <div className="relative flex items-center">
            <Search className="absolute left-2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
            <input
              autoFocus
              placeholder="Search items…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.stopPropagation()}
              onFocus={(e) => e.stopPropagation()}
              className="w-full rounded-md border pl-7 pr-7 py-1.5 text-sm outline-none focus:ring-1 focus:ring-[#013764]"
            />
            {search && (
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); setSearch(""); }}
                className="absolute right-2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          {term && (
            <p className="mt-1 px-1 text-[11px] text-gray-400">
              {filtered.reduce((n, g) => n + g.items.length, 0)} result
              {filtered.reduce((n, g) => n + g.items.length, 0) !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        <div className="max-h-[320px] overflow-y-auto">
          {loadError && (
            <div className="px-3 py-2 text-sm text-red-500">
              Failed to load items: {loadError}
            </div>
          )}

          {!loadError && filtered.length === 0 && (
            <div className="px-3 py-2 text-sm text-gray-400">
              {loading
                ? "Loading…"
                : groups.length === 0
                  ? "No items found — run cmd/sync-qbo-items to populate qbo_items"
                  : "No items match"}
            </div>
          )}

          {filtered.map((g) => (
            <SelectGroup key={g.parent_name}>
              <SelectLabel className="px-3 pt-2 pb-1 text-[11px] uppercase tracking-wide text-gray-400 font-semibold">
                {g.parent_name}
              </SelectLabel>
              {g.items.map((it) => (
                <SelectItem key={it.qbo_item_id} value={it.qbo_item_id} className="text-[13px]">
                  {it.display_name}
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
        </div>
      </SelectContent>
    </Select>
  );
}
