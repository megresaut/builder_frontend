import React from "react";

interface SectionCardTemplateProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * SectionCardTemplate
 * 
 * Standard titled section wrapper with consistent spacing and borders.
 * Used as the root container for all vendor detail sections.
 */
export const SectionCardTemplate: React.FC<SectionCardTemplateProps> = ({
  children,
  className = "",
}) => (
  <div
    className={`bg-white border border-[#E5E5E5] rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-4 flex flex-col ${className}`}
  >
    {children}
  </div>
);

export default SectionCardTemplate;
