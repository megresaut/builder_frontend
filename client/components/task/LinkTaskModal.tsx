import React, { useState, useEffect } from "react";
import {
  ModalTemplate,
  ModalButtons,
} from "@/components/ui/ModalTemplate";
import { FormLayout, FormSection } from "@/components/ui/form-layout";
import { ComboboxField } from "@/components/forms";
import { fetchJSON } from "@/api/fetchJSON";

export interface LinkedTaskData {
  id: string | number;
  name: string;
  status: "not_started" | "in_progress" | "completed";
  updatedDate: string;
  updatedBy: string;
}

interface LinkTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (linkedTask: LinkedTaskData) => void;
  availableTasks?: LinkedTaskData[];
  currentTaskId?: string | number;
  alreadyLinkedTaskIds?: (string | number)[];
}

interface ApiTask {
  id: number;
  name: string;
  status: string;
  priority: string;
  last_updated: string;
  assignees: Array<{ id: number; name: string; email: string }>;
}

export const LinkTaskModal: React.FC<LinkTaskModalProps> = ({
  open,
  onOpenChange,
  onSubmit,
  availableTasks,
  currentTaskId,
  alreadyLinkedTaskIds = [],
}) => {
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [selectedTask, setSelectedTask] = useState<LinkedTaskData | null>(null);
  const [tasks, setTasks] = useState<LinkedTaskData[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);

  // Fetch tasks from API when modal opens
  useEffect(() => {
    if (open && !availableTasks) {
      setIsLoadingTasks(true);
      fetchJSON("/maintenance/tasks")
        .then((apiTasks: ApiTask[]) => {
          // Filter out current task and already linked tasks, then map to LinkedTaskData format
          const alreadyLinkedIdsSet = new Set(alreadyLinkedTaskIds.map(id => String(id)));
          const mappedTasks = apiTasks
            .filter((task) => 
              String(task.id) !== String(currentTaskId) && 
              !alreadyLinkedIdsSet.has(String(task.id))
            )
            .map((task) => {
              // Map backend status to frontend status
              const statusMap: Record<string, "not_started" | "in_progress" | "completed"> = {
                open: "not_started",
                not_started: "not_started",
                in_progress: "in_progress",
                pending_vendor: "in_progress",
                scheduled: "in_progress",
                completed: "completed",
                closed: "completed",
                cancelled: "completed",
              };
              
              const frontendStatus = statusMap[task.status.toLowerCase()] || "not_started";
              
              // Format date
              const updatedDate = task.last_updated
                ? new Date(task.last_updated).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "Unknown";
              
              return {
                id: task.id,
                name: task.name,
                status: frontendStatus,
                updatedDate,
                updatedBy: task.assignees?.[0]?.name || "Unknown",
              };
            });
          setTasks(mappedTasks);
        })
        .catch((error) => {
          console.error("Error fetching tasks:", error);
          setTasks([]);
        })
        .finally(() => {
          setIsLoadingTasks(false);
        });
    } else if (availableTasks) {
      // Filter out already linked tasks from availableTasks
      const alreadyLinkedIdsSet = new Set(alreadyLinkedTaskIds.map(id => String(id)));
      const filteredTasks = availableTasks.filter(
        (task) => !alreadyLinkedIdsSet.has(String(task.id))
      );
      setTasks(filteredTasks);
    }
  }, [open, availableTasks, currentTaskId, alreadyLinkedTaskIds]);

  useEffect(() => {
    if (open) {
      setSelectedTaskId("");
      setSelectedTask(null);
    }
  }, [open]);

  useEffect(() => {
    if (selectedTaskId) {
      const task = tasks.find(
        (t) => String(t.id) === selectedTaskId
      );
      setSelectedTask(task || null);
    } else {
      setSelectedTask(null);
    }
  }, [selectedTaskId, tasks]);

  const handleSave = () => {
    if (!selectedTask) return;
    onSubmit(selectedTask);
    setSelectedTaskId("");
    setSelectedTask(null);
    onOpenChange(false);
  };

  const handleCancel = () => {
    setSelectedTaskId("");
    setSelectedTask(null);
    onOpenChange(false);
  };

  const taskOptions = tasks.map((task) => ({
    value: String(task.id),
    label: task.name,
  }));

  return (
    <ModalTemplate
      open={open}
      onOpenChange={(openState) => {
        if (!openState) {
          setSelectedTaskId("");
          setSelectedTask(null);
        }
        onOpenChange(openState);
      }}
      title="Link Task"
      size="sm"
      footer={
        <ModalButtons
          onCancel={handleCancel}
          onConfirm={handleSave}
          cancelLabel="Cancel"
          confirmLabel="Link"
          confirmDisabled={!selectedTask}
        />
      }
    >
      <FormLayout>
        <FormSection showDivider={false}>
          {isLoadingTasks ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
              <span className="ml-2 text-sm text-gray-600">Loading tasks...</span>
            </div>
          ) : (
            <ComboboxField
              label="Select a task"
              value={selectedTaskId}
              onChange={setSelectedTaskId}
              options={taskOptions}
              placeholder="Search tasks..."
            />
          )}

          {selectedTask && (
            <div className="mt-4 p-3 bg-[#f9f9f9] border border-[#e5e5e5] rounded-lg">
              <div className="text-sm text-[#303030] font-medium mb-2">
                {selectedTask.name}
              </div>
              <div className="flex flex-col gap-1 text-xs text-[#71717A]">
                <div>
                  <span className="font-medium">Status:</span>{" "}
                  {selectedTask.status === "not_started"
                    ? "Not Started"
                    : selectedTask.status === "in_progress"
                      ? "In Progress"
                      : "Completed"}
                </div>
                <div>
                  <span className="font-medium">Updated:</span>{" "}
                  {selectedTask.updatedDate}
                </div>
                <div>
                  <span className="font-medium">By:</span> {selectedTask.updatedBy}
                </div>
              </div>
            </div>
          )}
        </FormSection>
      </FormLayout>
    </ModalTemplate>
  );
};

export default LinkTaskModal;
