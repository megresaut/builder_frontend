import { useParams, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
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
import WorkOrders from "./WorkOrders";
import { fetchJSON, authFetch } from "@/api/fetchJSON";
import { openAuthPdf } from "@/api/openAuthPdf";
import FTOApprovalModal from "@/components/FTOApprovalModal";
import CreateFTOModal from "@/components/CreateFTOModal";
import { usePageState } from "@/hooks/usePageState";
import { useRef } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";


function renderUpdateDescription(u) {
  switch (u.update_type) {
    case "task_created":
      return <>created this task</>;

    case "status_changed":
      return (
        <>
          updated status from{" "}
          <span className="text-[#2463eb] font-medium">
            {u.old_value?.status}
          </span>{" "}
          to{" "}
          <span className="text-[#059669] font-medium">
            {u.new_value?.status}
          </span>
        </>
      );

    case "priority_changed":
      return (
        <>
          updated priority from{" "}
          <span className="text-[#2463eb] font-medium">
            {u.old_value?.priority}
          </span>{" "}
          to{" "}
          <span className="text-[#059669] font-medium">
            {u.new_value?.priority}
          </span>
        </>
      );

    case "fto_created":
      return (
        <>
          created Field Team Order{" "}
          <span className="text-[#2463eb] font-medium">
            #{u.new_value?.fto_id}
          </span>
        </>
      );

    default:
      return <>made an update</>;
  }
}

interface FieldTeamOrder {
  id: number;
  property: string;
  description: string;
  dueDate: string;
  unit?: string;
  fieldTeam: Array<{ initials: string; color: string; name: string }>;
  status: "dispatched" | "approved" | "pending-approval";
  amount: number;
}

const fieldTeamOrders: FieldTeamOrder[] = [
  {
    id: 1,
    property: "22 Indian Chase Dr",
    description: "Doors Need To Be Repaired",
    dueDate: "Oct 2, 2025",
    unit: "1",
    fieldTeam: [
      { initials: "CH", color: "bg-blue-500", name: "Christopher Harris" },
      { initials: "CS", color: "bg-blue-500", name: "Cassandra Smith" },
    ],
    status: "dispatched",
    amount: 420,
  },
  {
    id: 2,
    property: "22 Indian Chase Dr",
    description: "Doors Need To Be Repaired",
    dueDate: "Sep 29, 2025",
    fieldTeam: [
      { initials: "CH", color: "bg-blue-500", name: "Christopher Harris" },
      { initials: "CS", color: "bg-blue-500", name: "Cassandra Smith" },
    ],
    status: "approved",
    amount: 95,
  },
  {
    id: 3,
    property: "22 Indian Chase Dr",
    description: "Doors Need To Be Repaired",
    dueDate: "Sep 10, 2025",
    fieldTeam: [
      { initials: "CH", color: "bg-blue-500", name: "Christopher Harris" },
      { initials: "CS", color: "bg-blue-500", name: "Cassandra Smith" },
    ],
    status: "pending-approval",
    amount: 95,
  },
  {
    id: 4,
    property: "22 Indian Chase Dr",
    description: "Doors Need To Be Repaired",
    dueDate: "Sep 6, 2025",
    fieldTeam: [
      { initials: "CH", color: "bg-blue-500", name: "Christopher Harris" },
      { initials: "CS", color: "bg-blue-500", name: "Cassandra Smith" },
    ],
    status: "dispatched",
    amount: 112,
  },
  {
    id: 5,
    property: "22 Indian Chase Dr",
    description: "Doors Need To Be Repaired",
    dueDate: "Sep 5, 2025",
    fieldTeam: [
      { initials: "CH", color: "bg-blue-500", name: "Christopher Harris" },
      { initials: "CS", color: "bg-blue-500", name: "Cassandra Smith" },
    ],
    status: "dispatched",
    amount: 93,
  },
  {
    id: 6,
    property: "22 Indian Chase Dr",
    description: "Doors Need To Be Repaired",
    dueDate: "Sep 4, 2025",
    fieldTeam: [
      { initials: "CH", color: "bg-blue-500", name: "Christopher Harris" },
      { initials: "CS", color: "bg-blue-500", name: "Cassandra Smith" },
    ],
    status: "dispatched",
    amount: 75,
  },
  {
    id: 7,
    property: "22 Indian Chase Dr",
    description: "Doors Need To Be Repaired",
    dueDate: "Sep 4, 2025",
    fieldTeam: [
      { initials: "CH", color: "bg-blue-500", name: "Christopher Harris" },
      { initials: "CS", color: "bg-blue-500", name: "Cassandra Smith" },
    ],
    status: "dispatched",
    amount: 101,
  },
  {
    id: 8,
    property: "22 Indian Chase Dr",
    description: "Doors Need To Be Repaired",
    dueDate: "Sep 3, 2025",
    fieldTeam: [
      { initials: "CH", color: "bg-blue-500", name: "Christopher Harris" },
      { initials: "CS", color: "bg-blue-500", name: "Cassandra Smith" },
    ],
    status: "dispatched",
    amount: 124,
  },
  {
    id: 9,
    property: "22 Indian Chase Dr",
    description: "Doors Need To Be Repaired",
    dueDate: "Sep 1, 2025",
    fieldTeam: [
      { initials: "CH", color: "bg-blue-500", name: "Christopher Harris" },
      { initials: "CS", color: "bg-blue-500", name: "Cassandra Smith" },
    ],
    status: "dispatched",
    amount: 67,
  },
  {
    id: 10,
    property: "22 Indian Chase Dr",
    description: "Doors Need To Be Repaired",
    dueDate: "Sep 1, 2025",
    fieldTeam: [
      { initials: "CH", color: "bg-blue-500", name: "Christopher Harris" },
      { initials: "CS", color: "bg-blue-500", name: "Cassandra Smith" },
    ],
    status: "dispatched",
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

export default function TaskSummary() {
  const { taskId } = useParams<{ taskId: string }>();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("workorders");
  const [messageText, setMessageText] = useState("");
  const [summary, setSummary] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [attachments, setAttachments] = useState([]);
  const [loadingAttachments, setLoadingAttachments] = useState(true);
  const [updates, setUpdates] = useState([]);
  const [loadingUpdates, setLoadingUpdates] = useState(true);
  const [propertyManagerDetails, setPropertyManagerDetails] = useState<{
    name: string;
    email: string;
    role: string;
    phone?: string;
  } | null>(null);
  const [hoveredCreatedBy, setHoveredCreatedBy] = useState(false);
  // Initialize sequential number from navigation state if available
  const [sequentialNumber, setSequentialNumber] = useState<number | null>(
    () => location.state?.sequentialNumber || null
  );
  
  useEffect(() => {
    async function loadAttachments() {
      try {
        const list = await fetchJSON(`/maintenance/attachments/tasks/${taskId}`);
        setAttachments(list || []);
      } catch (err) {
        console.error("Failed to load attachments:", err);
      } finally {
        setLoadingAttachments(false);
      }
    }
  
    loadAttachments();
  }, [taskId]);
  
  useEffect(() => {
    async function load() {
      try {
        const data = await fetchJSON(`/maintenance/tasks/summary?id=${taskId}`);
        setSummary(data);
        
        // Fetch property manager details if requested_by ID is available
        if (data?.created_by?.id) {
          try {
            const propertyManagers = await fetchJSON("/users/property-managers");
            const manager = propertyManagers.find((pm: any) => pm.id === data.created_by.id);
            if (manager) {
              setPropertyManagerDetails({
                name: manager.name || data.created_by.name || "",
                email: manager.email || data.created_by.email || "",
                role: manager.role || "Property Manager",
                phone: manager.phone,
              });
            } else {
              // Fallback to created_by data if not found in property managers
              setPropertyManagerDetails({
                name: data.created_by.name || "",
                email: data.created_by.email || "",
                role: "Property Manager",
              });
            }
          } catch (err) {
            console.error("Failed to load property manager details:", err);
            // Fallback to created_by data
            if (data.created_by) {
              setPropertyManagerDetails({
                name: data.created_by.name || "",
                email: data.created_by.email || "",
                role: "Property Manager",
              });
            }
          }
        }
      } catch (err) {
        console.error("Failed to load summary:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [taskId]);
  
  // Calculate sequential number based on all tasks sorted by ID
  useEffect(() => {
    if (!taskId) return;
    
    async function calculateSequentialNumber() {
      try {
        const allTasks: Array<{ id: number }> = await fetchJSON("/maintenance/tasks");
        // Sort by ID (ascending) and find the position of current task
        const sortedTasks = [...allTasks].sort((a, b) => a.id - b.id);
        const taskIndex = sortedTasks.findIndex((t) => t.id === Number(taskId));
        if (taskIndex !== -1) {
          const calculatedNumber = taskIndex + 1;
          console.log(`Task ${taskId} found at index ${taskIndex}, sequential number: ${calculatedNumber}`, sortedTasks.map(t => t.id));
          setSequentialNumber(calculatedNumber);
        } else {
          console.warn(`Task ${taskId} not found in sorted tasks`);
        }
      } catch (err) {
        console.error("Failed to calculate sequential number:", err);
      }
    }
    
    // Calculate sequential number on mount and when taskId changes
    calculateSequentialNumber();
  }, [taskId]);
  
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

  useEffect(() => {
    async function loadUpdates() {
      try {
        const data = await fetchJSON(`/maintenance/tasks/updates/${taskId}`);
        setUpdates(data || []);
      } catch (err) {
        console.error("Failed to load updates:", err);
      } finally {
        setLoadingUpdates(false);
      }
    }
  
    loadUpdates();
  }, [taskId]);
  
  // Listen for refresh events to reload summary, updates, and attachments
  useEffect(() => {
    if (!taskId) return;
    
    const handleRefresh = async () => {
      // Refresh summary
      try {
        const data = await fetchJSON(`/maintenance/tasks/summary?id=${taskId}`);
        setSummary(data);
      } catch (err) {
        console.error("Failed to refresh summary:", err);
      }
      
      // Recalculate sequential number after refresh
      try {
        const allTasks: Array<{ id: number }> = await fetchJSON("/maintenance/tasks");
        const sortedTasks = [...allTasks].sort((a, b) => a.id - b.id);
        const taskIndex = sortedTasks.findIndex((t) => t.id === Number(taskId));
        if (taskIndex !== -1) {
          setSequentialNumber(taskIndex + 1);
        }
      } catch (err) {
        console.error("Failed to recalculate sequential number:", err);
      }
      
      // Refresh updates
      try {
        const updatesData = await fetchJSON(`/maintenance/tasks/updates/${taskId}`);
        setUpdates(updatesData || []);
      } catch (err) {
        console.error("Failed to refresh updates:", err);
      }
      
      // Refresh attachments
      try {
        const attachmentsList = await fetchJSON(`/maintenance/attachments/tasks/${taskId}`);
        setAttachments(attachmentsList || []);
      } catch (err) {
        console.error("Failed to refresh attachments:", err);
      }
    };

    window.addEventListener("refreshAllTasks", handleRefresh);
    return () => {
      window.removeEventListener("refreshAllTasks", handleRefresh);
    };
  }, [taskId]);
  
  if (loading || !summary) {
    return <div className="p-6">Loading...</div>;
  }

  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
  
    const form = new FormData();
    form.append("file", file);
  
    try {
      const res = await authFetch(`/maintenance/attachments/tasks/${taskId}`, {
        method: "POST",
        body: form,
      });
  
      if (!res.ok) {
        console.error("Upload failed:", await res.text());
        return;
      }
  
      const newFile = await res.json();
  
      // Update the UI immediately
      setAttachments((prev) => [...prev, newFile]);
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      // Reset so user can re-upload same file if needed
      e.target.value = "";
    }
  }
  
  
  return (
    <div
      className="flex flex-col px-6 py-9 pb-6 bg-white border-l"
      style={{ borderLeftColor: "rgb(210,209,207)" }}
    >
      {/* Header Section */}
      <div className="flex items-center justify-between gap-10 flex-wrap w-full">
        <div className="flex flex-col justify-start font-['Geist',sans-serif]">
        <div className="text-[#303030] text-[28px] font-semibold leading-[1.07]">
          {summary.title}
        </div>
        <div className="flex items-center gap-1 mt-1 text-base text-[#717179] font-medium">
          <span>To-Do</span>
          <span>•</span>
          <span>
            {sequentialNumber !== null 
              ? `#${sequentialNumber} ${taskId}` 
              : summary 
                ? `#? ${taskId}` 
                : `#? ${taskId}`}
          </span>
        </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 min-h-[40px] px-4 py-2.5 bg-[#013764] text-white rounded-lg shadow-[0px_0px_0px_1px_rgba(0,45,90,1)] font-['Geist',sans-serif] text-base font-medium hover:bg-[#014777] transition-colors">
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
            onClick={() => setActiveTab("summary")}
            className={`flex items-center gap-1.5 py-2 ${
              activeTab === "summary"
                ? "border-b-2 border-[#09090b] text-[#09090b]"
                : "hover:text-[#09090b]"
            } transition-colors`}
          >
            Summary
          </button>
          <button
            onClick={() => setActiveTab("workorders")}
            className={`flex items-center gap-1.5 py-2 ${
              activeTab === "workorders"
                ? "border-b-2 border-[#09090b] text-[#09090b]"
                : "hover:text-[#09090b]"
            } transition-colors`}
          >
            Work orders
          </button>
          <button
            onClick={() => setActiveTab("fieldteam")}
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
        {activeTab === "workorders" && (
          <div className="flex flex-col mt-5 w-full border border-[#e3e3e3] rounded-[10px] overflow-hidden font-['Geist',sans-serif]">
            <div className="flex items-center justify-between gap-10 px-3 py-3 bg-[#f9f9f9] max-w-full flex-wrap">
              <div className="flex items-center gap-2">
                <Bell className="w-[18px] h-[18px]" />
                <div className="text-base text-[#303030] font-bold tracking-[-0.32px]">
                  Notifications
                </div>
              </div>
            </div>
            <div className="flex flex-col px-3 py-3 bg-white">
              <div className="flex items-center justify-between flex-wrap">
                <div className="flex items-center gap-2 min-w-[240px] flex-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#e5e5e5]"></div>
                  <div className="text-base text-[#303030]">
                    A bill from Edgerton Inc. was uploaded, would you like to update work order status?
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
              <div className="flex items-center justify-between mt-3 flex-wrap">
                <div className="flex items-center gap-2 min-w-[240px] flex-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#e5e5e5]"></div>
                  <div className="text-base text-[#303030]">
                    Estimate differed from invoice by $50.50
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
          </div>
        )}

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

        {/* Status Section */}
        <div className="flex flex-col mt-5 w-full px-4 py-4 bg-[#f9f9f9] border border-[#e5e5e5] rounded-lg shadow-sm font-['Geist',sans-serif]">
          <div className="flex items-center justify-between gap-10 w-full flex-wrap">
            <div className="flex items-center gap-5 min-w-[240px] flex-wrap">
              <div className="flex items-center gap-2 text-sm flex-1 min-w-0">
                <div className="text-[#303030] font-medium">Status</div>
                <div className="flex items-center justify-between gap-5 px-1.5 pr-3 py-1.5 bg-white border border-[#dadada] rounded-lg shadow-sm w-[159px]">
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-[#d1fae5] rounded-2xl text-[#059669] text-sm tracking-[-0.28px]">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                      className="flex-shrink-0"
                    >
                      <path
                        d="M3.5 7L5.83333 9.33333L10.5 4.66667"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span>{summary.status}</span>
                  </div>
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm flex-1 min-w-0">
                <div className="text-[#303030] font-medium">Priority</div>
                <div className="flex items-center justify-between gap-5 px-1.5 pr-3 py-1.5 bg-white border border-[#dadada] rounded-lg shadow-sm w-[135px]">
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-[#dbe9fe] rounded-2xl text-[#2463eb] text-sm tracking-[-0.28px]">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                      className="flex-shrink-0"
                    >
                      <path
                        d="M2.91602 7H11.0827"
                        stroke="currentColor"
                        strokeWidth="1.3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span>{summary.priority}</span>
                  </div>
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-center gap-2 text-[#303030] flex-1 min-w-0">
                <div className="text-sm font-medium">Due Date</div>
                <div className="flex items-center justify-between gap-4 px-3 py-1.5 bg-white border border-[#dadada] rounded-lg shadow-sm text-base tracking-[-0.32px] w-[149px]">
                  <span>{summary.due_date ? new Date(summary.due_date).toLocaleDateString() : "None"}</span>
                  <Calendar className="w-4 h-4" />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 text-sm text-[#303030] tracking-[-0.28px]">
              <span className="font-normal">Last Updated</span>
              <span className="font-medium">{summary.last_updated ? new Date(summary.last_updated).toLocaleDateString() : "None"}</span>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex mt-5 w-full gap-6 flex-wrap lg:flex-nowrap">
          {/* Show WorkOrders component when work orders tab is active */}
          {activeTab === "workorders" && <WorkOrders />}

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
                      {summary.created_by?.name}
                    </span>{" "}
                    for{" "}
                    <span className="font-bold text-[#2463eb]">
                      {summary.property.name}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-sm text-[#717179] tracking-[-0.28px]">
                  <span>Created</span>
                  <span>{summary.date_requested ? new Date(summary.date_requested).toLocaleDateString() : "None"}</span>
                  <Edit className="w-4 h-4 ml-2 text-[#2463eb]" />
                  <span className="text-[#2463eb] font-medium">Edit</span>
                </div>
              </div>

              <div className="flex flex-col mt-5 w-full items-start text-sm text-[#717179]">
                <div className="flex items-center gap-1">
                  <span className="font-semibold">Category:</span>
                  <span className="font-medium">{summary.category}</span>
                </div>
              </div>

              <div className="mt-5 text-sm text-[#717179] font-semibold">
                Description:
              </div>
              <div className="mt-5 text-sm text-[#717179] font-medium leading-4">
                {summary.description}
              </div>

              <div className="w-full h-px bg-[#e5e5e5] mt-5"></div>   

              <div className="flex items-center gap-8 mt-5 flex-wrap">
                <div className="flex flex-col items-center">
                  <div className="text-sm text-[#717179]">TOTAL EXPENSE</div>
                  <div className="mt-1 text-2xl text-[#303030] font-medium">
                    ${summary.total_expense.toFixed(2)}
                  </div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="text-sm text-[#717179]">WORK ORDERS</div>
                  <div className="mt-1 text-2xl text-[#303030] font-medium">
                    {summary.work_order_count}
                  </div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="text-sm text-[#717179]">FTOs</div>
                  <div className="mt-1 text-2xl text-[#303030] font-medium">
                    {summary.fto_count}
                  </div>
                </div>
              </div>
            </div>

            {/* Notes Section */}
            <div className="flex flex-col w-full mt-[18px] px-4 py-4 bg-[#f9f9f9] border border-[#e5e5e5] rounded-lg shadow-sm font-['Geist',sans-serif]">
              <div className="text-base text-[#303030] font-medium">Notes</div>
              <textarea
                placeholder="Add some note here"
                className="mt-4 min-h-[81px] w-full px-3 py-2 bg-white border border-[#dadada] rounded-lg text-sm text-[#303030] placeholder:text-[#a1a1a9] resize-none focus:outline-none focus:border-[#2463eb]"
                rows={4}
              />
            </div>

            {/* Files Section */}
            <div className="flex flex-col w-full mt-[18px] px-4 py-4 bg-[#f9f9f9] border border-[#e5e5e5] rounded-lg shadow-sm font-['Geist',sans-serif]">
              <div className="text-base text-[#303030] font-medium">Files</div>
              <div className="mt-4 flex flex-col items-center px-52 py-7 bg-white border border-dashed border-[rgba(18,18,18,0.4)] rounded-lg">
                <input
                  type="file"
                  id="task-file-input"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e)}
                />
                <button
                  onClick={() => document.getElementById("task-file-input").click()}
                  className="flex items-center gap-2 min-h-[36px] px-3 py-1.5 bg-[#fbfbfb] border border-[#dadada] rounded-lg shadow-sm text-base text-[#303030] tracking-[-0.32px] hover:bg-gray-50 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  Upload
                </button>
                <div className="mt-3 px-2.5 py-2.5 flex flex-col items-center text-sm text-[#09090b]">
                  <div>Choose a file or drag & drop it here</div>
                  <div className="mt-1.5 text-sm">Maximum 500 MB file size</div>
                </div>
              </div>

              {/* File List */}
              <div className="mt-4 flex flex-col w-full">
                <div className="flex items-center gap-2 text-sm text-[#09090b] font-['Geist',sans-serif] font-medium">
                  <span>Files</span>
                </div>

                {loadingAttachments ? (
                  <div className="mt-2 text-gray-500 text-sm">Loading files...</div>
                ) : attachments.length === 0 ? (
                  <div className="mt-2 text-gray-500 text-sm">No files uploaded</div>
                ) : (
                  <div className="mt-2 flex flex-col gap-2 w-full">
                    {attachments.map((file) => (
                      <button
                        key={file.id}
                        onClick={() => openAuthPdf(file.storage_path).catch(() => {})}
                        className="flex items-center justify-between gap-3 px-4 py-3 bg-white border border-[#e5e5e5] rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {/* Icon */}
                          <div className="flex-shrink-0 w-10 h-10 bg-[#ef4444] rounded flex items-center justify-center">
                            <span className="text-white text-xs font-bold">
                              {file.file_type.startsWith("image") ? "IMG" : "FILE"}
                            </span>
                          </div>

                          {/* File info */}
                          <div className="flex flex-col min-w-0 flex-1 text-left">
                            <div className="text-sm text-[#303030] font-medium truncate">
                              {file.file_name}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-[#717179] mt-0.5">
                              <span>{file.file_type}</span>
                              <span>{Math.round(file.file_size / 1024)} KB</span>
                            </div>
                          </div>
                        </div>

                        {/* Delete button - we'll wire up later */}
                        <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600">
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path
                              d="M2 14L14 2M14 14L2 2"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                            />
                          </svg>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
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

              {/* 2-COLUMN LAYOUT */}
              <div className="flex gap-4">

                {/* LEFT FIXED TIMELINE COLUMN */}
                <div className="flex flex-col items-center w-[72px] pt-[4px]">

                  {/* + BUTTON DOT */}
                  <div className="w-10 h-10 rounded-full bg-[#013764]/10 border-[3px] border-[#013764]/40"></div>

                  {/* CONNECTOR */}
                  <div className="w-[2px] h-10 bg-gray-200 mt-1 mb-1"></div>

                  {/* UPDATE DOTS BELOW */}
                  {updates.map((u, idx) => {
                    let bg = "bg-gray-200";
                    let border = "border-gray-300";
                    let text = "text-gray-600";

                    if (u.update_type === "task_created" || u.update_type === "fto_created") {
                      bg = "bg-[#dbe9fe]";
                      border = "border-[#2463eb]";
                      text = "text-[#2463eb]";
                    } else if (u.update_type === "status_changed" || u.update_type === "priority_changed") {
                      bg = "bg-[#d1fae5]";
                      border = "border-[#059669]";
                      text = "text-[#059669]";
                    }

                    return (
                      <div key={u.id} className="flex flex-col items-center">
                        <div className={`w-10 h-10 rounded-full border ${bg} ${border} ${text}`}></div>

                        {idx < updates.length - 1 && (
                          <div className="w-[2px] h-10 bg-gray-200 my-1"></div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* RIGHT CONTENT COLUMN */}
                <div className="flex flex-col flex-1 gap-3">

                  {/* === UPDATE TASK CARD === */}
                  <div className="flex items-center gap-3 pl-[12px] pr-5 py-4 bg-white border border-[#e5e5e5] rounded-xl">
                    <button className="flex items-center justify-center w-10 h-10 bg-[#013764] rounded-full text-white">
                      <span className="text-lg font-semibold">+</span>
                    </button>

                    <div className="text-lg font-medium text-[#013764]">
                      Update Task
                    </div>
                  </div>

                  {/* === UPDATE CARDS === */}
                  {!loadingUpdates &&
                    updates.map((u) => (
                      <div
                        key={u.id}
                        className="flex items-start gap-3 px-4 py-3 bg-white border border-[#e5e5e5] rounded-lg"
                      >
                        {/* Actor bubble */}
                        <div className="flex items-center justify-center w-10 h-10 bg-white border border-[#2463eb] rounded-full text-base text-[#2463eb] font-semibold flex-shrink-0">
                          {u.actor?.initials || "?"}
                        </div>

                        <div className="flex flex-col flex-1 min-w-0">
                          <div className="text-sm text-[#303030]">
                            <span className="font-medium">{u.actor?.name || "System"}</span>{" "}
                            {renderUpdateDescription(u)}
                          </div>

                          <div className="text-xs text-[#a1a1a9] mt-1">
                            {new Date(u.created_at).toLocaleString()}
                          </div>

                          {u.attachments && u.attachments.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-[#e5e5e5] space-y-2">
                              {u.attachments.map((a) => (
                                <button
                                  key={a.id}
                                  onClick={() => openAuthPdf(a.storage_path).catch(() => {})}
                                  className="flex items-center gap-2 text-xs text-[#2463eb] hover:underline"
                                >
                                  <Paperclip className="w-3 h-3" />
                                  {a.file_name}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        <button className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
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
                      (C) {summary.property.address_line1}, {summary.property.city}, {summary.property.state} {summary.property.postal_code}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-[#717179] font-['Geist',sans-serif]">
                    {summary.property.full_address}
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
                      <div className="mt-1 text-[#a1a1a9]">Staff member</div>
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
                  <div className="flex items-center gap-2.5 min-w-[240px] flex-1 relative">
                    <div
                      className="flex items-center justify-center w-10 h-10 bg-white border border-[#2463eb] rounded-full text-xl text-[#2463eb] font-semibold leading-[0.8] cursor-pointer"
                      onMouseEnter={() => setHoveredCreatedBy(true)}
                      onMouseLeave={() => setHoveredCreatedBy(false)}
                    >
                      {summary.created_by?.initials || propertyManagerDetails?.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) || "?"}
                    </div>
                    {hoveredCreatedBy && propertyManagerDetails && (
                      <div
                        className="absolute left-0 top-12 z-50 bg-[#303030] text-white px-4 py-3 rounded-lg shadow-lg min-w-[200px]"
                        style={{ pointerEvents: "auto" }}
                      >
                        <div className="text-base font-semibold">{propertyManagerDetails.name}</div>
                        <div className="text-sm mt-1 opacity-90">{propertyManagerDetails.role}</div>
                        <div className="text-sm mt-1 opacity-90">{propertyManagerDetails.email}</div>
                        {propertyManagerDetails.phone && (
                          <div className="text-sm mt-1 opacity-90">{propertyManagerDetails.phone}</div>
                        )}
                      </div>
                    )}
                    <div className="flex flex-col flex-1 text-sm">
                      <div className="text-[#2463eb] font-medium tracking-[-0.28px]">
                        {propertyManagerDetails?.name || summary.created_by?.name || "Unknown"}
                      </div>
                      <div className="mt-1 text-[#a1a1a9]">{propertyManagerDetails?.role || "Staff member"}</div>
                    </div>
                  </div>
                  <div className="text-sm text-[#a1a1a9]">{propertyManagerDetails?.email || summary.created_by?.email || "No email"}</div>
                </div>
              </div>

              <div className="w-full h-px bg-[#e5e5e5] mt-4"></div>

              <div className="flex flex-col mt-4 w-full text-sm">
                <div className="text-[#303030] font-medium">Rental owners</div>
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
            <div className="flex flex-col mt-[18px] min-h-[200px]">
              <div className="flex flex-col w-full max-w-[376px] bg-[#f9f9f9] border border-[#e5e5e5] rounded-lg shadow-sm overflow-hidden px-4 py-6">
                
                <div className="text-lg font-semibold text-[#303030] tracking-[-0.32px]">
                  Client Communication
                </div>

                <div className="flex items-center justify-center mt-6 mb-4">
                  <div className="px-4 py-2 bg-[#e5e5e5] text-[#717179] text-sm rounded-lg font-medium">
                    Coming soon
                  </div>
                </div>

                <div className="text-center text-sm text-[#a1a1a9] font-medium">
                  This feature is currently under development.
                </div>

              </div>
            </div>

            {/* <div className="flex flex-col mt-[18px] min-h-[534px]">
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
                        I just got back from a hiking trip, and the views were
                        breathtaking! You should try it.
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-white border border-[#2463eb] rounded-full text-sm text-[#2463eb] font-semibold leading-[0.91] flex-shrink-0">
                      SP
                    </div>
                    <div className="flex flex-col min-w-[240px] flex-1 text-black">
                      <div className="text-base font-semibold">Sara Patel</div>
                      <div className="mt-2 text-sm leading-4">
                        The new art exhibit at the gallery opens this weekend.
                        Are you interested in going?
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-white border border-[#2463eb] rounded-full text-sm text-[#2463eb] font-semibold leading-[0.91] flex-shrink-0">
                      DK
                    </div>
                    <div className="flex flex-col min-w-[240px] flex-1 text-black">
                      <div className="text-base font-semibold">David Kim</div>
                      <div className="mt-2 text-sm leading-4">
                        There's a great concert happening in the park next week.
                        We should grab some tickets!
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
            </div> */}
          </div>
            </>
          )}

          {/* Field Team Orders tab content - placeholder */}
          {activeTab === "fieldteam" && (
            <div className="flex flex-col items-center justify-center w-full min-h-[400px]">
              <p className="text-gray-500 text-lg">Field Team Orders content coming soon...</p>
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
            onOpenChange={setShowFTOModal}
            editingFTOId={selectedFTOId}   // ✅ added
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