import { useCallback, useMemo } from "react";

export function useTableActions(onDelete: (row: any) => void, onEdit: (row: any) => void) {
  const handleDelete = useCallback(
    (row: any) => {
      console.log("Delete action called with row:", row);
      onDelete(row);
    },
    [onDelete]
  );

  const handleEdit = useCallback(
    (row: any) => {
      onEdit(row);
    },
    [onEdit]
  );

  return useMemo(
    () => ({
      handleDelete,
      handleEdit,
    }),
    [handleDelete, handleEdit]
  );
}
