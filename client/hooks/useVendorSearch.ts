import { useCallback, useEffect, useRef, useState } from "react";
import { fetchJSON } from "@/api/fetchJSON";

/**
 * Server-driven vendor lookup for pickers.
 *
 * The platform has ~2.5k active vendors, so any picker that fetches "all
 * vendors" in one shot is silently truncated by whatever `limit` the caller
 * passes (GET /vendors returns active vendors ordered by name) — vendors late in
 * the alphabet simply never appear. This hook instead pages through the endpoint
 * 50 at a time and pushes the search term to the server (`search=`, name
 * ILIKE), so the whole table is always reachable.
 */

export interface VendorOption {
  id: number;
  name: string;
  category?: string | null;
}

export const VENDOR_PAGE_SIZE = 50;
const SEARCH_DEBOUNCE_MS = 250;

export interface UseVendorSearchResult {
  /** Current server page(s) for the active search term. */
  vendors: VendorOption[];
  search: string;
  setSearch: (s: string) => void;
  loading: boolean;
  hasMore: boolean;
  /** Fetch the next page; no-op while loading or when exhausted. */
  loadMore: () => void;
  /** id → name for every vendor seen so far, plus any resolved via ensureVendor. */
  nameById: Record<number, string>;
  /**
   * Resolve a vendor's name even when it isn't in the current page — used when a
   * form loads with a vendor already selected that the first page doesn't cover.
   */
  ensureVendor: (id: number) => void;
}

export function useVendorSearch(enabled = true): UseVendorSearchResult {
  const [vendors, setVendors] = useState<VendorOption[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [nameById, setNameById] = useState<Record<number, string>>({});
  const offsetRef = useRef(0);
  // Monotonic request id: late responses from superseded searches are dropped.
  const requestIdRef = useRef(0);
  const resolvingRef = useRef<Set<number>>(new Set());

  const rememberNames = useCallback((rows: VendorOption[]) => {
    if (rows.length === 0) return;
    setNameById((prev) => {
      const next = { ...prev };
      for (const v of rows) next[v.id] = v.name;
      return next;
    });
  }, []);

  const fetchPage = useCallback(
    async (term: string, offset: number, append: boolean) => {
      const requestId = ++requestIdRef.current;
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("limit", String(VENDOR_PAGE_SIZE));
        if (offset > 0) params.set("offset", String(offset));
        const trimmed = term.trim();
        if (trimmed) params.set("search", trimmed);

        const rows: any[] = (await fetchJSON(`/vendors?${params.toString()}`)) ?? [];
        if (requestId !== requestIdRef.current) return;

        const page: VendorOption[] = rows.map((v) => ({
          id: v.id,
          name: v.name,
          category: v.category ?? null,
        }));

        setVendors((prev) => {
          if (!append) return page;
          const seen = new Set(prev.map((v) => v.id));
          return [...prev, ...page.filter((v) => !seen.has(v.id))];
        });
        rememberNames(page);
        // hasMore is inferred from a full page — one extra empty fetch at the
        // end is cheaper than a separate count query.
        setHasMore(page.length === VENDOR_PAGE_SIZE);
        offsetRef.current = offset + page.length;
      } catch {
        if (requestId !== requestIdRef.current) return;
        if (!append) setVendors([]);
        setHasMore(false);
      } finally {
        if (requestId === requestIdRef.current) setLoading(false);
      }
    },
    [rememberNames],
  );

  // (Re)load page 0 on mount and on every debounced search change.
  useEffect(() => {
    if (!enabled) return;
    const timeoutId = window.setTimeout(
      () => {
        fetchPage(search, 0, false);
      },
      search ? SEARCH_DEBOUNCE_MS : 0,
    );
    return () => window.clearTimeout(timeoutId);
  }, [search, enabled, fetchPage]);

  const loadMore = useCallback(() => {
    if (loading || !hasMore) return;
    fetchPage(search, offsetRef.current, true);
  }, [loading, hasMore, search, fetchPage]);

  const ensureVendor = useCallback((id: number) => {
    if (!id || id <= 0) return;
    if (resolvingRef.current.has(id)) return;
    resolvingRef.current.add(id);
    fetchJSON(`/vendors/${id}`)
      .then((v: any) => {
        if (!v?.id) return;
        setNameById((prev) => (prev[v.id] ? prev : { ...prev, [v.id]: v.name }));
      })
      .catch(() => {
        /* vendor may have been deleted — picker falls back to showing the id */
      });
  }, []);

  return { vendors, search, setSearch, loading, hasMore, loadMore, nameById, ensureVendor };
}
