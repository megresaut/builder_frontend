import { useState, useEffect, useRef, useCallback } from "react";
import { Plus } from "lucide-react";
import { ModalTemplate, ModalButtons } from "@/components/ui/ModalTemplate";
import {
  FormLayout,
  FormSection,
  FormFieldRow,
} from "@/components/ui/form-layout";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { fetchJSON } from "@/api/fetchJSON";
import AIGeneratedBanner from "@/components/AIGeneratedBanner";
import { FieldShell } from "@/components/forms/FieldShell";
import { useAuth } from "@/auth/useAuth";

/** When provided (e.g. property-level create), task dropdown shows only these tasks and selection supplies taskId for create. */
export interface TaskOption {
  id: number;
  label: string;
}

interface CreateWorkOrderModalV2Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: "create" | "edit";
  hideTaskSelection?: boolean;
  hideSubheader?: boolean;
  taskId?: number; // Task ID for creating work order (used when taskOptions not provided)
  propertyId?: number; // Property ID for creating work order
  /** Property-scoped tasks for dropdown. When set, task field is not autofilled and only these tasks are shown. */
  taskOptions?: TaskOption[];
  workOrderId?: number; // Work Order ID for updating work order (required in edit mode)
  requestedBy?: number; // User ID of the requester (optional)
  initialData?: {
    task?: string;
    workOrderName?: string;
    vendor?: string; // Vendor name (for backward compatibility)
    vendorId?: string | number; // Vendor ID (preferred)
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
  onWorkOrderCreated?: (workOrder: any) => void; // Callback when work order is successfully created
  onWorkOrderUpdated?: (workOrder: any) => void; // Callback when work order is successfully updated
}

// Base options for dropdowns
const BASE_TASKS = ["Task 1", "Task 2", "Task 3", "Task 4"];
const STATUSES = ["not_started", "in_progress", "completed"];
const PRIORITIES = ["low", "normal", "high"];

// Vendor interface
interface Vendor {
  id: number;
  name: string;
  primary_email?: string;
  phone?: string;
  notes?: string;
}

// Helper function to build options, ensuring initialData values are included
const buildTaskOptions = (initialTask?: string) => {
  const options = new Set(BASE_TASKS);
  if (initialTask && initialTask.trim()) {
    options.add(initialTask);
  }
  return Array.from(options)
    .sort()
    .map((task) => ({
      value: task,
      label: task,
    }));
};

const buildVendorOptions = (vendors: Vendor[], initialVendorId?: number) => {
  return vendors.map((vendor) => ({
    value: vendor.id.toString(),
    label: vendor.name,
  }));
};

// Fields that must be validated on submit
const REQUIRED_FIELDS = new Set(["task", "workOrderName"]);

// Convert frontend status value to backend status value
const convertStatusToBackend = (
  frontendStatus: "not_started" | "in_progress" | "completed"
): string => {
  // Frontend: not_started -> Backend: new (for new work orders)
  // Frontend: in_progress -> Backend: in_progress
  // Frontend: completed -> Backend: completed
  const statusMap: Record<
    "not_started" | "in_progress" | "completed",
    string
  > = {
    not_started: "new",
    in_progress: "in_progress",
    completed: "completed",
  };
  return statusMap[frontendStatus] || "new";
};

// Convert frontend priority value to backend priority value
const convertPriorityToBackend = (
  frontendPriority: "low" | "normal" | "high" | "urgent"
): string => {
  // Frontend: normal -> Backend: medium
  // Frontend: low -> Backend: low
  // Frontend: high -> Backend: high
  // Frontend: urgent -> Backend: urgent
  const priorityMap: Record<"low" | "normal" | "high" | "urgent", string> = {
    low: "low",
    normal: "medium",
    high: "high",
    urgent: "urgent",
  };
  return priorityMap[frontendPriority] || "medium";
};

// Convert backend status value to frontend status value
const convertStatusFromBackend = (
  backendStatus: string
): "not_started" | "in_progress" | "completed" => {
  // Backend: new -> Frontend: not_started
  // Backend: in_progress -> Frontend: in_progress
  // Backend: completed -> Frontend: completed
  const statusMap: Record<string, "not_started" | "in_progress" | "completed"> = {
    new: "not_started",
    in_progress: "in_progress",
    completed: "completed",
  };
  return statusMap[backendStatus] || "not_started";
};

// Convert backend priority value to frontend priority value
const convertPriorityFromBackend = (
  backendPriority: string
): "low" | "normal" | "high" | "urgent" => {
  // Backend: low -> Frontend: low
  // Backend: medium -> Frontend: normal
  // Backend: high -> Frontend: high
  // Backend: urgent -> Frontend: urgent
  const priorityMap: Record<string, "low" | "normal" | "high" | "urgent"> = {
    low: "low",
    medium: "normal",
    normal: "normal", // Handle both "medium" and "normal" for safety
    high: "high",
    urgent: "urgent",
  };
  return priorityMap[backendPriority] || "normal";
};

// Upload a file to the maintenance uploads endpoint
const uploadFile = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);

  // const API_BASE = "http://localhost:8080";
  const API_BASE = "/api";
  const response = await fetch(`${API_BASE}/maintenance/uploads`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`File upload failed: ${response.status} ${text}`);
  }

  const data = await response.json();
  // The endpoint returns storage_path, which we use as temp_object_key
  return data.storage_path;
};

export default function CreateWorkOrderModalV2({
  open,
  onOpenChange,
  mode = "create",
  hideTaskSelection = false,
  hideSubheader = false,
  taskId,
  propertyId,
  taskOptions,
  workOrderId,
  requestedBy,
  initialData,
  onDataUpdate,
  onWorkOrderCreated,
  onWorkOrderUpdated,
}: CreateWorkOrderModalV2Props) {
  const [formData, setFormData] = useState<{
    task: string;
    workOrderName: string;
    vendorId: string; // Changed from vendor (string) to vendorId (string for SelectField)
    status: "not_started" | "in_progress" | "completed";
    priority: "low" | "normal" | "high" | "urgent";
    dueDate: Date | null;
    notes: string;
    files: UploadedFile[];
  }>({
    task: initialData?.task ?? "",
    workOrderName: initialData?.workOrderName ?? "",
    vendorId: "", // Will be set from initialData if vendor ID is provided
    status: (initialData?.status as
      | "not_started"
      | "in_progress"
      | "completed") ?? "not_started",
    priority: (initialData?.priority as
      | "low"
      | "normal"
      | "high"
      | "urgent") ?? "normal",
    dueDate: initialData?.dueDate ?? (null as Date | null),
    notes: initialData?.notes ?? "",
    files: initialData?.files ?? ([] as UploadedFile[]),
  });

  const { userId } = useAuth();
  const vendorPageSize = 50;
  const vendorRequestIdRef = useRef(0);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [vendorSearch, setVendorSearch] = useState("");
  const [vendorOffset, setVendorOffset] = useState(0);
  const [vendorHasMore, setVendorHasMore] = useState(true);
  const [vendorLoading, setVendorLoading] = useState(false);
  const [isVendorDropdownOpen, setIsVendorDropdownOpen] = useState(false);
  const vendorSearchInputRef = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const pdfViewer = usePdfViewer();

  // Server-filtered vendor results
  const filteredVendors = vendors;

  const fetchVendorsPage = useCallback(
    async (search: string, offset: number, append: boolean) => {
      const requestId = ++vendorRequestIdRef.current;
      setVendorLoading(true);

      try {
        const params = new URLSearchParams();
        params.set("limit", vendorPageSize.toString());
        if (offset > 0) params.set("offset", offset.toString());

        const trimmed = search.trim();
        if (trimmed) params.set("search", trimmed);

        const vendorList = await fetchJSON(`/vendors?${params.toString()}`);

        if (requestId !== vendorRequestIdRef.current) return;

        setVendors((prev) => (append ? [...prev, ...vendorList] : vendorList));
        setVendorHasMore(vendorList.length === vendorPageSize);
        setVendorOffset(offset + vendorList.length);
      } catch (err) {
        if (requestId !== vendorRequestIdRef.current) return;
        console.error("Failed to load vendors:", err);
        if (!append) {
          setVendors([]);
        }
        setVendorHasMore(false);
      } finally {
        if (requestId === vendorRequestIdRef.current) {
          setVendorLoading(false);
        }
      }
    },
    [vendorPageSize],
  );

  useEffect(() => {
    if (!open) return;
    fetchVendorsPage("", 0, false);
  }, [open, fetchVendorsPage]);

  useEffect(() => {
    if (!isVendorDropdownOpen) return;

    const timeoutId = window.setTimeout(() => {
      fetchVendorsPage(vendorSearch, 0, false);
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [vendorSearch, isVendorDropdownOpen, fetchVendorsPage]);

  useEffect(() => {
    if (!isVendorDropdownOpen) return;
    const timeoutId = window.setTimeout(() => {
      vendorSearchInputRef.current?.focus();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [isVendorDropdownOpen]);

  useEffect(() => {
    if (!initialData?.vendor || vendorSearch.trim()) return;
    setVendors((prev) => {
      if (prev.some((vendor) => vendor.name === initialData.vendor)) {
        return prev;
      }
      return [
        {
          id: Number(formData.vendorId) || -1,
          name: initialData.vendor,
          phone: "",
          email: "",
          notes: "",
        },
        ...prev,
      ];
    });
  }, [initialData?.vendor, formData.vendorId, vendorSearch]);

  // When vendorId is set (e.g. from AI draft) but vendor isn't in the loaded list, fetch it
  useEffect(() => {
    if (!formData.vendorId || vendorSearch.trim()) return;
    const vid = Number(formData.vendorId);
    if (isNaN(vid) || vid <= 0) return;
    if (vendors.some((v) => v.id === vid)) return; // already loaded
    fetchJSON(`/vendors/${vid}`).then((v: any) => {
      if (v && v.id) {
        setVendors((prev) => {
          if (prev.some((existing) => existing.id === v.id)) return prev;
          return [{ id: v.id, name: v.name, phone: v.phone || "", email: v.email || "", notes: v.notes || "" }, ...prev];
        });
      }
    }).catch(() => {}); // vendor may not exist
  }, [formData.vendorId, vendors, vendorSearch]);

  const handleVendorScroll = useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      if (!vendorHasMore || vendorLoading) return;

      const target = event.currentTarget;
      if (target.scrollTop + target.clientHeight >= target.scrollHeight - 24) {
        fetchVendorsPage(vendorSearch, vendorOffset, true);
      }
    },
    [vendorHasMore, vendorLoading, vendorSearch, vendorOffset, fetchVendorsPage],
  );

  // Initialize formData only when modal opens/closes or mode changes - NOT when vendors change
  useEffect(() => {
    if (open) {
      if (mode === "edit" && initialData) {
        // In edit mode, initialize with initialData
        let vendorId = "";
        if (initialData.vendorId !== undefined && initialData.vendorId !== null) {
          vendorId = String(initialData.vendorId);
        }

        setFormData({
          task: initialData.task ?? "",
          workOrderName: initialData.workOrderName ?? "",
          vendorId: vendorId,
          status: (initialData.status as
            | "not_started"
            | "in_progress"
            | "completed") ?? "not_started",
          priority: (initialData.priority as
            | "low"
            | "normal"
            | "high"
            | "urgent") ?? "normal",
          dueDate: initialData.dueDate ?? null,
          notes: initialData.notes ?? "",
          files: initialData.files ?? [],
        });
      } else {
        let createVendorId = "";
        if (initialData?.vendorId !== undefined && initialData?.vendorId !== null) {
          createVendorId = String(initialData.vendorId);
        }
        setFormData({
          task: taskOptions ? "" : (initialData?.task ?? ""),
          workOrderName: initialData?.workOrderName ?? "",
          vendorId: createVendorId,
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
        vendorId: "",
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

  // Separate useEffect for matching vendor by name in edit mode (only when vendors are loaded)
  useEffect(() => {
    if (!open || mode !== "edit" || !initialData?.vendor || vendors.length === 0) return;
    if (initialData.vendorId !== undefined && initialData.vendorId !== null) return; // Already has vendorId
    
    // Try to find matching vendor by name
    const matchingVendor = vendors.find((v) => v.name === initialData.vendor);
    if (matchingVendor && formData.vendorId !== matchingVendor.id.toString()) {
      setFormData((prev) => ({ ...prev, vendorId: matchingVendor.id.toString() }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendors, open, mode, initialData?.vendor]);

  const handleTaskChange = (value: string) => {
    setFormData((prev) => ({ ...prev, task: value }));
    if (errors.task) {
      setErrors((prev) => ({ ...prev, task: "" }));
    }
  };

  const handleWorkOrderNameChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setFormData((prev) => ({ ...prev, workOrderName: e.target.value }));
    if (errors.workOrderName) {
      setErrors((prev) => ({ ...prev, workOrderName: "" }));
    }
  };

  const handleVendorChange = (value: string) => {
    setFormData((prev) => ({ ...prev, vendorId: value }));
  };

  const handleStatusChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      status: value as "not_started" | "in_progress" | "completed",
    }));
  };

  const handlePriorityChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      priority: value as "low" | "normal" | "high" | "urgent",
    }));
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

    // Only require task field if task selection is visible
    if (!hideTaskSelection && !formData.task.trim()) {
      newErrors.task = "Task is required";
    }
    if (!formData.workOrderName.trim()) {
      newErrors.workOrderName = "Work Order Name is required";
    }

    // For create mode, require taskId and propertyId
    if (mode === "create") {
      if (taskOptions) {
        // Property-scoped: taskId comes from dropdown selection
        if (!formData.task.trim()) {
          newErrors.task = "Task is required";
        }
      } else {
        if (!taskId) {
          newErrors.task = "Task ID is required";
        }
      }
      if (!propertyId) {
        newErrors.property = "Property ID is required";
      }
    }

    // For edit mode, require workOrderId
    if (mode === "edit") {
      if (!workOrderId) {
        newErrors.workOrderName = "Work Order ID is required";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConfirm = async () => {
    if (!validateForm()) {
      return;
    }

    // For edit mode, make PATCH API call
    if (mode === "edit") {
      if (!workOrderId) {
        setSubmitError("Work Order ID is required for update");
        return;
      }

      setIsSubmitting(true);
      setSubmitError(null);

      try {
        // Convert frontend values to backend values
        const frontendStatus = formData.status as
          | "not_started"
          | "in_progress"
          | "completed";
        const frontendPriority = formData.priority as
          | "low"
          | "normal"
          | "high"
          | "urgent";
        const backendStatus = convertStatusToBackend(frontendStatus);
        const backendPriority = convertPriorityToBackend(frontendPriority);

        // Prepare the request body for PATCH
        const requestBody: any = {
          name: formData.workOrderName,
          description: formData.notes || "",
          status: backendStatus,
          priority: backendPriority,
        };

        // Handle due_date - send ISO string if present, null if cleared
        if (formData.dueDate) {
          requestBody.due_date = formData.dueDate.toISOString();
        } else {
          // Send null to clear the due date
          requestBody.due_date = null;
        }

        // Handle vendor_id - send number if selected, null if cleared
        if (formData.vendorId) {
          const vendorIdNum = parseInt(formData.vendorId, 10);
          if (!isNaN(vendorIdNum)) {
            requestBody.vendor_id = vendorIdNum;
          } else {
            requestBody.vendor_id = null;
          }
        } else {
          // If vendor is cleared, send null
          requestBody.vendor_id = null;
        }

        // Set updated_by to the logged-in user ID
        if (userId) {
          requestBody.updated_by = userId;
        }

        // Make the PATCH API call
        const updatedWorkOrder = await fetchJSON(
          `/maintenance/work-orders/${workOrderId}`,
          {
            method: "PATCH",
            body: JSON.stringify(requestBody),
          }
        );

        // Call success callback if provided
        if (onWorkOrderUpdated) {
          onWorkOrderUpdated(updatedWorkOrder);
        }

        // Also call onDataUpdate for backward compatibility
        if (onDataUpdate) {
          onDataUpdate(formData);
        }

        // Close the modal
        onOpenChange(false);
      } catch (error: any) {
        console.error("Failed to update work order:", error);
        setSubmitError(
          error.message || "Failed to update work order. Please try again."
        );
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // For create mode, make API call
    if (mode === "create") {
      setIsSubmitting(true);
      setSubmitError(null);

      try {
        // Upload files first to get temp_object_key (storage_path)
        const attachments = [];
        for (const file of formData.files) {
          if (file.file) {
            try {
              const storagePath = await uploadFile(file.file);
              attachments.push({
                temp_object_key: storagePath,
                file_name: file.name,
                file_type: file.type || "application/octet-stream",
                file_size: file.size,
                label: null, // Optional label
              });
            } catch (error) {
              console.error(`Failed to upload file ${file.name}:`, error);
              // Continue with other files even if one fails
            }
          }
        }

        // Convert frontend values to backend values
        // Type assertion is safe because formData.status/priority come from controlled inputs
        const frontendStatus = formData.status as
          | "not_started"
          | "in_progress"
          | "completed";
        const frontendPriority = formData.priority as
          | "low"
          | "normal"
          | "high"
          | "urgent";
        const backendStatus = convertStatusToBackend(frontendStatus);
        const backendPriority = convertPriorityToBackend(frontendPriority);

        const effectiveTaskId = taskOptions
          ? (formData.task ? parseInt(formData.task, 10) : undefined)
          : taskId;

        // Prepare the request body
        const requestBody: any = {
          task_id: effectiveTaskId,
          property_id: propertyId,
          name: formData.workOrderName,
          description: formData.notes || "",
          status: backendStatus,
          priority: backendPriority,
        };

        // Add optional fields
        if (formData.dueDate) {
          requestBody.due_date = formData.dueDate.toISOString();
        }

        // Set requested_by to the logged-in user ID (or use requestedBy prop if provided)
        const finalRequestedBy = requestedBy || userId;
        if (finalRequestedBy) {
          requestBody.requested_by = finalRequestedBy;
        }

        // Add vendor_id if vendor is selected
        if (formData.vendorId) {
          const vendorIdNum = parseInt(formData.vendorId, 10);
          if (!isNaN(vendorIdNum)) {
            requestBody.vendor_id = vendorIdNum;
          }
        }

        // Add attachments if any were uploaded
        if (attachments.length > 0) {
          requestBody.attachments = attachments;
        }

        // Make the API call
        const workOrder = await fetchJSON("/maintenance/work-orders", {
          method: "POST",
          body: JSON.stringify(requestBody),
        });

        // Call success callback if provided
        if (onWorkOrderCreated) {
          onWorkOrderCreated(workOrder);
        }

        if (propertyId) {
          window.dispatchEvent(
            new CustomEvent("refreshWorkOrders", {
              detail: { propertyId },
            })
          );
        }

        // Also call onDataUpdate for backward compatibility
        if (onDataUpdate) {
          onDataUpdate(formData);
        }

        // Close the modal
        onOpenChange(false);
      } catch (error: any) {
        console.error("Failed to create work order:", error);
        setSubmitError(
          error.message || "Failed to create work order. Please try again."
        );
      } finally {
        setIsSubmitting(false);
      }
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
            confirmDisabled={isSubmitting}
            cancelDisabled={isSubmitting}
          />
        }
      >
        <FormLayout>
          {mode === "edit" && workOrderId && <AIGeneratedBanner entityType="work_order" entityId={workOrderId} />}
          {mode === "create" && !hideTaskSelection && (
            <FormSection>
              <SelectField
                label="Task"
                required={REQUIRED_FIELDS.has("task")}
                value={formData.task}
                onChange={handleTaskChange}
                placeholder="Select Task"
                options={
                  taskOptions
                    ? taskOptions.map((t) => ({
                        value: t.id.toString(),
                        label: t.label,
                      }))
                    : buildTaskOptions(initialData?.task)
                }
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

          <FormSection
            title={!hideSubheader ? "Work Order Details" : undefined}
          >
            <FormFieldRow columns={2}>
              <TextField
                label="Work Order Name"
                required={REQUIRED_FIELDS.has("workOrderName")}
                value={formData.workOrderName}
                onChange={handleWorkOrderNameChange}
                placeholder="Type Work Order Name"
                error={errors.workOrderName}
              />
              <div className="flex flex-col">
                <FieldShell label="Vendor" htmlFor="vendor-select">
                  <Select
                    value={formData.vendorId}
                    onValueChange={(vendorId) => {
                      handleVendorChange(vendorId);
                      setVendorSearch(""); // Reset search on select
                    }}
                    onOpenChange={(open) => {
                      setIsVendorDropdownOpen(open);
                      if (!open) setVendorSearch(""); // Reset search on close
                    }}
                  >
                    <SelectTrigger
                      id="vendor-select"
                      className="w-full rounded-lg border bg-white px-3 py-2 text-sm font-normal transition-colors flex items-center justify-between cursor-pointer border-[var(--color-border-light)]"
                      style={{
                        fontFamily:
                          "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                        lineHeight: 1.43,
                        minHeight: "44px",
                      }}
                    >
                      <SelectValue placeholder="Select a Vendor" />
                    </SelectTrigger>
                    <SelectContent 
                      className="bg-white border border-[#E5E7EB] shadow-md p-0 !z-[9999]"
                      style={{
                        zIndex: 9999,
                        width: "var(--radix-select-trigger-width)",
                        minHeight: "320px",
                      }}
                      position="popper"
                      side="bottom"
                      align="start"
                      avoidCollisions={false}
                      onOpenAutoFocus={(event) => {
                        event.preventDefault();
                        vendorSearchInputRef.current?.focus();
                      }}
                    >
                      {/* Search input - outside Viewport */}
                      <div className="p-2 border-b border-[#E5E7EB] sticky top-0 bg-white z-10">
                        <input
                          ref={vendorSearchInputRef}
                          autoFocus
                          placeholder="Type to search…"
                          value={vendorSearch}
                          onChange={(e) => setVendorSearch(e.target.value)}
                          onKeyDown={(e) => e.stopPropagation()} // Prevent Select keyboard hijack
                          className="w-full rounded-md border px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-[#013764]"
                          style={{
                            fontFamily:
                              "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                          }}
                        />
                      </div>

                      {/* Scrollable list - inside Viewport */}
                      <div
                        className="h-[240px] overflow-y-auto"
                        onScroll={handleVendorScroll}
                      >
                        {vendorLoading && filteredVendors.length === 0 && (
                          <div className="px-3 py-2 text-sm text-gray-400">
                            Loading vendors…
                          </div>
                        )}
                        {!vendorLoading && filteredVendors.length === 0 && (
                          <div className="px-3 py-2 text-sm text-gray-400">
                            No vendors found
                          </div>
                        )}

                        {filteredVendors.map((v) => (
                          <SelectItem key={v.id} value={v.id.toString()}>
                            {v.name}
                          </SelectItem>
                        ))}
                        {vendorLoading && filteredVendors.length > 0 && (
                          <div className="px-3 py-2 text-xs text-gray-400">
                            Loading more…
                          </div>
                        )}
                        {!vendorLoading && vendorHasMore && filteredVendors.length > 0 && (
                          <div className="px-3 py-2 text-xs text-gray-400">
                            Scroll to load more
                          </div>
                        )}
                      </div>
                    </SelectContent>
                  </Select>
                </FieldShell>
              </div>
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
              label="Description"
              value={formData.notes}
              onChange={handleNotesChange}
              placeholder="Description for your Work Order"
              autoGrow
            />

            {/* <FileUploadField
              label="Attachments"
              files={formData.files}
              onFilesAdded={handleFilesAdded}
              onFileRemoved={handleFileRemoved}
              onViewFile={handleViewFile}
              accept=".pdf,.jpg,.jpeg,.png"
              maxSize={10 * 1024 * 1024}
            /> */}

            {/* Error message */}
            {submitError && (
              <div
                style={{
                  backgroundColor: "#fef2f2",
                  borderColor: "#ef4444",
                  borderWidth: "1px",
                  borderStyle: "solid",
                  borderRadius: "6px",
                  padding: "12px",
                  marginTop: "16px",
                }}
              >
                <p
                  style={{
                    fontFamily:
                      "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                    fontSize: "14px",
                    fontWeight: 400,
                    color: "#7f1d1d",
                    margin: 0,
                  }}
                >
                  {submitError}
                </p>
              </div>
            )}

            {/* Loading indicator */}
            {isSubmitting && (
              <div
                style={{
                  padding: "12px",
                  marginTop: "16px",
                  textAlign: "center",
                }}
              >
                <p
                  style={{
                    fontFamily:
                      "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                    fontSize: "14px",
                    fontWeight: 400,
                    color: "var(--color-text-muted)",
                    margin: 0,
                  }}
                >
                  Creating work order...
                </p>
              </div>
            )}
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
        onSubmit={(taskData) => {
          // taskData should contain the task information
          if (taskData?.name || taskData?.title) {
            setFormData((prev) => ({
              ...prev,
              task: taskData.name || taskData.title || "",
            }));
          }
          setIsCreateTaskModalOpen(false);
        }}
      />
    </>
  );
}
