import React from "react";

export interface KeyValueCell {
  label: string;
  value?: React.ReactNode;
  icon?: React.ReactNode;
  isLink?: boolean;
  href?: string;
  fullWidth?: boolean;
}

interface KeyValueGridProps {
  cells: KeyValueCell[];
}

/**
 * KeyValueGrid
 *
 * Grid layout for read-only attribute summaries.
 * Displays key-value pairs with responsive wrapping.
 * Supports 4-column layout on desktop, full-width rows for specific cells.
 */
export const KeyValueGrid: React.FC<KeyValueGridProps> = ({ cells }) => {
  return (
    <div className="flex flex-col font-medium">
      {/* Grid content */}
      <div className="mt-3 flex flex-col whitespace-nowrap">
        {/* First pass: non-fullwidth cells */}
        <div className="flex items-start gap-10 flex-wrap">
          {cells
            .filter((cell) => !cell.fullWidth)
            .map((cell, idx) => (
              <div key={idx} className="flex flex-col w-[220px]">
                <div className="text-[#71717A] text-xs font-medium leading-[1.33]">
                  {cell.label}
                </div>
                {cell.value ? (
                  cell.isLink && cell.href ? (
                    <a
                      href={cell.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 flex items-center gap-1 text-[#2463EB] text-sm font-medium leading-[1.4] tracking-[-0.28px] rounded-lg hover:underline"
                    >
                      {cell.icon && cell.icon}
                      <span>{cell.value}</span>
                    </a>
                  ) : (
                    <div className="mt-1 flex items-center gap-1 text-[#303030] text-sm font-medium leading-[1.29]">
                      {cell.icon && cell.icon}
                      <span>{cell.value}</span>
                    </div>
                  )
                ) : (
                  <div className="mt-1 text-[#303030] text-sm font-medium leading-[1.29]">
                    --
                  </div>
                )}
              </div>
            ))}
        </div>

        {/* Second pass: fullwidth cells */}
        {cells.filter((cell) => cell.fullWidth).length > 0 && (
          <div className="mt-3 flex items-start gap-10">
            {cells
              .filter((cell) => cell.fullWidth)
              .map((cell, idx) => (
                <div key={idx} className="flex flex-col">
                  <div className="text-[#71717A] text-xs font-medium leading-[1.33]">
                    {cell.label}
                  </div>
                  {cell.value ? (
                    <div className="mt-1 text-[#303030] text-sm font-medium leading-[1.29]">
                      {cell.value}
                    </div>
                  ) : (
                    <div className="mt-1 text-[#303030] text-sm font-medium leading-[1.29]">
                      --
                    </div>
                  )}
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default KeyValueGrid;
