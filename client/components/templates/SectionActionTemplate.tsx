import React from "react";
import { Plus } from "lucide-react";

interface SectionActionTemplateProps {
  icon?: React.ReactNode;
  label: string;
  onClick: () => void;
  testId?: string;
}

/**
 * SectionActionTemplate
 * 
 * Styled action button for section headers (Add, Edit, etc).
 * Renders as blue text with icon and label.
 */
export const SectionActionTemplate: React.FC<SectionActionTemplateProps> = ({
  icon,
  label,
  onClick,
  testId,
}) => (
  <button
    onClick={onClick}
    data-testid={testId}
    className="flex items-center gap-1 text-[#2463EB] text-sm font-medium leading-[1.4] tracking-[-0.28px] whitespace-nowrap rounded-lg hover:opacity-80 transition-opacity"
  >
    {icon || <Plus className="w-3 h-3" />}
    <span>{label}</span>
  </button>
);

export default SectionActionTemplate;
