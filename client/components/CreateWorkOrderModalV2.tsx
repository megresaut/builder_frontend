import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import {
  ModalTemplate,
  ModalButtons,
} from "@/components/ui/ModalTemplate";
import {
  FormLayout,
  FormSection,
  FormFieldRow,
} from "@/components/ui/form-layout";
import { SelectField } from "@/components/forms/SelectField";
import { StatusSelectField } from "@/components/forms/StatusSelectField";
import { PrioritySelectField } from "@/components/forms/PrioritySelectField";
import { TextField } from "@/components/forms/TextField";
import { DateField } from "@/components/forms/DateField";
import { TextAreaField } from "@/components/forms/TextAreaField";
import { FileUploadField } from "@/components/forms/FileUploadField";
import { UploadedFile } from "@/components/ui/attachment-uploader";
import PdfViewerModal from "@/components/PdfViewerModal";
import { usePdfViewer } from "@/hooks/usePdfViewer";
import CreateTaskModal from "@/components/CreateTaskModal";

interface CreateWorkOrderModalV2Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: "create" | "edit";
  hideTaskSelection?: boolean;
  hideSubheader?: boolean;
  initialData?: {
    task?: string;
    workOrderName?: string;
    vendor?: string;
    status?: string;
    priority?: string;
    dueDate?: Date | null;
    notes?: string;
    files?: UploadedFile[];
  };
  onDataUpdate?: (data: {
    task?: string;
    workOrderName?: string;
    vendor?: string;
    status?: string;
    priority?: string;
    dueDate?: Date | null;
    notes?: string;
    files?: UploadedFile[];
  }) => void;
}

// Base options for dropdowns
const BASE_TASKS = ["Task 1", "Task 2", "Task 3", "Task 4"];
const VENDORS = ["David Smith", "Elite HVAC", "ABC Plumbing", "Green Lawn Services", "Spark Electrical"];
const STATUSES = ["not_started", "in_progress", "completed"];
const PRIORITIES = ["low", "normal", "high"];

// Helper function to build options, ensuring initialData values are included
const buildTaskOptions = (initialTask?: string) => {
  const options = new Set(BASE_TASKS);
  if (initialTask && initialTask.trim()) {
    options.add(initialTask);
  }
  return Array.from(options).sort().map(task => ({
    value: task,
    label: task,
  }));
};

const buildVendorOptions = (initialVendor?: string) => {
  const options = new Set(VENDORS);
  if (initialVendor && initialVendor.trim()) {
    options.add(initialVendor);
  }
  return Array.from(options).sort().map(vendor => ({
    value: vendor,
    label: vendor,
  }));
};

// Fields that must be validated on submit
const REQUIRED_FIELDS = new Set([
  "task",
  "workOrderName",
]);

export default function CreateWorkOrderModalV2({
  open,
  onOpenChange,
  mode = "create",
  hideTaskSelection = false,
  hideSubheader = false,
  initialData,
  onDataUpdate,
}: CreateWorkOrderModalV2Props) {
  const [formData, setFormData] = useState({
    task: initialData?.task ?? "",
    workOrderName: initialData?.workOrderName ?? "",
    vendor: initialData?.vendor ?? "",
    status: initialData?.status ?? "not_started",
    priority: initialData?.priority ?? "normal",
    dueDate: initialData?.dueDate ?? (null as Date | null),
    notes: initialData?.notes ?? "",
    files: initialData?.files ?? ([] as UploadedFile[]),
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const pdfViewer = usePdfViewer();

  useEffect(() => {
    if (open) {
      if (mode === "edit" && initialData) {
        setFormData({
          task: initialData.task ?? "",
          workOrderName: initialData.workOrderName ?? "",
          vendor: initialData.vendor ?? "",
          status: initialData.status ?? "not_started",
          priority: initialData.priority ?? "normal",
          dueDate: initialData.dueDate ?? null,
          notes: initialData.notes ?? "",
          files: initialData.files ?? [],
        });
      } else {
        setFormData({
          task: initialData?.task ?? "",
          workOrderName: initialData?.workOrderName ?? "",
          vendor: initialData?.vendor ?? "",
          status: "not_started",
          priority: "normal",
          dueDate: initialData?.dueDate ?? null,
          notes: initialData?.notes ?? "",
          files: initialData?.files ?? [],
        });
      }
    } else {
      setFormData({
        task: "",
        workOrderName: "",
        vendor: "",
        status: "not_started",
        priority: "normal",
        dueDate: null,
        notes: "",
        files: [],
      });
      setErrors({});
      pdfViewer.closePdf();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode]);

  const handleTaskChange = (value: string) => {
    setFormData((prev) => ({ ...prev, task: value }));
    if (errors.task) {
      setErrors((prev) => ({ ...prev, task: "" }));
    }
  };

  const handleWorkOrderNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, workOrderName: e.target.value }));
    if (errors.workOrderName) {
      setErrors((prev) => ({ ...prev, workOrderName: "" }));
    }
  };

  const handleVendorChange = (value: string) => {
    setFormData((prev) => ({ ...prev, vendor: value }));
  };

  const handleStatusChange = (value: string) => {
    setFormData((prev) => ({ ...prev, status: value }));
  };

  const handlePriorityChange = (value: string) => {
    setFormData((prev) => ({ ...prev, priority: value }));
  };

  const handleDueDateChange = (date: Date | null) => {
    setFormData((prev) => ({ ...prev, dueDate: date }));
    if (errors.dueDate) {
      setErrors((prev) => ({ ...prev, dueDate: "" }));
    }
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, notes: e.target.value }));
  };

  const handleFilesAdded = (newFiles: UploadedFile[]) => {
    setFormData((prev) => ({
      ...prev,
      files: [...prev.files, ...newFiles],
    }));
  };

  const handleFileRemoved = (fileId: string) => {
    setFormData((prev) => ({
      ...prev,
      files: prev.files.filter((f) => f.id !== fileId),
    }));
  };

  const handleViewFile = (file: UploadedFile) => {
    if (file.file) {
      const url = URL.createObjectURL(file.file);
      pdfViewer.openPdf(url, file.name);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.task.trim()) {
      newErrors.task = "Task is required";
    }
    if (!formData.workOrderName.trim()) {
      newErrors.workOrderName = "Work Order Name is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConfirm = () => {
    if (validateForm()) {
      const actionLabel = mode === "edit" ? "Work Order Updated:" : "Work Order Created:";
      console.log(actionLabel, formData);

      if (onDataUpdate) {
        onDataUpdate(formData);
      }

      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const isEditMode = mode === "edit";
  const modalTitle = isEditMode ? "Update Work Order" : "Create Work Order";
  const confirmLabel = isEditMode ? "Update Work Order" : "Create Work Order";

  return (
    <>
      <ModalTemplate
        open={open}
        onOpenChange={onOpenChange}
        title={modalTitle}
        size="md"
        footer={
          <ModalButtons
            onCancel={handleCancel}
            onConfirm={handleConfirm}
            cancelLabel="Cancel"
            confirmLabel={confirmLabel}
          />
        }
      >
        <FormLayout>
          {mode === "create" && !hideTaskSelection && (
            <FormSection>
              <SelectField
                label="Task"
                required={REQUIRED_FIELDS.has("task")}
                value={formData.task}
                onChange={handleTaskChange}
                placeholder="Select Task"
                options={buildTaskOptions(initialData?.task)}
                error={errors.task}
              />
              <button
                type="button"
                onClick={() => setIsCreateTaskModalOpen(true)}
                className="flex items-center gap-2 text-[#2463eb] text-sm font-medium hover:underline mt-2"
              >
                <Plus className="w-4 h-4" />
                Create Task
              </button>
            </FormSection>
          )}

          <FormSection title="Work Order Details">
            <FormFieldRow columns={2}>
              <TextField
                label="Work Order Name"
                required={REQUIRED_FIELDS.has("workOrderName")}
                value={formData.workOrderName}
                onChange={handleWorkOrderNameChange}
                placeholder="Type Work Order Name"
                error={errors.workOrderName}
              />
              <SelectField
                label="Vendor"
                value={formData.vendor}
                onChange={handleVendorChange}
                placeholder="Select a Vendor"
                options={buildVendorOptions(initialData?.vendor)}
              />
            </FormFieldRow>

            <FormFieldRow columns={2}>
              <StatusSelectField
                label="Status"
                value={formData.status}
                onChange={handleStatusChange}
              />
              <PrioritySelectField
                label="Priority"
                value={formData.priority}
                onChange={handlePriorityChange}
              />
            </FormFieldRow>

            <DateField
              label="Due Date"
              value={formData.dueDate}
              onChange={handleDueDateChange}
              placeholder="mm/dd/yyyy"
              error={errors.dueDate}
            />

            <TextAreaField
              label="Notes"
              value={formData.notes}
              onChange={handleNotesChange}
              placeholder="Notes for your work Order"
              autoGrow
            />

            <FileUploadField
              label="Attachments"
              files={formData.files}
              onFilesAdded={handleFilesAdded}
              onFileRemoved={handleFileRemoved}
              onViewFile={handleViewFile}
              accept=".pdf,.jpg,.jpeg,.png"
              maxSize={10 * 1024 * 1024}
            />
          </FormSection>
        </FormLayout>
      </ModalTemplate>

      <PdfViewerModal
        open={pdfViewer.isOpen}
        onOpenChange={(open) => {
          if (!open) pdfViewer.closePdf();
        }}
        title={pdfViewer.title || "Document"}
        url={pdfViewer.url}
      />

      <CreateTaskModal
        open={isCreateTaskModalOpen}
        onOpenChange={setIsCreateTaskModalOpen}
        variant="compact"
        onTaskCreated={(taskData) => {
          setFormData((prev) => ({
            ...prev,
            task: taskData.title,
          }));
          setIsCreateTaskModalOpen(false);
        }}
      />
    </>
  );
}
