import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface SearchSelectOption {
  value: string;
  label: string;
  hint?: string; // optional secondary text (e.g. "concierge")
}

interface Props {
  options: SearchSelectOption[];
  value: string; // selected option value; "" = none
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

// SearchSelect is a lightweight searchable single-select combobox: an input that
// filters a dropdown of options as you type, click to select. Used where a
// native <select> would be unusable (thousands of vendors / accounts).
export default function SearchSelect({
  options,
  value,
  onChange,
  placeholder,
  disabled,
  className,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const selectedLabel = useMemo(
    () => options.find((o) => o.value === value)?.label ?? "",
    [options, value],
  );

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q
      ? options.filter(
          (o) =>
            o.label.toLowerCase().includes(q) ||
            (o.hint ?? "").toLowerCase().includes(q),
        )
      : options;
    return base.slice(0, 100); // cap rendered rows for perf on huge lists
  }, [options, query]);

  return (
    <div ref={wrapRef} className={cn("relative", className)}>
      <input
        type="text"
        disabled={disabled}
        value={open ? query : selectedLabel}
        placeholder={placeholder}
        onFocus={() => {
          if (!disabled) {
            setOpen(true);
            setQuery("");
          }
        }}
        onChange={(e) => {
          setQuery(e.target.value);
          if (!open) setOpen(true);
        }}
        className={cn(
          "w-full border border-[#DDD] rounded px-2 py-1 text-sm bg-white",
          disabled && "bg-[#F5F5F5] text-[#A1A1A1]",
        )}
      />
      {open && (
        <ul className="absolute z-10 mt-0.5 max-h-56 w-full overflow-auto rounded-md border border-[#DDD] bg-white shadow-lg text-sm">
          {value && (
            <li>
              <button
                type="button"
                className="w-full text-left px-2 py-1.5 text-[#A1A1A1] hover:bg-[#F4F7FA]"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange("");
                  setOpen(false);
                  setQuery("");
                }}
              >
                Clear
              </button>
            </li>
          )}
          {filtered.length === 0 ? (
            <li className="px-2 py-1.5 text-[#A1A1A1]">No matches</li>
          ) : (
            filtered.map((o) => (
              <li key={o.value}>
                <button
                  type="button"
                  className={cn(
                    "w-full text-left px-2 py-1.5 hover:bg-[#F4F7FA]",
                    o.value === value && "bg-[#F0F6FB] font-medium",
                  )}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onChange(o.value);
                    setOpen(false);
                    setQuery("");
                  }}
                >
                  {o.label}
                  {o.hint && (
                    <span className="text-[#A1A1A1]"> · {o.hint}</span>
                  )}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
