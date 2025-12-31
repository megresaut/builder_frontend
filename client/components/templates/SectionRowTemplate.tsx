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
 * Dividers are handled by parent SectionGroupCardTemplate.
 * Each row contains a header (title + actions) and body content.
 */
export const SectionRowTemplate: React.FC<SectionRowTemplateProps> = ({
  children,
  isLast = false,
  className = "",
}) => (
  <div className={`p-4 flex flex-col ${!isLast ? "border-b border-[#E5E5E5]" : ""} ${className}`}>
    {children}
  </div>
);

export default SectionRowTemplate;
