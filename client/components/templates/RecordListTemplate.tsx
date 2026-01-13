import React from "react";

interface RecordListTemplateProps {
  children: React.ReactNode;
}

/**
 * RecordListTemplate
 *
 * Bordered container for lists of records.
 * Handles border, rounded corners, and overflow.
 */
export const RecordListTemplate: React.FC<RecordListTemplateProps> = ({
  children,
}) => (
  <div className="mt-3 border border-[#DADADA] rounded-lg overflow-hidden">
    {children}
  </div>
);

export default RecordListTemplate;
