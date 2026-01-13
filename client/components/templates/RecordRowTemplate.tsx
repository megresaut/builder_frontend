import React from "react";

interface RecordRowTemplateProps {
  leftSlot: React.ReactNode;
  rightSlot?: React.ReactNode;
  isLast?: boolean;
}

/**
 * RecordRowTemplate
 *
 * Standard row layout for list items.
 * Handles padding, divider lines, and optional right slot (for actions).
 */
export const RecordRowTemplate: React.FC<RecordRowTemplateProps> = ({
  leftSlot,
  rightSlot,
  isLast = false,
}) => (
  <div
    className={`flex items-center justify-between gap-6 px-3 py-2 ${
      !isLast ? "border-b border-[#DADADA]" : ""
    }`}
  >
    <div className="flex-1">{leftSlot}</div>
    {rightSlot && <div>{rightSlot}</div>}
  </div>
);

export default RecordRowTemplate;
