import { usePageState } from "@/hooks/usePageState";

export function useSortingTable<T extends Record<string, any>>(data: T[], namespace: string = "default") {
  const [sortBy, setSortBy] = usePageState<string>(`${namespace}_sortBy`, "");
  const [sortOrder, setSortOrder] = usePageState<"asc" | "desc">(`${namespace}_sortOrder`, "asc");

  const getSortedData = () => {
    if (!sortBy) return data;

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
      let aValue: any = a[sortBy];
      let bValue: any = b[sortBy];

      if (aValue == null) aValue = "";
      if (bValue == null) bValue = "";

      // Handle arrays (including arrays of objects like assignees)
      if (Array.isArray(aValue)) {
        aValue = formatArrayValue(aValue);
      }
      if (Array.isArray(bValue)) {
        bValue = formatArrayValue(bValue);
      }

      if (typeof aValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = String(bValue || "").toLowerCase();
      }

      if (aValue < bValue) {
        return sortOrder === "asc" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortOrder === "asc" ? 1 : -1;
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
