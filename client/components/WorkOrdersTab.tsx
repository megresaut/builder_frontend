import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, Search, ChevronDown, MoreVertical } from "lucide-react";
import WorkOrders from "../pages/WorkOrders";

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
        <MoreVertical className="w-4 h-4" />
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
                console.log("Edit clicked for work order", taskId);
                setOpenMenuId(null);
              }}
              className="flex justify-between items-center w-full hover:opacity-70 transition-opacity"
            >
              <span className="text-[#303030] font-normal text-base">Edit</span>
            </button>
            <button
              onClick={() => {
                console.log("Delete clicked for work order", taskId);
                setOpenMenuId(null);
              }}
              className="flex justify-between items-center w-full hover:opacity-70 transition-opacity"
            >
              <span className="text-[#303030] font-normal text-base">Delete</span>
            </button>
          </div>,
          document.body,
        )}
    </>
  );
};

export default function WorkOrdersTab() {
  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState<number | null>(
    null
  );
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  // Show detail view when a work order is selected
  if (selectedWorkOrderId) {
    return (
      <div className="flex flex-col w-full">
        <button
          onClick={() => setSelectedWorkOrderId(null)}
          className="flex items-center gap-2 mb-4 text-[#2463eb] hover:underline"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Work Orders
        </button>
        <WorkOrders />
      </div>
    );
  }

  // Show table view
  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col gap-6">
        {/* Work Orders Table */}
        <div className="w-full border border-gray-200 bg-white rounded-lg overflow-hidden">
          {/* Table Header */}
          <div className="flex justify-between items-center px-6 py-3 border-b border-gray-200 bg-white">
            <div className="flex items-center gap-4">
              <h2 className="text-[#303030] font-medium text-[22px] leading-6">
                Work Orders
              </h2>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="flex h-9 items-center gap-2 px-3 rounded-lg border border-[#DADADA] bg-white">
                <Search className="w-5 h-5 text-gray-600" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="text-[#303030] font-normal text-base bg-transparent border-none outline-none placeholder:text-[#303030] w-32 sm:w-48"
                />
              </div>
              <button className="flex h-9 justify-center items-center gap-2 px-3 rounded-lg border border-[#DADADA] bg-white hover:bg-gray-50 transition-colors">
                <span className="text-[#303030] font-normal text-base">
                  Filter
                </span>
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Table Content */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 h-12">
                  <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                    <span className="font-medium text-sm text-gray-700">
                      Work Order
                    </span>
                  </th>
                  <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                    <span className="font-medium text-sm text-gray-700">
                      Updated
                    </span>
                  </th>
                  <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                    <span className="font-medium text-sm text-gray-700">
                      Age
                    </span>
                  </th>
                  <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                    <span className="font-medium text-sm text-gray-700">
                      Status
                    </span>
                  </th>
                  <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                    <span className="font-medium text-sm text-gray-700">
                      Due
                    </span>
                  </th>
                  <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                    <span className="font-medium text-sm text-gray-700">
                      Priority
                    </span>
                  </th>
                  <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                    <span className="font-medium text-sm text-gray-700">
                      Bill Status
                    </span>
                  </th>
                  <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                    <span className="font-medium text-sm text-gray-700">
                      Bill Total
                    </span>
                  </th>
                  <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                    <span className="font-medium text-sm text-gray-700">
                      Assignees
                    </span>
                  </th>
                  <th
                    className="sticky right-0 px-2 py-3 text-center w-20"
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
                {mockWorkOrders.map((workOrder) => (
                  <tr
                    key={workOrder.id}
                    onClick={() => setSelectedWorkOrderId(workOrder.id)}
                    className="border-b border-gray-200 hover:bg-gray-50 transition-colors h-12 cursor-pointer"
                  >
                    <td className="px-3 py-3 border-r border-gray-200 whitespace-nowrap">
                      <span className="text-gray-900 font-normal text-base">
                        {workOrder.task}
                      </span>
                    </td>
                    <td className="px-3 py-3 border-r border-gray-200 whitespace-nowrap">
                      <span className="text-gray-900 font-normal text-base">
                        {workOrder.updatedDate}
                      </span>
                    </td>
                    <td className="px-3 py-3 border-r border-gray-200 whitespace-nowrap">
                      <span className="text-gray-900 font-normal text-base">
                        {workOrder.age}
                      </span>
                    </td>
                    <td className="px-3 py-3 border-r border-gray-200 whitespace-nowrap">
                      <div
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-normal ${
                          workOrder.status === "Completed"
                            ? "bg-emerald-100 text-emerald-600"
                            : "bg-blue-100 text-blue-600"
                        }`}
                      >
                        {workOrder.status}
                      </div>
                    </td>
                    <td className="px-3 py-3 border-r border-gray-200 whitespace-nowrap">
                      <span className="text-gray-900 font-normal text-base">
                        {workOrder.dueDate}
                      </span>
                    </td>
                    <td className="px-3 py-3 border-r border-gray-200 whitespace-nowrap">
                      <div
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-normal ${
                          workOrder.priority === "High"
                            ? "bg-[#fef3c7] text-[#d97706]"
                            : workOrder.priority === "Low"
                              ? "bg-[#d1fae5] text-[#059669]"
                              : "bg-[#dbe9fe] text-[#2463eb]"
                        }`}
                      >
                        {workOrder.priority}
                      </div>
                    </td>
                    <td className="px-3 py-3 border-r border-gray-200 whitespace-nowrap">
                      <div
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-normal ${
                          workOrder.billStatus === "Paid"
                            ? "bg-green-100 text-green-600"
                            : workOrder.billStatus === "Unpaid"
                              ? "bg-red-100 text-red-600"
                              : "bg-yellow-100 text-yellow-600"
                        }`}
                      >
                        {workOrder.billStatus}
                      </div>
                    </td>
                    <td className="px-3 py-3 border-r border-gray-200 whitespace-nowrap">
                      <span className="text-gray-900 font-normal text-base">
                        {workOrder.billTotal}
                      </span>
                    </td>
                    <td className="px-3 py-3 border-r border-gray-200 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {workOrder.assignees.map((assignee) => (
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
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ActionButton
                        taskId={workOrder.id}
                        openMenuId={openMenuId}
                        setOpenMenuId={setOpenMenuId}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
