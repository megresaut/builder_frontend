import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import CreateWorkOrderModalV2 from "@/components/CreateWorkOrderModalV2";
import { usePageState } from "@/hooks/usePageState";
import { useSortingTable } from "@/hooks/useSortingTable";
import { useColumnManagement } from "@/hooks/useColumnManagement";
import ColumnFilterModal from "@/components/ColumnFilterModal";
import GlobalTable from "@/components/GlobalTable";
import TaskStatusBadge from "@/components/TaskStatusBadge";
import TaskPriorityBadge from "@/components/TaskPriorityBadge";
import HeaderV1 from "@/components/HeaderV1";
import PersonAvatars from "@/components/PersonAvatars";
import { EditIcon, DeleteIcon, BuildingIcon, HashtagIcon } from "@/components/icons";

interface Assignee {
  id: number;
  name: string;
  initials: string;
  color: string;
}

interface WorkOrder {
  id: number;
  task: string;
  taskId: number;
  property: string;
  unit: string;
  dueDate: string | Date;
  updatedDate: string;
  age: string;
  priority: string;
  status: string;
  billStatus: "Paid" | "Unpaid" | "Awaiting Invoice";
  billTotal: string;
  assignees: Assignee[];
  collaborators: Assignee[];
  vendorName?: string;
}

const mockWorkOrders: WorkOrder[] = [
  {
    id: 1,
    task: "Doors need to be repaired",
    taskId: 1,
    property: "Downtown Building",
    unit: "Unit 101",
    dueDate: "Oct 2, 2025",
    updatedDate: "Oct 2, 2025",
    age: "6 days 5 hours",
    priority: "high",
    status: "in_progress",
    billStatus: "Paid",
    billTotal: "$420",
    assignees: [
      { id: 1, name: "Jerry Sanchez", initials: "JS", color: "bg-blue-500" },
    ],
    collaborators: [
      { id: 5, name: "Sarah Wilson", initials: "SW", color: "bg-pink-500" },
    ],
  },
  {
    id: 2,
    task: "HVAC maintenance needed",
    taskId: 2,
    property: "Riverside Complex",
    unit: "Unit 205",
    dueDate: "Sep 29, 2025",
    updatedDate: "Sep 29, 2025",
    age: "6 days 5 hours",
    priority: "low",
    status: "in_progress",
    billStatus: "Awaiting Invoice",
    billTotal: "No invoice",
    assignees: [
      { id: 3, name: "Jane Smith", initials: "JMS", color: "bg-green-500" },
    ],
    collaborators: [
      { id: 6, name: "Tom Davis", initials: "TD", color: "bg-indigo-500" },
      { id: 7, name: "Lisa Brown", initials: "LB", color: "bg-red-500" },
    ],
  },
  {
    id: 3,
    task: "Window replacement",
    taskId: 3,
    property: "Central Plaza",
    unit: "Unit 312",
    dueDate: "Sep 10, 2025",
    updatedDate: "Sep 10, 2025",
    age: "6 days 5 hours",
    priority: "normal",
    status: "completed",
    billStatus: "Unpaid",
    billTotal: "$95",
    assignees: [
      { id: 1, name: "Jerry Sanchez", initials: "JS", color: "bg-blue-500" },
    ],
    collaborators: [],
  },
  {
    id: 4,
    task: "Roof inspection",
    taskId: 4,
    property: "Highland Towers",
    unit: "Roof Level",
    dueDate: "Sep 6, 2025",
    updatedDate: "Sep 6, 2025",
    age: "6 days 5 hours",
    priority: "high",
    status: "completed",
    billStatus: "Unpaid",
    billTotal: "$112",
    assignees: [
      { id: 2, name: "John Doe", initials: "JD", color: "bg-purple-500" },
    ],
    collaborators: [
      { id: 5, name: "Sarah Wilson", initials: "SW", color: "bg-pink-500" },
    ],
  },
  {
    id: 5,
    task: "Plumbing repair",
    taskId: 5,
    property: "Market Street Apt",
    unit: "Unit 404",
    dueDate: "Sep 5, 2025",
    updatedDate: "Sep 5, 2025",
    age: "6 days 5 hours",
    priority: "high",
    status: "completed",
    billStatus: "Unpaid",
    billTotal: "$93",
    assignees: [
      { id: 4, name: "Mike Johnson", initials: "MJ", color: "bg-orange-500" },
    ],
    collaborators: [
      { id: 6, name: "Tom Davis", initials: "TD", color: "bg-indigo-500" },
    ],
  },
  {
    id: 6,
    task: "Electrical work",
    taskId: 6,
    property: "Oak Ridge Manor",
    unit: "Unit 501",
    dueDate: "Sep 4, 2025",
    updatedDate: "Sep 4, 2025",
    age: "6 days 5 hours",
    priority: "high",
    status: "completed",
    billStatus: "Unpaid",
    billTotal: "$75",
    assignees: [
      { id: 1, name: "Jerry Sanchez", initials: "JS", color: "bg-blue-500" },
    ],
    collaborators: [
      { id: 7, name: "Lisa Brown", initials: "LB", color: "bg-red-500" },
      { id: 5, name: "Sarah Wilson", initials: "SW", color: "bg-pink-500" },
    ],
  },
  {
    id: 7,
    task: "Painting job",
    taskId: 7,
    property: "Park Avenue Building",
    unit: "Unit 102",
    dueDate: "Sep 4, 2025",
    updatedDate: "Sep 4, 2025",
    age: "6 days 5 hours",
    priority: "high",
    status: "completed",
    billStatus: "Unpaid",
    billTotal: "$101",
    assignees: [
      { id: 3, name: "Jane Smith", initials: "JMS", color: "bg-green-500" },
    ],
    collaborators: [],
  },
  {
    id: 8,
    task: "Carpet replacement",
    taskId: 8,
    property: "Westside Residences",
    unit: "Unit 203",
    dueDate: "Sep 3, 2025",
    updatedDate: "Sep 3, 2025",
    age: "6 days 5 hours",
    priority: "high",
    status: "completed",
    billStatus: "Unpaid",
    billTotal: "$124",
    assignees: [
      { id: 2, name: "John Doe", initials: "JD", color: "bg-purple-500" },
    ],
    collaborators: [
      { id: 6, name: "Tom Davis", initials: "TD", color: "bg-indigo-500" },
    ],
  },
  {
    id: 9,
    task: "Landscaping work",
    taskId: 9,
    property: "Spring Valley Complex",
    unit: "Common Area",
    dueDate: "Sep 1, 2025",
    updatedDate: "Sep 1, 2025",
    age: "6 days 5 hours",
    priority: "high",
    status: "completed",
    billStatus: "Unpaid",
    billTotal: "$67",
    assignees: [
      { id: 4, name: "Mike Johnson", initials: "MJ", color: "bg-orange-500" },
    ],
    collaborators: [
      { id: 5, name: "Sarah Wilson", initials: "SW", color: "bg-pink-500" },
      { id: 7, name: "Lisa Brown", initials: "LB", color: "bg-red-500" },
    ],
  },
  {
    id: 10,
    task: "Fence repair",
    taskId: 10,
    property: "Lakeside Gardens",
    unit: "Unit 606",
    dueDate: "Sep 1, 2025",
    updatedDate: "Sep 1, 2025",
    age: "6 days 5 hours",
    priority: "high",
    status: "completed",
    billStatus: "Unpaid",
    billTotal: "$118",
    assignees: [
      { id: 1, name: "Jerry Sanchez", initials: "JS", color: "bg-blue-500" },
    ],
    collaborators: [
      { id: 6, name: "Tom Davis", initials: "TD", color: "bg-indigo-500" },
    ],
  },
];

interface TaskWorkOrdersProps {
  workOrders: WorkOrder[];
  onWorkOrdersChange: (orders: WorkOrder[]) => void;
  defaultProperty?: string;
  defaultTask?: string;
  defaultUnit?: string;
  taskId: string;
  onWorkOrderSelect?: (woId: number) => void;
}

export default function TaskWorkOrders({
  workOrders,
  onWorkOrdersChange,
  defaultProperty,
  defaultTask,
  defaultUnit,
  taskId,
  onWorkOrderSelect
}: TaskWorkOrdersProps) {
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
  const [editingWorkOrder, setEditingWorkOrder] = useState<WorkOrder | null>(
    null,
  );
  const [isCreateWorkOrderModalOpen, setIsCreateWorkOrderModalOpen] =
    usePageState("isCreateWorkOrderModalOpen", false);

  const { handleSortClick, getSortIndicator, getSortedData } =
    useSortingTable(workOrders, "taskWorkOrders");
  const {
    columnOrder,
    visibleColumns,
    draggedColumn,
    dropTargetColumn,
    dropPosition,
    showColumnModal,
    setShowColumnModal,
    columnMenuPos,
    columnButtonRef,
    toggleColumnVisibility,
    handleColumnDragStart,
    handleColumnDragOver,
    handleColumnDragLeave,
    handleColumnDrop,
  } = useColumnManagement([
    "priority",
    "task",
    "property",
    "unit",
    "updatedDate",
    "age",
    "status",
    "dueDate",
    "billStatus",
    "billTotal",
    "assignees",
    "collaborators",
  ]);

  const columns = [
    {
      key: "priority",
      label: "Priority",
      icon: (
        <img
          loading="lazy"
          src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/19c17d4129204654414d25bb07907dbe45b6100b?placeholderIfAbsent=true"
          className="w-3.5 h-3.5"
          alt=""
        />
      ),
    },
    {
      key: "task",
      label: "Work Order",
      icon: (
        <img
          loading="lazy"
          src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/7f481edecd98b8475a23ac762feb99280a60a52a?placeholderIfAbsent=true"
          style={{ width: "16px", height: "16px" }}
          alt=""
        />
      ),
    },
    {
      key: "property",
      label: "Property",
      icon: <BuildingIcon width={16} height={16} className="text-gray-600" />,
    },
    {
      key: "unit",
      label: "Unit",
      icon: <HashtagIcon width={16} height={16} className="text-gray-600" />,
    },
    {
      key: "updatedDate",
      label: "Updated",
      icon: (
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M14 6.66658H2M10.6667 1.33325V3.99992M5.33333 1.33325V3.99992M5.2 14.6666H10.8C11.9201 14.6666 12.4802 14.6666 12.908 14.4486C13.2843 14.2569 13.5903 13.9509 13.782 13.5746C14 13.1467 14 12.5867 14 11.4666V5.86659C14 4.74648 14 4.18643 13.782 3.7586C13.5903 3.38228 13.2843 3.07632 12.908 2.88457C12.4802 2.66659 11.9201 2.66659 10.8 2.66659H5.2C4.0799 2.66659 3.51984 2.66659 3.09202 2.88457C2.71569 3.07632 2.40973 3.38228 2.21799 3.7586C2 4.18643 2 4.74648 2 5.86658V11.4666C2 12.5867 2 13.1467 2.21799 13.5746C2.40973 13.9509 2.71569 14.2569 3.09202 14.4486C3.51984 14.6666 4.0799 14.6666 5.2 14.6666Z"
            stroke="#525252"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      key: "age",
      label: "Age",
      icon: (
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M8.00065 2.66659C5.05513 2.66659 2.66732 5.0544 2.66732 7.99992C2.66732 10.9454 5.05513 13.3333 8.00065 13.3333C10.5281 13.3333 12.6449 11.5752 13.1949 9.21518L12.9386 9.47139C12.6782 9.7317 12.2561 9.73164 11.9958 9.47125C11.7355 9.21086 11.7356 8.78875 11.9959 8.52844L13.3297 7.19511C13.4547 7.07011 13.6243 6.99989 13.8011 6.99992C13.9779 6.99994 14.1475 7.07021 14.2725 7.19525L15.6054 8.52858C15.8657 8.78897 15.8657 9.21108 15.6053 9.47139C15.3449 9.7317 14.9228 9.73164 14.6625 9.47125L14.5324 9.3411C13.9116 12.3802 11.2232 14.6666 8.00065 14.6666C4.31875 14.6666 1.33398 11.6818 1.33398 7.99992C1.33398 4.31802 4.31875 1.33325 8.00065 1.33325C10.4473 1.33325 12.5854 2.65164 13.7443 4.61357C13.9316 4.93058 13.8264 5.33938 13.5094 5.52664C13.1924 5.71391 12.7836 5.60873 12.5963 5.29172C11.6673 3.71904 9.95653 2.66659 8.00065 2.66659Z"
            fill="#525252"
          />
          <path
            d="M8.66732 4.66658C8.66732 4.2984 8.36884 3.99992 8.00065 3.99992C7.63246 3.99992 7.33398 4.2984 7.33398 4.66658V7.99992C7.33398 8.22282 7.44538 8.43097 7.63085 8.55462L9.63085 9.88795C9.9372 10.0922 10.3511 10.0094 10.5554 9.70305C10.7596 9.3967 10.6768 8.98279 10.3705 8.77855L8.66732 7.64313V4.66658Z"
            fill="#525252"
          />
        </svg>
      ),
    },
    {
      key: "status",
      label: "Status",
      icon: (
        <img
          loading="lazy"
          src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/137343a4a83566b73ded0282be168e468fbd729c?placeholderIfAbsent=true"
          style={{ width: "16px", height: "16px" }}
          alt=""
        />
      ),
    },
    {
      key: "dueDate",
      label: "Due",
      icon: (
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M14 6.66658H2M10.6667 1.33325V3.99992M5.33333 1.33325V3.99992M5.2 14.6666H10.8C11.9201 14.6666 12.4802 14.6666 12.908 14.4486C13.2843 14.2569 13.5903 13.9509 13.782 13.5746C14 13.1467 14 12.5867 14 11.4666V5.86659C14 4.74648 14 4.18643 13.782 3.7586C13.5903 3.38228 13.2843 3.07632 12.908 2.88457C12.4802 2.66659 11.9201 2.66659 10.8 2.66659H5.2C4.0799 2.66659 3.51984 2.66659 3.09202 2.88457C2.71569 3.07632 2.40973 3.38228 2.21799 3.7586C2 4.18643 2 4.74648 2 5.86658V11.4666C2 12.5867 2 13.1467 2.21799 13.5746C2.40973 13.9509 2.71569 14.2569 3.09202 14.4486C3.51984 14.6666 4.0799 14.6666 5.2 14.6666Z"
            stroke="#525252"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      key: "billStatus",
      label: "Bill Status",
      icon: (
        <img
          loading="lazy"
          src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/137343a4a83566b73ded0282be168e468fbd729c?placeholderIfAbsent=true"
          style={{ width: "16px", height: "16px" }}
          alt=""
        />
      ),
    },
    {
      key: "billTotal",
      label: "Bill Total",
      icon: (
        <img
          loading="lazy"
          src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/3b8ec0fa6eb0ec8e711c3a23fefa8083d72c2a94?placeholderIfAbsent=true"
          style={{ width: "16px", height: "16px" }}
          alt=""
        />
      ),
    },
    {
      key: "assignees",
      label: "Assignees",
      icon: (
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M11.4048 10.2586C11.5701 9.92957 11.9708 9.79684 12.2998 9.96212C13.3894 10.5095 14.3105 11.3809 14.9771 12.4547C15.0781 12.6174 15.2251 12.8346 15.2707 13.129C15.3196 13.4442 15.234 13.7456 15.1066 13.9748C14.9791 14.204 14.7681 14.4357 14.4745 14.5604C14.1954 14.679 13.8918 14.6666 13.6672 14.6666C13.299 14.6666 13.0005 14.3681 13.0005 13.9999C13.0005 13.6317 13.299 13.3333 13.6672 13.3333C13.8107 13.3333 13.8861 13.3328 13.9399 13.3292L13.9413 13.3267C13.9541 13.3038 13.8572 13.1788 13.8443 13.158C13.2961 12.2749 12.5529 11.5814 11.7013 11.1536C11.3723 10.9883 11.2395 10.5876 11.4048 10.2586Z"
            fill="#525252"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.0702 2.01507C10.2341 1.68535 10.6342 1.55089 10.9639 1.71475C12.1696 2.31394 13.0005 3.55928 13.0005 4.99992C13.0005 6.44056 12.1696 7.6859 10.9639 8.28509C10.6342 8.44895 10.2341 8.31449 10.0702 7.98477C9.90635 7.65505 10.0408 7.25493 10.3705 7.09107C11.1404 6.70845 11.6672 5.91509 11.6672 4.99992C11.6672 4.08474 11.1404 3.29138 10.3705 2.90877C10.0408 2.74491 9.90635 2.34479 10.0702 2.01507Z"
            fill="#525252"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M2.66722 4.99992C2.66722 2.97487 4.30884 1.33325 6.33388 1.33325C8.35893 1.33325 10.0005 2.97487 10.0005 4.99992C10.0005 7.02496 8.35893 8.66659 6.33388 8.66659C4.30884 8.66659 2.6672 7.02496 2.6672 4.99992ZM6.33388 2.66659C5.04329 2.66659 3.99388 3.71600 3.99388 4.99992C3.99388 6.28383 5.04329 7.33325 6.33388 7.33325C7.62447 7.33325 8.67388 6.28383 8.67388 4.99992C8.67388 3.71600 7.62447 2.66659 6.33388 2.66659Z"
            fill="#525252"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M0.627876 12.5294C0.929752 11.0968 2.02832 10.0099 3.37879 9.98838C3.70161 9.98353 3.96906 10.2426 3.97391 10.5655C3.9793 10.8883 3.72017 11.1558 3.39734 11.1606C2.45699 11.1739 1.6467 11.7951 1.44281 12.6622C1.26924 13.3463 1.44826 14.0404 1.91496 14.5339C2.39069 15.0334 3.11181 15.2592 3.82835 15.1408C4.14462 15.0932 4.42827 15.3233 4.475 15.6396C4.52173 15.9558 4.29168 16.2395 3.9754 16.2871C2.84859 16.4595 1.66273 16.1396 0.91265 15.3648C0.175929 14.6078 -0.155717 13.5563 0.627876 12.5294Z"
            fill="#525252"
          />
        </svg>
      ),
    },
    {
      key: "collaborators",
      label: "Collaborators",
      icon: (
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M11.4048 10.2586C11.5701 9.92957 11.9708 9.79684 12.2998 9.96212C13.3894 10.5095 14.3105 11.3809 14.9771 12.4547C15.0781 12.6174 15.2251 12.8346 15.2707 13.129C15.3196 13.4442 15.234 13.7456 15.1066 13.9748C14.9791 14.204 14.7681 14.4357 14.4745 14.5604C14.1954 14.679 13.8918 14.6666 13.6672 14.6666C13.299 14.6666 13.0005 14.3681 13.0005 13.9999C13.0005 13.6317 13.299 13.3333 13.6672 13.3333C13.8107 13.3333 13.8861 13.3328 13.9399 13.3292L13.9413 13.3267C13.9541 13.3038 13.8572 13.1788 13.8443 13.158C13.2961 12.2749 12.5529 11.5814 11.7013 11.1536C11.3723 10.9883 11.2395 10.5876 11.4048 10.2586Z"
            fill="#525252"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.0702 2.01507C10.2341 1.68535 10.6342 1.55089 10.9639 1.71475C12.1696 2.31394 13.0005 3.55928 13.0005 4.99992C13.0005 6.44056 12.1696 7.6859 10.9639 8.28509C10.6342 8.44895 10.2341 8.31449 10.0702 7.98477C9.90635 7.65505 10.0408 7.25493 10.3705 7.09107C11.1404 6.70845 11.6672 5.91509 11.6672 4.99992C11.6672 4.08474 11.1404 3.29138 10.3705 2.90877C10.0408 2.74491 9.90635 2.34479 10.0702 2.01507Z"
            fill="#525252"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M2.66722 4.99992C2.66722 2.97487 4.30884 1.33325 6.33388 1.33325C8.35893 1.33325 10.0005 2.97487 10.0005 4.99992C10.0005 7.02496 8.35893 8.66659 6.33388 8.66659C4.30884 8.66659 2.6672 7.02496 2.6672 4.99992ZM6.33388 2.66659C5.04329 2.66659 3.99388 3.71600 3.99388 4.99992C3.99388 6.28383 5.04329 7.33325 6.33388 7.33325C7.62447 7.33325 8.67388 6.28383 8.67388 4.99992C8.67388 3.71600 7.62447 2.66659 6.33388 2.66659Z"
            fill="#525252"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M0.627876 12.5294C0.929752 11.0968 2.02832 10.0099 3.37879 9.98838C3.70161 9.98353 3.96906 10.2426 3.97391 10.5655C3.9793 10.8883 3.72017 11.1558 3.39734 11.1606C2.45699 11.1739 1.6467 11.7951 1.44281 12.6622C1.26924 13.3463 1.44826 14.0404 1.91496 14.5339C2.39069 15.0334 3.11181 15.2592 3.82835 15.1408C4.14462 15.0932 4.42827 15.3233 4.475 15.6396C4.52173 15.9558 4.29168 16.2395 3.9754 16.2871C2.84859 16.4595 1.66273 16.1396 0.91265 15.3648C0.175929 14.6078 -0.155717 13.5563 0.627876 12.5294Z"
            fill="#525252"
          />
        </svg>
      ),
    },
  ];

  const handleDeleteWorkOrder = useCallback(
    (workOrder: WorkOrder) => {
      onWorkOrdersChange(workOrders.filter((wo) => wo.id !== workOrder.id));
    },
    [workOrders, onWorkOrdersChange]
  );

  const handleEditWorkOrder = useCallback(
    (workOrder: WorkOrder) => {
      navigate(`/tasks/${workOrder.taskId}/workorders/${workOrder.id}`);
    },
    [navigate]
  );

  return (
    <>
      <HeaderV1
        title="Work Orders"
        subtitle="Your work orders for this task in one place"
        actionLabel="Create Work Order"
        actionIcon={<Plus className="w-5 h-5" />}
        onActionClick={() => setIsCreateWorkOrderModalOpen(true)}
      >
        {/* Work Orders Table - Using GlobalTable Component */}
        <GlobalTable
            columns={columns}
            data={workOrders}
            rowKey="id"
            renderCell={(workOrder, columnKey) => {
              if (columnKey === "priority") {
                return <TaskPriorityBadge priority={workOrder.priority as any} />;
              }
              if (columnKey === "task") {
                return (
                  <span className="text-gray-900 font-normal text-sm truncate">
                    {workOrder.task}
                  </span>
                );
              }
              if (columnKey === "property") {
                return (
                  <span className="text-gray-900 font-normal text-sm truncate">
                    {workOrder.property}
                  </span>
                );
              }
              if (columnKey === "unit") {
                return (
                  <span className="text-gray-900 font-normal text-sm truncate">
                    {workOrder.unit}
                  </span>
                );
              }
              if (columnKey === "updatedDate") {
                return (
                  <span className="text-gray-900 font-normal text-sm truncate">
                    {workOrder.updatedDate}
                  </span>
                );
              }
              if (columnKey === "age") {
                return (
                  <span className="text-gray-900 font-normal text-sm truncate">
                    {workOrder.age}
                  </span>
                );
              }
              if (columnKey === "status") {
                return <TaskStatusBadge status={workOrder.status as any} />;
              }
              if (columnKey === "dueDate") {
                return (
                  <span className="text-gray-900 font-normal text-sm truncate">
                    {workOrder.dueDate}
                  </span>
                );
              }
              if (columnKey === "billStatus") {
                return (
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{
                        backgroundColor:
                          workOrder.billStatus === "Paid"
                            ? "#059669"
                            : workOrder.billStatus === "Unpaid"
                              ? "#DC2626"
                              : "#D97706",
                      }}
                    />
                    <span className="text-gray-900 font-normal text-sm capitalize">
                      {workOrder.billStatus}
                    </span>
                  </div>
                );
              }
              if (columnKey === "billTotal") {
                return (
                  <span className="text-gray-900 font-normal text-sm">
                    {workOrder.billTotal}
                  </span>
                );
              }
              if (columnKey === "assignees") {
                return <PersonAvatars people={workOrder.assignees} type="assignee" fallback="None" size="sm" />;
              }
              if (columnKey === "collaborators") {
                return <PersonAvatars people={workOrder.collaborators} type="collaborator" fallback="None" size="sm" />;
              }
              return null;
            }}
            sortingHook={{
              handleSortClick,
              getSortIndicator,
              getSortedData,
            }}
            columnManagementHook={{
              columnOrder,
              visibleColumns,
              draggedColumn,
              dropTargetColumn,
              dropPosition,
              columnMenuPos,
              columnButtonRef,
              toggleColumnVisibility,
              handleColumnDragStart,
              handleColumnDragOver,
              handleColumnDragLeave,
              handleColumnDrop,
            }}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={setItemsPerPage}
            showPageSizeDropdown={showPageSizeDropdown}
            onShowPageSizeDropdownChange={setShowPageSizeDropdown}
            openMenuId={openMenuId}
            onOpenMenuIdChange={setOpenMenuId}
            title="Work Orders"
            headerActions={
              <button
                ref={columnButtonRef}
                onClick={() => {
                  setShowPageSizeDropdown(false);
                  setOpenMenuId(null);
                  setShowColumnModal((prev) => !prev);
                }}
                className="flex h-9 w-9 justify-center items-center rounded-lg border border-[#DADADA] bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] hover:bg-gray-50 transition-colors"
                data-test="column-button"
              >
                <svg width="18" height="18" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="8" cy="3" r="1.5" fill="#303030"/>
                  <circle cx="8" cy="8" r="1.5" fill="#303030"/>
                  <circle cx="8" cy="13" r="1.5" fill="#303030"/>
                </svg>
              </button>
            }
            actions={[
              {
                label: "Edit",
                icon: <EditIcon width={18} height={18} color="#525252" />,
                onClick: handleEditWorkOrder,
              },
              {
                label: "Delete",
                icon: <DeleteIcon width={18} height={18} color="#982740" />,
                onClick: handleDeleteWorkOrder,
              },
            ]}
            onRowClick={(workOrder) => {
              // Navigate to work order details - the URL change will drive state updates via effects
              navigate(
                `/tasks/${taskId}/workorders/${workOrder.id}`,
              );
            }}
            showColumnModal={showColumnModal}
            onShowColumnModalChange={setShowColumnModal}
          />
      </HeaderV1>

      {/* Create Work Order Modal */}
      <CreateWorkOrderModalV2
        open={isCreateWorkOrderModalOpen}
        onOpenChange={(open) => {
          setIsCreateWorkOrderModalOpen(open);
          if (!open) {
            setEditingWorkOrder(null);
          }
        }}
        initialData={{
          property: defaultProperty,
          task: defaultTask,
          unit: defaultUnit,
        }}
        onDataUpdate={(data) => {
          const newId = workOrders.length > 0 ? Math.max(...workOrders.map(wo => wo.id)) + 1 : 1;
          // Store the original Date object for newly created work order (will be converted to string when added to list)
          const newWorkOrder: WorkOrder = {
            id: newId,
            task: data.workOrderName || data.task || "New Work Order",
            taskId: parseInt(taskId),
            property: data.property || "",
            unit: data.unit || "",
            dueDate: data.dueDate || null,
            updatedDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            age: "Just now",
            priority: data.priority || "normal",
            status: data.status || "not_started",
            billStatus: "Awaiting Invoice",
            billTotal: "No invoice",
            assignees: [],
            collaborators: [],
            vendorName: data.vendor || "Unassigned",
          };
          // Convert dueDate to string format for the list, but keep Date object in navigation state for immediate rendering
          const workOrderForList = {
            ...newWorkOrder,
            dueDate: data.dueDate ? data.dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "No due date",
          };
          // Add to work orders list (with formatted dueDate string)
          onWorkOrdersChange([...workOrders, workOrderForList]);
          // Update parent state to select the new work order
          if (onWorkOrderSelect) {
            onWorkOrderSelect(newId);
          }
          // Close the modal
          setIsCreateWorkOrderModalOpen(false);
          // Navigate to the new work order details, passing the work order data through state
          // Keep the Date object in navigation state so it renders correctly immediately
          navigate(`/tasks/${taskId}/workorders/${newId}`, {
            state: { newWorkOrder }
          });
        }}
      />

      {/* Column Filter Modal */}
      <ColumnFilterModal
        isOpen={showColumnModal}
        position={columnMenuPos}
        columns={columns.map((col) => ({
          key: col.key,
          label: col.label,
          icon: col.icon || null,
        }))}
        visibleColumns={visibleColumns}
        onToggleColumn={toggleColumnVisibility}
        onClose={() => setShowColumnModal(false)}
        buttonRef={columnButtonRef}
      />
    </>
  );
}
