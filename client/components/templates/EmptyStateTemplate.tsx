import React from "react";

interface EmptyStateTemplateProps {
  message: string;
}

/**
 * EmptyStateTemplate
 *
 * Simple empty state display for list sections.
 * Used when there are no items to display.
 */
export const EmptyStateTemplate: React.FC<EmptyStateTemplateProps> = ({
  message,
}) => (
  <div className="mt-3 flex items-center gap-1 w-full px-3 py-1.5 bg-[#F9F9F9] border border-[#DADADA] rounded">
    <p className="text-[#303030] text-sm font-normal leading-[1.29]">
      {message}
    </p>
  </div>
);

export default EmptyStateTemplate;
