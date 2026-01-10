import React, { ReactNode } from "react";
import { MoreVertical } from "lucide-react";
import SectionCard from "@/components/SectionCard";

export interface UpdateItem {
  id: string | number;
  avatar?: string;
  initials?: string;
  author: string;
  action: string;
  actionValue?: ReactNode;
  timestamp: string;
  details?: ReactNode;
  moreOptions?: () => void;
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
        {/* Continuous Timeline Rail - extends from first to last marker center */}
        <div
          className="absolute w-1 bg-gradient-to-b from-[#d4e3f7] to-[#e5e5e5]"
          style={{
            left: "19px",
            top: "20px",
            bottom: "20px",
            clipPath: "inset(0 0 20px 0)",
            backgroundImage:
              "linear-gradient(to bottom, rgb(212, 227, 247) 0%, rgb(229, 229, 229) 100%)",
          }}
        />

        {/* Updates Stack */}
        <div className="flex flex-col gap-4">
          {/* Composer Row */}
          {onAddUpdate && (
            <div className="flex items-start gap-3 -ml-14">
              {/* Composer Marker */}
              <div className="flex flex-col items-center gap-0 w-14 flex-shrink-0">
                <button
                  onClick={onAddUpdate}
                  className="flex items-center justify-center w-10 h-10 bg-[#013764] border-2 border-white rounded-full text-white hover:bg-[#014777] transition-colors flex-shrink-0 relative z-10 shadow-sm"
                  title="Add update"
                >
                  <span className="text-lg font-semibold leading-none">+</span>
                </button>
              </div>

              {/* Composer Input */}
              <div className="flex-1 flex items-center">
                <input
                  type="text"
                  placeholder="Add an update..."
                  className="w-full px-4 py-2.5 bg-gray-50 border border-[#e5e5e5] rounded-lg text-base text-[#303030] font-['Geist',sans-serif] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2463eb] focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Update Items */}
          {updates.map((update, idx) => (
            <div key={update.id} className="flex items-start gap-3 -ml-14">
              {/* Timeline Marker */}
              <div className="flex flex-col items-center w-14 flex-shrink-0">
                <div
                  className="flex items-center justify-center w-10 h-10 bg-[#dbe9fe] border-2 border-[#2463eb] rounded-full text-[#2463eb] font-semibold text-sm flex-shrink-0 relative z-10"
                  title={update.author}
                >
                  {update.initials || "U"}
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
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    )}
                  </div>

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
