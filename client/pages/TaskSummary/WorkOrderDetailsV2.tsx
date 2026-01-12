import React, { useState } from "react";
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
import DateField from "@/components/forms/DateField";
import { cn } from "@/lib/utils";
import { AddNoteModal, AddFileModal } from "@/components/task";
import PopoverActionsDropdown from "@/components/PopoverActionsDropdown";
import PdfViewerModal from "@/components/PdfViewerModal";
import type { UploadedFile } from "@/components/ui/attachment-uploader";
import type { Note, File } from "@/components/templates";

interface WorkOrder {
  id: number;
  task: string;
  property: string;
  unit: string;
  status: string;
  priority: string;
  dueDate: string;
  invoiceNumber?: string;
  vendorName?: string;
  chargeTo?: string;
}

interface WorkOrderDetailsV2Props {
  workOrder: WorkOrder;
}

export default function WorkOrderDetailsV2({ workOrder }: WorkOrderDetailsV2Props) {
  const navigate = useNavigate();
  const { taskId } = useParams<{ taskId: string }>();

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

  const [notes, setNotes] = useState<Note[]>([
    {
      id: 1,
      text: "Initial check of the HVAC system showed some leaks.",
      date: "11/12/2025 9:22 PM",
      author: "Julia LoSchiavo",
    },
  ]);

  const [files, setFiles] = useState<File[]>([
    {
      id: 1,
      name: "Lorem Ipsum.PDF",
      uploadedAt: "11/12/2025 9:22 PM",
      category: "Invoice",
      url: "#",
    },
    {
      id: 2,
      name: "Lorem Ipsum.PDF",
      uploadedAt: "11/12/2025 9:22 PM",
      category: "Work Order",
      url: "#",
    },
  ]);

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

  return (
    <div className="flex flex-col w-full gap-6 bg-white min-h-0 font-['Geist',sans-serif]">
      {/* Back Button */}
      <div className="flex items-center gap-4 -mt-2">
        <button
          onClick={() => navigate(`/tasks/${taskId}/workorders`)}
          className="flex items-center gap-2 text-sm text-[#717179] hover:text-[#303030] transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Work Orders
        </button>
      </div>

      {/* Notifications Section */}
      {/*
      {notifications.length > 0 && (
        <div className="flex flex-col w-full border border-[#e3e3e3] rounded-[10px] overflow-hidden bg-white mb-4">
          <div className="flex items-center gap-2 px-4 py-3 bg-[#f9f9f9] border-b border-[#e5e5e5]">
            <Bell className="w-[18px] h-[18px] text-[#8b5cf6]" />
            <div className="text-base text-[#303030] font-bold tracking-tight">
              Notifications
            </div>
          </div>
          <div className="flex flex-col divide-y divide-[#e5e5e5]">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className="flex items-center justify-between px-4 py-3 bg-white flex-wrap gap-4"
              >
                <div className="flex items-center gap-2 flex-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#e5e5e5]"></div>
                  <div className="text-sm text-[#303030] font-medium">
                    {notification.message}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm font-medium">
                  <button
                    onClick={() => handleDismissNotification(notification.id)}
                    className="text-[#717179] hover:text-[#303030] transition-colors"
                  >
                    Dismiss
                  </button>
                  <button className="text-[#2463eb] hover:underline">
                    Approve
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      */}

      {/* Field Selectors Row */}
      <div className="flex flex-wrap items-end gap-6 w-full mb-2">
        <div className="flex flex-col gap-1.5 min-w-[180px]">
          <label className="text-xs font-semibold text-[#717179] uppercase tracking-wider">Status</label>
          <div className="relative">
             <div className="flex items-center gap-2 px-3 py-2 bg-white border border-[#e5e5e5] rounded-lg cursor-pointer hover:bg-gray-50 transition-colors h-10">
                <div className="w-2 h-2 rounded-full bg-[#10b981]"></div>
                <span className="text-sm text-[#303030] font-medium flex-1">Completed</span>
                <ChevronDown className="w-4 h-4 text-[#717179]" />
             </div>
          </div>
        </div>
        
        <div className="flex flex-col gap-1.5 min-w-[180px]">
          <label className="text-xs font-semibold text-[#717179] uppercase tracking-wider">Priority</label>
          <div className="relative">
             <div className="flex items-center gap-2 px-3 py-2 bg-white border border-[#e5e5e5] rounded-lg cursor-pointer hover:bg-gray-50 transition-colors h-10">
                <div className="w-2 h-2 rounded-full bg-[#2463eb]"></div>
                <span className="text-sm text-[#303030] font-medium flex-1">Normal</span>
                <ChevronDown className="w-4 h-4 text-[#717179]" />
             </div>
          </div>
        </div>

        <div className="flex flex-col gap-1.5 min-w-[180px]">
          <label className="text-xs font-semibold text-[#717179] uppercase tracking-wider">Due Date</label>
          <div className="flex items-center px-3 py-2 bg-white border border-[#e5e5e5] rounded-lg cursor-pointer hover:bg-gray-50 transition-colors h-10 min-w-[180px]">
             <span className="text-sm text-[#717179] flex-1 font-medium italic">mm/dd/yyyy</span>
             <ChevronDown className="w-4 h-4 text-[#717179]" />
          </div>
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
            <div className="flex flex-col md:flex-row w-full p-5 gap-6">
              <div className="w-full md:w-[190px] h-[140px] rounded-lg overflow-hidden flex-shrink-0 border border-[#e5e5e5]">
                <img 
                  src="https://api.builder.io/api/v1/image/assets%2Fba2f0cd1a4c64ebda0865daf8dd0ff2a%2F8f2f256086b940029bc4894372e519c1?format=webp&width=400" 
                  alt="Property" 
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="flex flex-col flex-1 min-w-0">
                <div className="flex items-center justify-between gap-4 w-full flex-wrap">
                  <div className="flex items-center gap-2">
                    <h2 className="text-[22px] font-bold text-[#303030] tracking-tight">
                      HVAC - #1024431-1
                    </h2>
                    <button className="flex items-center gap-1 text-sm text-[#2463eb] font-medium hover:underline">
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                  </div>
                  <div className="text-xs text-[#717179] font-medium">
                    Created <span className="text-[#303030] font-bold">11/12/2025 9:22 PM</span>
                  </div>
                </div>

                <div className="mt-2 text-sm text-[#717179] font-medium leading-relaxed">
                  Created by Julia LoSchiavo for{" "}
                  <a href="#" className="text-[#2463eb] font-bold hover:underline">
                    (C) 51 Willowmere Circle, Riverside CT 06878 -1
                  </a>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 mt-4 text-sm font-medium">
                   <div className="flex items-center gap-1.5">
                      <span className="text-[#717179]">Invoice Number:</span>
                      <span className="text-[#303030]">234605</span>
                   </div>
                   <div className="flex items-center gap-1.5 sm:justify-end">
                      <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-[#e5e5e5] rounded-lg text-xs font-semibold text-[#2463eb] shadow-sm hover:bg-gray-50 transition-colors">
                        <Share2 className="w-3.5 h-3.5" />
                        View Maps
                      </button>
                   </div>
                   <div className="flex items-center gap-1.5">
                      <span className="text-[#717179]">Vendor:</span>
                      <span className="text-[#303030]">Dolce Plumbing & Heating LLC</span>
                   </div>
                   <div className="flex items-center gap-1.5">
                      <span className="text-[#717179]">Charge Work To:</span>
                      <span className="text-[#303030]">Owner</span>
                   </div>
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
                $1,450.50
              </div>
            </div>
            <div className="flex flex-col justify-center items-start gap-1 flex-1 rounded-lg border border-[#DADADA] bg-[#F9F9F9] p-4">
              <div className="text-[#717179] font-['Geist',sans-serif] text-sm font-normal leading-5">
                WORK ORDER TOTAL
              </div>
              <div className="text-[#303030] font-['Geist',sans-serif] text-2xl font-medium leading-7">
                $1,350.00
              </div>
            </div>
          </div>

          {/* Notes Section */}
          <SectionCard
            variant="white"
            title="Notes"
            padding="compact"
            actions={
              <PopoverActionsDropdown
                row={{}}
                rowKey="id"
                actions={[
                  {
                    label: "Add Note",
                    icon: <Plus className="w-4 h-4" />,
                    onClick: () => {
                      setEditingNoteId(null);
                      setIsAddNoteModalOpen(true);
                    }
                  }
                ]}
              />
            }
          >
            <div className="p-4 pt-0">
              <NotesTemplate
                notes={notes}
                hideHeader={true}
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
            </div>
          </SectionCard>

          {/* Files Section */}
          <SectionCard
            variant="white"
            title="Recent Files"
            padding="compact"
            actions={
              <PopoverActionsDropdown
                row={{}}
                rowKey="id"
                actions={[
                  {
                    label: "Add File",
                    icon: <Plus className="w-4 h-4" />,
                    onClick: () => {
                      setEditingFileId(null);
                      setIsAddFileModalOpen(true);
                    }
                  }
                ]}
              />
            }
          >
            <div className="p-4 pt-0">
              <FilesTemplate
                files={files}
                hideHeader={true}
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
            </div>
          </SectionCard>
        </div>

        {/* Right Sidebar */}
        <div className="flex flex-col w-full lg:w-[376px] gap-6 flex-shrink-0">
          {/* Bills Card */}
          <BillsCard 
            bills={[
              {
                id: "1",
                date: "November 27",
                time: "5:00 PM",
                invoiceNumber: "234605",
                vendorName: "Dolce Heating & Plumbing",
                amount: "$1,350.00",
                status: "Paid",
              }
            ]}
          />

          {/* Assignees Card */}
          <PeopleCard
            title="Assignees"
            variant="white"
            tabs={["Staff", "Vendors", "Field Team"]}
            defaultTab={0}
            footerActions={[
              {
                label: "Email Staff",
                onClick: () => console.log("Email staff"),
                icon: <Mail className="w-4 h-4" />
              }
            ]}
            subsections={[
              {
                label: "Assigned to",
                mode: "rows",
                people: [
                  {
                    id: 1,
                    name: "Julia LoSchiavo",
                    initials: "JL",
                    roleLabel: "Staff member",
                    phone: "(203) 927-1280",
                    type: "staff"
                  }
                ],
                showRoleLabel: true,
                showPhone: true,
                showDivider: true,
                tabIndex: 0,
                actionLabel: "Edit",
                onAction: () => console.log("Edit assigned to")
              },
              {
                label: "Collaborators",
                mode: "rows",
                people: [
                  { id: 2, name: "Chris Henry", initials: "CH", type: "staff" },
                  { id: 3, name: "Connor Smith", initials: "CS", type: "staff" },
                ],
                showRoleLabel: false,
                showPhone: false,
                showDivider: false,
                tabIndex: 0,
                actionLabel: "Edit",
                onAction: () => console.log("Edit collaborators")
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
    </div>
  );
}
