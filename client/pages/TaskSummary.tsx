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
import { NotesTemplate } from "@/components/templates";
import { FilesTemplate } from "@/components/templates";
import type { Note } from "@/components/templates";
import type { File } from "@/components/templates";

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
              <NotesTemplate
                notes={notes}
                onAdd={() => console.log("Add note")}
                onEdit={(note) => console.log("Edit note", note)}
                onDelete={(noteId) =>
                  setNotes(notes.filter((n) => n.id !== noteId))
                }
              />

              {/* Files Section */}
              <FilesTemplate
                files={files}
                onAdd={() => console.log("Add file")}
                onEdit={(file) => console.log("Edit file", file)}
                onDelete={(fileId) =>
                  setFiles(files.filter((f) => f.id !== fileId))
                }
                onView={(file) => console.log("View file", file)}
              />

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
              <div className="flex flex-col min-w-[240px] w-[376px]">
                {/* Location Section */}
                <div className="flex flex-col w-full px-4 py-4 bg-[#f9f9f9] border border-[#e5e5e5] rounded-lg shadow-sm">
                  <div className="text-base text-[#303030] font-['Geist',sans-serif] font-medium">
                    Location
                  </div>
                  <div className="flex flex-col mt-3 w-full text-sm">
                    <img
                      src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/067809472377195b06444da037ab0e0c9542bf94?placeholderIfAbsent=true"
                      alt="Property"
                      className="w-full aspect-[1.8] rounded-lg object-cover"
                    />
                    <div className="mt-4 w-full">
                      <div className="text-sm font-['Inter',sans-serif] font-medium">
                        <span className="font-['Geist',sans-serif] font-bold text-[#2463eb]">
                          (C) 51 Willowmere Circle, Riverside CT 06878 -1
                        </span>
                      </div>
                      <div className="mt-2 text-sm text-[#717179] font-['Geist',sans-serif]">
                        51 Willowmere Circle Greenwich, CT 06878
                      </div>
                    </div>
                    <img
                      src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/b2c68a80effe0893f444c93ea4b66f4db8c65123?placeholderIfAbsent=true"
                      alt="Map"
                      className="mt-6 w-full aspect-[2.33] rounded-lg object-cover"
                    />
                  </div>
                </div>

                {/* Assignees Section */}
                <div className="flex flex-col w-full mt-[18px] px-4 py-4 bg-[#f9f9f9] border border-[#e5e5e5] rounded-lg shadow-sm font-['Geist',sans-serif]">
                  <div className="text-base text-[#303030] font-medium">
                    Assignees
                  </div>
                  <div className="mt-4 flex w-full px-0.5 py-0.5 bg-[#f2f2f2] rounded-lg shadow-[0px_0px_0px_1px_rgba(210,209,207,1)] text-sm text-[#282828] text-center">
                    <button className="flex items-center justify-center flex-1 px-4 py-1.5 bg-white rounded-md shadow-sm text-[#09090b] font-medium">
                      Staff
                    </button>
                    <button className="flex items-center justify-center flex-1 px-4 py-1.5 text-[#282828]">
                      Vendors
                    </button>
                    <button className="flex items-center justify-center flex-1 px-4 py-1.5 text-[#282828]">
                      Field Team
                    </button>
                  </div>

                  <div className="flex flex-col mt-4 w-full">
                    <div className="text-sm text-[#303030] font-medium">
                      Assigned to
                    </div>
                    <div className="flex items-center justify-between mt-3 w-full">
                      <div className="flex items-center gap-2.5 min-w-[240px] flex-1">
                        <div className="flex items-center justify-center w-10 h-10 bg-white border border-[#2463eb] rounded-full text-xl text-[#2463eb] font-semibold leading-[0.8]">
                          JL
                        </div>
                        <div className="flex flex-col flex-1 text-sm">
                          <div className="text-[#2463eb] font-medium tracking-[-0.28px]">
                            Julia LoSchiavo
                          </div>
                          <div className="mt-1 text-[#a1a1a9]">
                            Staff member
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="text-base text-[#2463eb] font-medium tracking-[-0.32px]">
                          Edit
                        </div>
                        <div className="mt-1 text-sm text-[#a1a1a9]">
                          (203) 927-1280
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="w-full h-px bg-[#e5e5e5] mt-4"></div>

                  <div className="flex flex-col mt-4 w-full">
                    <div className="text-sm text-[#303030] font-medium">
                      Collaborators
                    </div>
                    <div className="flex items-center justify-between mt-3 w-full gap-10 text-[#2463eb]">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center w-10 h-10 bg-white border border-[#2463eb] rounded-full text-xl font-semibold leading-[0.8]">
                          CH
                        </div>
                        <div className="flex items-center justify-center w-10 h-10 bg-white border border-[#2463eb] rounded-full text-xl font-semibold leading-[0.8]">
                          CS
                        </div>
                      </div>
                      <div className="text-base font-medium tracking-[-0.32px]">
                        Edit
                      </div>
                    </div>
                  </div>

                  <div className="w-full h-px bg-[#e5e5e5] mt-4"></div>

                  <button className="flex items-center justify-center gap-1 mt-4 w-full text-sm text-[#2463eb] font-medium tracking-[-0.28px] hover:underline">
                    <Mail className="w-4 h-4" />
                    Email staff
                  </button>
                </div>

                {/* Contacts Section */}
                <div className="flex flex-col w-full mt-[18px] px-4 py-4 bg-[#f9f9f9] border border-[#e5e5e5] rounded-lg shadow-sm font-['Geist',sans-serif]">
                  <div className="text-base text-[#303030] font-medium">
                    Contacts
                  </div>

                  <div className="flex flex-col mt-4 w-full">
                    <div className="text-sm text-[#303030] font-medium">
                      Created by
                    </div>
                    <div className="flex items-center justify-between mt-3 w-full">
                      <div className="flex items-center gap-2.5 min-w-[240px] flex-1">
                        <div className="flex items-center justify-center w-10 h-10 bg-white border border-[#2463eb] rounded-full text-xl text-[#2463eb] font-semibold leading-[0.8]">
                          JL
                        </div>
                        <div className="flex flex-col flex-1 text-sm">
                          <div className="text-[#2463eb] font-medium tracking-[-0.28px]">
                            Julia LoSchiavo
                          </div>
                          <div className="mt-1 text-[#a1a1a9]">
                            Staff member
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-[#a1a1a9]">
                        (203) 927-1280
                      </div>
                    </div>
                  </div>

                  <div className="w-full h-px bg-[#e5e5e5] mt-4"></div>

                  <div className="flex flex-col mt-4 w-full text-sm">
                    <div className="text-[#303030] font-medium">
                      Rental owners
                    </div>
                    <div className="flex items-center gap-2.5 mt-3 min-h-[40px] w-full">
                      <div className="flex items-center justify-center w-10 h-10 bg-white border border-[#2463eb] rounded-full text-xl text-[#2463eb] font-semibold leading-[0.8]">
                        PJ
                      </div>
                      <div className="flex flex-col flex-1">
                        <div className="text-[#2463eb] font-medium tracking-[-0.28px]">
                          Peter & Ali Jennison
                        </div>
                        <div className="mt-1 text-[#a1a1a9]">Rental Owner</div>
                      </div>
                      <div className="text-[#a1a1a9]">(203) 927-1280</div>
                    </div>
                  </div>

                  <div className="w-full h-px bg-[#e5e5e5] mt-4"></div>

                  <button className="flex items-center justify-center gap-1 mt-4 w-full text-sm text-[#2463eb] font-medium tracking-[-0.28px] hover:underline">
                    <Mail className="w-4 h-4" />
                    Email contacts
                  </button>
                </div>

                {/* Client Communication Section - COMMENTED OUT */}
                {false && (
                  <div className="flex flex-col mt-[18px] min-h-[534px]">
                    <div className="flex flex-col w-full max-w-[376px] bg-[#f9f9f9] border border-[#e5e5e5] rounded-lg shadow-sm overflow-hidden">
                      <div className="flex items-center justify-between gap-10 px-4 py-4 bg-white border-b border-[#e5e5e5] font-['Geist',sans-serif] text-base text-[#303030]">
                        <div className="font-medium">Client Communication</div>
                        <div className="flex items-center gap-3">
                          <button className="flex items-center gap-2 min-h-[28px] px-3 py-0.5 bg-[#fbfbfb] border border-[#dadada] rounded-lg shadow-sm tracking-[-0.32px] hover:bg-gray-50 transition-colors">
                            English
                            <ChevronDown className="w-4 h-4" />
                          </button>
                          <MoreVertical className="w-5 h-5" />
                        </div>
                      </div>

                      {/* Message List */}
                      <div className="px-4 space-y-4 mt-4 font-['Geist',sans-serif]">
                        <div className="flex gap-3">
                          <div className="flex items-center justify-center w-8 h-8 bg-white border border-[#2463eb] rounded-full text-sm text-[#2463eb] font-semibold leading-[0.91] flex-shrink-0">
                            MT
                          </div>
                          <div className="flex flex-col min-w-[240px] flex-1 text-black">
                            <div className="text-base font-semibold">
                              Michael Tran
                            </div>
                            <div className="mt-2 text-sm leading-4">
                              I just got back from a hiking trip, and the views
                              were breathtaking! You should try it.
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <div className="flex items-center justify-center w-8 h-8 bg-white border border-[#2463eb] rounded-full text-sm text-[#2463eb] font-semibold leading-[0.91] flex-shrink-0">
                            SP
                          </div>
                          <div className="flex flex-col min-w-[240px] flex-1 text-black">
                            <div className="text-base font-semibold">
                              Sara Patel
                            </div>
                            <div className="mt-2 text-sm leading-4">
                              The new art exhibit at the gallery opens this
                              weekend. Are you interested in going?
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <div className="flex items-center justify-center w-8 h-8 bg-white border border-[#2463eb] rounded-full text-sm text-[#2463eb] font-semibold leading-[0.91] flex-shrink-0">
                            DK
                          </div>
                          <div className="flex flex-col min-w-[240px] flex-1 text-black">
                            <div className="text-base font-semibold">
                              David Kim
                            </div>
                            <div className="mt-2 text-sm leading-4">
                              There's a great concert happening in the park next
                              week. We should grab some tickets!
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <div className="flex items-center justify-center w-8 h-8 bg-white border border-[#2463eb] rounded-full text-sm text-[#2463eb] font-semibold leading-[0.91] flex-shrink-0">
                            EJ
                          </div>
                          <div className="flex flex-col min-w-[240px] flex-1 text-black">
                            <div className="text-base font-semibold">
                              Emma Johnson
                            </div>
                            <div className="mt-2 text-sm leading-4">
                              I found a cute little cafe that serves the best
                              pastries. Want to check it out together?
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Message Input */}
                      <div className="flex flex-col mt-4 w-full">
                        <div className="flex flex-col px-4 py-4 bg-white border-b border-[#e5e5e5]">
                          <div className="flex min-h-[98px] w-full max-w-[345px] px-5 py-[17px] bg-white border border-[#2463eb] rounded-lg font-['Geist',sans-serif] text-sm text-black leading-4">
                            <textarea
                              value={messageText}
                              onChange={(e) => setMessageText(e.target.value)}
                              placeholder="I found a cute little cafe that serves the best pastries. Want to check it out together?"
                              className="flex-1 resize-none focus:outline-none"
                              rows={3}
                            />
                          </div>
                          <div className="flex items-center justify-between gap-10 mt-2.5 w-full py-px overflow-hidden">
                            <button className="flex items-center justify-center w-[33px] min-h-[28px] px-2 py-1.5 bg-[#fbfbfb] border border-[#dadada] rounded-lg shadow-sm hover:bg-gray-50 transition-colors">
                              <Paperclip className="w-[17px] h-[17px]" />
                            </button>
                            <button className="flex items-center gap-1.5 w-[156px] min-h-[28px] px-3 pr-2 py-0.5 bg-[#2463eb] border border-[#dadada] rounded-lg shadow-sm font-['Geist',sans-serif] text-base text-white tracking-[-0.32px] hover:bg-[#1d4ed8] transition-colors">
                              Send Message
                              <Send className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Field Team Orders tab content */}
          {activeTab === "fieldteam" && <FieldTeamOrdersTab />}
        </div>
      </div>
    </PageTemplate>
  );
}
