import React, { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface Person {
  id: string | number;
  name: string;
  initials: string;
  href?: string;
  roleLabel?: string;
  phone?: string;
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
  showSecondaryMetaColumn?: boolean;
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
 * - showPhone: Display phone in secondary column or under name
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
}) => {
  const handleAvatarClick = (person: Person) => {
    if (person.href) {
      window.location.href = person.href;
    }
  };

  return (
    <div className="flex flex-col w-full">
      {/* Header: Label + optional Action */}
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

      {/* Divider after header (optional) */}
      {showDivider && mode === "rows" && (
        <div className="w-full h-px bg-[#e5e5e5] mt-3 mb-3"></div>
      )}

      {/* Body: Render mode-specific layout */}
      {mode === "rows" && (
        <div
          className={cn("flex flex-col gap-3 mt-3", {
            "gap-2": density === "compact",
          })}
        >
          {people.map((person, idx) => (
            <div
              key={`${person.id}-${idx}`}
              className="flex items-center justify-between gap-3 flex-wrap"
            >
              {/* Left: Avatar + Name/Role */}
              <div className="flex items-center gap-2.5 flex-1 min-w-[240px]">
                <div
                  className={cn(
                    "flex items-center justify-center flex-shrink-0 bg-white border border-[#2463eb] rounded-full text-[#2463eb] font-semibold leading-[0.8]",
                    {
                      "w-10 h-10 text-xl": density === "default",
                      "w-8 h-8 text-sm": density === "compact",
                    },
                  )}
                >
                  {person.initials}
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  {person.href ? (
                    <a
                      href={person.href}
                      className="text-[#2463eb] font-medium tracking-[-0.28px] hover:underline truncate"
                    >
                      {person.name}
                    </a>
                  ) : (
                    <div className="text-[#2463eb] font-medium tracking-[-0.28px] truncate">
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

              {/* Right: Phone or secondary meta (optional) */}
              {showSecondaryMetaColumn && (
                <div className="flex flex-col items-end text-right">
                  {showPhone && person.phone && (
                    <div className="text-sm text-[#a1a1a9]">{person.phone}</div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {mode === "avatars" && (
        <div className="flex items-center gap-2 mt-3">
          {people.map((person, idx) => (
            <button
              key={`${person.id}-${idx}`}
              onClick={() => handleAvatarClick(person)}
              className="flex items-center justify-center w-10 h-10 bg-white border border-[#2463eb] rounded-full text-[#2463eb] font-semibold text-sm leading-[0.8] hover:bg-[#f0f4ff] transition-colors flex-shrink-0"
              title={person.name}
            >
              {person.initials}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default PeopleSubsection;
