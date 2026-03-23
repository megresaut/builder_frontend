import { useState, useEffect, useMemo } from "react";
import {
  ModalTemplate,
  ModalButtons,
} from "@/components/ui/ModalTemplate";
import { StatusBadge } from "@/components/StatusBadge";
import { cn } from "@/lib/utils";

interface MergeFTOItem {
  id: number;
  name: string;
  description: string;
  property: string;
  property_id: number | null;
  dueDate: string;
  priority: "low" | "normal" | "high";
  status: string;
  timesheetStatus: string;
  amount: number;
  unit?: string;
  fieldTeam: Array<{
    id: number;
    initials: string;
    name: string;
    color: string;
  }>;
  hours?: number;
  task_id?: number | null;
  bill_id?: number | null;
  bill_draft_id?: number | null;
  form_submission_status?: "none" | "partial" | "complete";
}

interface MergeFTOsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedFTOs: MergeFTOItem[];
  onConfirmMerge: (primaryId: number, mergedIds: number[]) => void;
}

// Inline SVG icons to avoid import dependencies
const InfoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2463eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4" />
    <path d="M12 8h.01" />
  </svg>
);

const WarningIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
  </svg>
);

const DangerIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
    <circle cx="12" cy="12" r="10" />
    <path d="m15 9-6 6" />
    <path d="m9 9 6 6" />
  </svg>
);

export default function MergeFTOsModal({
  open,
  onOpenChange,
  selectedFTOs,
  onConfirmMerge,
}: MergeFTOsModalProps) {
  const [primaryId, setPrimaryId] = useState<number | null>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!open) {
      setPrimaryId(null);
    } else if (selectedFTOs.length > 0) {
      setPrimaryId(selectedFTOs[0].id);
    }
  }, [open, selectedFTOs]);

  // --- Conflict detection ---

  const taskConflict = useMemo(() => {
    const ftosWithTasks = selectedFTOs.filter((f) => f.task_id != null);
    if (ftosWithTasks.length <= 1) return null;

    const uniqueTaskIds = new Set(ftosWithTasks.map((f) => f.task_id));
    if (uniqueTaskIds.size <= 1) return null; // all same task — no conflict

    return {
      type: "different_tasks" as const,
      ftos: ftosWithTasks,
    };
  }, [selectedFTOs]);

  const billWarnings = useMemo(() => {
    return selectedFTOs.filter(
      (f) => f.bill_id != null || f.bill_draft_id != null
    );
  }, [selectedFTOs]);

  // Non-primary FTOs that have a task_id the primary doesn't share
  const taskLossWarnings = useMemo(() => {
    if (!primaryId) return [];
    const primary = selectedFTOs.find((f) => f.id === primaryId);
    if (!primary) return [];

    return selectedFTOs.filter(
      (f) =>
        f.id !== primaryId &&
        f.task_id != null &&
        f.task_id !== primary.task_id
    );
  }, [selectedFTOs, primaryId]);

  // Merge summary stats
  const mergeStats = useMemo(() => {
    const nonPrimary = selectedFTOs.filter((f) => f.id !== primaryId);
    return {
      totalHours: nonPrimary.reduce((sum, f) => sum + (f.hours ?? 0), 0),
      totalAmount: nonPrimary.reduce((sum, f) => sum + f.amount, 0),
      submissionCount: nonPrimary.filter(
        (f) => f.form_submission_status && f.form_submission_status !== "none"
      ).length,
    };
  }, [selectedFTOs, primaryId]);

  const hasBlockingConflict = taskConflict !== null;

  const handleConfirm = () => {
    if (!primaryId || hasBlockingConflict) return;
    const mergedIds = selectedFTOs
      .filter((fto) => fto.id !== primaryId)
      .map((fto) => fto.id);
    onConfirmMerge(primaryId, mergedIds);
  };

  const priorityColor = (p: string) => {
    if (p === "high") return "#d97706";
    if (p === "normal") return "#2463eb";
    return "#059669";
  };

  return (
    <ModalTemplate
      open={open}
      onOpenChange={onOpenChange}
      title="Merge Field Team Orders"
      size="lg"
      footer={
        <ModalButtons
          onCancel={() => onOpenChange(false)}
          onConfirm={handleConfirm}
          cancelLabel="Cancel"
          confirmLabel="Merge FTOs"
          confirmDisabled={!primaryId || hasBlockingConflict}
        />
      }
    >
      <div className="flex flex-col gap-4">
        {/* Instructions */}
        <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
          <InfoIcon />
          <div className="text-sm text-blue-900">
            <span className="font-medium">Select a primary FTO</span> to keep.
            All other selected FTOs will be merged into it — their submissions,
            hours, expenses, and attachments will be transferred to the primary.
            Merged FTOs will be deleted.
          </div>
        </div>

        {/* BLOCKING: Different task conflict */}
        {taskConflict && (
          <div className="flex items-start gap-3 p-3 rounded-lg bg-red-50 border border-red-300">
            <DangerIcon />
            <div className="text-sm text-red-900">
              <span className="font-medium">Cannot merge — different tasks linked.</span>{" "}
              These FTOs are associated with different tasks
              ({taskConflict.ftos.map((f) => `FTO #${f.id} → Task #${f.task_id}`).join(", ")}).
              Merging would break one of the task associations. Please unlink
              a task first, or only merge FTOs that share the same task.
            </div>
          </div>
        )}

        {/* WARNING: Bill association */}
        {billWarnings.length > 0 && (
          <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
            <WarningIcon />
            <div className="text-sm text-amber-900">
              <span className="font-medium">Bill association detected.</span>{" "}
              {billWarnings.map((f) => `FTO #${f.id}`).join(", ")}{" "}
              {billWarnings.length === 1 ? "has" : "have"} a linked bill
              {billWarnings.length > 1 ? "/draft" : " or draft"}.
              The non-primary FTO's bill link will be lost on merge.
            </div>
          </div>
        )}

        {/* WARNING: Task will be unlinked from non-primary */}
        {!taskConflict && taskLossWarnings.length > 0 && (
          <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
            <WarningIcon />
            <div className="text-sm text-amber-900">
              <span className="font-medium">Task link will be lost.</span>{" "}
              {taskLossWarnings.map((f) => `FTO #${f.id} (Task #${f.task_id})`).join(", ")}{" "}
              {taskLossWarnings.length === 1 ? "is" : "are"} linked to a task
              that the primary FTO is not. That task will lose its FTO
              association after merge.
            </div>
          </div>
        )}

        {/* FTO Cards */}
        <div className="flex flex-col gap-3 max-h-[50vh] overflow-y-auto pr-1">
          {selectedFTOs.map((fto) => {
            const isPrimary = primaryId === fto.id;
            const hasTask = fto.task_id != null;
            const hasBill = fto.bill_id != null || fto.bill_draft_id != null;
            const hasSubmissions =
              fto.form_submission_status &&
              fto.form_submission_status !== "none";

            return (
              <button
                key={fto.id}
                type="button"
                onClick={() => !hasBlockingConflict && setPrimaryId(fto.id)}
                className={cn(
                  "w-full text-left rounded-lg border-2 p-4 transition-all",
                  hasBlockingConflict && "opacity-60 cursor-not-allowed",
                  isPrimary
                    ? "border-[#013764] bg-[#f0f6fc] shadow-sm"
                    : "border-gray-200 bg-white hover:border-gray-300"
                )}
              >
                {/* Primary badge + FTO ID + association tags */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Radio indicator */}
                    <div
                      className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                        isPrimary ? "border-[#013764]" : "border-gray-300"
                      )}
                    >
                      {isPrimary && (
                        <div className="w-2.5 h-2.5 rounded-full bg-[#013764]" />
                      )}
                    </div>
                    <span className="text-sm font-medium text-gray-500">
                      FTO #{fto.id}
                    </span>
                    {isPrimary && (
                      <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-[#013764] text-white">
                        Primary
                      </span>
                    )}
                    {hasTask && (
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                        Task #{fto.task_id}
                      </span>
                    )}
                    {hasBill && (
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700 border border-green-200">
                        Bill linked
                      </span>
                    )}
                    {hasSubmissions && (
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                        Has submissions
                      </span>
                    )}
                  </div>
                  {!isPrimary && !hasBlockingConflict && (
                    <span className="text-xs text-gray-400 font-medium shrink-0 ml-2">
                      Will be merged
                    </span>
                  )}
                </div>

                {/* FTO Details Grid */}
                <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                  {/* Name */}
                  <div className="col-span-2">
                    <span className="text-xs font-medium text-gray-500 block mb-0.5">
                      Name
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {fto.name}
                    </span>
                  </div>

                  {/* Property */}
                  <div>
                    <span className="text-xs font-medium text-gray-500 block mb-0.5">
                      Property
                    </span>
                    <span className="text-sm text-gray-900">{fto.property}</span>
                  </div>

                  {/* Unit */}
                  <div>
                    <span className="text-xs font-medium text-gray-500 block mb-0.5">
                      Unit
                    </span>
                    <span className="text-sm text-gray-900">
                      {fto.unit || "\u2014"}
                    </span>
                  </div>

                  {/* Date of Work */}
                  <div>
                    <span className="text-xs font-medium text-gray-500 block mb-0.5">
                      Date of Work
                    </span>
                    <span className="text-sm text-gray-900">{fto.dueDate}</span>
                  </div>

                  {/* Priority */}
                  <div>
                    <span className="text-xs font-medium text-gray-500 block mb-0.5">
                      Priority
                    </span>
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: priorityColor(fto.priority) }}
                      />
                      <span className="text-sm text-gray-900 capitalize">
                        {fto.priority}
                      </span>
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <span className="text-xs font-medium text-gray-500 block mb-0.5">
                      FTO Status
                    </span>
                    <StatusBadge status={fto.status} variant="fto-status" />
                  </div>

                  {/* Timesheet */}
                  <div>
                    <span className="text-xs font-medium text-gray-500 block mb-0.5">
                      Timesheet
                    </span>
                    <StatusBadge
                      status={fto.timesheetStatus}
                      variant="timesheet-status"
                    />
                  </div>

                  {/* Hours */}
                  <div>
                    <span className="text-xs font-medium text-gray-500 block mb-0.5">
                      Hours
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {fto.hours != null ? `${fto.hours}h` : "\u2014"}
                    </span>
                  </div>

                  {/* Amount */}
                  <div>
                    <span className="text-xs font-medium text-gray-500 block mb-0.5">
                      Amount
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      ${fto.amount}
                    </span>
                  </div>

                  {/* Field Team */}
                  <div>
                    <span className="text-xs font-medium text-gray-500 block mb-0.5">
                      Field Team
                    </span>
                    <div className="flex items-center gap-1.5">
                      {fto.fieldTeam.length > 0 ? (
                        fto.fieldTeam.map((member, idx) => (
                          <div
                            key={idx}
                            className={`w-6 h-6 rounded-full ${member.color} flex items-center justify-center text-white text-[10px] font-semibold border border-gray-300`}
                            title={member.name}
                          >
                            {member.initials}
                          </div>
                        ))
                      ) : (
                        <span className="text-sm text-gray-400">{"\u2014"}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Description (if present) */}
                {fto.description && (
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <span className="text-xs font-medium text-gray-500 block mb-0.5">
                      Description
                    </span>
                    <span className="text-sm text-gray-700 line-clamp-2">
                      {fto.description}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Merge Summary */}
        {primaryId && selectedFTOs.length > 1 && !hasBlockingConflict && (
          <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
              <circle cx="18" cy="18" r="3" />
              <circle cx="6" cy="6" r="3" />
              <path d="M6 21V9a9 9 0 0 0 9 9" />
            </svg>
            <div className="text-sm text-gray-700">
              <span className="font-medium">Merge summary:</span>{" "}
              <span className="font-medium">
                {selectedFTOs.length - 1} FTO{selectedFTOs.length - 1 > 1 ? "s" : ""}
              </span>{" "}
              will be merged into{" "}
              <span className="font-medium">
                FTO #{primaryId} ({selectedFTOs.find((f) => f.id === primaryId)?.name})
              </span>.
              {(mergeStats.totalHours > 0 || mergeStats.totalAmount > 0) && (
                <>
                  {" "}Transferring
                  {mergeStats.totalHours > 0 && (
                    <> <span className="font-medium">{mergeStats.totalHours}h</span></>
                  )}
                  {mergeStats.totalHours > 0 && mergeStats.totalAmount > 0 && " and"}
                  {mergeStats.totalAmount > 0 && (
                    <> <span className="font-medium">${mergeStats.totalAmount}</span></>
                  )}
                  {" "}in {mergeStats.submissionCount > 0 ? `${mergeStats.submissionCount} submission${mergeStats.submissionCount > 1 ? "s" : ""}` : "data"}.
                </>
              )}
              {" "}Merged FTOs will be permanently deleted.
            </div>
          </div>
        )}
      </div>
    </ModalTemplate>
  );
}
