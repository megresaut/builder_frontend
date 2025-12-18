import { ReactNode } from "react";
import { MoreVertical } from "lucide-react";
import BlueButton from "./BlueButton";

interface PageHeaderProps {
  title: string;
  subtitle?: string | ReactNode;
  actionButton?: {
    label: string;
    onClick: () => void;
  };
  moreOptions?: {
    onView?: () => void;
    onDelete?: () => void;
  };
}

export default function PageHeader({
  title,
  subtitle,
  actionButton,
  moreOptions,
}: PageHeaderProps) {
  return (
    <div className="flex justify-between gap-4 flex-row">
      {/* Left side - Heading and Subheading */}
      <div className="flex flex-col justify-start font-['Geist',sans-serif]">
        <div className="text-[#303030] text-[28px] font-semibold leading-[1.07] whitespace-nowrap">
          {title}
        </div>
        {subtitle && (
          <div className="mt-2 text-[#717179] font-medium text-sm leading-4">
            <span className="inline">{subtitle}</span>
          </div>
        )}
      </div>

      {/* Right side - Action buttons */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {actionButton && (
          <BlueButton onClick={actionButton.onClick}>
            {actionButton.label}
          </BlueButton>
        )}

        {moreOptions && (
          <button
            onClick={() => {
              // Handle dropdown menu toggle here
              // This is a placeholder for the dropdown menu trigger
            }}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#DADADA] bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] hover:bg-gray-50 transition-colors"
          >
            <MoreVertical className="w-4 h-4 text-[#303030]" />
          </button>
        )}
      </div>
    </div>
  );
}
