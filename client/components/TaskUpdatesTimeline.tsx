import React, { ReactNode } from "react";
import SectionCard from "@/components/SectionCard";
import { DotsIcon, PlusIcon, UserIcon } from "@/components/icons";

export interface UpdateItem {
  id: string | number;
  avatar?: string;
  initials?: string;
  author: string;
  action: string;
  actionValue?: ReactNode;
  timestamp: string;
  fieldsDisplay?: ReactNode;
  details?: ReactNode;
  moreOptions?: () => void;
  icon?: ReactNode;
  isInitialCreation?: boolean;
}

interface TaskUpdatesTimelineProps {
  updates: UpdateItem[];
  onAddUpdate?: () => void;
}

/**
 * TaskUpdatesTimeline - Buildium-style dynamic timeline
 *
 * Displays a timeline of task updates with:
 * - Dynamic card heights (no fixed heights)
 * - Continuous vertical rail that stretches with content
 * - Two-column layout (fixed left timeline, flexible right content)
 * - Composer row at top with '+' marker
 * - Cards expand naturally based on content length
 */
export const TaskUpdatesTimeline: React.FC<TaskUpdatesTimelineProps> = ({
  updates,
  onAddUpdate,
}) => {
  return (
    <SectionCard title="Updates">
      {/* Updates List Container - relative so rail can be absolutely positioned */}
      <div className="relative pl-14">
        {/* Continuous Timeline Rail - extends from composer to initial creation item, stopping before it */}
        {updates.length > 0 && (
          <div
            className="absolute left-7 -translate-x-1/2 w-1 bg-gradient-to-b from-[#d4e3f7] to-[#e5e5e5]"
            style={{
              top: "20px",
              // Stop before the last item if it's an initial creation
              bottom: updates[updates.length - 1]?.isInitialCreation
                ? `${updates.length * 96 + 40}px`
                : "20px",
              clipPath: "inset(0 0 20px 0)",
              backgroundImage:
                "linear-gradient(to bottom, rgb(212, 227, 247) 0%, rgb(229, 229, 229) 100%)",
            }}
          />
        )}

        {/* Updates Stack */}
        <div className="flex flex-col gap-4">
          {/* Composer Row */}
          {onAddUpdate && (
            <div className="flex items-start gap-3 -ml-14">
              {/* Composer Marker */}
              <div className="flex flex-col items-center gap-0 w-14 flex-shrink-0">
                <button
                  onClick={onAddUpdate}
                  className="flex items-center justify-center w-10 h-10 bg-[#013764] border border-[#013764] rounded-full text-white flex-shrink-0 relative z-10 shadow-[0_0_0_1px_#002D5A]"
                  title="Add update"
                >
                  <PlusIcon width={16} height={16} color="white" />
                </button>
              </div>

              {/* Composer Button */}
              <div className="flex-1 flex items-center">
                <button
                  onClick={onAddUpdate}
                  className="w-full px-4 py-2.5 bg-white border border-[#e5e5e5] rounded-lg text-base text-[#303030] font-['Geist',sans-serif] hover:bg-gray-50 hover:border-[#d4d4d8] transition-colors text-left"
                >
                  Add an update...
                </button>
              </div>
            </div>
          )}

          {/* Update Items */}
          {updates.map((update, idx) => (
            <div key={update.id} className="flex items-start gap-3 -ml-14">
              {/* Timeline Marker */}
              <div className="flex flex-col items-center w-14 flex-shrink-0">
                <div
                  className="flex items-center justify-center w-10 h-10 bg-white border-2 border-[#717179] rounded-full text-[#717179] flex-shrink-0 relative z-10"
                  title={update.author}
                  style={{ color: "#717179" }}
                >
                  {update.icon ? (
                    <div className="text-[#717179]">{update.icon}</div>
                  ) : (
                    <UserIcon width={16} height={16} color="#717179" />
                  )}
                </div>
              </div>

              {/* Update Card - height:auto so it grows naturally */}
              <div
                className="flex-1 bg-white border border-[#e5e5e5] rounded-lg hover:border-[#d4d4d8] transition-colors"
                style={{
                  /* Speech bubble notch */
                  position: "relative",
                }}
              >
                {/* Notch pointer (optional speech bubble effect) */}
                <div
                  className="absolute left-0 top-3 w-0 h-0"
                  style={{
                    borderTop: "6px solid transparent",
                    borderBottom: "6px solid transparent",
                    borderRight: "8px solid white",
                    marginLeft: "-8px",
                  }}
                />
                <div
                  className="absolute left-0 top-3 w-0 h-0"
                  style={{
                    borderTop: "6px solid transparent",
                    borderBottom: "6px solid transparent",
                    borderRight: "8px solid #e5e5e5",
                    marginLeft: "-9px",
                  }}
                />

                {/* Card Content */}
                <div className="px-4 py-3 flex flex-col gap-2">
                  {/* Header Row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-[#303030] leading-snug">
                        <span className="font-semibold">{update.author}</span>{" "}
                        {update.action}
                        {update.actionValue && (
                          <>
                            {" "}
                            <span className="text-[#2463eb] font-medium break-words">
                              {update.actionValue}
                            </span>
                          </>
                        )}
                      </div>
                      <div className="text-xs text-[#a1a1a9] mt-1">
                        {update.timestamp}
                      </div>
                    </div>

                    {/* More Options Button */}
                    {update.moreOptions && (
                      <button
                        onClick={update.moreOptions}
                        className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        title="More options"
                      >
                        <DotsIcon width={16} height={16} className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Fields Display (inline on same line) */}
                  {update.fieldsDisplay && (
                    <div className="pt-2">
                      {update.fieldsDisplay}
                    </div>
                  )}

                  {/* Details Section */}
                  {update.details && (
                    <div className="pt-2 border-t border-[#e5e5e5]">
                      {update.details}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </SectionCard>
  );
};

export default TaskUpdatesTimeline;
