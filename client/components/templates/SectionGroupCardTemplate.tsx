import React from "react";

interface SectionGroupCardTemplateProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * SectionGroupCardTemplate
 * 
 * Single container wrapping multiple section rows.
 * Provides outer border and radius, with internal dividers between rows.
 * Each child row should be a SectionRowTemplate.
 */
export const SectionGroupCardTemplate: React.FC<SectionGroupCardTemplateProps> = ({
  children,
  className = "",
}) => (
  <div
    className={`bg-white border border-[#E5E5E5] rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden flex flex-col ${className}`}
  >
    {children}
  </div>
);

export default SectionGroupCardTemplate;
