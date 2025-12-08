import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import CreateTaskModal from "@/components/CreateTaskModal";

interface Assignee {
  id: number;
  name: string;
  initials: string;
}

interface Task {
  id: number;
  status: string;
  title: string;
  property: string;
  due: string;
  updated: string;
  age: string;
  priority: string;
  assignees: Assignee[];
}

const tasks: Task[] = [
  {
    id: 1,
    status: "Completed",
    title: "Doors Need To Be Repaired",
    property: "22 Indian Chase Dr",
    due: "Oct 2, 2025",
    updated: "Oct 2, 2025",
    age: "6 Days",
    priority: "Normal",
    assignees: [{ id: 1, name: "John Doe", initials: "JD" }],
  },
  {
    id: 2,
    status: "In Progress",
    title: "Doors Need To Be Repaired",
    property: "22 Indian Chase Dr",
    due: "Sep 25, 2025",
    updated: "Sep 25, 2025",
    age: "6 Days",
    priority: "Low",
    assignees: [{ id: 2, name: "Jane Smith", initials: "JMS" }],
  },
  {
    id: 3,
    status: "Completed",
    title: "Doors Need To Be Repaired",
    property: "22 Indian Chase Dr",
    due: "Sep 12, 2025",
    updated: "Sep 12, 2025",
    age: "6 Days",
    priority: "Normal",
    assignees: [
      { id: 1, name: "John Doe", initials: "JD" },
      { id: 2, name: "Jane Smith", initials: "JMS" },
    ],
  },
  {
    id: 4,
    status: "Completed",
    title: "Doors Need To Be Repaired",
    property: "22 Indian Chase Dr",
    due: "Sep 6, 2025",
    updated: "Sep 6, 2025",
    age: "6 Days",
    priority: "High",
    assignees: [{ id: 3, name: "Mike Johnson", initials: "MJ" }],
  },
  {
    id: 5,
    status: "Completed",
    title: "Doors Need To Be Repaired",
    property: "22 Indian Chase Dr",
    due: "Sep 5, 2025",
    updated: "Sep 5, 2025",
    age: "6 Days",
    priority: "Normal",
    assignees: [
      { id: 2, name: "Jane Smith", initials: "JMS" },
      { id: 3, name: "Mike Johnson", initials: "MJ" },
    ],
  },
  {
    id: 6,
    status: "Completed",
    title: "Doors Need To Be Repaired",
    property: "22 Indian Chase Dr",
    due: "Sep 4, 2025",
    updated: "Sep 4, 2025",
    age: "6 Days",
    priority: "Normal",
    assignees: [{ id: 1, name: "John Doe", initials: "JD" }],
  },
  {
    id: 7,
    status: "Completed",
    title: "Doors Need To Be Repaired",
    property: "22 Indian Chase Dr",
    due: "Sep 3, 2025",
    updated: "Sep 3, 2025",
    age: "6 Days",
    priority: "Normal",
    assignees: [
      { id: 3, name: "Mike Johnson", initials: "MJ" },
      { id: 1, name: "John Doe", initials: "JD" },
    ],
  },
  {
    id: 8,
    status: "Completed",
    title: "Doors Need To Be Repaired",
    property: "22 Indian Chase Dr",
    due: "Sep 2, 2025",
    updated: "Sep 2, 2025",
    age: "6 Days",
    priority: "Normal",
    assignees: [{ id: 2, name: "Jane Smith", initials: "JMS" }],
  },
  {
    id: 9,
    status: "Completed",
    title: "Doors Need To Be Repaired",
    property: "22 Indian Chase Dr",
    due: "Sep 1, 2025",
    updated: "Sep 1, 2025",
    age: "6 Days",
    priority: "Normal",
    assignees: [
      { id: 1, name: "John Doe", initials: "JD" },
      { id: 2, name: "Jane Smith", initials: "JMS" },
    ],
  },
  {
    id: 10,
    status: "Completed",
    title: "Doors Need To Be Repaired",
    property: "22 Indian Chase Dr",
    due: "Sep 1, 2025",
    updated: "Sep 1, 2025",
    age: "6 Days",
    priority: "Normal",
    assignees: [{ id: 3, name: "Mike Johnson", initials: "MJ" }],
  },
];

const StatusBadge = ({ status }: { status: string }) => {
  if (status === "Completed") {
    return (
      <span className="inline-flex items-center bg-emerald-100 rounded-2xl text-emerald-600 gap-1.5 relative px-3 py-1 text-sm">
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g clipPath="url(#clip0_bills_pushed)">
            <path
              d="M5.00065 8.00016L7.00065 10.0002L11.0007 6.00016M14.6673 8.00016C14.6673 11.6821 11.6825 14.6668 8.00065 14.6668C4.31875 14.6668 1.33398 11.6821 1.33398 8.00016C1.33398 4.31826 4.31875 1.3335 8.00065 1.3335C11.6825 1.3335 14.6673 4.31826 14.6673 8.00016Z"
              stroke="#059669"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
          <defs>
            <clipPath id="clip0_bills_pushed">
              <rect width="16" height="16" fill="white" />
            </clipPath>
          </defs>
        </svg>
        {status}
      </span>
    );
  }

  if (status === "In Progress") {
    return (
      <div className="flex items-center bg-blue-50 rounded-2xl text-blue-600 gap-1 h-[30px] px-2">
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M2.91602 7H11.0827"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <div className="text-sm font-normal tracking-[-0.28px] capitalize overflow-hidden text-ellipsis whitespace-nowrap">
          {status}
        </div>
      </div>
    );
  }

  return (
    <span className="text-sm font-medium px-2 py-1 rounded bg-gray-100 text-gray-700">
      {status}
    </span>
  );
};

const PriorityBadge = ({ priority }: { priority: string }) => {
  if (priority === "Low") {
    return (
      <div className="flex items-center gap-1 rounded-2xl h-[30px] px-2 bg-emerald-50 text-emerald-600">
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M6.99935 2.91675V11.0834M6.99935 11.0834L11.0827 7.00008M6.99935 11.0834L2.91602 7.00008"
            stroke="#059669"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <div className="text-sm font-normal tracking-[-0.28px] capitalize overflow-hidden text-ellipsis whitespace-nowrap">
          {priority}
        </div>
      </div>
    );
  }

  if (priority === "Normal") {
    return (
      <div className="flex items-center bg-blue-50 rounded-2xl text-blue-600 gap-1 h-[30px] px-2">
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M2.91602 7H11.0827"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <div className="text-sm font-normal tracking-[-0.28px] capitalize overflow-hidden text-ellipsis whitespace-nowrap">
          {priority}
        </div>
      </div>
    );
  }

  if (priority === "High") {
    return (
      <div className="flex items-center gap-1 rounded-2xl h-[30px] px-2">
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g clipPath="url(#clip0_high_priority)">
            <path
              d="M8.00065 5.33325V7.99992M8.00065 10.6666H8.00732M14.6673 7.99992C14.6673 11.6818 11.6825 14.6666 8.00065 14.6666C4.31875 14.6666 1.33398 11.6818 1.33398 7.99992C1.33398 4.31802 4.31875 1.33325 8.00065 1.33325C11.6825 1.33325 14.6673 4.31802 14.6673 7.99992Z"
              stroke="#D97706"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
          <defs>
            <clipPath id="clip0_high_priority">
              <rect width="16" height="16" fill="white" />
            </clipPath>
          </defs>
        </svg>
        <div className="text-base font-normal tracking-[-0.32px] capitalize overflow-hidden text-ellipsis whitespace-nowrap text-[#D97706]">
          {priority}
        </div>
      </div>
    );
  }

  return (
    <span className="font-normal text-base text-gray-600">{priority}</span>
  );
};

const ActionButton = ({
  taskId,
  openMenuId,
  setOpenMenuId,
}: {
  taskId: number;
  openMenuId: number | null;
  setOpenMenuId: (id: number | null) => void;
}) => {
  const showMenu = openMenuId === taskId;
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
        onClick={() => setOpenMenuId(showMenu ? null : taskId)}
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
                console.log("Edit clicked for task", taskId);
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
                console.log("Delete clicked for task", taskId);
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

export default function AllTasks() {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [showPageSizeDropdown, setShowPageSizeDropdown] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
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

  const totalPages = Math.ceil(tasks.length / itemsPerPage);

  const getPaginationNumbers = () => {
    const pages: (number | string)[] = [];

    if (totalPages <= 1) {
      return [1];
    }

    if (totalPages <= 6) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
      return pages;
    }

    const leftStart = currentPage;
    const leftEnd = Math.min(currentPage + 2, totalPages);

    const rightStart = Math.max(leftEnd + 5, totalPages - 2);
    const rightEnd = totalPages;

    for (let i = leftStart; i <= leftEnd; i++) {
      pages.push(i);
    }

    if (rightStart > leftEnd + 1) {
      pages.push("...");
    }

    for (let i = rightStart; i <= rightEnd; i++) {
      pages.push(i);
    }

    return pages;
  };

  return (
    <div
      className="bg-white"
      style={{
        borderLeftWidth: "1px",
        borderLeftColor: "rgb(210, 209, 207)",
        padding: "32px 32px 150px",
      }}
    >
      <div className="max-w-full mx-auto flex flex-col gap-6">
        {/* Header Section */}
        <div className="flex items-center gap-10 justify-between flex-wrap">
          {/* Title and Description */}
          <div className="flex flex-col gap-1 min-w-[240px]">
            <h1 className="text-[#303030] font-semibold text-2xl leading-[30px]">
              All Tasks
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <p
                className="text-[#717179] font-medium text-base leading-4"
                style={{ marginTop: "-4px" }}
              >
                All your tasks, in one place
              </p>
            </div>
          </div>

          {/* Add Task Button */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsCreateTaskModalOpen(true)}
              className="flex h-9 items-center gap-2 px-3 rounded-lg bg-[#013764] shadow-[0_0_0_1px_#002D5A] hover:bg-[#003a73] transition-colors"
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
                Add Task
              </span>
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {/* Tasks Table */}
          <div className="w-full border border-gray-200 bg-white rounded-lg overflow-hidden">
            {/* Table Header */}
            <div className="flex justify-between items-center px-6 py-3 border-b border-gray-200 bg-white">
              <div className="flex items-center gap-4">
                <h2 className="text-[#303030] font-medium text-[22px] leading-6">
                  Task List
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
              </div>
            </div>

            {/* Table Content */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 h-12">
                    <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" clipRule="evenodd" d="M6.66758 8.00008C6.66758 7.2637 7.26454 6.66675 8.00092 6.66675C8.7373 6.66675 9.33425 7.2637 9.33425 8.00008C9.33425 8.73646 8.7373 9.33342 8.00092 9.33342C7.26454 9.33342 6.66758 8.73646 6.66758 8.00008Z" fill="#525252"/>
                          <path fillRule="evenodd" clipRule="evenodd" d="M8.00092 2.66675C6.09314 2.66675 4.53782 3.5099 3.38542 4.4717C2.23458 5.4322 1.44556 6.54294 1.0504 7.16865L1.03434 7.19397C0.955928 7.3174 0.854119 7.47765 0.802652 7.70219C0.761095 7.8835 0.761095 8.11667 0.802652 8.29797C0.854119 8.52251 0.955928 8.68276 1.03434 8.80619L1.0504 8.83152C1.44556 9.45722 2.23459 10.568 3.38542 11.5285C4.53782 12.4903 6.09314 13.3334 8.00092 13.3334C9.9087 13.3334 11.464 12.4903 12.6164 11.5285C13.7673 10.568 14.5563 9.45722 14.9514 8.83152L14.9675 8.8062C15.0459 8.68277 15.1477 8.52252 15.1992 8.29797C15.2407 8.11667 15.2407 7.8835 15.1992 7.70219C15.1477 7.47765 15.0459 7.31739 14.9675 7.19396L14.9514 7.16865C14.5563 6.54294 13.7673 5.4322 12.6164 4.4717C11.464 3.50989 9.9087 2.66675 8.00092 2.66675ZM8.00092 5.33341C6.52816 5.33341 5.33425 6.52732 5.33425 8.00008C5.33425 9.47284 6.52816 10.6667 8.00092 10.6667C9.47367 10.6667 10.6676 9.47284 10.6676 8.00008C10.6676 6.52732 9.47367 5.33341 8.00092 5.33341Z" fill="#525252"/>
                        </svg>
                        <span className="font-medium text-sm text-gray-700">
                          Status
                        </span>
                      </div>
                    </th>
                    <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <g clipPath="url(#clip0_task)">
                            <path d="M5.33399 5.33325H5.34065M1.33398 3.46658L1.33398 6.44959C1.33398 6.77572 1.33398 6.93878 1.37082 7.09223C1.40349 7.22827 1.45736 7.35833 1.53046 7.47763C1.61292 7.61219 1.72822 7.72749 1.95882 7.95809L7.07124 13.0705C7.86328 13.8625 8.25929 14.2586 8.71595 14.4069C9.11764 14.5375 9.55033 14.5375 9.95202 14.4069C10.4087 14.2586 10.8047 13.8625 11.5967 13.0705L13.0712 11.596C13.8633 10.804 14.2593 10.4079 14.4077 9.95128C14.5382 9.5496 14.5382 9.1169 14.4077 8.71522C14.2593 8.25856 13.8633 7.86254 13.0712 7.07051L7.95882 1.95809C7.72822 1.72749 7.61292 1.61219 7.47836 1.52973C7.35907 1.45663 7.22901 1.40275 7.09296 1.37009C6.93951 1.33325 6.77645 1.33325 6.45033 1.33325L3.46732 1.33325C2.72058 1.33325 2.34721 1.33325 2.062 1.47858C1.81111 1.60641 1.60714 1.81038 1.47931 2.06126C1.33398 2.34648 1.33398 2.71985 1.33398 3.46658ZM5.66732 5.33325C5.66732 5.51735 5.51808 5.66658 5.33399 5.66658C5.14989 5.66658 5.00065 5.51735 5.00065 5.33325C5.00065 5.14916 5.14989 4.99992 5.33399 4.99992C5.51808 4.99992 5.66732 5.14916 5.66732 5.33325Z" stroke="#525252" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </g>
                          <defs>
                            <clipPath id="clip0_task">
                              <rect width="16" height="16" fill="white"/>
                            </clipPath>
                          </defs>
                        </svg>
                        <span className="font-medium text-sm text-gray-700">
                          Task
                        </span>
                      </div>
                    </th>
                    <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M5.00065 7.33333H3.06732C2.69395 7.33333 2.50727 7.33333 2.36466 7.406C2.23922 7.46991 2.13723 7.5719 2.07331 7.69734C2.00065 7.83995 2.00065 8.02663 2.00065 8.4V14M11.0007 7.33333H12.934C13.3074 7.33333 13.494 7.33333 13.6366 7.406C13.7621 7.46991 13.8641 7.5719 13.928 7.69734C14.0007 7.83995 14.0007 8.02663 14.0007 8.4V14M11.0007 14V4.13333C11.0007 3.3866 11.0007 3.01323 10.8553 2.72801C10.7275 2.47713 10.5235 2.27316 10.2726 2.14532C9.98742 2 9.61405 2 8.86732 2H7.13398C6.38725 2 6.01388 2 5.72866 2.14532C5.47778 2.27316 5.27381 2.47713 5.14598 2.72801C5.00065 3.01323 5.00065 3.3866 5.00065 4.13333V14M14.6673 14H1.33398M7.33398 4.66667H8.66732M7.33398 7.33333H8.66732M7.33398 10H8.66732" stroke="#525252" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span className="font-medium text-sm text-gray-700">
                          Property
                        </span>
                      </div>
                    </th>
                    <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M14 6.66658H2M10.6667 1.33325V3.99992M5.33333 1.33325V3.99992M5.2 14.6666H10.8C11.9201 14.6666 12.4802 14.6666 12.908 14.4486C13.2843 14.2569 13.5903 13.9509 13.782 13.5746C14 13.1467 14 12.5867 14 11.4666V5.86659C14 4.74648 14 4.18643 13.782 3.7586C13.5903 3.38228 13.2843 3.07632 12.908 2.88457C12.4802 2.66659 11.9201 2.66659 10.8 2.66659H5.2C4.0799 2.66659 3.51984 2.66659 3.09202 2.88457C2.71569 3.07632 2.40973 3.38228 2.21799 3.7586C2 4.18643 2 4.74648 2 5.86658V11.4666C2 12.5867 2 13.1467 2.21799 13.5746C2.40973 13.9509 2.71569 14.2569 3.09202 14.4486C3.51984 14.6666 4.0799 14.6666 5.2 14.6666Z" stroke="#525252" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span className="font-medium text-sm text-gray-700">
                          Due
                        </span>
                      </div>
                    </th>
                    <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M14 6.66658H2M10.6667 1.33325V3.99992M5.33333 1.33325V3.99992M5.2 14.6666H10.8C11.9201 14.6666 12.4802 14.6666 12.908 14.4486C13.2843 14.2569 13.5903 13.9509 13.782 13.5746C14 13.1467 14 12.5867 14 11.4666V5.86659C14 4.74648 14 4.18643 13.782 3.7586C13.5903 3.38228 13.2843 3.07632 12.908 2.88457C12.4802 2.66659 11.9201 2.66659 10.8 2.66659H5.2C4.0799 2.66659 3.51984 2.66659 3.09202 2.88457C2.71569 3.07632 2.40973 3.38228 2.21799 3.7586C2 4.18643 2 4.74648 2 5.86658V11.4666C2 12.5867 2 13.1467 2.21799 13.5746C2.40973 13.9509 2.71569 14.2569 3.09202 14.4486C3.51984 14.6666 4.0799 14.6666 5.2 14.6666Z" stroke="#525252" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span className="font-medium text-sm text-gray-700">
                          Updated
                        </span>
                      </div>
                    </th>
                    <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M8.00065 2.66659C5.05513 2.66659 2.66732 5.0544 2.66732 7.99992C2.66732 10.9454 5.05513 13.3333 8.00065 13.3333C10.5281 13.3333 12.6449 11.5752 13.1949 9.21518L12.9386 9.47139C12.6782 9.7317 12.2561 9.73164 11.9958 9.47125C11.7355 9.21086 11.7356 8.78875 11.9959 8.52844L13.3297 7.19511C13.4547 7.07011 13.6243 6.99989 13.8011 6.99992C13.9779 6.99994 14.1475 7.07021 14.2725 7.19525L15.6054 8.52858C15.8657 8.78897 15.8657 9.21108 15.6053 9.47139C15.3449 9.7317 14.9228 9.73164 14.6625 9.47125L14.5324 9.3411C13.9116 12.3802 11.2232 14.6666 8.00065 14.6666C4.31875 14.6666 1.33398 11.6818 1.33398 7.99992C1.33398 4.31802 4.31875 1.33325 8.00065 1.33325C10.4473 1.33325 12.5854 2.65164 13.7443 4.61357C13.9316 4.93058 13.8264 5.33938 13.5094 5.52664C13.1924 5.71391 12.7836 5.60873 12.5963 5.29172C11.6673 3.71904 9.95653 2.66659 8.00065 2.66659Z" fill="#525252"/>
                          <path d="M8.66732 4.66658C8.66732 4.2984 8.36884 3.99992 8.00065 3.99992C7.63246 3.99992 7.33398 4.2984 7.33398 4.66658V7.99992C7.33398 8.22282 7.44538 8.43097 7.63085 8.55462L9.63085 9.88795C9.9372 10.0922 10.3511 10.0094 10.5554 9.70305C10.7596 9.3967 10.6768 8.98279 10.3705 8.77855L8.66732 7.64313V4.66658Z" fill="#525252"/>
                        </svg>
                        <span className="font-medium text-sm text-gray-700">
                          Age
                        </span>
                      </div>
                    </th>
                    <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M9 4.33341H13.137C13.4228 4.33341 13.5657 4.33341 13.6517 4.3936C13.7268 4.44615 13.777 4.52732 13.7904 4.61803C13.8058 4.7219 13.7419 4.84969 13.6141 5.10526L12.7792 6.77496C12.7379 6.85769 12.7172 6.89905 12.7084 6.94253C12.7006 6.98105 12.6997 7.02064 12.7058 7.05947C12.7125 7.1033 12.7313 7.14556 12.7689 7.23008L13.6667 9.25014C13.7778 9.50008 13.8333 9.62504 13.8151 9.72593C13.7992 9.81409 13.7485 9.89214 13.6744 9.94248C13.5896 10.0001 13.4528 10.0001 13.1793 10.0001H8.06667C7.6933 10.0001 7.50661 10.0001 7.36401 9.92742C7.23856 9.8635 7.13658 9.76152 7.07266 9.63607C7 9.49347 7 9.30678 7 8.93341V7.33341M2 14.0001L2 2.33341M2 7.33341H7.93333C8.3067 7.33341 8.49339 7.33341 8.63599 7.26075C8.76143 7.19684 8.86342 7.09485 8.92734 6.96941C9 6.8268 9 6.64012 9 6.26675V2.73341C9 2.36005 9 2.17336 8.92734 2.03075C8.86342 1.90531 8.76143 1.80333 8.63599 1.73941C8.49339 1.66675 8.3067 1.66675 7.93333 1.66675L3.06667 1.66675C2.6933 1.66675 2.50661 1.66675 2.36401 1.73941C2.23856 1.80333 2.13658 1.90531 2.07266 2.03075C2 2.17336 2 2.36005 2 2.73341V7.33341Z" stroke="#525252" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span className="font-medium text-sm text-gray-700">
                          Priority
                        </span>
                      </div>
                    </th>
                    <th
                      className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap"
                      style={{
                        borderBottomWidth: "1px",
                        borderColor:
                          "rgba(0, 0, 0, 0) rgb(231, 232, 236) rgb(231, 232, 236) rgba(0, 0, 0, 0)",
                        borderRightWidth: "1px",
                        borderTopWidth: "1px",
                        borderWidth: "1px 1px 1px 0px",
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" clipRule="evenodd" d="M11.4048 10.2586C11.5701 9.92957 11.9708 9.79684 12.2998 9.96212C13.3894 10.5095 14.3105 11.3809 14.9771 12.4547C15.0781 12.6174 15.2251 12.8346 15.2707 13.129C15.3196 13.4442 15.234 13.7456 15.1066 13.9748C14.9791 14.204 14.7681 14.4357 14.4745 14.5604C14.1954 14.679 13.8918 14.6666 13.6672 14.6666C13.299 14.6666 13.0005 14.3681 13.0005 13.9999C13.0005 13.6317 13.299 13.3333 13.6672 13.3333C13.8107 13.3333 13.8861 13.3328 13.9399 13.3292L13.9413 13.3267C13.9541 13.3038 13.8572 13.1788 13.8443 13.158C13.2961 12.2749 12.5529 11.5814 11.7013 11.1536C11.3723 10.9883 11.2395 10.5876 11.4048 10.2586Z" fill="#525252"/>
                          <path fillRule="evenodd" clipRule="evenodd" d="M10.0702 2.01507C10.2341 1.68535 10.6342 1.55089 10.9639 1.71475C12.1696 2.31394 13.0005 3.55928 13.0005 4.99992C13.0005 6.44056 12.1696 7.6859 10.9639 8.28509C10.6342 8.44895 10.2341 8.31449 10.0702 7.98477C9.90635 7.65505 10.0408 7.25493 10.3705 7.09107C11.1404 6.70845 11.6672 5.91509 11.6672 4.99992C11.6672 4.08474 11.1404 3.29138 10.3705 2.90877C10.0408 2.74491 9.90635 2.34479 10.0702 2.01507Z" fill="#525252"/>
                          <path fillRule="evenodd" clipRule="evenodd" d="M2.66722 4.99992C2.66722 2.97487 4.30884 1.33325 6.33388 1.33325C8.35893 1.33325 10.0005 2.97487 10.0005 4.99992C10.0005 7.02496 8.35893 8.66659 6.33388 8.66659C4.30884 8.66659 2.66722 7.02496 2.66722 4.99992Z" fill="#525252"/>
                          <path fillRule="evenodd" clipRule="evenodd" d="M6.33388 9.33325C8.46471 9.33325 10.3696 10.536 11.532 12.28C11.6344 12.4336 11.7436 12.5975 11.8199 12.7532C11.9118 12.9407 11.9778 13.156 11.9624 13.4131C11.9501 13.6182 11.882 13.8085 11.8012 13.9596C11.7203 14.1107 11.5996 14.2728 11.4357 14.3967C11.2162 14.5627 10.9796 14.6209 10.7705 14.6453C10.5863 14.6667 10.3682 14.6666 10.1485 14.6666C7.60641 14.6661 5.06234 14.6661 2.51926 14.6666C2.29957 14.6666 2.08147 14.6667 1.89731 14.6453C1.68818 14.6209 1.45158 14.5627 1.23204 14.3967C1.06816 14.2728 0.947505 14.1107 0.86661 13.9596C0.785715 13.8085 0.71768 13.6182 0.705369 13.4131C0.689933 13.156 0.755933 12.9407 0.847831 12.7532C0.924183 12.5975 1.03339 12.4336 1.1358 12.28C2.29819 10.536 4.20306 9.33325 6.33388 9.33325Z" fill="#525252"/>
                        </svg>
                        <span className="font-medium text-sm text-gray-700">
                          Assignee
                        </span>
                      </div>
                    </th>
                    <th
                      className="sticky right-0 px-2 py-3 text-center w-20 whitespace-nowrap"
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
                  {tasks.map((task) => (
                    <tr
                      key={task.id}
                      className="border-b border-gray-200 hover:bg-gray-50 transition-colors h-12"
                    >
                      <td className="px-3 py-3 border-r border-gray-200 whitespace-nowrap">
                        <StatusBadge status={task.status} />
                      </td>
                      <td className="px-3 py-3 border-r border-gray-200 whitespace-nowrap">
                        <button
                          onClick={() => navigate(`/tasks/${task.id}`)}
                          className="text-blue-600 font-normal text-base hover:underline cursor-pointer transition-colors"
                        >
                          {task.title}
                        </button>
                      </td>
                      <td className="px-3 py-3 border-r border-gray-200 whitespace-nowrap">
                        <span className="text-gray-900 font-normal text-base">
                          {task.property}
                        </span>
                      </td>
                      <td className="px-3 py-3 border-r border-gray-200 whitespace-nowrap">
                        <span className="text-gray-900 font-normal text-base">
                          {task.due}
                        </span>
                      </td>
                      <td className="px-3 py-3 border-r border-gray-200 whitespace-nowrap">
                        <span className="text-blue-600 font-normal text-base hover:underline cursor-pointer">
                          {task.updated}
                        </span>
                      </td>
                      <td className="px-3 py-3 border-r border-gray-200 whitespace-nowrap">
                        <span className="text-gray-900 font-normal text-base">
                          {task.age}
                        </span>
                      </td>
                      <td className="px-3 py-3 border-r border-gray-200 whitespace-nowrap">
                        <PriorityBadge priority={task.priority} />
                      </td>
                      <td
                        className="px-3 py-3 whitespace-nowrap"
                        style={{
                          borderRightWidth: "1px",
                          border: "1px solid #e7e8ec",
                        }}
                      >
                        <div className="flex items-center gap-2">
                          {task.assignees.map((assignee) => (
                            <div
                              key={assignee.id}
                              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                              style={{
                                backgroundColor: "rgb(59, 130, 246)",
                                borderColor: "rgb(209, 213, 219)",
                                borderWidth: "1px",
                              }}
                              title={assignee.name}
                            >
                              {assignee.initials}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td
                        className="sticky right-0 px-2 py-3 flex items-center justify-center"
                        style={{
                          borderLeftWidth: "2px",
                          width: "80px",
                          border:
                            "1px none rgb(226, 232, 240) rgb(226, 232, 240) rgb(226, 232, 240) rgb(210, 209, 207)",
                          borderLeftColor: "transparent",
                          backgroundColor: "white",
                        }}
                      >
                        <ActionButton
                          taskId={task.id}
                          openMenuId={openMenuId}
                          setOpenMenuId={setOpenMenuId}
                        />
                      </td>
                    </tr>
                  ))}
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
                  of {tasks.length}
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

      {/* Create Task Modal */}
      <CreateTaskModal
        open={isCreateTaskModalOpen}
        onOpenChange={setIsCreateTaskModalOpen}
      />
    </div>
  );
}
