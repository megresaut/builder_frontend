import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";
import {
  ChevronDown,
  Calendar,
  MoreVertical,
  Bell,
  Edit,
  Upload,
  Link,
  Mail,
  Send,
  Paperclip,
} from "lucide-react";
import { cn } from "@/lib/utils";
import WorkOrders from "./WorkOrders";
import WorkOrdersTab from "@/components/WorkOrdersTab";
import CreateFTOModal from "@/components/CreateFTOModal";
import FTOApprovalModal from "@/components/FTOApprovalModal";
import { useTabContext } from "@/hooks/useTabContext";
import { usePageState } from "@/hooks/usePageState";
import { useSortingTable } from "@/hooks/useSortingTable";

interface FieldTeamOrder {
  id: number;
  property: string;
  description: string;
  dueDate: string;
  unit?: string;
  priority: "low" | "normal" | "high";
  fieldTeam: Array<{ initials: string; color: string; name: string }>;
  status: "dispatched" | "approved" | "pending-approval";
  timesheetStatus:
    | "awaiting-submission"
    | "submitted"
    | "rejected"
    | "approved";
  amount: number;
}

const getRandomTimesheetStatus = ():
  | "awaiting-submission"
  | "submitted"
  | "rejected"
  | "approved" => {
  const statuses: (
    | "awaiting-submission"
    | "submitted"
    | "rejected"
    | "approved"
  )[] = ["awaiting-submission", "submitted", "rejected", "approved"];
  return statuses[Math.floor(Math.random() * statuses.length)];
};

const fieldTeamOrders: FieldTeamOrder[] = [
  {
    id: 1,
    property: "22 Indian Chase Dr",
    description: "Doors Need To Be Repaired",
    dueDate: "Oct 2, 2025",
    unit: "1",
    priority: "high",
    fieldTeam: [
      { initials: "CH", color: "bg-blue-500", name: "Christopher Harris" },
      { initials: "CS", color: "bg-blue-500", name: "Cassandra Smith" },
    ],
    status: "dispatched",
    timesheetStatus: getRandomTimesheetStatus(),
    amount: 420,
  },
  {
    id: 2,
    property: "22 Indian Chase Dr",
    description: "Doors Need To Be Repaired",
    dueDate: "Sep 29, 2025",
    priority: "normal",
    fieldTeam: [
      { initials: "CH", color: "bg-blue-500", name: "Christopher Harris" },
      { initials: "CS", color: "bg-blue-500", name: "Cassandra Smith" },
    ],
    status: "approved",
    timesheetStatus: getRandomTimesheetStatus(),
    amount: 95,
  },
  {
    id: 3,
    property: "22 Indian Chase Dr",
    description: "Doors Need To Be Repaired",
    dueDate: "Sep 10, 2025",
    priority: "low",
    fieldTeam: [
      { initials: "CH", color: "bg-blue-500", name: "Christopher Harris" },
      { initials: "CS", color: "bg-blue-500", name: "Cassandra Smith" },
    ],
    status: "pending-approval",
    timesheetStatus: getRandomTimesheetStatus(),
    amount: 95,
  },
  {
    id: 4,
    property: "22 Indian Chase Dr",
    description: "Doors Need To Be Repaired",
    dueDate: "Sep 6, 2025",
    priority: "high",
    fieldTeam: [
      { initials: "CH", color: "bg-blue-500", name: "Christopher Harris" },
      { initials: "CS", color: "bg-blue-500", name: "Cassandra Smith" },
    ],
    status: "dispatched",
    timesheetStatus: getRandomTimesheetStatus(),
    amount: 112,
  },
  {
    id: 5,
    property: "22 Indian Chase Dr",
    description: "Doors Need To Be Repaired",
    dueDate: "Sep 5, 2025",
    priority: "normal",
    fieldTeam: [
      { initials: "CH", color: "bg-blue-500", name: "Christopher Harris" },
      { initials: "CS", color: "bg-blue-500", name: "Cassandra Smith" },
    ],
    status: "dispatched",
    timesheetStatus: getRandomTimesheetStatus(),
    amount: 93,
  },
  {
    id: 6,
    property: "22 Indian Chase Dr",
    description: "Doors Need To Be Repaired",
    dueDate: "Sep 4, 2025",
    priority: "low",
    fieldTeam: [
      { initials: "CH", color: "bg-blue-500", name: "Christopher Harris" },
      { initials: "CS", color: "bg-blue-500", name: "Cassandra Smith" },
    ],
    status: "dispatched",
    timesheetStatus: getRandomTimesheetStatus(),
    amount: 75,
  },
  {
    id: 7,
    property: "22 Indian Chase Dr",
    description: "Doors Need To Be Repaired",
    dueDate: "Sep 4, 2025",
    priority: "high",
    fieldTeam: [
      { initials: "CH", color: "bg-blue-500", name: "Christopher Harris" },
      { initials: "CS", color: "bg-blue-500", name: "Cassandra Smith" },
    ],
    status: "dispatched",
    timesheetStatus: getRandomTimesheetStatus(),
    amount: 101,
  },
  {
    id: 8,
    property: "22 Indian Chase Dr",
    description: "Doors Need To Be Repaired",
    dueDate: "Sep 3, 2025",
    priority: "normal",
    fieldTeam: [
      { initials: "CH", color: "bg-blue-500", name: "Christopher Harris" },
      { initials: "CS", color: "bg-blue-500", name: "Cassandra Smith" },
    ],
    status: "dispatched",
    timesheetStatus: getRandomTimesheetStatus(),
    amount: 124,
  },
  {
    id: 9,
    property: "22 Indian Chase Dr",
    description: "Doors Need To Be Repaired",
    dueDate: "Sep 1, 2025",
    priority: "low",
    fieldTeam: [
      { initials: "CH", color: "bg-blue-500", name: "Christopher Harris" },
      { initials: "CS", color: "bg-blue-500", name: "Cassandra Smith" },
    ],
    status: "dispatched",
    timesheetStatus: getRandomTimesheetStatus(),
    amount: 67,
  },
  {
    id: 10,
    property: "22 Indian Chase Dr",
    description: "Doors Need To Be Repaired",
    dueDate: "Sep 1, 2025",
    priority: "high",
    fieldTeam: [
      { initials: "CH", color: "bg-blue-500", name: "Christopher Harris" },
      { initials: "CS", color: "bg-blue-500", name: "Cassandra Smith" },
    ],
    status: "dispatched",
    timesheetStatus: getRandomTimesheetStatus(),
    amount: 118,
  },
];

const ActionButton = ({
  orderId,
  openMenuId,
  setOpenMenuId,
  onApprove,
  onEdit,
}: {
  orderId: number;
  openMenuId: number | null;
  setOpenMenuId: (id: number | null) => void;
  onApprove: () => void;
  onEdit: () => void;
}) => {
  const showMenu = openMenuId === orderId;
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    let animationFrameId: number;

    const updateMenuPos = () => {
      if (showMenu && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();

        setMenuPos({
          top: rect.bottom + 8,
          left: rect.right - 145,
        });
      }

      if (showMenu) {
        animationFrameId = requestAnimationFrame(updateMenuPos);
      }
    };

    if (showMenu) {
      updateMenuPos();
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [showMenu]);

  useEffect(() => {
    if (!showMenu) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        !buttonRef.current?.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenu, setOpenMenuId]);

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setOpenMenuId(showMenu ? null : orderId)}
        className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="1" />
          <circle cx="19" cy="12" r="1" />
          <circle cx="5" cy="12" r="1" />
        </svg>
      </button>

      {showMenu &&
        createPortal(
          <div
            ref={menuRef}
            className="bg-white flex flex-col justify-center items-start gap-4 p-4"
            style={{
              width: "145px",
              border: "0.5px solid #DADADA",
              borderRadius: "8px",
              boxShadow:
                "0 38px 11px 0 rgba(0, 0, 0, 0.00), 0 24px 10px 0 rgba(0, 0, 0, 0.01), 0 14px 8px 0 rgba(0, 0, 0, 0.04), 0 6px 6px 0 rgba(0, 0, 0, 0.06), 0 2px 3px 0 rgba(0, 0, 0, 0.07)",
              zIndex: 99999,
              position: "fixed",
              top: menuPos.top + "px",
              left: menuPos.left + "px",
              pointerEvents: "auto",
            }}
            onMouseLeave={() => setOpenMenuId(null)}
          >
            <button
              onClick={() => {
                console.log("Approve clicked for order", orderId);
                setOpenMenuId(null);
                onApprove();
              }}
              className="flex justify-between items-center w-full hover:opacity-70 transition-opacity"
            >
              <span
                className="text-[#303030] font-normal text-base leading-[140%] tracking-[-0.32px] capitalize"
                style={{
                  fontFamily:
                    "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                }}
              >
                Approve
              </span>
              <img
                loading="lazy"
                src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/b13c8f79f0bbe495c159d6f52432780ef6582cfb?placeholderIfAbsent=true"
                className="w-4 h-4"
                alt=""
              />
            </button>
            <button
              onClick={() => {
                console.log("Edit clicked for order", orderId);
                setOpenMenuId(null);
                onEdit();
              }}
              className="flex justify-between items-center w-full hover:opacity-70 transition-opacity"
            >
              <span
                className="text-[#303030] font-normal text-base leading-[140%] tracking-[-0.32px] capitalize"
                style={{
                  fontFamily:
                    "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                }}
              >
                Edit
              </span>
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M15.75 15.7502H9.75002M1.875 16.1252L6.03695 14.5245C6.30316 14.4221 6.43626 14.3709 6.56079 14.3041C6.6714 14.2447 6.77685 14.1761 6.87603 14.0992C6.98769 14.0125 7.08853 13.9117 7.29021 13.71L15.75 5.25023C16.5784 4.4218 16.5784 3.07865 15.75 2.25023C14.9216 1.4218 13.5784 1.4218 12.75 2.25022L4.29021 10.71C4.08853 10.9117 3.98769 11.0125 3.90104 11.1242C3.82408 11.2234 3.75555 11.3288 3.69618 11.4394C3.62933 11.564 3.57814 11.6971 3.47575 11.9633L1.875 16.1252ZM1.875 16.1252L3.41859 12.1119C3.52905 11.8248 3.58428 11.6812 3.67901 11.6154C3.76179 11.5579 3.86423 11.5362 3.96322 11.5551C4.0765 11.5767 4.18529 11.6855 4.40286 11.9031L6.09718 13.5974C6.31475 13.815 6.42354 13.9237 6.44517 14.037C6.46408 14.136 6.44234 14.2385 6.38486 14.3212C6.31908 14.416 6.17549 14.4712 5.8883 14.5817L1.875 16.1252Z"
                  stroke="#525252"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              onClick={() => {
                console.log("Delete clicked for order", orderId);
                setOpenMenuId(null);
              }}
              className="flex justify-between items-center w-full hover:opacity-70 transition-opacity"
            >
              <span
                className="text-[#303030] font-normal text-base leading-[140%] tracking-[-0.32px] capitalize"
                style={{
                  fontFamily:
                    "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                }}
              >
                Delete
              </span>
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M6.75 2.25H11.25M2.25 4.5H15.75M14.25 4.5L13.724 12.3895C13.6451 13.5732 13.6057 14.165 13.35 14.6138C13.1249 15.0088 12.7854 15.3265 12.3762 15.5248C11.9115 15.75 11.3183 15.75 10.132 15.75H7.86799C6.68168 15.75 6.08852 15.75 5.62375 15.5248C5.21457 15.3265 4.87507 15.0088 4.64999 14.6138C4.39433 14.165 4.35488 13.5732 4.27596 12.3895L3.75 4.5M7.5 7.875V11.625M10.5 7.875V11.625"
                  stroke="#982740"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>,
          document.body,
        )}
    </>
  );
};

const getFTOStatusBadge = (status: string) => {
  const statusConfig: Record<string, { label: string; dotColor: string }> = {
    "pending-approval": { label: "New", dotColor: "#1E40AF" },
    dispatched: { label: "Dispatched", dotColor: "#B45309" },
    approved: { label: "Completed", dotColor: "#166534" },
  };

  const config = statusConfig[status] || statusConfig["pending-approval"];

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <div
        style={{
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          backgroundColor: config.dotColor,
          flexShrink: 0,
        }}
      />
      <span style={{ fontSize: "14px", color: config.dotColor }}>
        {config.label}
      </span>
    </div>
  );
};

const getTimesheetStatusBadge = (status: string) => {
  const statusConfig: Record<string, { label: string; dotColor: string }> = {
    "awaiting-submission": {
      label: "Awaiting Submission",
      dotColor: "#3730A3",
    },
    submitted: { label: "Submitted", dotColor: "#991B1B" },
    rejected: { label: "Rejected", dotColor: "#DC2626" },
    approved: { label: "Approved", dotColor: "#065F46" },
  };

  const config = statusConfig[status] || statusConfig["awaiting-submission"];

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <div
        style={{
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          backgroundColor: config.dotColor,
          flexShrink: 0,
        }}
      />
      <span style={{ fontSize: "14px", color: config.dotColor }}>
        {config.label}
      </span>
    </div>
  );
};

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
  const [currentPage, setCurrentPage] = usePageState("currentPage", 1);
  const [itemsPerPage, setItemsPerPage] = usePageState("itemsPerPage", 50);
  const [showPageSizeDropdown, setShowPageSizeDropdown] = usePageState(
    "showPageSizeDropdown",
    false,
  );
  const [openMenuId, setOpenMenuId] = usePageState<number | null>(
    "openMenuId",
    null,
  );
  const [showFTOModal, setShowFTOModal] = usePageState("showFTOModal", false);
  const [editFTOData, setEditFTOData] = usePageState<{
    dueDate: string;
    priority: string;
    ftoStatus?: string;
  } | null>("editFTOData", null);
  const [showApprovalModal, setShowApprovalModal] = usePageState(
    "showApprovalModal",
    false,
  );
  const [selectedFTOId, setSelectedFTOId] = usePageState<number | null>(
    "selectedFTOId",
    null,
  );
  const dropdownButtonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const { handleSortClick, getSortIndicator, getSortedData } = useSortingTable(fieldTeamOrders);

  const getDisplayedOrdersForPage = () => {
    const sorted = getSortedData();
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return sorted.slice(start, end);
  };

  useEffect(() => {
    let animationFrameId: number;

    const updateDropdownPos = () => {
      if (showPageSizeDropdown && dropdownButtonRef.current) {
        const rect = dropdownButtonRef.current.getBoundingClientRect();
        setDropdownPos({
          top: rect.bottom + 8,
          left: rect.left,
        });
      }

      if (showPageSizeDropdown) {
        animationFrameId = requestAnimationFrame(updateDropdownPos);
      }
    };

    if (showPageSizeDropdown) {
      updateDropdownPos();
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [showPageSizeDropdown]);

  const totalOrders = getSortedData().length;
  const totalPages = Math.ceil(totalOrders / itemsPerPage);

  const getPaginationNumbers = () => {
    const pages: (number | string)[] = [];

    if (totalPages <= 1) {
      return [1];
    }

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
      return pages;
    }

    // For totalPages > 7, show exactly 7 consecutive pages without ellipsis
    const windowSize = 7;
    let start = Math.max(1, currentPage - 2);
    let end = start + windowSize - 1;

    // Adjust if we're near the end to keep showing 7 pages
    if (end > totalPages) {
      end = totalPages;
      start = Math.max(1, end - windowSize + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  };

  return (
    <div
      className="flex flex-col px-6 py-9 pb-6 bg-white"
      style={{ borderStyle: "none", borderWidth: "1px" }}
    >
      {/* Header Section */}
      <div className="flex items-center justify-between gap-10 flex-wrap w-full">
        <div className="flex flex-col justify-start font-['Geist',sans-serif]">
          <div className="text-[#303030] text-[28px] font-semibold leading-[1.07]">
            Edgerton - Quote
          </div>
          <div className="flex items-center gap-1 mt-1 text-base text-[#717179] font-medium">
            <span>Resident Request</span>
            <span>/</span>
            <span>10244381</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 min-h-[40px] px-4 py-2.5 border border-white bg-[#013764] text-white rounded-lg shadow-[0px_0px_0px_1px_rgba(0,45,90,1)] font-['Geist',sans-serif] text-base font-medium hover:bg-[#014777] transition-colors">
            Update task
          </button>
          <button className="flex items-center justify-center w-10 h-10 bg-white border border-[#dadada] rounded-lg shadow-sm hover:bg-gray-50 transition-colors">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="flex flex-col mt-9 w-full">
        <div className="flex items-start gap-6 min-h-[36px] w-full border-b border-[#e5e5e5] font-['Geist',sans-serif] text-base text-[#717179] font-medium">
          <button
            onClick={() => handleTabChange("summary")}
            className={`flex items-center gap-1.5 py-2 ${
              activeTab === "summary"
                ? "border-b-2 border-[#09090b] text-[#09090b]"
                : "hover:text-[#09090b]"
            } transition-colors`}
          >
            Summary
          </button>
          <button
            onClick={() => handleTabChange("workorders")}
            className={`flex items-center gap-1.5 py-2 ${
              activeTab === "workorders"
                ? "border-b-2 border-[#09090b] text-[#09090b]"
                : "hover:text-[#09090b]"
            } transition-colors`}
          >
            Work orders
          </button>
          <button
            onClick={() => handleTabChange("fieldteam")}
            className={`flex items-center gap-1.5 py-2 ${
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
          {activeTab === "fieldteam" && (
            <div className="flex flex-col w-full gap-6">
              {/* Field Team Orders Table */}
              <div className="w-full border border-gray-200 bg-white rounded-lg overflow-hidden">
                {/* Table Header */}
                <div className="flex justify-between items-center px-6 py-3 border-b border-gray-200 bg-white">
                  <div className="flex items-center gap-4">
                    <h2 className="text-[#303030] font-medium text-[22px] leading-6">
                      Field Team Orders
                    </h2>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <div className="flex h-9 items-center gap-2 px-3 rounded-lg border border-[#DADADA] bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.03)]">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M17.5 17.5L13.875 13.875M15.8333 9.16667C15.8333 12.8486 12.8486 15.8333 9.16667 15.8333C5.48477 15.8333 2.5 12.8486 2.5 9.16667C2.5 5.48477 5.48477 2.5 9.16667 2.5C12.8486 2.5 15.8333 5.48477 15.8333 9.16667Z"
                          stroke="#303030"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <input
                        type="text"
                        placeholder="Search..."
                        className="text-[#303030] font-normal text-base leading-[140%] tracking-[-0.32px] capitalize bg-transparent border-none outline-none placeholder:text-[#303030] w-32 sm:w-48"
                      />
                    </div>
                    <button className="flex h-9 justify-center items-center gap-2 px-3 rounded-lg border border-[#DADADA] bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] hover:bg-gray-50 transition-colors">
                      <span className="text-[#303030] font-normal text-base leading-[140%] tracking-[-0.32px] capitalize">
                        Filter
                      </span>
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 18 18"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M4.5 6.75L9 11.25L13.5 6.75"
                          stroke="#303030"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => {
                        setEditFTOData(null);
                        setShowFTOModal(true);
                      }}
                      className="flex h-9 items-center gap-2 px-3 rounded-lg bg-[#013764] border border-white hover:bg-[#003a73] transition-colors"
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M10 4.16667V15.8333M4.16667 10H15.8333"
                          stroke="white"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span className="text-white font-medium text-base leading-normal">
                        Create FTO
                      </span>
                    </button>
                  </div>
                </div>

                {/* Table Content */}
                <div className="overflow-x-auto">
                  <div className="w-fit min-w-full">
                    <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50 h-12">
                        <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                          <span className="font-medium text-sm text-gray-700">
                            Priority
                          </span>
                        </th>
                        <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" />
                              <circle
                                cx="7.5"
                                cy="7.5"
                                r=".5"
                                fill="currentColor"
                              />
                            </svg>
                            <span className="font-medium text-sm text-gray-700">
                              FTO Name
                            </span>
                          </div>
                        </th>
                        <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M8 2v4" />
                              <path d="M16 2v4" />
                              <rect width="18" height="18" x="3" y="4" rx="2" />
                              <path d="M3 10h18" />
                            </svg>
                            <span className="font-medium text-sm text-gray-700">
                              Due Date
                            </span>
                          </div>
                        </th>
                        <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                              <circle cx="12" cy="7" r="4" />
                            </svg>
                            <span className="font-medium text-sm text-gray-700">
                              Field Team
                            </span>
                          </div>
                        </th>
                        <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" />
                              <circle
                                cx="7.5"
                                cy="7.5"
                                r=".5"
                                fill="currentColor"
                              />
                            </svg>
                            <span className="font-medium text-sm text-gray-700">
                              FTO Status
                            </span>
                          </div>
                        </th>
                        <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                              <circle cx="12" cy="7" r="4" />
                            </svg>
                            <span className="font-medium text-sm text-gray-700">
                              Timesheet Status
                            </span>
                          </div>
                        </th>
                        <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <line x1="4" x2="20" y1="9" y2="9" />
                              <line x1="4" x2="20" y1="15" y2="15" />
                              <line x1="10" x2="8" y1="3" y2="21" />
                              <line x1="16" x2="14" y1="3" y2="21" />
                            </svg>
                            <span className="font-medium text-sm text-gray-700">
                              Amount
                            </span>
                          </div>
                        </th>
                        <th
                          className="sticky right-0 px-2 py-3 text-center border-gray-200 w-20"
                          style={{
                            borderLeftWidth: "2px",
                            borderLeftColor: "rgb(210,209,207)",
                            backgroundColor: "white",
                          }}
                        >
                          <span className="font-medium text-sm text-gray-700">
                            Actions
                          </span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {getDisplayedOrdersForPage().map((order) => (
                        <tr
                          key={order.id}
                          className="border-b border-gray-200 hover:bg-gray-50 transition-colors h-12"
                        >
                          <td className="px-3 py-3 border-r border-gray-200 whitespace-nowrap overflow-hidden">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-2 h-2 rounded-full"
                                style={{
                                  backgroundColor:
                                    order.priority === "low"
                                      ? "#059669"
                                      : order.priority === "normal"
                                        ? "#2463eb"
                                        : "#d97706",
                                }}
                              />
                              <span className="text-gray-900 font-normal text-sm capitalize truncate">
                                {order.priority}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-3 border-r border-gray-200 whitespace-nowrap overflow-hidden">
                            <span className="text-gray-900 font-normal text-sm truncate">
                              {order.description}
                            </span>
                          </td>
                          <td className="px-3 py-3 border-r border-gray-200 whitespace-nowrap overflow-hidden">
                            <span className="text-gray-900 font-normal text-sm truncate">
                              {order.dueDate}
                            </span>
                          </td>
                          <td className="px-3 py-3 border-r border-gray-200 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {order.fieldTeam.map((member, idx) => (
                                <div key={idx} className="relative group">
                                  <div
                                    className={`w-7 h-7 rounded-full ${member.color} flex items-center justify-center text-white text-xs font-semibold border border-gray-300 cursor-pointer`}
                                    title={member.name}
                                  >
                                    {member.initials}
                                  </div>
                                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                                    {member.name}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="px-3 py-3 border-r border-gray-200 whitespace-nowrap overflow-hidden">
                            {getFTOStatusBadge(order.status)}
                          </td>
                          <td className="px-3 py-3 border-r border-gray-200 whitespace-nowrap overflow-hidden">
                            {getTimesheetStatusBadge(order.timesheetStatus)}
                          </td>
                          <td className="px-3 py-3 border-r border-gray-200 whitespace-nowrap overflow-hidden">
                            <span className="text-gray-900 font-normal text-sm truncate">
                              ${order.amount}
                            </span>
                          </td>
                          <td
                            className="sticky right-0 px-2 py-3 border-gray-200 w-20 flex items-center justify-center"
                            style={{
                              borderLeftWidth: "1px",
                              backgroundColor: "white",
                            }}
                          >
                            <ActionButton
                              orderId={order.id}
                              openMenuId={openMenuId}
                              setOpenMenuId={setOpenMenuId}
                              onApprove={() => {
                                setSelectedFTOId(order.id);
                                setShowApprovalModal(true);
                              }}
                              onEdit={() => {
                                setEditFTOData({
                                  dueDate: order.dueDate,
                                  priority: "normal",
                                  ftoStatus: order.status,
                                });
                                setShowFTOModal(true);
                              }}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                </div>

                {/* Pagination Footer */}
                <div
                  className="flex justify-between items-center px-6 py-4 bg-white gap-4 relative"
                  style={{
                    position: "relative",
                    zIndex: 1,
                    overflow: "visible",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-gray-700 text-sm font-medium">
                      Showing
                    </span>
                    <div
                      className="relative"
                      style={{ position: "relative", zIndex: 10 }}
                    >
                      <button
                        ref={dropdownButtonRef}
                        onClick={() =>
                          setShowPageSizeDropdown(!showPageSizeDropdown)
                        }
                        className="flex items-center justify-center gap-2 h-10 px-3 border rounded-lg bg-white hover:bg-gray-50 transition-colors text-gray-900 font-medium text-sm relative"
                        style={{
                          borderColor: "rgb(218, 218, 218)",
                          borderWidth: "0.909091px",
                          boxShadow:
                            "rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.03) 0px 1px 3px 0px",
                        }}
                      >
                        <div className="text-gray-900 font-medium text-sm">
                          {itemsPerPage}
                        </div>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      </button>
                    </div>
                    <span className="text-gray-700 text-sm font-medium">
                      of 225
                    </span>
                  </div>
                  <div
                    className="flex items-center rounded-lg border bg-white overflow-hidden"
                    style={{
                      borderColor: "rgb(218, 218, 218)",
                      borderWidth: "0.909091px",
                      boxShadow:
                        "rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.03) 0px 1px 3px 0px",
                    }}
                  >
                    <button
                      disabled={currentPage === 1}
                      onClick={() =>
                        setCurrentPage(Math.max(1, currentPage - 1))
                      }
                      className={cn(
                        "flex items-center justify-center gap-1.5 h-10 px-3 transition-colors",
                        currentPage === 1
                          ? "opacity-50 cursor-not-allowed"
                          : "hover:bg-gray-50",
                      )}
                      style={{
                        borderRightWidth: "0.909091px",
                        borderRightColor: "rgb(229, 229, 229)",
                      }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={
                          currentPage === 1
                            ? "rgb(163, 163, 163)"
                            : "currentColor"
                        }
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="m12 19-7-7 7-7" />
                        <path d="M19 12H5" />
                      </svg>
                      <div
                        className={cn(
                          "font-medium text-sm",
                          currentPage === 1 ? "text-gray-400" : "text-gray-700",
                        )}
                      >
                        Previous
                      </div>
                    </button>
                    {getPaginationNumbers().map((page, idx) => {
                      if (page === "...") {
                        return (
                          <button
                            key={`ellipsis-${idx}`}
                            disabled
                            className="flex items-center justify-center h-10 min-w-10 opacity-50 cursor-not-allowed"
                            style={{
                              borderRightWidth: "0.909091px",
                              borderRightColor: "rgb(229, 229, 229)",
                              backgroundColor: "rgba(0, 0, 0, 0)",
                            }}
                          >
                            <div className="text-gray-500 font-medium text-sm">
                              ...
                            </div>
                          </button>
                        );
                      }

                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page as number)}
                          className={cn(
                            "flex items-center justify-center h-10 min-w-10 transition-colors",
                            currentPage === page
                              ? "hover:bg-gray-50"
                              : "hover:bg-gray-50",
                          )}
                          style={{
                            borderRightWidth: "0.909091px",
                            borderRightColor: "rgb(229, 229, 229)",
                            backgroundColor:
                              currentPage === page
                                ? "white"
                                : "rgba(0, 0, 0, 0)",
                          }}
                        >
                          <div
                            className={cn(
                              "font-medium text-sm",
                              currentPage === page
                                ? "text-gray-900 font-bold"
                                : "text-gray-500",
                            )}
                          >
                            {page}
                          </div>
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      className={cn(
                        "flex items-center justify-center gap-1.5 h-10 px-3 transition-colors hover:bg-gray-50",
                      )}
                      style={{
                        backgroundColor: "rgba(0, 0, 0, 0)",
                      }}
                    >
                      <div className={cn("font-medium text-sm text-gray-700")}>
                        Next
                      </div>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={
                          currentPage === totalPages
                            ? "rgb(163, 163, 163)"
                            : "currentColor"
                        }
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M5 12h14" />
                        <path d="m12 5 7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Dropdown Menu - Rendered via Portal at body level */}
          {showPageSizeDropdown &&
            createPortal(
              <div
                className="bg-white overflow-hidden"
                style={{
                  border: "0.5px solid #DADADA",
                  borderRadius: "8px",
                  boxShadow:
                    "0 38px 11px 0 rgba(0, 0, 0, 0.00), 0 24px 10px 0 rgba(0, 0, 0, 0.01), 0 14px 8px 0 rgba(0, 0, 0, 0.04), 0 6px 6px 0 rgba(0, 0, 0, 0.06), 0 2px 3px 0 rgba(0, 0, 0, 0.07)",
                  zIndex: 99999,
                  minWidth: "56px",
                  width: "56px",
                  position: "fixed",
                  top: dropdownPos.top + "px",
                  left: dropdownPos.left + "px",
                  pointerEvents: "auto",
                }}
                onMouseLeave={() => setShowPageSizeDropdown(false)}
              >
                {[10, 25, 50].map((size, index) => (
                  <button
                    key={size}
                    onClick={() => {
                      setItemsPerPage(size);
                      setCurrentPage(1);
                      setShowPageSizeDropdown(false);
                    }}
                    className={cn(
                      "w-full px-4 py-3 text-center text-base transition-colors whitespace-nowrap",
                      itemsPerPage === size
                        ? "bg-gray-50 font-medium text-gray-900"
                        : "text-[#303030] hover:bg-gray-50",
                    )}
                    style={{
                      fontFamily:
                        "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                      fontSize: "16px",
                      lineHeight: "140%",
                      letterSpacing: "-0.32px",
                      borderRadius: index === 2 ? "0 0 8px 8px" : "0",
                    }}
                  >
                    {size}
                  </button>
                ))}
              </div>,
              document.body,
            )}

          {/* Create/Update FTO Modal */}
          <CreateFTOModal
            open={showFTOModal}
            onOpenChange={(open) => {
              setShowFTOModal(open);
              if (!open) {
                setEditFTOData(null);
              }
            }}
            editData={editFTOData || undefined}
          />

          {/* FTO Approval Modal */}
          <FTOApprovalModal
            open={showApprovalModal}
            onOpenChange={(open) => {
              setShowApprovalModal(open);
              if (!open) {
                setSelectedFTOId(null);
              }
            }}
            selectedFTOId={selectedFTOId}
            rowId={`fto-${selectedFTOId}`}
            editingOrder={fieldTeamOrders.find((o) => o.id === selectedFTOId)}
            property={
              fieldTeamOrders.find((o) => o.id === selectedFTOId)?.property
            }
            unit={fieldTeamOrders.find((o) => o.id === selectedFTOId)?.unit}
            fieldTeamAssignee={
              fieldTeamOrders.find((o) => o.id === selectedFTOId)?.fieldTeam[0]
                ?.name
            }
          />
        </div>
      </div>
    </div>
  );
}
