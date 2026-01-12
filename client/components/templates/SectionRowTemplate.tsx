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
    <div className="px-4 pt-2 pb-4 flex flex-col">{children}</div>
    {!isLast && <div className="h-px border-t border-[#E5E5E5]" />}
  </div>
);

export default SectionRowTemplate;
