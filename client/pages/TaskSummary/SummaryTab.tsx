import React from "react";
import { useNavigate } from "react-router-dom";
import { EditIcon } from "@/components/icons";
import { SectionActionTemplate, TaskDetailsBarTemplate } from "@/components/templates";
import TaskOverviewCard from "@/components/TaskOverviewCard";
import TaskLocationCard from "@/components/TaskLocationCard";
import LinkedTasksCard from "@/components/LinkedTasksCard";
import TaskUpdatesTimeline from "@/components/TaskUpdatesTimeline";
import PeopleCard from "@/components/PeopleCard";
import SectionCard from "@/components/SectionCard";
import { NotesTemplate } from "@/components/templates";
import { FilesTemplate } from "@/components/templates";
import type { Note } from "@/components/templates";
import type { File } from "@/components/templates";

const vendorMasterData: Record<string, { id: number }> = {
  "ABC Doors & Hardware": { id: 1 },
  "Elite HVAC Services": { id: 2 },
  "Glass & Frames Inc": { id: 3 },
  "Pro Roofing Solutions": { id: 4 },
  "Dolce Plumbing & Heating LLC": { id: 5 },
  "Spark Electrical": { id: 6 },
  "Premium Painters Co": { id: 7 },
  "Quality Flooring LLC": { id: 8 },
  "Green Lawn Services": { id: 9 },
  "Outdoor Construction Corp": { id: 10 },
};

const getVendorHref = (vendorName: string): string | undefined => {
  const vendorId = vendorMasterData[vendorName]?.id;
  return vendorId ? `/vendors/${vendorId}` : undefined;
};

interface SummaryTabProps {
  currentCategory: string;
  currentDescription: string;
  currentStatus: string;
  currentPriority: string;
  currentDueDate: Date | null;
  currentProperty: string;
  currentUnit: string;
  createdTimestamp: string;
  lastUpdatedTimestamp: string;
  workOrders: any[];
  fieldTeamOrders: any[];
  notes: Note[];
  files: File[];
  updates: any[];
  linkedTasks: any[];
  currentAssignees: any[];
  currentCollaborators: any[];
  vendorsFromWorkOrders: any[];
  fieldTeamFromOrders: any[];
  isNewTask: boolean;
  taskData: any;
  onEditTaskDetails: () => void;
  onAddNote: () => void;
  onEditNote: (note: Note) => void;
  onDeleteNote: (noteId: number) => void;
  onAddFile: () => void;
  onEditFile: (file: File) => void;
  onDeleteFile: (fileId: number) => void;
  onViewFile: (file: File) => void;
  onLinkTasks: () => void;
  onUnlinkTask: (taskId: number) => void;
  onTaskClick: (taskId: number) => void;
  onAddUpdate: () => void;
  onEditTask: () => void;
  onStatusChange: (newStatus: string) => void;
  onPriorityChange: (newPriority: string) => void;
  onDueDateChange: (newDate: Date | string | null) => void;
  getPropertyDisplayLabel: (property: string) => string;
  getUnitDisplayLabel: (unit: string) => string;
  getPropertyName: (property: string) => string;
  getPropertyAddress: (property: string) => string;
  getRentalOwnerByProperty: (property: string) => any;
}

export default function SummaryTab({
  currentCategory,
  currentDescription,
  currentStatus,
  currentPriority,
  currentDueDate,
  currentProperty,
  currentUnit,
  createdTimestamp,
  lastUpdatedTimestamp,
  workOrders,
  fieldTeamOrders,
  notes,
  files,
  updates,
  linkedTasks,
  currentAssignees,
  currentCollaborators,
  vendorsFromWorkOrders,
  fieldTeamFromOrders,
  isNewTask,
  taskData,
  onEditTaskDetails,
  onAddNote,
  onEditNote,
  onDeleteNote,
  onAddFile,
  onEditFile,
  onDeleteFile,
  onViewFile,
  onLinkTasks,
  onUnlinkTask,
  onTaskClick,
  onAddUpdate,
  onEditTask,
  onStatusChange,
  onPriorityChange,
  onDueDateChange,
  getPropertyDisplayLabel,
  getUnitDisplayLabel,
  getPropertyName,
  getPropertyAddress,
  getRentalOwnerByProperty,
}: SummaryTabProps) {
  const navigate = useNavigate();

  // Calculate total expense from work orders and field team orders
  const calculateTotalExpense = () => {
    let total = 0;

    // Sum work order bill totals
    workOrders.forEach((wo) => {
      if (wo.billTotal) {
        // Parse billTotal string like "$420" or "$0.00"
        const amount = parseFloat(wo.billTotal.replace(/[$,]/g, ""));
        if (!isNaN(amount)) {
          total += amount;
        }
      }
    });

    // Sum field team order amounts
    fieldTeamOrders.forEach((fto) => {
      if (typeof fto.amount === "number") {
        total += fto.amount;
      }
    });

    return total.toFixed(2);
  };

  const totalExpense = calculateTotalExpense();

  return (
    <>
      {/* Left Column */}
      <div className="flex flex-col min-w-[240px] flex-1 gap-5">
        {/* Task Details Bar - Status, Priority, Due Date, Last Updated */}
        <SectionCard padding="none" variant="gray">
          <TaskDetailsBarTemplate
            status={currentStatus}
            priority={currentPriority}
            dueDate={currentDueDate}
            onStatusChange={onStatusChange}
            onPriorityChange={onPriorityChange}
            onDueDateChange={onDueDateChange}
          />
        </SectionCard>

        {/* Task Overview Card */}
        <TaskOverviewCard
          category={currentCategory || "Uncategorized"}
          description={currentDescription}
          status={currentStatus ? (currentStatus === "not_started" ? "Not Started" : currentStatus === "in_progress" ? "In Progress" : "Completed") : "Not Started"}
          priority={currentPriority ? currentPriority.charAt(0).toUpperCase() + currentPriority.slice(1) : "Normal"}
          dueDate={currentDueDate ? currentDueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "No due date"}
          createdBy={{
            name: "Julia LoSchiavo",
            email: "julia.loschiavo@company.com",
            phone: "(555) 123-4567",
            title: "Project Manager",
            property: currentProperty && currentProperty !== "Unassigned"
              ? `${getPropertyDisplayLabel(currentProperty)}${currentUnit ? ` - ${getUnitDisplayLabel(currentUnit)}` : ""}`
              : "Unassigned",
          }}
          createdDate={createdTimestamp}
          lastUpdatedDate={lastUpdatedTimestamp}
          stats={[
            { label: "TOTAL EXPENSE", value: `$${totalExpense}` },
            { label: "WORK ORDERS", value: workOrders.length.toString() },
            { label: "FTOs", value: fieldTeamOrders.length.toString() },
          ]}
          onEdit={onEditTaskDetails}
        />

        {/* Notes Section */}
        <SectionCard padding="compact">
          <NotesTemplate
            notes={notes}
            onAdd={onAddNote}
            onEdit={onEditNote}
            onDelete={onDeleteNote}
          />
        </SectionCard>

        {/* Files Section */}
        <SectionCard padding="compact">
          <FilesTemplate
            files={files}
            onAdd={onAddFile}
            onEdit={onEditFile}
            onDelete={onDeleteFile}
            onView={onViewFile}
          />
        </SectionCard>

        {/* Linked Tasks Card */}
        <LinkedTasksCard
          linkedTasks={linkedTasks}
          onLinkTasks={onLinkTasks}
          onUnlinkTask={onUnlinkTask}
          onTaskClick={onTaskClick}
        />

        {/* Updates Timeline */}
        <TaskUpdatesTimeline
          updates={updates}
          onAddUpdate={onAddUpdate}
        />
      </div>

      {/* Right Sidebar */}
      <div className="flex flex-col min-w-[240px] w-[376px] gap-5">
        {/* Location Card - Only show when property is selected */}
        {currentProperty && currentProperty !== "Unassigned" && (
          <TaskLocationCard
            propertyImage="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/067809472377195b06444da037ab0e0c9542bf94?placeholderIfAbsent=true"
            propertyName={`${getPropertyName(currentProperty)}${currentUnit ? ` - ${getUnitDisplayLabel(currentUnit)}` : ""}`}
            propertyAddress={getPropertyAddress(currentProperty)}
            mapImage="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/b2c68a80effe0893f444c93ea4b66f4db8c65123?placeholderIfAbsent=true"
            propertyId={currentProperty}
          />
        )}

        {/* Assignees Card */}
        {(currentAssignees.length > 0 || currentCollaborators.length > 0 || vendorsFromWorkOrders.length > 0 || fieldTeamFromOrders.length > 0) && (
          <PeopleCard
            title="Assignees"
            tabs={["Staff", "Vendors", "Field Team"]}
            defaultTab={0}
            subsections={[
              {
                label: "Assigned to",
                mode: "rows",
                people: currentAssignees.map((assignee) => ({
                  id: assignee.id,
                  name: assignee.name || assignee.label,
                  initials: assignee.initials,
                  roleLabel: assignee.title || "Property manager",
                  email: assignee.email,
                  phone: assignee.phone || "",
                  type: "staff",
                })),
                showRoleLabel: true,
                showPhone: true,
                showDivider: true,
                tabIndex: [0],
                type: "assignee",
                onAction: onEditTask,
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
                  email: collaborator.email,
                  phone: collaborator.phone || "",
                  type: "staff",
                })),
                showRoleLabel: true,
                showPhone: true,
                showDivider: true,
                tabIndex: [0],
                type: "collaborator",
                onAction: onEditTask,
                actionLabel: "Edit",
              },
              {
                label: "Vendors",
                mode: "rows",
                people: vendorsFromWorkOrders.map((vendor) => ({
                  id: vendor.id,
                  name: vendor.name,
                  initials: vendor.initials,
                  email: vendor.email,
                  roleLabel: vendor.title || "Vendor Company",
                  phone: vendor.phone || "",
                  type: "vendor",
                  href: getVendorHref(vendor.name),
                })),
                showRoleLabel: true,
                showPhone: true,
                showDivider: true,
                tabIndex: [1],
                type: "vendor",
              },
              {
                label: "Field Team",
                mode: "rows",
                people: fieldTeamFromOrders.map((fieldTeam) => ({
                  id: fieldTeam.id,
                  name: fieldTeam.name,
                  initials: fieldTeam.initials,
                  email: fieldTeam.email,
                  roleLabel: fieldTeam.title || "Field Team Member",
                  phone: fieldTeam.phone || "",
                  type: "fieldteam",
                })),
                showRoleLabel: true,
                showPhone: true,
                showDivider: true,
                tabIndex: [2],
                type: "fieldteam",
              },
            ]}
          />
        )}

        {/* Contacts Card */}
        {(() => {
          const rentalOwner = getRentalOwnerByProperty(taskData?.property);
          return (
            <PeopleCard
              subsections={[
                {
                  label: "Created by",
                  mode: "rows",
                  people: [
                    ...(isNewTask ? [
                      {
                        id: 0,
                        name: "Julia LoSchiavo",
                        initials: "JL",
                        email: "julia.loschiavo@company.com",
                        roleLabel: "Project Manager",
                        phone: "(555) 123-4567",
                      },
                    ] : [
                      {
                        id: 4,
                        name: "Julia LoSchiavo",
                        initials: "JL",
                        email: "julia.loschiavo@company.com",
                        roleLabel: "Project Manager",
                        phone: "(203) 927-1280",
                      },
                    ]),
                  ],
                  showRoleLabel: true,
                  showPhone: true,
                  showDivider: true,
                },
                ...(rentalOwner ? [
                  {
                    label: "Rental owners",
                    mode: "rows",
                    people: [rentalOwner],
                    showRoleLabel: true,
                    showPhone: true,
                    showDivider: true,
                  },
                ] : []),
              ]}
            />
          );
        })()}
      </div>
    </>
  );
}
