import React, { ReactNode, useLayoutEffect, useRef, useState } from "react";
import SectionCard from "@/components/SectionCard";
import PersonAvatars from "@/components/PersonAvatars";
import { DotsIcon, PlusIcon, UserIcon } from "@/components/icons";

export interface AttachmentFile {
  name: string;
  url: string;
  preview?: string;
}

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
  attachments?: AttachmentFile[];
  onAttachmentClick?: (file: AttachmentFile) => void;
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
  const containerRef = useRef<HTMLDivElement | null>(null);
  const composerButtonRef = useRef<HTMLButtonElement | null>(null);
  const lastMarkerRef = useRef<HTMLDivElement | null>(null);
  const [rail, setRail] = useState<{ top: number; height: number } | null>(null);

  useLayoutEffect(() => {
    if (!onAddUpdate || updates.length === 0) {
      setRail(null);
      return;
    }

    const compute = () => {
      const container = containerRef.current;
      const startEl = composerButtonRef.current;
      const endEl = lastMarkerRef.current;

      if (!container || !startEl || !endEl) {
        setRail(null);
        return;
      }

      const containerRect = container.getBoundingClientRect();
      const startRect = startEl.getBoundingClientRect();
      const endRect = endEl.getBoundingClientRect();

      const startCenter = startRect.top - containerRect.top + startRect.height / 2;
      const endCenter = endRect.top - containerRect.top + endRect.height / 2;

      const top = Math.min(startCenter, endCenter);
      const height = Math.max(0, Math.abs(endCenter - startCenter));

      setRail({ top, height });
    };

    const scheduleCompute = () => {
      window.requestAnimationFrame(compute);
    };

    scheduleCompute();

    const container = containerRef.current;
    const startEl = composerButtonRef.current;
    const endEl = lastMarkerRef.current;

    const cleanupFns: Array<() => void> = [];

    if (typeof window !== "undefined") {
      window.addEventListener("resize", scheduleCompute);
      cleanupFns.push(() => window.removeEventListener("resize", scheduleCompute));
    }

    if (container && "ResizeObserver" in window) {
      const ro = new ResizeObserver(scheduleCompute);
      ro.observe(container);
      if (startEl) ro.observe(startEl);
      if (endEl) ro.observe(endEl);
      cleanupFns.push(() => ro.disconnect());
    }

    return () => {
      cleanupFns.forEach((fn) => fn());
    };
  }, [onAddUpdate, updates.length]);

  return (
    <SectionCard title="Updates">
      {/* Updates List Container - relative so rail can be absolutely positioned */}
      <div ref={containerRef} className="relative pl-14">
        {/* Continuous Timeline Rail - from composer to last circle */}
        {onAddUpdate && updates.length > 0 && rail && (
          <div
            className="absolute left-7 -translate-x-1/2 w-1 bg-gradient-to-b from-[#d4e3f7] to-[#e5e5e5]"
            style={{ top: `${rail.top}px`, height: `${rail.height}px` }}
          />
        )}

        {/* Updates Stack */}
        <div className="flex flex-col gap-4">
          {/* Composer Row */}
          {onAddUpdate && (
            <div className="flex items-center gap-3 -ml-14">
              {/* Composer Marker */}
              <div className="flex flex-col items-center gap-0 w-14 flex-shrink-0">
                <button
                  ref={composerButtonRef}
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
                  ref={idx === updates.length - 1 ? lastMarkerRef : undefined}
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
              >

                {/* Card Content */}
                <div className="px-4 py-3 flex flex-col gap-2">
                  {/* Header Row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-sm text-[#303030] leading-snug">
                        <PersonAvatars
                          people={[
                            {
                              name: update.author,
                              initials: update.initials || update.author.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2),
                            },
                          ]}
                          type="assignee"
                          size="sm"
                        />
                        <div className="flex-1 truncate">
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

                  {/* Body (divider sits between header and everything below) */}
                  {(update.fieldsDisplay || update.details || (update.attachments && update.attachments.length > 0)) && (
                    <div className="border-t border-[#e5e5e5] pt-2 mt-1">
                      {update.fieldsDisplay && <div>{update.fieldsDisplay}</div>}

                      {update.details && (
                        <div className={update.fieldsDisplay ? "mt-3" : ""}>
                          {update.details}
                        </div>
                      )}

                      {/* Attachments with Previews */}
                      {update.attachments && update.attachments.length > 0 && (
                        <div className={(update.fieldsDisplay || update.details) ? "flex flex-col gap-2 mt-3" : "flex flex-col gap-2"}>
                          {update.attachments.map((file, idx) => (
                            <div
                              key={idx}
                              onClick={() => update.onAttachmentClick?.(file)}
                              className="flex items-start gap-2 p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100 transition-colors"
                              title="Click to view"
                            >
                              {file.preview && (
                                <div className="flex-shrink-0 w-14 h-14 rounded overflow-hidden border border-[#e5e5e5]">
                                  <img
                                    src={file.preview}
                                    alt={file.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="text-xs text-[#303030] font-medium truncate">
                                  {file.name}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
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
