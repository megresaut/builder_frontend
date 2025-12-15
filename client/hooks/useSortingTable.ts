import { usePageState } from "@/hooks/usePageState";

export function useSortingTable<T extends Record<string, any>>(data: T[], namespace: string = "default") {
  const [sortBy, setSortBy] = usePageState<string>(`${namespace}_sortBy`, "");
  const [sortOrder, setSortOrder] = usePageState<"asc" | "desc">(`${namespace}_sortOrder`, "asc");

  const getSortedData = () => {
    if (!sortBy) return data;

    const sorted = [...data].sort((a, b) => {
      let aValue: any = a[sortBy];
      let bValue: any = b[sortBy];

      // Handle arrays by joining them into a string
      if (Array.isArray(aValue)) {
        aValue = aValue.join(", ");
      }
      if (Array.isArray(bValue)) {
        bValue = bValue.join(", ");
      }

      if (typeof aValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = (bValue || "").toLowerCase();
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
