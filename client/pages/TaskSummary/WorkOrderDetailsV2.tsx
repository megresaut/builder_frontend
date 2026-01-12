import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Edit, Bell, Share2, Mail, ChevronDown, Plus } from "lucide-react";
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
    if (formData.status) setStatus(formData.status);
    if (formData.priority) setPriority(formData.priority);
    if (formData.dueDate) setDueDate(formData.dueDate);

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
      vendorName: formData.vendor !== undefined ? formData.vendor : workOrder.vendorName,
      task: formData.workOrderName || workOrder.task,
      property: formData.property || workOrder.property,
      unit: formData.unit || workOrder.unit,
      notes: updatedNotes,
      files: updatedFiles,
    };

    if (onWorkOrderUpdate) {
      onWorkOrderUpdate(updatedWorkOrder);
    }
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
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-[#2463eb] font-medium text-sm hover:opacity-80 transition-opacity w-fit"
      >
        <ArrowLeft width={16} height={16} />
        Back to Work Orders
      </button>

      {/* Field Selectors Row */}
      <div className="flex flex-wrap items-end gap-6 w-full mb-2">
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

      <div className="flex flex-wrap lg:flex-nowrap gap-6 w-full">
        {/* Left Column (Main Content) */}
        <div className="flex flex-col flex-1 gap-6 min-w-0">
          {/* Main Overview Card */}
          <SectionCard variant="white" padding="none">
            <div className="flex flex-col md:flex-row items-start gap-4 w-full p-5">
              <img
                src="https://api.builder.io/api/v1/image/assets%2Fba2f0cd1a4c64ebda0865daf8dd0ff2a%2F8f2f256086b940029bc4894372e519c1?format=webp&width=502"
                alt="Property"
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  img.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='251' height='191'%3E%3Crect fill='%23e5e5e5' width='251' height='191'/%3E%3Ctext x='50%25' y='50%25' font-family='Geist,sans-serif' font-size='16' fill='%23999' text-anchor='middle' dominant-baseline='middle'%3EProperty Image%3C/text%3E%3C/svg%3E";
                }}
                className="w-full md:w-[251px] h-[191px] rounded-lg object-cover flex-shrink-0 bg-[#f0f0f0]"
              />

              <div className="flex flex-col items-start gap-6 flex-1 min-w-0">
                <div className="flex items-start gap-4 w-full">
                  <div className="flex flex-col items-start gap-4 flex-1 min-w-0">
                    <div className="flex justify-start items-start gap-2 w-full">
                      <h2 className="text-[#303030] text-[22px] font-semibold leading-[30px] flex-1">
                        {workOrder.task} - #{workOrder.id}
                      </h2>
                      <button
                        onClick={() => onUpdateWorkOrderModalOpenChange?.(true)}
                        className="flex justify-center items-center gap-1 rounded-lg hover:opacity-80 transition-opacity flex-shrink-0 ml-auto whitespace-nowrap mt-1"
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M14.4714 1.52855C13.4747 0.531824 11.8587 0.531823 10.862 1.52855L10.0876 2.3029C9.82359 2.56691 9.69158 2.69892 9.64212 2.85114C9.59862 2.98503 9.59862 3.12926 9.64212 3.26316C9.69158 3.41538 9.82359 3.54739 10.0876 3.8114L12.1886 5.91238C12.4526 6.17639 12.5846 6.30839 12.7368 6.35785C12.8707 6.40136 13.0149 6.40136 13.1488 6.35785C13.3011 6.30839 13.4331 6.17639 13.6971 5.91238L14.4714 5.13803C15.4682 4.1413 15.4682 2.52528 14.4714 1.52855Z" fill="#2463EB"/>
                          <path d="M11.2458 8.36368C11.5098 8.09967 11.6418 7.96766 11.6912 7.81544C11.7348 7.68155 11.7348 7.53732 11.6912 7.40342C11.6418 7.2512 11.5098 7.1192 11.2458 6.85519L9.14479 4.7542C8.88078 4.49019 8.74877 4.35819 8.59655 4.30873C8.46266 4.26522 8.31843 4.26522 8.18453 4.30873C8.03231 4.35818 7.90031 4.49019 7.6363 4.7542L2.02449 10.366C1.86096 10.5292 1.71671 10.6732 1.60388 10.8444C1.50467 10.9948 1.42626 11.158 1.37075 11.3294C1.30763 11.5244 1.28528 11.727 1.25994 11.9567L1.00408 14.2597C0.981717 14.461 1.05206 14.6615 1.19527 14.8047C1.33847 14.9479 1.53901 15.0182 1.74029 14.9959L4.04329 14.74C4.27297 14.7147 4.47557 14.6923 4.67056 14.6292C4.84201 14.5737 5.00516 14.4953 5.1556 14.3961C5.32672 14.2832 5.47074 14.139 5.634 13.9755L11.2458 8.36368Z" fill="#2463EB"/>
                        </svg>
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
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-sm font-normal leading-[140%] tracking-[-0.28px] capitalize flex-shrink-0 whitespace-nowrap">
                    <span className="text-[#717179]">Created</span>
                    <span className="text-[#717179]">11/12/2025 9:22 PM</span>
                  </div>
                </div>

                <div className="flex justify-between items-end w-full">
                  <div className="flex flex-col items-start gap-3 flex-1">
                    <div className="flex items-center gap-1">
                      <span className="text-[#717179] text-sm font-semibold leading-4">Invoice Number:</span>
                      <span className="text-[#717179] text-sm font-medium leading-4">{workOrder.invoiceNumber || ""}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[#717179] text-sm font-semibold leading-4">Vendor:</span>
                      <span className="text-[#717179] text-sm font-medium leading-4">{workOrder.vendorName || "Unassigned"}</span>
                    </div>
                  </div>
                  <a
                    href={`https://www.google.com/maps/search/${encodeURIComponent(workOrder.property)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-10 px-4 justify-center items-center gap-2 rounded-lg border border-[#dadada] bg-[#f9f9f9] shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] hover:opacity-80 transition-opacity"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3.8329 1.36272C3.9427 1.35374 3.9976 1.34926 4.06229 1.35661C4.24453 1.37733 4.43386 1.49138 4.53736 1.6428C4.57411 1.69656 4.59996 1.75688 4.65167 1.87754L7.15032 7.70773L2.12495 10.4803C1.86466 10.624 1.73451 10.6958 1.62803 10.6831C1.53513 10.6721 1.45113 10.6225 1.39658 10.5465C1.33405 10.4594 1.33404 10.3107 1.33402 10.0135C1.3339 8.39977 1.33412 6.78607 1.33412 5.17238C1.33411 4.63574 1.3341 4.19283 1.36358 3.83204C1.3942 3.4573 1.45991 3.11284 1.62477 2.78928C1.88043 2.28751 2.28838 1.87956 2.79014 1.6239C3.1137 1.45904 3.45817 1.39333 3.8329 1.36272Z" fill="#2463EB"/>
                      <path d="M2.02907 12.0561C1.8052 12.1796 1.69326 12.2413 1.60539 12.3641C1.54294 12.4513 1.48401 12.6266 1.48107 12.7338C1.47692 12.8847 1.51061 12.9606 1.57798 13.1123C1.59262 13.1453 1.60819 13.178 1.62477 13.2106C1.88043 13.7123 2.28838 14.1203 2.79014 14.3759C3.1137 14.5408 3.45817 14.6065 3.8329 14.6371C4.19369 14.6666 4.6366 14.6666 5.17324 14.6666H9.32387C9.59393 14.6666 9.72896 14.6666 9.81338 14.6097C9.88717 14.56 9.93804 14.4829 9.95465 14.3955C9.97365 14.2955 9.92046 14.1714 9.81408 13.9232L7.67815 8.93932L2.02907 12.0561Z" fill="#2463EB"/>
                      <path d="M12.1687 14.6371C12.059 14.6461 12.0042 14.6506 11.9396 14.6432C11.7572 14.6225 11.5678 14.5084 11.4643 14.3569C11.4276 14.3032 11.4018 14.2429 11.3501 14.1224L6.18764 2.07668C6.08126 1.82845 6.02807 1.70434 6.04707 1.60435C6.06368 1.51694 6.11454 1.43981 6.18834 1.39011C6.27276 1.33325 6.40779 1.33325 6.67785 1.33325H10.8283C11.365 1.33324 11.8079 1.33324 12.1687 1.36272C12.5434 1.39333 12.8879 1.45904 13.2114 1.6239C13.7132 1.87956 14.1211 2.28751 14.3768 2.78928C14.5417 3.11284 14.6074 3.4573 14.638 3.83204C14.6675 4.19283 14.6675 4.63573 14.6674 5.17237V10.8275C14.6675 11.3641 14.6675 11.807 14.638 12.1678C14.6074 12.5425 14.5417 12.887 14.3768 13.2106C14.1211 13.7123 13.7132 14.1203 13.2114 14.3759C12.8879 14.5408 12.5434 14.6065 12.1687 14.6371Z" fill="#2463EB"/>
                    </svg>
                    <span className="text-[#2463eb] text-sm font-medium leading-[140%] tracking-[-0.28px] capitalize">View Maps</span>
                  </a>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Totals Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            <div className="flex flex-col justify-center items-start gap-1 flex-1 rounded-lg border border-[#DADADA] bg-[#F9F9F9] p-4">
              <div className="text-[#717179] font-['Geist',sans-serif] text-sm font-normal leading-5">
                ESTIMATE TOTAL
              </div>
              <div className="text-[#303030] font-['Geist',sans-serif] text-2xl font-medium leading-7">
                $0.00
              </div>
            </div>
            <div className="flex flex-col justify-center items-start gap-1 flex-1 rounded-lg border border-[#DADADA] bg-[#F9F9F9] p-4">
              <div className="text-[#717179] font-['Geist',sans-serif] text-sm font-normal leading-5">
                WORK ORDER TOTAL
              </div>
              <div className="text-[#303030] font-['Geist',sans-serif] text-2xl font-medium leading-7">
                $0.00
              </div>
            </div>
          </div>

          {/* Notes Section */}
          <SectionCard padding="compact">
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
          <SectionCard padding="compact">
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
            variant="default"
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
                    phone: "",
                  }
                ] : [],
                showRoleLabel: true,
                showPhone: false,
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
                  roleLabel: "Property manager",
                  phone: "",
                })),
                showRoleLabel: true,
                showPhone: false,
                showDivider: true,
                tabIndex: 1,
              },
              {
                label: "Collaborators",
                mode: "rows",
                people: currentCollaborators.map((collaborator) => ({
                  id: collaborator.id,
                  name: collaborator.name || collaborator.label,
                  initials: collaborator.initials,
                  roleLabel: "Property manager",
                  phone: "",
                })),
                showRoleLabel: true,
                showPhone: false,
                showDivider: true,
                tabIndex: 1,
                type: "collaborator",
              }
            ]}
          />

          {/* Created By Card */}
          <PeopleCard
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
