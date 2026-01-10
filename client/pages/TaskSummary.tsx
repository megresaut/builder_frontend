import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Mail } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import PageTemplate from "@/layout/PageTemplate";
import WorkOrders from "./WorkOrders";
import WorkOrdersTab from "@/components/WorkOrdersTab";
import FieldTeamOrdersTab from "@/components/FieldTeamOrdersTab";
import { useTabContext } from "@/hooks/useTabContext";
import { usePageState } from "@/hooks/usePageState";
import TaskOverviewCard from "@/components/TaskOverviewCard";
import TaskLocationCard from "@/components/TaskLocationCard";
import LinkedTasksCard from "@/components/LinkedTasksCard";
import TaskUpdatesTimeline from "@/components/TaskUpdatesTimeline";
import PeopleCard from "@/components/PeopleCard";
import SectionCard from "@/components/SectionCard";
import AddNoteModal from "@/components/AddNoteModal";
import AddFileModal from "@/components/AddFileModal";
import { NotesTemplate } from "@/components/templates";
import { FilesTemplate } from "@/components/templates";
import type { Note } from "@/components/templates";
import type { File } from "@/components/templates";
import type { UploadedFile } from "@/components/ui/attachment-uploader";

export default function TaskSummary() {
  const { taskId, tab, workOrderId } = useParams<{
    taskId: string;
    tab?: string;
    workOrderId?: string;
  }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<
    "summary" | "workorders" | "fieldteam"
  >((tab as "summary" | "workorders" | "fieldteam") || "summary");
  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState<number | null>(
    workOrderId ? parseInt(workOrderId) : null,
  );

  // Mock state for notes, files, and updates
  const [notes, setNotes] = useState<Note[]>([
    {
      id: 1,
      text: "Initial task setup completed",
      date: "11/12/2025 9:22 PM",
      author: "Julia LoSchiavo",
    },
  ]);

  const [files, setFiles] = useState<File[]>([
    {
      id: 1,
      name: "Lorem Ipsum.PDF",
      uploadedAt: "11/12/2025 9:22 PM",
      category: "PDF",
    },
  ]);

  // Modal states
  const [isAddNoteModalOpen, setIsAddNoteModalOpen] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [isAddFileModalOpen, setIsAddFileModalOpen] = useState(false);
  const [editingFileId, setEditingFileId] = useState<number | null>(null);

  // Get current note/file being edited for initial values
  const editingNote = editingNoteId
    ? notes.find((n) => n.id === editingNoteId)
    : null;
  const editingFile = editingFileId
    ? files.find((f) => f.id === editingFileId)
    : null;

  // Sync activeTab with URL params
  useEffect(() => {
    if (tab) {
      setActiveTab(tab as "summary" | "workorders" | "fieldteam");
    }
  }, [tab]);

  // Sync selectedWorkOrderId with URL params
  useEffect(() => {
    setSelectedWorkOrderId(workOrderId ? parseInt(workOrderId) : null);
  }, [workOrderId]);

  const handleTabChange = (newTab: "summary" | "workorders" | "fieldteam") => {
    navigate(`/tasks/${taskId}/${newTab}`);
  };

  const handleWorkOrderSelect = (woId: number | null) => {
    if (woId !== null) {
      navigate(`/tasks/${taskId}/workorders/${woId}`);
      return;
    }

    navigate(`/tasks/${taskId}/workorders`);
  };

  return (
    <PageTemplate>
      {/* Header Section */}
      <PageHeader
        title="Edgerton - Quote"
        subtitle={
          <div className="flex items-center font-medium gap-3 overflow-wrap-anywhere word-wrap-anywhere">
            <div className="block text-base font-medium">Resident Request</div>
            <svg
              width="4"
              height="4"
              viewBox="0 0 4 4"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="2" cy="2" r="2" fill="#717179" />
            </svg>
            <span className="block text-base font-medium">10244381</span>
            <svg
              width="4"
              height="4"
              viewBox="0 0 4 4"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            />
          </div>
        }
        actionButton={{
          label: "Update task",
          onClick: () => {
            // Handle update task click
          },
        }}
        moreOptions={{
          onView: () => {
            // Handle view
          },
          onDelete: () => {
            // Handle delete
          },
        }}
      />

      {/* Tabs Section */}
      <div className="flex flex-col mt-6 w-full">
        <div className="flex items-start gap-6 min-h-[36px] w-full border-b border-[#e5e5e5] font-['Geist',sans-serif] text-base text-[#717179] font-medium flex-nowrap overflow-x-auto">
          <button
            onClick={() => handleTabChange("summary")}
            className={`flex items-center gap-1.5 py-2 whitespace-nowrap ${
              activeTab === "summary"
                ? "border-b-2 border-[#09090b] text-[#09090b]"
                : "hover:text-[#09090b]"
            } transition-colors`}
          >
            Summary
          </button>
          <button
            onClick={() => handleTabChange("workorders")}
            className={`flex items-center gap-1.5 py-2 whitespace-nowrap ${
              activeTab === "workorders"
                ? "border-b-2 border-[#09090b] text-[#09090b]"
                : "hover:text-[#09090b]"
            } transition-colors`}
          >
            Work orders
          </button>
          <button
            onClick={() => handleTabChange("fieldteam")}
            className={`flex items-center gap-1.5 py-2 whitespace-nowrap ${
              activeTab === "fieldteam"
                ? "border-b-2 border-[#09090b] text-[#09090b]"
                : "hover:text-[#09090b]"
            } transition-colors`}
          >
            Field Team Orders
          </button>
        </div>

        {/* Notifications Banner - COMMENTED OUT */}
        {false && activeTab === "summary" && (
          <div className="flex flex-col mt-5 w-full border border-[#e3e3e3] rounded-[10px] overflow-hidden font-['Geist',sans-serif]">
            <div className="flex items-center justify-between gap-10 px-3 py-3 bg-[#f9f9f9] max-w-full flex-wrap">
              <div className="flex items-center gap-2">
                <Bell className="w-[18px] h-[18px]" />
                <div className="text-base text-[#303030] font-bold tracking-[-0.32px]">
                  Notifications
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between px-3 py-3 bg-white flex-wrap">
              <div className="flex items-center gap-2 min-w-[240px] flex-1">
                <div className="w-1.5 h-1.5 rounded-full bg-[#e5e5e5]"></div>
                <div className="text-base text-[#303030]">
                  Task looks similar to a previous task XYZ. Would you like to
                  link tasks?
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm tracking-[-0.28px]">
                <button className="text-[#303030] underline hover:no-underline">
                  Dismiss
                </button>
                <button className="text-[#2463eb] hover:underline">
                  Approve
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex mt-5 w-full gap-6 flex-wrap lg:flex-nowrap">
          {/* Show WorkOrdersTab component when work orders tab is active */}
          {activeTab === "workorders" && (
            <WorkOrdersTab
              taskId={taskId}
              initialSelectedWorkOrderId={selectedWorkOrderId}
              onWorkOrderSelect={handleWorkOrderSelect}
            />
          )}

          {/* Show summary content when summary tab is active */}
          {activeTab === "summary" && (
            <>
              {/* Left Column */}
              <div className="flex flex-col min-w-[240px] flex-1 gap-5">
                {/* Task Overview Card */}
              <TaskOverviewCard
                category="Uncategorized"
                description="We have been experiencing issues with the water heater. At first we thought the issue was due to us just moving in and maybe the water heater needed time to heat up after no tenants. It has been 3 days in a row now that we lose hot water mid shower. My wife and I both timed it and we lose hot water in the shower after about 5 min. It also takes about 3-4 min to even heat up."
                createdBy={{
                  name: "Julia LoSchiavo",
                  property: "(C) 51 Willowmere Circle, Riverside CT 06878 -1",
                }}
                createdDate="11/12/2025 9:22 PM"
                stats={[
                  { label: "TOTAL EXPENSE", value: "$1,450.50" },
                  { label: "WORK ORDERS", value: "5" },
                  { label: "FTOs", value: "3" },
                ]}
                onEdit={() => console.log("Edit task")}
              />

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
                  onDelete={(noteId) =>
                    setNotes(notes.filter((n) => n.id !== noteId))
                  }
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
                  onDelete={(fileId) =>
                    setFiles(files.filter((f) => f.id !== fileId))
                  }
                  onView={(file) => console.log("View file", file)}
                />
              </SectionCard>

              {/* Linked Tasks Card */}
              <LinkedTasksCard
                count={3}
                onLinkTasks={() => console.log("Link tasks")}
              />

              {/* Updates Timeline */}
              <TaskUpdatesTimeline
                updates={[
                  {
                    id: 1,
                    initials: "JL",
                    author: "Julia LoSchiavo",
                    action: "submitted an",
                    actionValue: "8.0 Hour Field Team Submission",
                    timestamp: "11/12/2025 9:22 PM",
                  },
                  {
                    id: 2,
                    initials: "MK",
                    author: "Meghashyam Krishnasamy",
                    action: "updated the priority from Normal to Low",
                    timestamp: "11/12/2025 9:22 PM",
                  },
                  {
                    id: 3,
                    initials: "JL",
                    author: "Julia LoSchiavo",
                    action: "updated status to ✓ Completed for Work Order #1024431",
                    timestamp: "11/12/2025 9:22 PM",
                  },
                ]}
                onAddUpdate={() => console.log("Add update")}
              />
            </div>

              {/* Right Sidebar */}
              <div className="flex flex-col min-w-[240px] w-[376px] gap-5">
                {/* Location Card */}
                <TaskLocationCard
                  propertyImage="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/067809472377195b06444da037ab0e0c9542bf94?placeholderIfAbsent=true"
                  propertyName="(C) 51 Willowmere Circle, Riverside CT 06878 -1"
                  propertyAddress="51 Willowmere Circle Greenwich, CT 06878"
                  mapImage="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/b2c68a80effe0893f444c93ea4b66f4db8c65123?placeholderIfAbsent=true"
                />

                {/* Assignees Card */}
                <PeopleCard
                  title="Assignees"
                  tabs={["Staff", "Vendors", "Field Team"]}
                  defaultTab={0}
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
                        },
                      ],
                      actionLabel: "Edit",
                      onAction: () => console.log("Edit assignee"),
                      showRoleLabel: true,
                      showPhone: true,
                      showDivider: true,
                    },
                    {
                      label: "Collaborators",
                      mode: "avatars",
                      people: [
                        {
                          id: 2,
                          name: "Chris Henry",
                          initials: "CH",
                        },
                        {
                          id: 3,
                          name: "Connor Smith",
                          initials: "CS",
                        },
                      ],
                      actionLabel: "Edit",
                      onAction: () => console.log("Edit collaborators"),
                      showDivider: true,
                      density: "compact",
                    },
                  ]}
                  footerActions={[
                    {
                      label: "Email staff",
                      onClick: () => console.log("Email staff"),
                      icon: <Mail className="w-4 h-4" />,
                    },
                  ]}
                />

                {/* Contacts Card */}
                <PeopleCard
                  title="Contacts"
                  subsections={[
                    {
                      label: "Created by",
                      mode: "rows",
                      people: [
                        {
                          id: 4,
                          name: "Julia LoSchiavo",
                          initials: "JL",
                          roleLabel: "Staff member",
                          phone: "(203) 927-1280",
                        },
                      ],
                      showRoleLabel: true,
                      showPhone: true,
                      showDivider: true,
                    },
                    {
                      label: "Rental owners",
                      mode: "rows",
                      people: [
                        {
                          id: 5,
                          name: "Peter & Ali Jennison",
                          initials: "PJ",
                          roleLabel: "Rental Owner",
                          phone: "(203) 927-1280",
                        },
                      ],
                      showRoleLabel: true,
                      showPhone: true,
                      showDivider: true,
                    },
                  ]}
                  footerActions={[
                    {
                      label: "Email contacts",
                      onClick: () => console.log("Email contacts"),
                      icon: <Mail className="w-4 h-4" />,
                    },
                  ]}
                />
              </div>
            </>
          )}

          {/* Field Team Orders tab content */}
          {activeTab === "fieldteam" && <FieldTeamOrdersTab />}
        </div>
      </div>

      {/* Add/Edit Note Modal */}
      <AddNoteModal
        open={isAddNoteModalOpen}
        onOpenChange={setIsAddNoteModalOpen}
        onSubmit={(text) => {
          if (editingNoteId) {
            // Edit existing note
            setNotes(
              notes.map((n) =>
                n.id === editingNoteId
                  ? { ...n, text, date: new Date().toLocaleString() }
                  : n,
              ),
            );
          } else {
            // Add new note
            const maxId = notes.length > 0 ? Math.max(...notes.map((n) => n.id)) : 0;
            const newNote: Note = {
              id: maxId + 1,
              text,
              date: new Date().toLocaleString(),
              author: "Current User",
            };
            setNotes([newNote, ...notes]);
          }
          setEditingNoteId(null);
          setIsAddNoteModalOpen(false);
        }}
        initialText={editingNote?.text || ""}
        isEditMode={!!editingNoteId}
        title={editingNoteId ? "Edit Note" : "Add Note"}
        submitLabel={editingNoteId ? "Update" : "Add"}
      />

      {/* Add/Edit File Modal */}
      <AddFileModal
        open={isAddFileModalOpen}
        onOpenChange={setIsAddFileModalOpen}
        onSubmit={(uploadedFiles, category, description) => {
          if (editingFileId) {
            // Edit existing file
            setFiles(
              files.map((f) =>
                f.id === editingFileId
                  ? {
                      ...f,
                      category: category || f.category,
                      description,
                    }
                  : f,
              ),
            );
          } else {
            // Add new file - convert UploadedFile to File
            const newFiles: File[] = uploadedFiles.map((uf) => ({
              id: Math.max(...files.map((f) => f.id), 0) + 1,
              name: uf.name,
              url: uf.url,
              uploadedAt: new Date().toLocaleString(),
              category,
              description,
            }));
            setFiles([...newFiles, ...files]);
          }
          setEditingFileId(null);
          setIsAddFileModalOpen(false);
        }}
        initialFiles={
          editingFile
            ? [
                {
                  id: editingFile.id.toString(),
                  name: editingFile.name,
                  url: editingFile.url,
                  file: null as any,
                },
              ]
            : []
        }
        initialCategory={editingFile?.category || ""}
        initialDescription={editingFile?.description || ""}
        isEditMode={!!editingFileId}
        title={editingFileId ? "Edit File" : "Add File"}
        submitLabel={editingFileId ? "Update" : "Add"}
      />
    </PageTemplate>
  );
}
