import React from "react";

interface SectionRowTemplateProps {
  children: React.ReactNode;
  isLast?: boolean;
  className?: string;
}

/**
 * SectionRowTemplate
 *
 * Row template for sections inside SectionGroupCardTemplate.
 * Renders without its own border/radius/shadow.
 * Dividers (border-bottom) are on the inner padded container, not the outer wrapper.
 * Each row contains a header (title + actions) and body content.
 */
export const SectionRowTemplate: React.FC<SectionRowTemplateProps> = ({
  children,
  isLast = false,
  className = "",
}) => (
  <div className={className}>
    <div className="p-4 flex flex-col">
      {children}
    </div>
    {!isLast && (
      <div className="mx-4 h-px border-t border-[#E5E5E5]" />
    )}
  </div>
);

export default SectionRowTemplate;
