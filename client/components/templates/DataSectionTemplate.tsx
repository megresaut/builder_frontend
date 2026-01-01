import React from "react";
import { EditIcon } from "@/components/icons";
import {
  SectionRowTemplate,
  SectionActionTemplate,
} from "@/components/templates";

export interface DataField {
  label: string;
  value?: React.ReactNode;
  icon?: React.ReactNode;
}

export interface Subsection {
  title: string;
  fields: DataField[];
}

interface DataSectionTemplateProps {
  title: string;
  subsections: Subsection[];
  onEdit: () => void;
  isLast?: boolean;
  editLabel?: string;
  wrapInSectionRow?: boolean;
}

/**
 * DataSectionTemplate
 *
 * Reusable template for displaying data sections with multiple subsections.
 * Each subsection can have a title and multiple data fields with optional icons.
 * Provides consistent layout for information display with edit capabilities.
 *
 * Features:
 * - Multiple subsections with optional titles
 * - Data fields with label, value, and optional icon
 * - Edit button via SectionActionTemplate
 * - Responsive layout
 *
 * @param title - Main section title
 * @param subsections - Array of subsections, each with title and fields
 * @param onEdit - Callback when edit button is clicked
 * @param isLast - Whether this is the last section (controls bottom border)
 * @param editLabel - Label for edit button (default: "Edit")
 */
export const DataSectionTemplate: React.FC<DataSectionTemplateProps> = ({
  title,
  subsections,
  onEdit,
  isLast = true,
  editLabel = "Edit",
  wrapInSectionRow = true,
}) => {
  const content = (
    <>
      <div className="flex w-full items-center justify-between gap-4 flex-wrap">
        <h2 className="text-[#303030] text-xl font-medium leading-[1.1]">
          {title}
        </h2>
        <SectionActionTemplate
          icon={<EditIcon width={14} height={14} />}
          label={editLabel}
          onClick={onEdit}
        />
      </div>

      <div className="flex mt-3 w-full flex-col">
        {subsections.map((subsection, sectionIdx) => (
          <div
            key={sectionIdx}
            className={sectionIdx > 0 ? "mt-5" : ""}
          >
            {subsection.title && (
              <div className="text-[#303030] text-base leading-[1.38] font-medium">
                {subsection.title}
              </div>
            )}
            <div className={subsection.title ? "self-start flex mt-3 items-start gap-14 text-xs text-[#71717A] leading-[1.33]" : "self-start flex items-start gap-14 text-xs text-[#71717A] leading-[1.33]"}>
              {subsection.fields.map((field, fieldIdx) => (
                <div key={fieldIdx} className="flex flex-col">
                  <div className="font-medium">{field.label}</div>
                  <div className="mt-1 flex items-center gap-1">
                    {field.icon && <span>{field.icon}</span>}
                    <span className="text-[#303030]">
                      {field.value || "-"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );

  if (!wrapInSectionRow) {
    return content;
  }

  return <SectionRowTemplate isLast={isLast}>{content}</SectionRowTemplate>;
};

export default DataSectionTemplate;
