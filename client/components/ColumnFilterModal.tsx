import { createPortal } from "react-dom";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

interface ColumnOption {
  key: string;
  label: string;
  icon: ReactNode;
}

interface ColumnFilterModalProps {
  isOpen: boolean;
  position: { top: number; left: number };
  columns: ColumnOption[];
  visibleColumns: Set<string>;
  onToggleColumn: (columnKey: string) => void;
  onClose?: () => void;
}

export default function ColumnFilterModal({
  isOpen,
  position,
  columns,
  visibleColumns,
  onToggleColumn,
  onClose,
}: ColumnFilterModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [computedPos, setComputedPos] = useState(position);

  useEffect(() => {
    if (!isOpen) return;
    setComputedPos(position);
  }, [isOpen, position.top, position.left]);

  useLayoutEffect(() => {
    if (!isOpen) return;

    const el = modalRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const padding = 8;

    const clampedLeft = Math.min(
      Math.max(padding, computedPos.left),
      Math.max(padding, window.innerWidth - rect.width - padding),
    );

    const clampedTop = Math.min(
      Math.max(padding, computedPos.top),
      Math.max(padding, window.innerHeight - rect.height - padding),
    );

    if (clampedLeft !== computedPos.left || clampedTop !== computedPos.top) {
      setComputedPos({ top: clampedTop, left: clampedLeft });
    }
  }, [isOpen, computedPos.left, computedPos.top]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose?.();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      ref={modalRef}
      data-column-filter-modal="true"
      className="bg-white flex flex-col justify-center items-start gap-1 p-2"
      style={{
        width: "260px",
        border: "0.5px solid #DADADA",
        borderRadius: "8px",
        boxShadow:
          "0 38px 11px 0 rgba(0, 0, 0, 0.00), 0 24px 10px 0 rgba(0, 0, 0, 0.01), 0 14px 8px 0 rgba(0, 0, 0, 0.04), 0 6px 6px 0 rgba(0, 0, 0, 0.06), 0 2px 3px 0 rgba(0, 0, 0, 0.07)",
        zIndex: 99999,
        position: "fixed",
        top: Math.max(0, computedPos.top) + "px",
        left: Math.max(0, computedPos.left) + "px",
        pointerEvents: "auto",
      }}
      onMouseLeave={onClose}
    >
      {columns.map((column) => (
        <label
          key={column.key}
          className="flex items-center justify-between gap-3 w-full px-3 py-2 hover:bg-gray-50 rounded cursor-pointer transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={visibleColumns.has(column.key)}
              onChange={() => onToggleColumn(column.key)}
              className="w-4 h-4 rounded cursor-pointer"
              style={{
                accentColor: "#013764",
              }}
              onClick={(e) => e.stopPropagation()}
            />
            <span
              className="text-[#303030] font-normal text-base leading-[140%] tracking-[-0.32px]"
              style={{
                fontFamily:
                  "Geist, -apple-system, Roboto, Helvetica, sans-serif",
              }}
            >
              {column.label}
            </span>
          </div>
          {column.icon}
        </label>
      ))}
    </div>,
    document.body,
  );
}
