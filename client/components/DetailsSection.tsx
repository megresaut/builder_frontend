import React from "react";

export interface DetailField {
  label: string;
  value?: React.ReactNode;
  width?: string;
  icon?: React.ReactNode;
  isLink?: boolean;
  href?: string;
}

interface DetailsSectionProps {
  title: string;
  fields: DetailField[];
  headerButtons?: React.ReactNode;
  showDivider?: boolean;
}

export const DetailsSection: React.FC<DetailsSectionProps> = ({
  title,
  fields,
  headerButtons,
  showDivider = true,
}) => (
  <div className="flex flex-col font-medium">
    {/* Header */}
    <div className="flex items-center justify-between gap-4 flex-wrap">
      <h2 className="text-[#303030] text-xl font-medium leading-[1.1]">
        {title}
      </h2>
      {headerButtons}
    </div>

    {/* Divider */}
    {showDivider && (
      <div className="mt-3 w-full h-px">
        <svg width="100%" height="1" xmlns="http://www.w3.org/2000/svg">
          <line x1="0" y1="0" x2="100%" y2="0" stroke="#E5E5E5" strokeWidth="1" />
        </svg>
      </div>
    )}

    {/* Fields */}
    <div className="mt-3 flex flex-col whitespace-nowrap">
      <div className="flex items-start gap-10 flex-wrap">
        {fields.map((field, idx) => (
          <div
            key={idx}
            className={field.width || "flex flex-col"}
          >
            <div className="text-[#71717A] text-xs font-medium leading-[1.33]">
              {field.label}
            </div>
            {field.value ? (
              field.isLink && field.href ? (
                <a
                  href={field.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 flex items-center gap-1 text-[#2463EB] text-sm font-medium leading-[1.4] tracking-[-0.28px] rounded-lg hover:underline"
                >
                  {field.icon && field.icon}
                  <span>{field.value}</span>
                </a>
              ) : (
                <div className={`mt-1 ${field.isLink ? "flex items-center gap-1" : ""} text-[#303030] text-sm font-medium leading-[1.29]`}>
                  {field.icon && field.icon}
                  <span>{field.value}</span>
                </div>
              )
            ) : (
              <div className="mt-1 text-[#303030] text-sm font-medium leading-[1.29]">
                --
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  </div>
);

DetailsSection.displayName = "DetailsSection";
