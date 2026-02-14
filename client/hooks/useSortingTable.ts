import { usePageState } from "@/hooks/usePageState";

/**
 * Compare two values with natural (numeric-aware) ordering so that
 * "1", "2", "10", "11" sort correctly instead of "1", "10", "11", "2".
 * Handles pure numbers, numeric strings, and alphanumeric (e.g. "1A", "2B", "10").
 */
function naturalCompare(a: string, b: string): number {
  const chunkRe = /(\d+|\D+)/g;
  const aStr = a.toLowerCase();
  const bStr = b.toLowerCase();
  const aChunks = aStr.match(chunkRe) ?? [];
  const bChunks = bStr.match(chunkRe) ?? [];

  for (let i = 0; i < Math.max(aChunks.length, bChunks.length); i++) {
    const ac = aChunks[i] ?? "";
    const bc = bChunks[i] ?? "";
    const aNum = parseInt(ac, 10);
    const bNum = parseInt(bc, 10);
    const aIsNum = !Number.isNaN(aNum) && String(aNum) === ac;
    const bIsNum = !Number.isNaN(bNum) && String(bNum) === bc;

    if (aIsNum && bIsNum) {
      if (aNum !== bNum) return aNum - bNum;
    } else {
      if (ac !== bc) return ac < bc ? -1 : 1;
    }
  }
  return 0;
}

export type UseSortingTableOptions = {
  /** Column to sort by when user has not yet clicked a column (e.g. "unitNumber" for Units tab). */
  initialSortBy?: string;
  /** Order for initial sort. */
  initialSortOrder?: "asc" | "desc";
};

export function useSortingTable<T extends Record<string, any>>(
  data: T[],
  namespace: string = "default",
  options?: UseSortingTableOptions
) {
  const [sortBy, setSortBy] = usePageState<string>(`${namespace}_sortBy`, "");
  const [sortOrder, setSortOrder] = usePageState<"asc" | "desc">(`${namespace}_sortOrder`, "asc");

  const effectiveSortBy = sortBy || options?.initialSortBy || "";
  const effectiveSortOrder = sortBy ? sortOrder : (options?.initialSortOrder ?? "asc");

  const getSortedData = () => {
    if (!effectiveSortBy) return data;

    const formatArrayValue = (value: unknown[]) =>
      value
        .map((item) => {
          if (item == null) return "";
          if (
            typeof item === "string" ||
            typeof item === "number" ||
            typeof item === "boolean"
          ) {
            return String(item);
          }
          if (typeof item === "object") {
            const obj = item as Record<string, unknown>;
            const best =
              obj.name ??
              obj.title ??
              obj.label ??
              obj.value ??
              obj.initials ??
              "";
            return String(best);
          }
          return String(item);
        })
        .filter(Boolean)
        .join(", ");

    const sorted = [...data].sort((a, b) => {
      let aValue: any = a[effectiveSortBy];
      let bValue: any = b[effectiveSortBy];

      if (aValue == null) aValue = "";
      if (bValue == null) bValue = "";

      // Handle arrays (including arrays of objects like assignees)
      if (Array.isArray(aValue)) {
        aValue = formatArrayValue(aValue);
      }
      if (Array.isArray(bValue)) {
        bValue = formatArrayValue(bValue);
      }

      const aStr = typeof aValue === "string" ? aValue : String(aValue ?? "");
      const bStr = typeof bValue === "string" ? bValue : String(bValue ?? "");

      // Use natural sort so unit numbers order as 1, 2, 3, ... 9, 10, 11
      const cmp = naturalCompare(aStr, bStr);
      if (cmp !== 0) {
        return effectiveSortOrder === "asc" ? cmp : -cmp;
      }
      return 0;
    });

    return sorted;
  };

  const handleSortClick = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const getSortIndicator = (column: string) => {
    if (sortBy !== column) return null;
    return sortOrder === "asc" ? "↑" : "↓";
  };

  return {
    sortBy,
    sortOrder,
    getSortedData,
    handleSortClick,
    getSortIndicator,
  };
}
