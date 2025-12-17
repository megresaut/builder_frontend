import { ReactNode } from "react";

interface GlobalColumnFilterItemProps {
  columnKey: string;
  label: string;
  icon: ReactNode;
  isVisible: boolean;
  onToggle: (columnKey: string) => void;
  onClick?: (e: React.MouseEvent) => void;
}

export default function GlobalColumnFilterItem({
  columnKey,
  label,
  icon,
  isVisible,
  onToggle,
  onClick,
}: GlobalColumnFilterItemProps) {
  return (
    <label
      className="ra-column-filter-item flex items-center justify-between gap-3 w-full px-3 py-2 hover:bg-gray-50 rounded cursor-pointer transition-colors"
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(e);
      }}
    >
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={isVisible}
          onChange={() => onToggle(columnKey)}
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
          {label}
        </span>
      </div>
      <div className="ra-column-filter-icon">
        {icon}
      </div>
    </label>
  );
}
