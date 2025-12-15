import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import CreateFTOModal from "@/components/CreateFTOModal";
import FTOApprovalModal from "@/components/FTOApprovalModal";
import { usePageState } from "@/hooks/usePageState";
import { useSortingTable } from "@/hooks/useSortingTable";

interface FieldTeamOrder {
  id: number;
  taskId: number;
  property: string;
  description: string;
  dueDate: string;
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
    taskId: 6,
    property: "22 Indian Chase Dr",
    description: "Doors Need To Be Repaired",
    dueDate: "Oct 2, 2025",
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
    taskId: 6,
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
    taskId: 6,
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
    taskId: 6,
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
    taskId: 6,
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
    taskId: 6,
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
    taskId: 6,
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
    taskId: 6,
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
    taskId: 6,
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
    taskId: 6,
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
  order,
  openMenuId,
  setOpenMenuId,
  onApprove,
  onEdit,
}: {
  order: FieldTeamOrder;
  openMenuId: number | null;
  setOpenMenuId: (id: number | null) => void;
  onApprove: (order: FieldTeamOrder) => void;
  onEdit: (order: FieldTeamOrder) => void;
}) => {
  const orderId = order.id;
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
                setOpenMenuId(null);
                onApprove(order);
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
                setOpenMenuId(null);
                onEdit(order);
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

export default function FieldTeamOrders() {
  const navigate = useNavigate();
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
  const [editingOrder, setEditingOrder] = useState<FieldTeamOrder | null>(null);
  const [showFTOModal, setShowFTOModal] = usePageState("showFTOModal", false);
  const [showApprovalModal, setShowApprovalModal] = usePageState(
    "showApprovalModal",
    false,
  );
  const dropdownButtonRef = useRef<HTMLButtonElement>(null);
  const dropdownMenuRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showPageSizeDropdown &&
        dropdownMenuRef.current &&
        dropdownButtonRef.current
      ) {
        const isClickOutside =
          !dropdownMenuRef.current.contains(event.target as Node) &&
          !dropdownButtonRef.current.contains(event.target as Node);

        if (isClickOutside) {
          setShowPageSizeDropdown(false);
        }
      }
    };

    if (showPageSizeDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
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
      className="min-h-screen bg-white p-4 md:p-6 lg:p-8"
      style={{
        borderLeftWidth: "1px",
        borderLeftColor: "rgb(210, 209, 207)",
        paddingBottom: "150px",
      }}
    >
      <div className="max-w-full mx-auto flex flex-col gap-6">
        {/* Header Section */}
        <div className="flex items-center gap-10 justify-between flex-wrap">
          {/* Title and Description */}
          <div className="flex flex-col gap-1 min-w-[240px]">
            <h1 className="text-[#303030] font-semibold text-2xl leading-[30px]">
              All Field Team Orders
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <p
                className="text-[#717179] font-medium text-base leading-4"
                style={{ marginTop: "-4px" }}
              >
                All your field team orders, in one place
              </p>
            </div>
          </div>

          {/* Create FTO Button */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowFTOModal(true)}
              className="flex h-9 items-center gap-2 px-3 rounded-lg border border-white bg-[#013764] shadow-[0_0_0_1px_#002D5A] hover:bg-[#003a73] transition-colors"
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

        <div className="flex flex-col gap-6">
          {/* Field Team Orders Table */}
          <div className="w-full border border-gray-200 bg-white rounded-lg overflow-hidden">
            {/* Table Header */}
            <div className="flex justify-between items-center px-6 py-3 border-b border-gray-200 bg-white">
              <div className="flex items-center gap-4">
                <h2 className="text-[#303030] font-medium text-[22px] leading-6">
                  All Field Team Orders
                </h2>
                <div className="flex items-center gap-2 h-6">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M1.16699 8.16667C1.16699 8.16667 1.23776 8.66206 3.28802 10.7123C5.33827 12.7626 8.66238 12.7626 10.7126 10.7123C11.439 9.9859 11.9081 9.09958 12.1198 8.16667M1.16699 8.16667V11.6667M1.16699 8.16667H4.66699M12.8337 5.83333C12.8337 5.83333 12.7629 5.33794 10.7126 3.28769C8.66238 1.23744 5.33827 1.23744 3.28802 3.28769C2.56161 4.0141 2.09256 4.90042 1.88089 5.83333M12.8337 5.83333V2.33333M12.8337 5.83333H9.33366"
                      stroke="#8B8D8D"
                      strokeWidth="1.3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="text-[#8B8D8D] font-medium text-sm leading-[15px]">
                    Updated 2 minutes ago
                  </span>
                </div>
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
              </div>
            </div>

            {/* Table Content */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 h-12">
                    <th
                      onClick={() => handleSortClick("priority")}
                      className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <img
                          loading="lazy"
                          src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/19c17d4129204654414d25bb07907dbe45b6100b?placeholderIfAbsent=true"
                          className="w-3.5 h-3.5"
                          alt=""
                        />
                        <span className="font-medium text-sm text-gray-700">
                          Priority
                        </span>
                        {getSortIndicator("priority") && (
                          <span className="text-xs font-bold text-gray-700 ml-1">
                            {getSortIndicator("priority")}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSortClick("property")}
                      className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
                          <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
                          <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
                          <path d="M10 6h4" />
                          <path d="M10 10h4" />
                          <path d="M10 14h4" />
                          <path d="M10 18h4" />
                        </svg>
                        <span className="font-medium text-sm text-gray-700">
                          Property
                        </span>
                        {getSortIndicator("property") && (
                          <span className="text-xs font-bold text-gray-700 ml-1">
                            {getSortIndicator("property")}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSortClick("description")}
                      className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap cursor-pointer hover:bg-gray-100 transition-colors"
                    >
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
                        {getSortIndicator("description") && (
                          <span className="text-xs font-bold text-gray-700 ml-1">
                            {getSortIndicator("description")}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSortClick("dueDate")}
                      className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap cursor-pointer hover:bg-gray-100 transition-colors"
                    >
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
                        {getSortIndicator("dueDate") && (
                          <span className="text-xs font-bold text-gray-700 ml-1">
                            {getSortIndicator("dueDate")}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSortClick("fieldTeam")}
                      className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap cursor-pointer hover:bg-gray-100 transition-colors"
                    >
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
                        {getSortIndicator("fieldTeam") && (
                          <span className="text-xs font-bold text-gray-700 ml-1">
                            {getSortIndicator("fieldTeam")}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSortClick("status")}
                      className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap cursor-pointer hover:bg-gray-100 transition-colors"
                    >
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
                        {getSortIndicator("status") && (
                          <span className="text-xs font-bold text-gray-700 ml-1">
                            {getSortIndicator("status")}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSortClick("timesheetStatus")}
                      className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap cursor-pointer hover:bg-gray-100 transition-colors"
                    >
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
                        {getSortIndicator("timesheetStatus") && (
                          <span className="text-xs font-bold text-gray-700 ml-1">
                            {getSortIndicator("timesheetStatus")}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSortClick("amount")}
                      className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap cursor-pointer hover:bg-gray-100 transition-colors"
                    >
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
                        {getSortIndicator("amount") && (
                          <span className="text-xs font-bold text-gray-700 ml-1">
                            {getSortIndicator("amount")}
                          </span>
                        )}
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
                  {getDisplayedOrdersForPage().map((order) => {
                    const handleRowClick = (e: React.MouseEvent) => {
                      const target = e.target as HTMLElement;
                      // Don't navigate if clicking on actions cell or any button inside it
                      if (
                        target.closest("td:last-child") ||
                        target.closest("button")
                      ) {
                        return;
                      }
                      navigate(`/tasks/${order.taskId}/fieldteam`);
                    };
                    return (
                      <tr
                        key={order.id}
                        className="border-b border-gray-200 hover:bg-gray-50 transition-colors h-12 cursor-pointer"
                        onClick={handleRowClick}
                      >
                        <td className="px-3 py-3 border-r border-gray-200 whitespace-nowrap">
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
                            <span className="text-gray-900 font-normal text-sm capitalize">
                              {order.priority}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-3 border-r border-gray-200 whitespace-nowrap">
                          <span className="text-gray-900 font-normal text-base">
                            {order.property}
                          </span>
                        </td>
                        <td className="px-3 py-3 border-r border-gray-200 whitespace-nowrap">
                          <span className="text-gray-900 font-normal text-base">
                            {order.description}
                          </span>
                        </td>
                        <td className="px-3 py-3 border-r border-gray-200 whitespace-nowrap">
                          <span className="text-gray-900 font-normal text-base">
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
                        <td className="px-3 py-3 border-r border-gray-200 whitespace-nowrap">
                          {getFTOStatusBadge(order.status)}
                        </td>
                        <td className="px-3 py-3 border-r border-gray-200 whitespace-nowrap">
                          {getTimesheetStatusBadge(order.timesheetStatus)}
                        </td>
                        <td className="px-3 py-3 border-r border-gray-200 whitespace-nowrap">
                          <span className="text-gray-900 font-normal text-base">
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
                            order={order}
                            openMenuId={openMenuId}
                            setOpenMenuId={setOpenMenuId}
                            onApprove={(selectedOrder) => {
                              setEditingOrder(selectedOrder);
                              setShowApprovalModal(true);
                            }}
                            onEdit={(selectedOrder) => {
                              setEditingOrder(selectedOrder);
                              setShowFTOModal(true);
                            }}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div
              className="flex justify-between items-center px-6 py-4 bg-white gap-4 relative"
              style={{ position: "relative", zIndex: 1, overflow: "visible" }}
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
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
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
                      currentPage === 1 ? "rgb(163, 163, 163)" : "currentColor"
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
                          currentPage === page ? "white" : "rgba(0, 0, 0, 0)",
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
      </div>
      {/* Dropdown Menu - Rendered via Portal at body level */}
      {showPageSizeDropdown &&
        createPortal(
          <div
            ref={dropdownMenuRef}
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
            setEditingOrder(null);
          }
        }}
        editData={
          editingOrder
            ? {
                dueDate: editingOrder.dueDate,
                priority: "Normal",
                timesheetStatus: editingOrder.status,
              }
            : undefined
        }
      />

      {/* FTO Approval Modal */}
      <FTOApprovalModal
        open={showApprovalModal}
        onOpenChange={(open) => {
          setShowApprovalModal(open);
          if (!open) {
            setEditingOrder(null);
          }
        }}
        editingOrder={editingOrder}
        property={editingOrder?.property || "3 hekma Road"}
        unit={editingOrder?.unit || "2"}
        fieldTeamAssignee={editingOrder?.fieldTeamAssignee || "John Smith"}
      />
    </div>
  );
}
