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
 * TaskUpdatesTimeline
 *
 * Displays a timeline of task updates with author, action, and timestamp.
 * Composed using SectionCard.
 */
export const TaskUpdatesTimeline: React.FC<TaskUpdatesTimelineProps> = ({
  updates,
  onAddUpdate,
}) => {
  return (
    <SectionCard
      title="Updates"
      actions={
        onAddUpdate && (
          <button
            onClick={onAddUpdate}
            className="flex items-center justify-center w-10 h-10 bg-[#013764] border border-white rounded-full text-white hover:bg-[#014777] transition-colors"
          >
            <span className="text-lg font-semibold">+</span>
          </button>
        )
      }
    >
      <div className="flex gap-4">
        {/* Timeline Icons */}
        <div className="flex flex-col items-center gap-2">
          {onAddUpdate && (
            <>
              <button className="flex items-center justify-center w-10 h-10 bg-[#013764] border border-white rounded-full text-white hover:bg-[#014777] transition-colors">
                <span className="text-lg font-semibold">+</span>
              </button>
              <div className="w-1 h-12 bg-gray-200"></div>
            </>
          )}

          {updates.map((update, idx) => (
            <React.Fragment key={update.id}>
              <div className="flex items-center justify-center w-10 h-10 bg-[#dbe9fe] border border-[#2463eb] rounded-full text-[#2463eb] font-semibold text-sm flex-shrink-0">
                {update.initials || "U"}
              </div>
              {idx < updates.length - 1 && (
                <div className="w-1 h-12 bg-gray-200"></div>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Update Items */}
        <div className="flex flex-col flex-1 gap-3">
          {onAddUpdate && (
            <div className="px-4 py-2.5 bg-gray-50 border border-[#e5e5e5] rounded-lg text-base text-[#303030] font-['Geist',sans-serif]">
              Update task
            </div>
          )}

          {updates.map((update) => (
            <div
              key={update.id}
              className="flex items-start gap-3 px-4 py-3 bg-white border border-[#e5e5e5] rounded-lg"
            >
              <div className="flex items-center justify-center w-10 h-10 bg-white border border-[#2463eb] rounded-full text-base text-[#2463eb] font-semibold flex-shrink-0">
                {update.initials || "U"}
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <div className="text-sm text-[#303030]">
                  <span className="font-medium">{update.author}</span> {update.action}
                  {update.actionValue && (
                    <>
                      {" "}
                      <span className="text-[#2463eb] font-medium">
                        {update.actionValue}
                      </span>
                    </>
                  )}
                </div>
                <div className="text-xs text-[#a1a1a9] mt-1">{update.timestamp}</div>
                {update.details && (
                  <div className="mt-3 pt-3 border-t border-[#e5e5e5]">
                    {update.details}
                  </div>
                )}
              </div>
              {update.moreOptions && (
                <button
                  onClick={update.moreOptions}
                  className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </SectionCard>
  );
};

export default TaskUpdatesTimeline;
