import React, { useRef, useState } from "react";
import { Check, ChevronDown, Pencil, Trash2, X } from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { FieldShell } from "./FieldShell";
import { useTaskCategories } from "@/hooks/useTaskCategories";

interface CategorySelectFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

const rowButtonBaseStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 12px",
  textAlign: "left",
  border: "none",
  cursor: "pointer",
  fontSize: "14px",
  fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
  display: "flex",
  alignItems: "center",
  gap: "8px",
  transition: "background-color 0.15s",
};

const inlineInputStyle: React.CSSProperties = {
  flex: 1,
  border: "1px solid var(--color-border-light)",
  borderRadius: "6px",
  padding: "4px 8px",
  fontSize: "14px",
  fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
  outline: "none",
};

export const CategorySelectField: React.FC<CategorySelectFieldProps> = ({
  label,
  required = false,
  error,
  value,
  onChange,
  disabled = false,
  placeholder = "Select Category",
}) => {
  const { categories, createCategory, renameCategory, deactivateCategory } =
    useTaskCategories();

  const [open, setOpen] = useState(false);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [addingNew, setAddingNew] = useState(false);
  const [newValue, setNewValue] = useState("");
  const [rowError, setRowError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const newInputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  const fieldId = label.toLowerCase().replace(/\s+/g, "-");

  const resetRowState = () => {
    setEditingId(null);
    setEditingValue("");
    setConfirmDeleteId(null);
    setAddingNew(false);
    setNewValue("");
    setRowError(null);
  };

  const selectedCategory = categories.find((c) => c.name === value);
  const displayLabel = value || placeholder;
  const isShowingPlaceholder = !value;

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) resetRowState();
  };

  const startEdit = (id: number, currentName: string) => {
    setConfirmDeleteId(null);
    setAddingNew(false);
    setEditingId(id);
    setEditingValue(currentName);
    setRowError(null);
    requestAnimationFrame(() => editInputRef.current?.focus());
  };

  const confirmEdit = async () => {
    if (editingId == null) return;
    const trimmed = editingValue.trim();
    if (!trimmed) {
      setRowError("Category name is required");
      return;
    }
    setBusy(true);
    setRowError(null);
    try {
      const updated = await renameCategory(editingId, trimmed);
      if (selectedCategory?.id === editingId) {
        onChange(updated.name);
      }
      resetRowState();
    } catch (err) {
      setRowError(err instanceof Error ? err.message : "Failed to rename category");
    } finally {
      setBusy(false);
    }
  };

  const startDelete = (id: number) => {
    setEditingId(null);
    setAddingNew(false);
    setConfirmDeleteId(id);
    setRowError(null);
  };

  const confirmDelete = async () => {
    if (confirmDeleteId == null) return;
    setBusy(true);
    setRowError(null);
    try {
      await deactivateCategory(confirmDeleteId);
      if (selectedCategory?.id === confirmDeleteId) {
        onChange("");
      }
      resetRowState();
    } catch (err) {
      setRowError(err instanceof Error ? err.message : "Failed to remove category");
    } finally {
      setBusy(false);
    }
  };

  const startAddNew = () => {
    setEditingId(null);
    setConfirmDeleteId(null);
    setAddingNew(true);
    setNewValue("");
    setRowError(null);
    requestAnimationFrame(() => newInputRef.current?.focus());
  };

  const confirmAddNew = async () => {
    const trimmed = newValue.trim();
    if (!trimmed) {
      setRowError("Category name is required");
      return;
    }
    setBusy(true);
    setRowError(null);
    try {
      const created = await createCategory(trimmed);
      onChange(created.name);
      setOpen(false);
      resetRowState();
    } catch (err) {
      setRowError(err instanceof Error ? err.message : "Failed to add category");
    } finally {
      setBusy(false);
    }
  };

  return (
    <FieldShell
      label={label}
      required={required}
      error={error}
      disabled={disabled}
      htmlFor={fieldId}
    >
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger
          id={fieldId}
          disabled={disabled}
          className={`w-full rounded-lg border bg-white px-3 py-2 text-sm font-normal transition-colors flex items-center justify-between cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${
            error ? "border-red-600" : open ? "border-black" : "border-[var(--color-border-light)]"
          }`}
          style={{
            fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
            lineHeight: 1.43,
            minHeight: "44px",
            height: "auto",
          }}
        >
          <span
            style={{
              color: isShowingPlaceholder ? "#303030" : "var(--color-text-primary)",
              fontSize: "14px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {displayLabel}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 flex-none" style={{ color: "#303030" }} />
        </PopoverTrigger>

        <PopoverContent
          className="rounded-lg border border-[var(--color-border-light)] bg-white shadow-md"
          align="start"
          syncTriggerWidth={true}
        >
          <div
            style={{
              padding: "4px 0",
              maxHeight: "300px",
              overflowY: "auto",
              overflowX: "hidden",
            }}
          >
            {categories.map((cat) => {
              const isSelected = value === cat.name;

              if (editingId === cat.id) {
                return (
                  <div key={cat.id} style={{ padding: "6px 12px", display: "flex", gap: "6px" }}>
                    <input
                      ref={editInputRef}
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") confirmEdit();
                        if (e.key === "Escape") resetRowState();
                      }}
                      style={inlineInputStyle}
                      disabled={busy}
                    />
                    <button type="button" onClick={confirmEdit} disabled={busy} className="p-1">
                      <Check className="h-4 w-4 text-green-600" />
                    </button>
                    <button type="button" onClick={resetRowState} disabled={busy} className="p-1">
                      <X className="h-4 w-4 text-gray-500" />
                    </button>
                  </div>
                );
              }

              if (confirmDeleteId === cat.id) {
                return (
                  <div
                    key={cat.id}
                    style={{
                      padding: "8px 12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "8px",
                      fontSize: "13px",
                    }}
                  >
                    <span>Remove "{cat.name}"?</span>
                    <div style={{ display: "flex", gap: "4px" }}>
                      <button type="button" onClick={confirmDelete} disabled={busy} className="p-1">
                        <Check className="h-4 w-4 text-green-600" />
                      </button>
                      <button type="button" onClick={resetRowState} disabled={busy} className="p-1">
                        <X className="h-4 w-4 text-gray-500" />
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={cat.id}
                  onMouseEnter={() => setHoveredId(cat.id)}
                  onMouseLeave={() => setHoveredId((prev) => (prev === cat.id ? null : prev))}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    backgroundColor: isSelected
                      ? "rgba(36, 99, 235, 0.15)"
                      : hoveredId === cat.id
                        ? "rgba(36, 99, 235, 0.08)"
                        : "transparent",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      onChange(cat.name);
                      setOpen(false);
                    }}
                    style={{ ...rowButtonBaseStyle, backgroundColor: "transparent", flex: 1 }}
                  >
                    {isSelected ? <Check className="h-4 w-4 text-blue-600" /> : <div className="h-4 w-4" />}
                    {cat.name}
                  </button>
                  {hoveredId === cat.id && (
                    <div style={{ display: "flex", gap: "2px", paddingRight: "8px" }}>
                      <button
                        type="button"
                        onClick={() => startEdit(cat.id, cat.name)}
                        className="p-1 hover:opacity-70"
                      >
                        <Pencil className="h-3.5 w-3.5 text-gray-500" />
                      </button>
                      <button
                        type="button"
                        onClick={() => startDelete(cat.id)}
                        className="p-1 hover:opacity-70"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-gray-500" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {addingNew ? (
              <div style={{ padding: "6px 12px", display: "flex", gap: "6px" }}>
                <input
                  ref={newInputRef}
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder="New category name"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") confirmAddNew();
                    if (e.key === "Escape") resetRowState();
                  }}
                  style={inlineInputStyle}
                  disabled={busy}
                />
                <button type="button" onClick={confirmAddNew} disabled={busy} className="p-1">
                  <Check className="h-4 w-4 text-green-600" />
                </button>
                <button type="button" onClick={resetRowState} disabled={busy} className="p-1">
                  <X className="h-4 w-4 text-gray-500" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={startAddNew}
                style={{ ...rowButtonBaseStyle, backgroundColor: "transparent" }}
              >
                <div className="h-4 w-4" />
                Other
              </button>
            )}

            {rowError && (
              <div style={{ padding: "4px 12px", color: "#dc2626", fontSize: "12px" }}>
                {rowError}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </FieldShell>
  );
};

CategorySelectField.displayName = "CategorySelectField";
