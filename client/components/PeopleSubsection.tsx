import React, { ReactNode } from "react";
import { cn } from "@/lib/utils";
import PersonAvatars from "@/components/PersonAvatars";

export interface Person {
  id: string | number;
  name: string;
  initials: string;
  href?: string;
  roleLabel?: string;
  phone?: string;
  email?: string;
  title?: string;
  type?: "staff" | "vendor" | "propertyManager" | "fieldManager";
}

interface PeopleSubsectionProps {
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
  alignBody?: "left" | "center";
  activeTab?: number;
  hideHeaderOnTab?: number | number[];
  type?: "assignee" | "collaborator";
}

/**
 * PeopleSubsection
 *
 * Reusable subsection component for people-related content.
 * Supports two modes:
 * - "rows": List of person rows with detailed info (Assigned to, Created by, Rental owners)
 * - "avatars": Compact avatar bubbles row (Collaborators)
 *
 * Optional features:
 * - showRoleLabel: Display role/title under name
 * - showPhone: Display phone next to role label on same line
 * - actionLabel/onAction: Optional action link (e.g., "Edit")
 * - density: "compact" for tighter spacing
 * - showDivider: Add divider between header and body
 */
export const PeopleSubsection: React.FC<PeopleSubsectionProps> = ({
  label,
  mode,
  people,
  showDivider = true,
  showRoleLabel = false,
  showPhone = false,
  actionLabel,
  onAction,
  actionNode,
  density = "default",
  alignBody = "left",
  showSecondaryMetaColumn = false,
  activeTab = 0,
  hideHeaderOnTab,
  type = "assignee",
}) => {
  // Determine border and text color based on type
  const borderColor = type === "collaborator" ? "border-[#10b981]" : "border-[#2463eb]";
  const textColor = type === "collaborator" ? "text-[#10b981]" : "text-[#2463eb]";
  const handleAvatarClick = (person: Person) => {
    if (person.href) {
      window.location.href = person.href;
    }
  };

  const filteredPeople = people;

  const shouldHideHeader = hideHeaderOnTab !== undefined && (
    Array.isArray(hideHeaderOnTab)
      ? hideHeaderOnTab.includes(activeTab)
      : hideHeaderOnTab === activeTab
  );

  return (
    <div className="flex flex-col w-full">
      {/* Header: Label + optional Action */}
      {!shouldHideHeader && (
        <div className="flex items-center justify-between gap-4 w-full">
          <div className="text-sm text-[#303030] font-medium">{label}</div>
          {actionNode ? (
            actionNode
          ) : actionLabel && onAction ? (
            <button
              onClick={onAction}
              className="text-base text-[#2463eb] font-medium tracking-[-0.32px] hover:underline"
            >
              {actionLabel}
            </button>
          ) : null}
        </div>
      )}

      {/* Divider after header (optional) */}
      {showDivider && mode === "rows" && !shouldHideHeader && (
        <div className="w-full h-px bg-[#e5e5e5] mt-3 mb-3"></div>
      )}

      {/* Body: Render mode-specific layout */}
      {mode === "rows" && (
        <div
          className={cn("flex flex-col gap-3 mt-3", {
            "gap-2": density === "compact",
          })}
        >
          {filteredPeople.map((person, idx) => (
            <div
              key={`${person.id}-${idx}`}
              className="flex items-center justify-between gap-3 flex-wrap group/row relative"
            >
              {/* Tooltip for name on hover */}
              <div className="absolute bottom-full left-0 mb-2 px-2 py-1 bg-[#303030] text-white text-xs rounded whitespace-nowrap opacity-0 group-hover/row:opacity-100 transition-opacity pointer-events-none z-50">
                {person.name}
              </div>

              {/* Left: Avatar + Name/Role */}
              <div className="flex items-center gap-2.5 flex-1 min-w-[240px]">
                <div
                  className={`flex items-center justify-center flex-shrink-0 bg-white border ${borderColor} rounded-full ${textColor} font-semibold leading-[0.8] ${
                    density === "default" ? "w-10 h-10 text-xl" : "w-8 h-8 text-sm"
                  }`}
                  title={person.name}
                >
                  {person.initials}
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  {person.href ? (
                    <a
                      href={person.href}
                      className={cn(
                        "font-medium tracking-[-0.28px] hover:underline truncate",
                        type === "collaborator" ? "text-[#10b981]" : "text-[#2463eb]"
                      )}
                    >
                      {person.name}
                    </a>
                  ) : (
                    <div
                      className={cn(
                        "font-medium tracking-[-0.28px] truncate",
                        type === "collaborator" ? "text-[#10b981]" : "text-[#2463eb]"
                      )}
                    >
                      {person.name}
                    </div>
                  )}
                  {(showRoleLabel && person.roleLabel) ||
                  (showPhone && person.phone) ? (
                    <div className="text-[#a1a1a9] text-sm mt-1 flex items-center gap-2">
                      {showRoleLabel && person.roleLabel && (
                        <span>{person.roleLabel}</span>
                      )}
                      {showPhone && person.phone && (
                        <span>{person.phone}</span>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {mode === "avatars" && (
        <div className="flex items-center gap-2 mt-3">
          {filteredPeople.map((person, idx) => (
            <div key={`${person.id}-${idx}`} className="relative group/avatar">
              <button
                onClick={() => handleAvatarClick(person)}
                className={`flex items-center justify-center w-10 h-10 bg-white border ${borderColor} rounded-full ${textColor} font-semibold text-sm leading-[0.8] hover:bg-opacity-90 transition-colors flex-shrink-0`}
                title={person.name}
              >
                {person.initials}
              </button>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-[#303030] text-white text-xs rounded opacity-0 group-hover/avatar:opacity-100 transition-opacity pointer-events-none z-50 whitespace-normal min-w-max">
                <div className="font-semibold">{person.name}</div>
                {person.title && <div className="text-[#b4b4b4]">{person.title}</div>}
                {person.email && <div className="text-[#b4b4b4]">{person.email}</div>}
                {person.phone && <div className="text-[#b4b4b4]">{person.phone}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PeopleSubsection;
