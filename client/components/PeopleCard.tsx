import React, { ReactNode, useState } from "react";
import { cn } from "@/lib/utils";
import SectionCard from "@/components/SectionCard";
import { PeopleSubsection, Person } from "@/components/PeopleSubsection";

export interface PeopleSubsectionProps {
  label: string;
  mode: "rows" | "avatars";
  people: Person[];
  showDivider?: boolean;
  showRoleLabel?: boolean;
  showPhone?: boolean;
  actionLabel?: string;
  onAction?: () => void;
  actionNode?: ReactNode;
  density?: "default" | "compact";
  showSecondaryMetaColumn?: boolean;
}

interface PeopleCardProps {
  title: string;
  subsections: PeopleSubsectionProps[];
  tabs?: string[];
  defaultTab?: number;
  headerActions?: ReactNode;
  footerActions?: {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
  }[];
}

/**
 * PeopleCard
 *
 * Reusable card for people-related content (Assignees, Contacts).
 * Composes multiple PeopleSubsection components with optional tabs and footer actions.
 *
 * Props:
 * - title: Card title (e.g., "Assignees", "Contacts")
 * - subsections: Array of PeopleSubsectionProps for each subsection
 * - tabs?: Optional tab list (for Assignees: ["Staff", "Vendors", "Field Team"])
 * - defaultTab?: Which tab index to show by default (default: 0)
 * - headerActions?: Optional actions in the header
 * - footerActions?: Optional action buttons at the footer (e.g., "Email staff")
 */
export const PeopleCard: React.FC<PeopleCardProps> = ({
  title,
  subsections,
  tabs,
  defaultTab = 0,
  headerActions,
  footerActions,
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab);

  return (
    <SectionCard title={title} actions={headerActions}>
      {/* Tabs (optional, for Assignees) */}
      {tabs && tabs.length > 0 && (
        <div className="flex w-full px-0.5 py-0.5 bg-[#f2f2f2] rounded-lg shadow-[0px_0px_0px_1px_rgba(210,209,207,1)] text-sm text-[#282828] text-center mb-4">
          {tabs.map((tab, idx) => (
            <button
              key={idx}
              onClick={() => setActiveTab(idx)}
              className={cn(
                "flex items-center justify-center flex-1 px-4 py-1.5 rounded-md transition-colors",
                {
                  "bg-white shadow-sm text-[#09090b] font-medium":
                    activeTab === idx,
                  "text-[#282828] hover:text-[#09090b]": activeTab !== idx,
                },
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      )}

      {/* Subsections */}
      <div className="flex flex-col w-full gap-4">
        {subsections.map((subsection, idx) => (
          <PeopleSubsection key={idx} {...subsection} />
        ))}
      </div>

      {/* Footer Actions (optional) */}
      {footerActions && footerActions.length > 0 && (
        <div className="flex flex-col w-full gap-2 mt-4">
          {footerActions.map((action, idx) => (
            <button
              key={idx}
              onClick={action.onClick}
              className="flex items-center justify-center gap-1 w-full text-sm text-[#2463eb] font-medium tracking-[-0.28px] hover:underline"
            >
              {action.icon}
              {action.label}
            </button>
          ))}
        </div>
      )}
    </SectionCard>
  );
};

export default PeopleCard;
