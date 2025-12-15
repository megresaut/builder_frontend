import { usePageState } from "@/hooks/usePageState";

export function useSortingTable<T extends Record<string, any>>(data: T[]) {
  const [sortBy, setSortBy] = usePageState<string>("sortBy", "");
  const [sortOrder, setSortOrder] = usePageState<"asc" | "desc">("sortOrder", "asc");

  const getSortedData = () => {
    if (!sortBy) return data;

    const sorted = [...data].sort((a, b) => {
      let aValue: any = a[sortBy];
      let bValue: any = b[sortBy];

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
