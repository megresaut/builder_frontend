import React, { useState, useEffect } from "react";
import {
  ModalTemplate,
  ModalButtons,
} from "@/components/ui/ModalTemplate";
import { FormLayout, FormSection } from "@/components/ui/form-layout";
import { ComboboxField } from "@/components/forms";

import { MOCK_TASKS } from "@/data/tasks";

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
}

const DEFAULT_AVAILABLE_TASKS: LinkedTaskData[] = MOCK_TASKS.map((task) => ({
  id: task.id,
  name: task.title,
  status: task.status.toLowerCase().replace(" ", "_") as any,
  updatedDate: task.updated,
  updatedBy: task.assignees[0]?.name || "Unknown",
}));

export const LinkTaskModal: React.FC<LinkTaskModalProps> = ({
  open,
  onOpenChange,
  onSubmit,
  availableTasks = DEFAULT_AVAILABLE_TASKS,
}) => {
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [selectedTask, setSelectedTask] = useState<LinkedTaskData | null>(null);

  useEffect(() => {
    if (open) {
      setSelectedTaskId("");
      setSelectedTask(null);
    }
  }, [open]);

  useEffect(() => {
    if (selectedTaskId) {
      const task = availableTasks.find(
        (t) => String(t.id) === selectedTaskId
      );
      setSelectedTask(task || null);
    } else {
      setSelectedTask(null);
    }
  }, [selectedTaskId, availableTasks]);

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

  const taskOptions = availableTasks.map((task) => ({
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
          <ComboboxField
            label="Select a task"
            value={selectedTaskId}
            onChange={setSelectedTaskId}
            options={taskOptions}
            placeholder="Search tasks..."
          />

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
