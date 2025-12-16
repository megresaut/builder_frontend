import { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Search, ChevronDown, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import WorkOrders from "../pages/WorkOrders";
import CreateWorkOrderModal from "./CreateWorkOrderModal";

interface Assignee {
  id: number;
  name: string;
  initials: string;
  color: string;
}

interface WorkOrder {
  id: number;
  task: string;
  dueDate: string;
  updatedDate: string;
  age: string;
  priority: "High" | "Low" | "Normal";
  status: "In progress" | "Completed";
  billStatus: "Paid" | "Unpaid" | "Awaiting Invoice";
  billTotal: string;
  assignees: Assignee[];
}

const mockWorkOrders: WorkOrder[] = [
  {
    id: 1,
    task: "Doors need to be repaired",
    dueDate: "Oct 2, 2025",
    updatedDate: "Oct 2, 2025",
    age: "6 days 5 hours",
    priority: "High",
    status: "In progress",
    billStatus: "Paid",
    billTotal: "$420",
    assignees: [
      { id: 1, name: "Jerry Sanchez", initials: "JS", color: "bg-blue-500" },
    ],
  },
  {
    id: 2,
    task: "Doors need to be repaired",
    dueDate: "Sep 29, 2025",
    updatedDate: "Sep 29, 2025",
    age: "6 days 5 hours",
    priority: "Low",
    status: "In progress",
    billStatus: "Awaiting Invoice",
    billTotal: "No invoice",
    assignees: [
      { id: 3, name: "Jane Smith", initials: "JMS", color: "bg-green-500" },
    ],
  },
  {
    id: 3,
    task: "Doors need to be repaired",
    dueDate: "Sep 10, 2025",
    updatedDate: "Sep 10, 2025",
    age: "6 days 5 hours",
    priority: "Normal",
    status: "Completed",
    billStatus: "Unpaid",
    billTotal: "$95",
    assignees: [
      { id: 1, name: "Jerry Sanchez", initials: "JS", color: "bg-blue-500" },
    ],
  },
];

const ActionButton = ({
  taskId,
  workOrderId,
  openMenuId,
  setOpenMenuId,
}: {
  taskId?: string;
  workOrderId: number;
  openMenuId: number | null;
  setOpenMenuId: (id: number | null) => void;
}) => {
  const navigate = useNavigate();
  const showMenu = openMenuId === workOrderId;
  const buttonRef = useRef<HTMLButtonElement>(null);
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

  return (
    <>
      <button
        ref={buttonRef}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={() => setOpenMenuId(showMenu ? null : workOrderId)}
        className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ transform: "rotate(90deg)" }}
        >
          <circle cx="8" cy="3" r="1.5" fill="#303030"/>
          <circle cx="8" cy="8" r="1.5" fill="#303030"/>
          <circle cx="8" cy="13" r="1.5" fill="#303030"/>
        </svg>
      </button>

      {showMenu &&
        createPortal(
          <div
            className="bg-white flex flex-col justify-center items-start gap-4 p-4"
            onMouseDown={(e) => e.stopPropagation()}
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
                if (taskId) {
                  navigate(`/tasks/${taskId}/workorders/${workOrderId}`);
                }
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
                console.log("Delete clicked for work order");
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
                  d="M2.25 4.5H3.75H15.75M14.25 4.5V14.25C14.25 14.8023 14.0292 15.3415 13.636 15.7348C13.2428 16.128 12.7035 16.35 12.15 16.35H5.85C5.29674 16.35 4.75737 16.128 4.36414 15.7348C3.9709 15.3415 3.75 14.8023 3.75 14.25V4.5M6.75 4.5V3.15C6.75 2.85163 6.8684 2.56548 7.0795 2.3545C7.2905 2.1435 7.57663 2.025 7.875 2.025H10.125C10.4234 2.025 10.7095 2.1435 10.9205 2.3545C11.1316 2.56548 11.25 2.85163 11.25 3.15V4.5M7.5 8.25V13.5M10.5 8.25V13.5"
                  stroke="#525252"
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

interface WorkOrdersTabProps {
  taskId?: string;
  initialSelectedWorkOrderId?: number | null;
  onWorkOrderSelect?: (workOrderId: number | null) => void;
}

export default function WorkOrdersTab({
  taskId,
  initialSelectedWorkOrderId = null,
  onWorkOrderSelect,
}: WorkOrdersTabProps) {
  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState<number | null>(
    initialSelectedWorkOrderId,
  );

  useEffect(() => {
    setSelectedWorkOrderId(initialSelectedWorkOrderId ?? null);
  }, [initialSelectedWorkOrderId]);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [showPageSizeDropdown, setShowPageSizeDropdown] = useState(false);
  const [showCreateWorkOrderModal, setShowCreateWorkOrderModal] =
    useState(false);
  const dropdownButtonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

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

  const totalWorkOrders = mockWorkOrders.length;
  const totalPages = Math.ceil(totalWorkOrders / itemsPerPage);

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

    const windowSize = 7;
    let start = Math.max(1, currentPage - 2);
    let end = start + windowSize - 1;

    if (end > totalPages) {
      end = totalPages;
      start = Math.max(1, end - windowSize + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  };

  const handleSelectWorkOrder = (workOrderId: number | null) => {
    setSelectedWorkOrderId(workOrderId);
    onWorkOrderSelect?.(workOrderId);
  };

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedWorkOrders = mockWorkOrders.slice(startIndex, endIndex);

  if (selectedWorkOrderId !== null) {
    return (
      <div className="flex flex-col w-full gap-6">
        <button
          onClick={() => handleSelectWorkOrder(null)}
          className="flex items-center gap-2 text-[#2463eb] hover:underline"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Work Orders
        </button>

        <WorkOrders />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col gap-6">
        <div className="w-full border border-gray-200 bg-white rounded-lg overflow-hidden">
          <div className="flex justify-between items-center px-6 py-3 border-b border-gray-200 bg-white">
            <div className="flex items-center gap-4">
              <h2 className="text-[#303030] font-medium text-[22px] leading-6 whitespace-nowrap">
                Work Orders
              </h2>
            </div>
            <div className="flex items-start gap-2.5 flex-nowrap">
              <div className="flex h-9 items-center gap-2 px-3 rounded-lg border border-[#DADADA] bg-white">
                <Search className="w-5 h-5 text-gray-600" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="text-[#303030] font-normal text-base bg-transparent border-none outline-none placeholder:text-[#303030] w-32 sm:w-48"
                />
              </div>
              <button className="flex h-9 justify-center items-center gap-2 px-3 rounded-lg border border-[#DADADA] bg-white hover:bg-gray-50 transition-colors">
                <span className="text-[#303030] font-normal text-base whitespace-nowrap">
                  Filter
                </span>
                <ChevronDown className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowCreateWorkOrderModal(true)}
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
                <span className="text-white font-medium text-base leading-normal whitespace-nowrap">
                  Create Work Order
                </span>
              </button>
            </div>
          </div>

              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 h-12">
                    <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap min-w-max">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-gray-700">
                          Priority
                        </span>
                      </div>
                    </th>
                    <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap min-w-max">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-gray-700">
                          Work Order
                        </span>
                      </div>
                    </th>
                    <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap min-w-max">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-gray-700">
                          Updated
                        </span>
                      </div>
                    </th>
                    <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap min-w-max">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-gray-700">
                          Age
                        </span>
                      </div>
                    </th>
                    <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap min-w-max">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-gray-700">
                          Status
                        </span>
                      </div>
                    </th>
                    <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap min-w-max">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-gray-700">
                          Due
                        </span>
                      </div>
                    </th>
                    <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap min-w-max">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-gray-700">
                          Bill Status
                        </span>
                      </div>
                    </th>
                    <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap min-w-max">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-gray-700">
                          Bill Total
                        </span>
                      </div>
                    </th>
                    <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap min-w-max">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-gray-700">
                          Assignees
                        </span>
                      </div>
                    </th>
                    <th
                      className="px-2 py-3 text-center w-20 whitespace-nowrap"
                      style={{
                        borderLeftWidth: "2px",
                        border: "1px none rgb(226, 232, 240)",
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
                  {paginatedWorkOrders.map((workOrder) => (
                    <tr
                      key={workOrder.id}
                      onClick={() => handleSelectWorkOrder(workOrder.id)}
                      className="border-b border-gray-200 hover:bg-gray-50 transition-colors h-12 cursor-pointer"
                    >
                      <td className="px-3 py-3 border-r border-gray-200 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{
                              backgroundColor:
                                workOrder.priority === "High"
                                  ? "#D97706"
                                  : workOrder.priority === "Low"
                                    ? "#059669"
                                    : "#2463EB",
                            }}
                          />
                          <span className="text-gray-900 font-normal text-sm capitalize">
                            {workOrder.priority}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3 border-r border-gray-200 whitespace-nowrap">
                        <span className="text-gray-900 font-normal text-sm">
                          {workOrder.task}
                        </span>
                      </td>
                      <td className="px-3 py-3 border-r border-gray-200 whitespace-nowrap">
                        <span className="text-gray-900 font-normal text-sm">
                          {workOrder.updatedDate}
                        </span>
                      </td>
                      <td className="px-3 py-3 border-r border-gray-200 whitespace-nowrap">
                        <span className="text-gray-900 font-normal text-sm">
                          {workOrder.age}
                        </span>
                      </td>
                      <td className="px-3 py-3 border-r border-gray-200 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{
                              backgroundColor:
                                workOrder.status === "Completed"
                                  ? "#059669"
                                  : "#2463EB",
                            }}
                          />
                          <span className="text-gray-900 font-normal text-sm capitalize">
                            {workOrder.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3 border-r border-gray-200 whitespace-nowrap">
                        <span className="text-gray-900 font-normal text-sm">
                          {workOrder.dueDate}
                        </span>
                      </td>
                      <td className="px-3 py-3 border-r border-gray-200 whitespace-nowrap">
                        <span className="text-gray-900 font-normal text-sm">
                          {workOrder.billStatus}
                        </span>
                      </td>
                      <td className="px-3 py-3 border-r border-gray-200 whitespace-nowrap">
                        <span className="text-gray-900 font-normal text-sm">
                          {workOrder.billTotal}
                        </span>
                      </td>
                      <td className="px-3 py-3 border-r border-gray-200 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {workOrder.assignees.map((assignee, idx) => (
                            <div key={idx} className="relative group">
                              <div
                                className={`w-7 h-7 rounded-full ${assignee.color} flex items-center justify-center text-white text-xs font-semibold border border-gray-300 cursor-pointer flex-shrink-0`}
                                title={assignee.name}
                              >
                                {assignee.initials}
                              </div>
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                                {assignee.name}
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td
                        className="px-2 py-3 border-gray-200 w-20 flex items-center justify-center"
                        style={{
                          borderLeftWidth: "1px",
                          backgroundColor: "white",
                        }}
                      >
                        <ActionButton
                          taskId={taskId}
                          workOrderId={workOrder.id}
                          openMenuId={openMenuId}
                          setOpenMenuId={setOpenMenuId}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div
                className="flex justify-between items-center px-6 py-4 bg-white gap-4 relative flex-nowrap"
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
                    of {totalWorkOrders}
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
                        "font-medium text-sm whitespace-nowrap",
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
                    <div className={cn("font-medium text-sm text-gray-700 whitespace-nowrap")}>
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

      <CreateWorkOrderModal
        open={showCreateWorkOrderModal}
        onOpenChange={setShowCreateWorkOrderModal}
      />

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
    </div>
  );
}
