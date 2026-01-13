import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Bell, Share2, Mail, ChevronDown, Plus } from "lucide-react";
import { EditIcon } from "@/components/icons";
import SectionCard from "@/components/SectionCard";
import PeopleCard from "@/components/PeopleCard";
import BillsCard from "./BillsCard";
import { NotesTemplate, FilesTemplate, SectionActionTemplate } from "@/components/templates";
import TaskStatusBadge from "@/components/TaskStatusBadge";
import TaskPriorityBadge from "@/components/TaskPriorityBadge";
import { StatusSelectField } from "@/components/forms/StatusSelectField";
import { PrioritySelectField } from "@/components/forms/PrioritySelectField";
import { DateField } from "@/components/forms/DateField";
import { cn } from "@/lib/utils";
import { AddNoteModal, AddFileModal } from "@/components/task";
import PopoverActionsDropdown from "@/components/PopoverActionsDropdown";
import PdfViewerModal from "@/components/PdfViewerModal";
import CreateWorkOrderModalV2 from "@/components/CreateWorkOrderModalV2";
import type { UploadedFile } from "@/components/ui/attachment-uploader";
import type { Note, File } from "@/components/templates";
import { FormLayout, FormSection } from "@/components/ui/form-layout";

interface WorkOrder {
  id: number;
  task: string;
  property: string;
  unit: string;
  status: string;
  priority: string;
  dueDate: string | Date | null;
  invoiceNumber?: string;
  vendorName?: string;
  chargeTo?: string;
  description?: string;
  notes?: Note[];
  files?: File[];
}

interface WorkOrderDetailsV2Props {
  workOrder: WorkOrder;
  currentAssignees?: any[];
  currentCollaborators?: any[];
  onWorkOrderUpdate?: (updatedWorkOrder: WorkOrder) => void;
  isUpdateWorkOrderModalOpen?: boolean;
  onUpdateWorkOrderModalOpenChange?: (open: boolean) => void;
}

const vendorMasterData: Record<string, { email: string; phone: string; id: number }> = {
  "ABC Doors & Hardware": { email: "info@abcdoors.com", phone: "(555) 123-1234", id: 1 },
  "Elite HVAC Services": { email: "contact@elitehvac.com", phone: "(555) 234-5678", id: 2 },
  "Glass & Frames Inc": { email: "sales@glassframes.com", phone: "(555) 345-6789", id: 3 },
  "Pro Roofing Solutions": { email: "quote@proroofing.com", phone: "(555) 456-7890", id: 4 },
  "Dolce Plumbing & Heating LLC": { email: "service@dolceplumbing.com", phone: "(555) 567-8901", id: 5 },
  "Spark Electrical": { email: "jobs@sparkelectrical.com", phone: "(555) 678-9012", id: 6 },
  "Premium Painters Co": { email: "estimate@premiumpainters.com", phone: "(555) 789-0123", id: 7 },
  "Quality Flooring LLC": { email: "orders@qualityflooring.com", phone: "(555) 890-1234", id: 8 },
  "Green Lawn Services": { email: "schedule@greenlawn.com", phone: "(555) 901-2345", id: 9 },
  "Outdoor Construction Corp": { email: "bids@outdoorconstruction.com", phone: "(555) 012-3456", id: 10 },
};

const getVendorEmail = (vendorName?: string): string => {
  if (!vendorName) return "";
  return vendorMasterData[vendorName]?.email || "";
};

const getVendorPhone = (vendorName?: string): string => {
  if (!vendorName) return "";
  return vendorMasterData[vendorName]?.phone || "";
};

const getVendorHref = (vendorName?: string): string | undefined => {
  if (!vendorName) return undefined;
  const vendorId = vendorMasterData[vendorName]?.id;
  return vendorId ? `/vendors/${vendorId}` : undefined;
};

export default function WorkOrderDetailsV2({
  workOrder,
  currentAssignees = [],
  currentCollaborators = [],
  onWorkOrderUpdate,
  isUpdateWorkOrderModalOpen = false,
  onUpdateWorkOrderModalOpenChange,
}: WorkOrderDetailsV2Props) {
  const navigate = useNavigate();
  const { taskId } = useParams<{ taskId: string }>();

  // Field state
  const [status, setStatus] = useState(() => workOrder?.status || "completed");
  const [priority, setPriority] = useState(() => workOrder?.priority || "normal");
  const [dueDate, setDueDate] = useState<Date | string | null>(() => {
    if (!workOrder?.dueDate) return null;
    // If it's already a Date object, use it directly
    if (workOrder.dueDate instanceof Date) {
      return workOrder.dueDate;
    }
    // Try to parse string dates (may be ISO or formatted)
    const parsed = new Date(workOrder.dueDate);
    return !isNaN(parsed.getTime()) ? parsed : workOrder.dueDate;
  });

  // Sync workOrder prop changes to local state
  useEffect(() => {
    if (workOrder) {
      setStatus(workOrder.status || "completed");
      setPriority(workOrder.priority || "normal");
      if (workOrder.dueDate) {
        if (workOrder.dueDate instanceof Date) {
          setDueDate(workOrder.dueDate);
        } else {
          const parsed = new Date(workOrder.dueDate);
          setDueDate(!isNaN(parsed.getTime()) ? parsed : workOrder.dueDate);
        }
      } else {
        setDueDate(null);
      }
      if (workOrder.notes) {
        setNotes(workOrder.notes);
      }
      if (workOrder.files) {
        setFiles(workOrder.files);
      }
    }
  }, [workOrder?.id, workOrder?.status, workOrder?.priority, workOrder?.dueDate, workOrder?.notes, workOrder?.files]);

  // Mock notifications
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      message: "A bill from Edgerton Inc. was uploaded, would you like to update work order status?",
      type: "bill",
    },
    {
      id: 2,
      message: "Estimate differed from invoice by $50.50",
      type: "discrepancy",
    },
  ]);

  const [notes, setNotes] = useState<Note[]>(() => workOrder?.notes || []);

  const [files, setFiles] = useState<File[]>(() => workOrder?.files || []);

  interface BillItem {
    id: string;
    date: string;
    time: string;
    invoiceNumber: string;
    vendorName: string;
    amount: string;
    status: "Paid" | "Unpaid" | "Awaiting Invoice";
  }

  const [bills, setBills] = useState<BillItem[]>([]);

  // Calculate work order total from bills
  const workOrderTotal = bills.reduce((sum, bill) => {
    const amount = parseFloat(bill.amount.replace('$', '').replace(',', ''));
    return sum + (isNaN(amount) ? 0 : amount);
  }, 0);

  // Modal states
  const [isAddNoteModalOpen, setIsAddNoteModalOpen] = useState(false);
  const [isAddFileModalOpen, setIsAddFileModalOpen] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [editingFileId, setEditingFileId] = useState<number | null>(null);
  const [viewingFileUrl, setViewingFileUrl] = useState<string | null>(null);
  const [viewingFileName, setViewingFileName] = useState<string>("");

  const handleDismissNotification = (id: number) => {
    setNotifications(notifications.filter((n) => n.id !== id));
  };

  const handleWorkOrderUpdate = (formData: {
    property?: string;
    unit?: string;
    task?: string;
    workOrderName?: string;
    vendor?: string;
    status?: string;
    priority?: string;
    dueDate?: Date | null;
    notes?: string;
    files?: UploadedFile[];
  }) => {
    // Update local state
    if (formData.status !== undefined) setStatus(formData.status);
    if (formData.priority !== undefined) setPriority(formData.priority);
    if (formData.dueDate !== undefined) setDueDate(formData.dueDate);

    // Build updated notes and files arrays
    let updatedNotes = notes;
    let updatedFiles = files;

    if (formData.notes) {
      const newNote: Note = {
        id: Math.max(0, ...notes.map(n => n.id)) + 1,
        text: formData.notes,
        date: new Date().toLocaleString(),
        author: "Julia LoSchiavo",
      };
      updatedNotes = [...notes, newNote];
      setNotes(updatedNotes);
    }

    if (formData.files && formData.files.length > 0) {
      const newFiles: File[] = formData.files.map((uf, idx) => ({
        id: Math.max(0, ...files.map(f => f.id)) + idx + 1,
        name: uf.name,
        url: uf.url || "#",
        uploadedAt: new Date().toLocaleString(),
        category: "Work Order",
        description: "",
      }));
      updatedFiles = [...files, ...newFiles];
      setFiles(updatedFiles);
    }

    // Update parent work orders list
    let dueDateValue: string | Date | null = workOrder.dueDate;
    if (formData.dueDate) {
      dueDateValue = formData.dueDate instanceof Date
        ? formData.dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : String(formData.dueDate);
    }

    const updatedWorkOrder: WorkOrder = {
      ...workOrder,
      status: formData.status || workOrder.status,
      priority: formData.priority || workOrder.priority,
      dueDate: dueDateValue,
      vendorName: formData.vendor ?? workOrder.vendorName,
      task: formData.workOrderName || workOrder.task,
      description: workOrder.description,
      notes: updatedNotes,
      files: updatedFiles,
    };

    if (onWorkOrderUpdate) {
      onWorkOrderUpdate(updatedWorkOrder);
    }

    // Close the modal after update
    onUpdateWorkOrderModalOpenChange?.(false);
  };

  const handleAddNote = (text: string) => {
    if (editingNoteId) {
      setNotes(notes.map(n => n.id === editingNoteId ? { ...n, text, date: new Date().toLocaleString() } : n));
    } else {
      const newNote: Note = {
        id: Math.max(0, ...notes.map(n => n.id)) + 1,
        text,
        date: new Date().toLocaleString(),
        author: "Julia LoSchiavo",
      };
      setNotes([...notes, newNote]);
    }
    setIsAddNoteModalOpen(false);
    setEditingNoteId(null);
  };

  const handleAddFile = (uploadedFiles: UploadedFile[], category: string, description: string) => {
    if (editingFileId) {
      setFiles(files.map(f => f.id === editingFileId ? {
        ...f,
        name: uploadedFiles[0]?.name || f.name,
        category,
        description
      } : f));
    } else {
      const newFiles: File[] = uploadedFiles.map((uf, idx) => ({
        id: Math.max(0, ...files.map(f => f.id)) + idx + 1,
        name: uf.name,
        url: uf.url || "#",
        uploadedAt: new Date().toLocaleString(),
        category,
        description,
      }));
      setFiles([...files, ...newFiles]);
    }
    setIsAddFileModalOpen(false);
    setEditingFileId(null);
  };

  const editingNote = notes.find(n => n.id === editingNoteId);
  const editingFile = files.find(f => f.id === editingFileId);

  // Synchronize local field state with parent workOrder updates
  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus);
    if (onWorkOrderUpdate) {
      onWorkOrderUpdate({ ...workOrder, status: newStatus, notes, files });
    }
  };

  const handlePriorityChange = (newPriority: string) => {
    setPriority(newPriority);
    if (onWorkOrderUpdate) {
      onWorkOrderUpdate({ ...workOrder, priority: newPriority, notes, files });
    }
  };

  const handleDueDateChange = (newDate: Date | string | null) => {
    setDueDate(newDate);
    if (onWorkOrderUpdate) {
      let dateValue: string | null = null;
      if (newDate) {
        dateValue = newDate instanceof Date
          ? newDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          : String(newDate);
      }
      onWorkOrderUpdate({ ...workOrder, dueDate: dateValue, notes, files });
    }
  };

  return (
    <div className="flex flex-col w-full gap-6 bg-white min-h-0 font-['Geist',sans-serif]">

      {/* Back Button */}
      <button
        onClick={() => navigate(`/tasks/${taskId}/workorders`)}
        className="flex items-center gap-2 text-[#2463eb] font-medium text-sm hover:opacity-80 transition-opacity w-fit"
      >
        <ArrowLeft width={16} height={16} />
        Back to Work Orders
      </button>

      {/* Field Selectors Row */}
      <SectionCard padding="none" variant="white">
        <div className="flex flex-wrap items-end gap-6 w-full p-4">
          <div className="flex-1 min-w-[180px]">
            <StatusSelectField
              label="Status"
              value={status}
              onChange={handleStatusChange}
            />
          </div>

          <div className="flex-1 min-w-[180px]">
            <PrioritySelectField
              label="Priority"
              value={priority}
              onChange={handlePriorityChange}
            />
          </div>

          <div className="flex-1 min-w-[180px]">
            <DateField
              label="Due Date"
              value={dueDate}
              onChange={handleDueDateChange}
              returnFormat="Date"
            />
          </div>

          <div className="flex-1 flex justify-end text-xs text-[#717179] font-medium pb-1">
            Last Updated <span className="text-[#303030] font-bold ml-1">11/12/2025 9:22 PM</span>
          </div>
        </div>
      </SectionCard>

      <div className="flex flex-wrap lg:flex-nowrap gap-6 w-full">
        {/* Left Column (Main Content) */}
        <div className="flex flex-col flex-1 gap-6 min-w-0">
          {/* Main Overview Card */}
          <SectionCard variant="white" padding="none">
            <div className="flex flex-col md:flex-row items-stretch gap-4 w-full p-5">
              <img
                src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/067809472377195b06444da037ab0e0c9542bf94?placeholderIfAbsent=true"
                alt="Property"
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  img.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='251' height='400'%3E%3Crect fill='%23e5e5e5' width='251' height='400'/%3E%3Ctext x='50%25' y='50%25' font-family='Geist,sans-serif' font-size='16' fill='%23999' text-anchor='middle' dominant-baseline='middle'%3EProperty Image%3C/text%3E%3C/svg%3E";
                }}
                className="w-full md:w-[251px] h-auto rounded-lg object-cover flex-shrink-0 bg-[#f0f0f0]"
              />

              <div className="flex flex-col items-start gap-6 flex-1 min-w-0">
                <div className="flex flex-col items-start gap-4 w-full">
                  <div className="flex justify-between items-start gap-2 w-full">
                    <h2 className="text-[#303030] text-[22px] font-semibold leading-[30px] flex-1">
                      {workOrder.task} - #{workOrder.id}
                    </h2>
                    <button
                      onClick={() => onUpdateWorkOrderModalOpenChange?.(true)}
                      className="flex justify-center items-center gap-1 rounded-lg hover:opacity-80 transition-opacity flex-shrink-0 whitespace-nowrap mt-1"
                    >
                      <EditIcon width={16} height={16} />
                      <span className="text-[#2463eb] text-base font-medium leading-[140%] tracking-[-0.32px] capitalize">Edit</span>
                    </button>
                  </div>
                  <div className="flex flex-col items-start gap-2 w-full">
                    <div className="text-[#717179] text-sm font-medium leading-4">
                      Created by Julia LoSchiavo for
                    </div>
                    <div className="text-[#2463eb] text-sm font-bold leading-4">
                      (C) {workOrder.property} {workOrder.unit && `- ${workOrder.unit}`}
                    </div>
                    <div className="flex items-center gap-1 text-sm font-normal leading-[140%] tracking-[-0.28px] capitalize">
                      <span className="text-[#717179]">Created</span>
                      <span className="text-[#717179]">11/12/2025 9:22 PM</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-start gap-4 w-full">
                  <div className="flex items-center gap-1">
                    <span className="text-[#717179] text-sm font-semibold leading-4">Invoice Number:</span>
                    <span className="text-[#717179] text-sm font-medium leading-4">{workOrder.invoiceNumber || ""}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[#717179] text-sm font-semibold leading-4">Vendor:</span>
                    <span className="text-[#717179] text-sm font-medium leading-4">{workOrder.vendorName || "Unassigned"}</span>
                  </div>

                  {/* Description Section */}
                  <div className="w-full">
                    <div className="text-[#717179] text-sm font-semibold leading-4 mb-2">Description:</div>
                    <div className="text-[#303030] text-sm font-normal leading-5 whitespace-pre-wrap">
                      {workOrder.description || notes[0]?.text || "No description provided"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Totals Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            <SectionCard padding="none" variant="white">
              <div className="flex flex-col justify-center items-start gap-1 flex-1 p-4">
                <div className="text-[#717179] font-['Geist',sans-serif] text-sm font-normal leading-5">
                  ESTIMATE TOTAL
                </div>
                <div className="text-[#303030] font-['Geist',sans-serif] text-2xl font-medium leading-7">
                  $0.00
                </div>
              </div>
            </SectionCard>
            <SectionCard padding="none" variant="white">
              <div className="flex flex-col justify-center items-start gap-1 flex-1 p-4">
                <div className="text-[#717179] font-['Geist',sans-serif] text-sm font-normal leading-5">
                  WORK ORDER TOTAL
                </div>
                <div className="text-[#303030] font-['Geist',sans-serif] text-2xl font-medium leading-7">
                  ${workOrderTotal.toFixed(2)}
                </div>
              </div>
            </SectionCard>
          </div>

          {/* Notes Section */}
          <SectionCard padding="compact" variant="white">
            <NotesTemplate
              notes={notes}
              onAdd={() => {
                setEditingNoteId(null);
                setIsAddNoteModalOpen(true);
              }}
              onEdit={(note) => {
                setEditingNoteId(note.id);
                setIsAddNoteModalOpen(true);
              }}
              onDelete={(id) => setNotes(notes.filter(n => n.id !== id))}
            />
          </SectionCard>

          {/* Files Section */}
          <SectionCard padding="compact" variant="white">
            <FilesTemplate
              files={files}
              onAdd={() => {
                setEditingFileId(null);
                setIsAddFileModalOpen(true);
              }}
              onEdit={(file) => {
                setEditingFileId(file.id);
                setIsAddFileModalOpen(true);
              }}
              onDelete={(id) => setFiles(files.filter(f => f.id !== id))}
              onView={(file) => {
                setViewingFileUrl(file.url || "#");
                setViewingFileName(file.name);
              }}
            />
          </SectionCard>
        </div>

        {/* Right Sidebar */}
        <div className="flex flex-col w-full lg:w-[376px] gap-6 flex-shrink-0">
          {/* Bills Card */}
          <BillsCard
            bills={bills}
            workOrderId={workOrder.id}
            onBillSelected={(bill) => setBills([...bills, bill])}
          />

          {/* Assignees Card */}
          <PeopleCard
            title="Assignees"
            variant="white"
            tabs={["Vendors", "Staff"]}
            defaultTab={0}
            footerActions={[]}
            subsections={[
              {
                label: "Vendor",
                mode: "rows",
                people: workOrder.vendorName ? [
                  {
                    id: "vendor-1",
                    name: workOrder.vendorName,
                    initials: workOrder.vendorName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2),
                    roleLabel: "Vendor Company",
                    email: getVendorEmail(workOrder.vendorName),
                    phone: getVendorPhone(workOrder.vendorName),
                    href: getVendorHref(workOrder.vendorName),
                  }
                ] : [],
                showRoleLabel: true,
                showPhone: true,
                showDivider: false,
                tabIndex: 0,
                hideHeaderOnTab: 0
              },
              {
                label: "Assigned to",
                mode: "rows",
                people: currentAssignees.map((assignee) => ({
                  id: assignee.id,
                  name: assignee.name || assignee.label,
                  initials: assignee.initials,
                  roleLabel: assignee.title || "Property manager",
                  email: assignee.email || "",
                  phone: assignee.phone || "",
                })),
                showRoleLabel: true,
                showPhone: true,
                showDivider: true,
                tabIndex: 1,
                onAction: () => onUpdateWorkOrderModalOpenChange?.(true),
                actionLabel: "Edit",
              },
              {
                label: "Collaborators",
                mode: "rows",
                people: currentCollaborators.map((collaborator) => ({
                  id: collaborator.id,
                  name: collaborator.name || collaborator.label,
                  initials: collaborator.initials,
                  roleLabel: collaborator.title || "Property manager",
                  email: collaborator.email || "",
                  phone: collaborator.phone || "",
                })),
                showRoleLabel: true,
                showPhone: true,
                showDivider: true,
                tabIndex: 1,
                type: "collaborator",
                onAction: () => onUpdateWorkOrderModalOpenChange?.(true),
                actionLabel: "Edit",
              }
            ]}
          />

          {/* Created By Card */}
          <PeopleCard
            variant="white"
            subsections={[
              {
                label: "Created by",
                mode: "rows",
                people: [
                  {
                    id: 4,
                    name: "Julia LoSchiavo",
                    initials: "JL",
                    roleLabel: "Property manager",
                    email: "julia.loschiavo@company.com",
                    phone: "(203) 927-1280",
                  }
                ],
                showRoleLabel: true,
                showPhone: true,
                showDivider: true,
              }
            ]}
          />
        </div>
      </div>

      {/* Modals */}
      <AddNoteModal
        open={isAddNoteModalOpen}
        onOpenChange={setIsAddNoteModalOpen}
        onSubmit={handleAddNote}
        initialText={editingNote?.text}
        isEditMode={!!editingNoteId}
      />

      <AddFileModal
        open={isAddFileModalOpen}
        onOpenChange={setIsAddFileModalOpen}
        onSubmit={handleAddFile}
        initialFiles={editingFile ? [{
          id: String(editingFile.id),
          name: editingFile.name,
          url: editingFile.url,
          size: 0,
          type: "application/pdf"
        }] : []}
        initialCategory={editingFile?.category}
        initialDescription={editingFile?.description}
        isEditMode={!!editingFileId}
      />

      <PdfViewerModal
        open={!!viewingFileUrl}
        onOpenChange={(open) => {
          if (!open) setViewingFileUrl(null);
        }}
        title={viewingFileName}
        url={viewingFileUrl || ""}
      />

      <CreateWorkOrderModalV2
        open={isUpdateWorkOrderModalOpen}
        onOpenChange={onUpdateWorkOrderModalOpenChange || (() => {})}
        mode="edit"
        hideTaskSelection={true}
        hideSubheader={true}
        initialData={{
          task: workOrder.task,
          workOrderName: workOrder.task,
          vendor: workOrder.vendorName || "",
          status: workOrder.status,
          priority: workOrder.priority,
          dueDate: workOrder.dueDate ? new Date(workOrder.dueDate) : null,
          notes: "",
          files: [],
        }}
        onDataUpdate={handleWorkOrderUpdate}
      />

    </div>
  );
}
