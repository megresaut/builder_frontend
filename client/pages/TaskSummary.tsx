import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ChevronDown,
  Bell,
  Edit,
  Upload,
  Link,
  Mail,
  Send,
  Paperclip,
  MoreVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import PageHeader from "@/components/PageHeader";
import PageTemplate from "@/layout/PageTemplate";
import WorkOrders from "./WorkOrders";
import WorkOrdersTab from "@/components/WorkOrdersTab";
import FieldTeamOrdersTab from "@/components/FieldTeamOrdersTab";
import { useTabContext } from "@/hooks/useTabContext";
import { usePageState } from "@/hooks/usePageState";

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
  const [messageText, setMessageText] = useState("");


  return (
    <PageTemplate>
      {/* Header Section */}
      <PageHeader
        title="Edgerton - Quote"
        subtitle={
          <div className="flex items-center font-medium gap-3 overflow-wrap-anywhere word-wrap-anywhere">
            <div className="block text-base font-medium">
              Resident Request
            </div>
            <svg width="4" height="4" viewBox="0 0 4 4" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="2" cy="2" r="2" fill="#717179" />
            </svg>
            <span className="block text-base font-medium">
              10244381
            </span>
            <svg width="4" height="4" viewBox="0 0 4 4" fill="none" xmlns="http://www.w3.org/2000/svg" />
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

        {/* Notifications Banner */}
        {activeTab === "summary" && (
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
              <div className="flex flex-col min-w-[240px] flex-1">
                {/* Task Details Card */}
                <div className="flex flex-col w-full px-4 py-4 bg-[#f9f9f9] border border-[#e5e5e5] rounded-lg shadow-sm font-['Geist',sans-serif]">
                  <div className="flex justify-between items-start gap-10 w-full flex-wrap">
                    <div className="flex flex-col min-w-[240px] flex-1">
                      <div className="flex items-center gap-2">
                        <div className="text-[#303030] text-[22px] font-semibold leading-[1.36]">
                          Overview
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-[#717179] font-medium">
                        Created by{" "}
                        <span className="font-bold text-[#2463eb]">
                          Julia LoSchiavo
                        </span>{" "}
                        for{" "}
                        <span className="font-bold text-[#2463eb]">
                          (C) 51 Willowmere Circle, Riverside CT 06878 -1
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-[#717179] tracking-[-0.28px]">
                      <span>Created</span>
                      <span>11/12/2025 9:22 PM</span>
                      <Edit className="w-4 h-4 ml-2 text-[#2463eb]" />
                      <span className="text-[#2463eb] font-medium">Edit</span>
                    </div>
                  </div>

                  <div className="flex flex-col mt-5 w-full items-start text-sm text-[#717179]">
                    <div className="flex items-center gap-1">
                      <span className="font-semibold">Category:</span>
                      <span className="font-medium">Uncategorized</span>
                    </div>
                  </div>

                  <div className="mt-5 text-sm text-[#717179] font-semibold">
                    Description:
                  </div>
                  <div className="mt-5 text-sm text-[#717179] font-medium leading-4">
                    We have been experiencing issues with the water heater. At
                    first we thought the issue was due to us just moving in and
                    maybe the water heater needed time to heat up after no
                    tenants. It has been 3 days in a row now that we lose hot
                    water mid shower. My wife and I both timed it and we lose
                    hot water in the shower after about 5 min. It also takes
                    about 3-4 min to even heat up.
                  </div>

                  <div className="w-full h-px bg-[#e5e5e5] mt-5"></div>

                  <div className="flex items-center gap-8 mt-5 flex-wrap">
                    <div className="flex flex-col items-center">
                      <div className="text-sm text-[#717179]">
                        TOTAL EXPENSE
                      </div>
                      <div className="mt-1 text-2xl text-[#303030] font-medium">
                        $1,450.50
                      </div>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="text-sm text-[#717179]">WORK ORDERS</div>
                      <div className="mt-1 text-2xl text-[#303030] font-medium">
                        5
                      </div>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="text-sm text-[#717179]">FTOs</div>
                      <div className="mt-1 text-2xl text-[#303030] font-medium">
                        3
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes Section */}
                <div className="flex flex-col w-full mt-[18px] px-4 py-4 bg-[#f9f9f9] border border-[#e5e5e5] rounded-lg shadow-sm font-['Geist',sans-serif]">
                  <div className="text-base text-[#303030] font-medium">
                    Notes
                  </div>
                  <textarea
                    placeholder="Add some note here"
                    className="mt-4 min-h-[81px] w-full px-3 py-2 bg-white border border-[#dadada] rounded-lg text-sm text-[#303030] placeholder:text-[#a1a1a9] resize-none focus:outline-none focus:border-[#2463eb]"
                    rows={4}
                  />
                </div>

                {/* Files Section */}
                <div className="flex flex-col w-full mt-[18px] px-4 py-4 bg-[#f9f9f9] border border-[#e5e5e5] rounded-lg shadow-sm font-['Geist',sans-serif]">
                  <div className="text-base text-[#303030] font-medium">
                    Files
                  </div>
                  <div className="mt-4 flex flex-col items-center px-52 py-7 bg-white border border-dashed border-[rgba(18,18,18,0.4)] rounded-lg">
                    <button className="flex items-center gap-2 min-h-[36px] px-3 py-1.5 bg-[#fbfbfb] border border-[#dadada] rounded-lg shadow-sm text-base text-[#303030] tracking-[-0.32px] hover:bg-gray-50 transition-colors">
                      <Upload className="w-4 h-4" />
                      Upload
                    </button>
                    <div className="mt-3 px-2.5 py-2.5 flex flex-col items-center text-sm text-[#09090b]">
                      <div>Choose a file or drag & drop it here</div>
                      <div className="mt-1.5 text-sm">
                        Maximum 500 MB file size
                      </div>
                    </div>
                  </div>

                  {/* File List */}
                  <div className="mt-4 flex flex-col w-full">
                    <div className="flex items-center gap-2 text-sm text-[#09090b] font-['Geist',sans-serif] font-medium">
                      <span>Files</span>
                    </div>
                    <div className="mt-2 flex flex-col gap-2 w-full">
                      <div className="flex items-center justify-between gap-3 px-4 py-3 bg-white border border-[#e5e5e5] rounded-lg">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="flex-shrink-0 w-10 h-10 bg-[#ef4444] rounded flex items-center justify-center">
                            <span className="text-white text-xs font-bold">
                              PDF
                            </span>
                          </div>
                          <div className="flex flex-col min-w-0 flex-1">
                            <div className="text-sm text-[#303030] font-medium truncate">
                              Lorem Ipsum.PDF
                            </div>
                            <div className="flex items-center gap-2 text-xs text-[#717179] mt-0.5">
                              <span>PDF</span>
                              <span>112KB</span>
                            </div>
                          </div>
                        </div>
                        <button className="flex-shrink-0 w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors">
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="none"
                          >
                            <path
                              d="M2 14L14 2M14 14L2 2"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                            />
                          </svg>
                        </button>
                      </div>
                      <div className="flex items-center justify-between gap-3 px-4 py-3 bg-white border border-[#e5e5e5] rounded-lg">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="flex-shrink-0 w-10 h-10 bg-[#ef4444] rounded flex items-center justify-center">
                            <span className="text-white text-xs font-bold">
                              PDF
                            </span>
                          </div>
                          <div className="flex flex-col min-w-0 flex-1">
                            <div className="text-sm text-[#303030] font-medium truncate">
                              Lorem Ipsum.PDF
                            </div>
                            <div className="flex items-center gap-2 text-xs text-[#717179] mt-0.5">
                              <span>PDF</span>
                              <span>112KB</span>
                            </div>
                          </div>
                        </div>
                        <button className="flex-shrink-0 w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors">
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="none"
                          >
                            <path
                              d="M2 14L14 2M14 14L2 2"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Linked Tasks Section */}
                <div className="flex flex-col w-full mt-[18px] px-4 py-4 bg-[#f9f9f9] border border-[#e5e5e5] rounded-lg shadow-sm font-['Geist',sans-serif]">
                  <div className="flex items-center justify-between gap-10 text-base font-medium flex-wrap">
                    <div className="flex items-center gap-1 text-[#303030]">
                      <span>Linked tasks</span>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="currentColor"
                      >
                        <circle cx="8" cy="8" r="6" fill="#e5e5e5" />
                        <text
                          x="50%"
                          y="50%"
                          dominantBaseline="middle"
                          textAnchor="middle"
                          fontSize="10"
                          fontWeight="600"
                        >
                          3
                        </text>
                      </svg>
                    </div>
                    <button className="flex items-center gap-1 text-[#2463eb] tracking-[-0.32px] hover:underline">
                      <Link className="w-4 h-4" />
                      Link tasks
                    </button>
                  </div>
                  <div className="mt-4 flex items-center justify-center min-h-[72px] w-full px-3 py-7 bg-white border border-[#dadada] rounded-lg text-sm text-[#09090b]">
                    No linked tasks yet
                  </div>
                </div>

                {/* Updates Section */}
                <div className="flex flex-col w-full mt-[18px] px-4 py-4 bg-white border border-[#e5e5e5] rounded-lg shadow-sm">
                  <div className="text-base text-[#303030] font-['Geist',sans-serif] font-medium mb-4">
                    Updates
                  </div>
                  <div className="flex gap-4">
                    {/* Timeline Icons */}
                    <div className="flex flex-col items-center gap-2">
                      <button className="flex items-center justify-center w-10 h-10 bg-[#013764] border border-white rounded-full text-white hover:bg-[#014777] transition-colors">
                        <span className="text-lg font-semibold">+</span>
                      </button>
                      <div className="w-1 h-12 bg-gray-200"></div>
                      <div className="flex items-center justify-center w-10 h-10 bg-[#dbe9fe] border border-[#2463eb] rounded-full text-[#2463eb] font-semibold text-sm"></div>
                      <div className="w-1 h-12 bg-gray-200"></div>
                      <div className="flex items-center justify-center w-10 h-10 bg-[#d1fae5] border border-[#059669] rounded-full text-[#059669] font-semibold text-sm"></div>
                      <div className="w-1 h-12 bg-gray-200"></div>
                      <div className="flex items-center justify-center w-10 h-10 bg-[#d1fae5] border border-[#059669] rounded-full text-[#059669] font-semibold text-sm"></div>
                      <div className="w-1 h-12 bg-gray-200"></div>
                      <div className="flex items-center justify-center w-10 h-10 bg-[#d1fae5] border border-[#059669] rounded-full text-[#059669] font-semibold text-sm"></div>
                      <div className="w-1 h-12 bg-gray-200"></div>
                      <div className="flex items-center justify-center w-10 h-10 bg-[#dbe9fe] border border-[#2463eb] rounded-full text-[#2463eb] font-semibold text-sm"></div>
                      <div className="w-1 h-12 bg-gray-200"></div>
                      <div className="flex items-center justify-center w-10 h-10 bg-gray-200 border border-gray-300 rounded-full text-gray-600 font-semibold text-sm"></div>
                      <div className="w-1 h-12 bg-gray-200"></div>
                      <div className="flex items-center justify-center w-10 h-10 bg-gray-200 border border-gray-300 rounded-full text-gray-600 font-semibold text-sm"></div>
                    </div>

                    {/* Update Items */}
                    <div className="flex flex-col flex-1 gap-3">
                      <div className="px-4 py-2.5 bg-gray-50 border border-[#e5e5e5] rounded-lg text-base text-[#303030] font-['Geist',sans-serif]">
                        Update task
                      </div>

                      {/* Update 1 */}
                      <div className="flex items-start gap-3 px-4 py-3 bg-white border border-[#e5e5e5] rounded-lg">
                        <div className="flex items-center justify-center w-10 h-10 bg-white border border-[#2463eb] rounded-full text-base text-[#2463eb] font-semibold flex-shrink-0">
                          JL
                        </div>
                        <div className="flex flex-col flex-1 min-w-0">
                          <div className="text-sm text-[#303030]">
                            <span className="font-medium">Julia LoSchiavo</span>{" "}
                            submitted an{" "}
                            <span className="text-[#2463eb] font-medium">
                              8.0 Hour
                            </span>{" "}
                            <span>Field Team Submission</span>
                          </div>
                          <div className="text-xs text-[#a1a1a9] mt-1">
                            11/12/2025 9:22 PM
                          </div>
                        </div>
                        <button className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Update 2 */}
                      <div className="flex items-start gap-3 px-4 py-3 bg-white border border-[#e5e5e5] rounded-lg">
                        <div className="flex items-center justify-center w-10 h-10 bg-white border border-[#2463eb] rounded-full text-base text-[#2463eb] font-semibold flex-shrink-0">
                          MK
                        </div>
                        <div className="flex flex-col flex-1 min-w-0">
                          <div className="text-sm text-[#303030]">
                            <span className="font-medium">
                              Meghashyam Krishnasamy
                            </span>{" "}
                            updated the priority from{" "}
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#dbe9fe] rounded text-xs text-[#2463eb]">
                              Normal
                            </span>{" "}
                            to{" "}
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#d1fae5] rounded text-xs text-[#059669]">
                              Low
                            </span>
                          </div>
                          <div className="text-xs text-[#a1a1a9] mt-1">
                            11/12/2025 9:22 PM
                          </div>
                        </div>
                        <button className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Update 3 */}
                      <div className="flex items-start gap-3 px-4 py-3 bg-white border border-[#e5e5e5] rounded-lg">
                        <div className="flex items-center justify-center w-10 h-10 bg-white border border-[#2463eb] rounded-full text-base text-[#2463eb] font-semibold flex-shrink-0">
                          JL
                        </div>
                        <div className="flex flex-col flex-1 min-w-0">
                          <div className="text-sm text-[#303030]">
                            <span className="font-medium">Julia LoSchiavo</span>{" "}
                            updated status to{" "}
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#d1fae5] rounded text-xs text-[#059669]">
                              ✓ Completed
                            </span>{" "}
                            for{" "}
                            <span className="text-[#2463eb] font-medium">
                              Work Order #1024431
                            </span>
                          </div>
                          <div className="text-xs text-[#a1a1a9] mt-1">
                            11/12/2025 9:22 PM
                          </div>
                        </div>
                        <button className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Update 4 */}
                      <div className="flex items-start gap-3 px-4 py-3 bg-white border border-[#e5e5e5] rounded-lg">
                        <div className="flex items-center justify-center w-10 h-10 bg-white border border-[#2463eb] rounded-full text-base text-[#2463eb] font-semibold flex-shrink-0">
                          MK
                        </div>
                        <div className="flex flex-col flex-1 min-w-0">
                          <div className="text-sm text-[#303030]">
                            <span className="font-medium">
                              Meghashyam Krishnasamy
                            </span>{" "}
                            sent a payment of{" "}
                            <span className="text-[#2463eb] font-medium">
                              $1,450.00
                            </span>{" "}
                            for{" "}
                            <span className="text-[#2463eb] font-medium">
                              Work Order #1024431
                            </span>
                          </div>
                          <div className="text-xs text-[#a1a1a9] mt-1">
                            11/12/2025 9:22 PM
                          </div>
                        </div>
                        <button className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Update 5 */}
                      <div className="flex items-start gap-3 px-4 py-3 bg-white border border-[#e5e5e5] rounded-lg">
                        <div className="flex items-center justify-center w-10 h-10 bg-white border border-[#2463eb] rounded-full text-base text-[#2463eb] font-semibold flex-shrink-0">
                          JL
                        </div>
                        <div className="flex flex-col flex-1 min-w-0">
                          <div className="text-sm text-[#303030]">
                            <span className="font-medium">Julia LoSchiavo</span>{" "}
                            added a vendor estimate of{" "}
                            <span className="text-[#2463eb] font-medium">
                              $1,450.00
                            </span>{" "}
                            for{" "}
                            <span className="text-[#2463eb] font-medium">
                              Work Order #1024431
                            </span>
                          </div>
                          <div className="text-xs text-[#a1a1a9] mt-1">
                            11/12/2025 9:22 PM
                          </div>
                        </div>
                        <button className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Update 6 */}
                      <div className="flex items-start gap-3 px-4 py-3 bg-white border border-[#e5e5e5] rounded-lg">
                        <div className="flex items-center justify-center w-10 h-10 bg-white border border-[#2463eb] rounded-full text-base text-[#2463eb] font-semibold flex-shrink-0">
                          JL
                        </div>
                        <div className="flex flex-col flex-1 min-w-0">
                          <div className="text-sm text-[#303030]">
                            <span className="font-medium">Julia LoSchiavo</span>{" "}
                            created a work order for{" "}
                            <span className="text-[#2463eb] font-medium">
                              Edgerton Inc.
                            </span>
                          </div>
                          <div className="text-xs text-[#a1a1a9] mt-1">
                            11/12/2025 9:22 PM
                          </div>
                        </div>
                      </div>

                      {/* Update 7 */}
                      <div className="flex items-start gap-3 px-4 py-3 bg-white border border-[#e5e5e5] rounded-lg">
                        <div className="flex items-center justify-center w-10 h-10 bg-white border border-[#2463eb] rounded-full text-base text-[#2463eb] font-semibold flex-shrink-0">
                          JL
                        </div>
                        <div className="flex flex-col flex-1 min-w-0">
                          <div className="text-sm text-[#303030]">
                            <span className="font-medium">Julia LoSchiavo</span>{" "}
                            created a new task
                          </div>
                          <div className="text-xs text-[#a1a1a9] mt-1">
                            11/12/2025 9:22 PM
                          </div>
                          <div className="mt-3 pt-3 border-t border-[#e5e5e5] space-y-2">
                            <div className="flex items-center gap-2 text-xs">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#d1fae5] rounded text-[#059669]">
                                ✓ Completed
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#dbe9fe] rounded text-[#2463eb]">
                                Normal
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-[#303030] font-medium">
                                Collaborators:
                              </span>
                              <div className="flex gap-1">
                                <div className="w-6 h-6 bg-white border border-[#2463eb] rounded-full flex items-center justify-center text-[10px] text-[#2463eb] font-semibold">
                                  JL
                                </div>
                                <div className="w-6 h-6 bg-white border border-[#2463eb] rounded-full flex items-center justify-center text-[10px] text-[#2463eb] font-semibold">
                                  CH
                                </div>
                                <div className="w-6 h-6 bg-white border border-[#2463eb] rounded-full flex items-center justify-center text-[10px] text-[#2463eb] font-semibold">
                                  CS
                                </div>
                              </div>
                            </div>
                            <div className="text-xs text-[#717179]">
                              <span className="font-medium">Description:</span>{" "}
                              We have been experiencing issues with the water
                              heater. At first we thought the issue was due to
                              us just moving in and maybe the water heater
                              needed time to heat up after no tenants. It has
                              been 3 days in a row now that we lose hot water
                              mid shower...
                            </div>
                          </div>
                        </div>
                        <button className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
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

                {/* Client Communication Section */}
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
