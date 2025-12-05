import { useState } from "react";
import { cn } from "@/lib/utils";
import { PropertyTablePagination } from "@/components/PropertyTable";

type OrderStatus = "dispatched" | "approved" | "pending-approval";

interface FieldTeamOrder {
  id: number;
  property: string;
  description: string;
  dueDate: string;
  fieldTeam: { initials: string; color: string }[];
  status: OrderStatus;
  amount: number;
}

const fieldTeamOrders: FieldTeamOrder[] = [
  {
    id: 1,
    property: "22 Indian Chase Dr",
    description: "Doors need to be repaired",
    dueDate: "Oct 2, 2025",
    fieldTeam: [
      { initials: "CH", color: "bg-blue-500" },
      { initials: "CS", color: "bg-blue-500" },
    ],
    status: "dispatched",
    amount: 420,
  },
  {
    id: 2,
    property: "22 Indian Chase Dr",
    description: "Doors need to be repaired",
    dueDate: "Sep 29, 2025",
    fieldTeam: [
      { initials: "CH", color: "bg-blue-500" },
      { initials: "CS", color: "bg-blue-500" },
    ],
    status: "approved",
    amount: 95,
  },
  {
    id: 3,
    property: "22 Indian Chase Dr",
    description: "Doors need to be repaired",
    dueDate: "Sep 10, 2025",
    fieldTeam: [
      { initials: "CH", color: "bg-blue-500" },
      { initials: "CS", color: "bg-blue-500" },
    ],
    status: "pending-approval",
    amount: 95,
  },
  {
    id: 4,
    property: "22 Indian Chase Dr",
    description: "Doors need to be repaired",
    dueDate: "Sep 6, 2025",
    fieldTeam: [
      { initials: "CH", color: "bg-blue-500" },
      { initials: "CS", color: "bg-blue-500" },
    ],
    status: "dispatched",
    amount: 112,
  },
  {
    id: 5,
    property: "22 Indian Chase Dr",
    description: "Doors need to be repaired",
    dueDate: "Sep 5, 2025",
    fieldTeam: [
      { initials: "CH", color: "bg-blue-500" },
      { initials: "CS", color: "bg-blue-500" },
    ],
    status: "dispatched",
    amount: 93,
  },
  {
    id: 6,
    property: "22 Indian Chase Dr",
    description: "Doors need to be repaired",
    dueDate: "Sep 4, 2025",
    fieldTeam: [
      { initials: "CH", color: "bg-blue-500" },
      { initials: "CS", color: "bg-blue-500" },
    ],
    status: "dispatched",
    amount: 75,
  },
  {
    id: 7,
    property: "22 Indian Chase Dr",
    description: "Doors need to be repaired",
    dueDate: "Sep 4, 2025",
    fieldTeam: [
      { initials: "CH", color: "bg-blue-500" },
      { initials: "CS", color: "bg-blue-500" },
    ],
    status: "dispatched",
    amount: 101,
  },
  {
    id: 8,
    property: "22 Indian Chase Dr",
    description: "Doors need to be repaired",
    dueDate: "Sep 3, 2025",
    fieldTeam: [
      { initials: "CH", color: "bg-blue-500" },
      { initials: "CS", color: "bg-blue-500" },
    ],
    status: "dispatched",
    amount: 124,
  },
  {
    id: 9,
    property: "22 Indian Chase Dr",
    description: "Doors need to be repaired",
    dueDate: "Sep 1, 2025",
    fieldTeam: [
      { initials: "CH", color: "bg-blue-500" },
      { initials: "CS", color: "bg-blue-500" },
    ],
    status: "dispatched",
    amount: 95,
  },
  {
    id: 10,
    property: "22 Indian Chase Dr",
    description: "Doors need to be repaired",
    dueDate: "Sep 1, 2025",
    fieldTeam: [
      { initials: "CH", color: "bg-blue-500" },
      { initials: "CS", color: "bg-blue-500" },
    ],
    status: "dispatched",
    amount: 120,
  },
];

const StatusBadge = ({ status }: { status: OrderStatus }) => {
  const config = {
    dispatched: {
      bgColor: "bg-[#FEF3C7]",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-4 h-4"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" x2="12" y1="8" y2="12" />
          <line x1="12" x2="12.01" y1="16" y2="16" />
        </svg>
      ),
      label: "Dispatched",
      color: "text-yellow-700",
    },
    approved: {
      bgColor: "bg-[#DCFCE7]",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-4 h-4"
        >
          <path d="M21.801 10A10 10 0 1 1 17 3.335" />
          <path d="m9 11 3 3L22 4" />
        </svg>
      ),
      label: "Approved",
      color: "text-green-700",
    },
    "pending-approval": {
      bgColor: "bg-[#DBEAFE]",
      icon: (
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-4 h-4"
        >
          <path
            d="M8.10938 5.66663H15.2061"
            stroke="#2463EB"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M8.10938 17.9999H15.2061"
            stroke="#2463EB"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M13.4394 8.80664L11.386 10.86C10.8527 11.3933 9.98605 11.3933 9.44605 10.86L7.39272 8.80664C7.13272 8.54664 6.99272 8.19997 6.99272 7.83997V7.03997C6.99272 6.27997 7.60605 5.66664 8.36605 5.66664H12.4794C13.2394 5.66664 13.8527 6.27997 13.8527 7.03997V7.83997C13.8394 8.19997 13.6927 8.55331 13.4394 8.80664Z"
            stroke="#2463EB"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M13.8398 16.6267C13.8398 17.3867 13.2265 18 12.4665 18H8.35984C7.59984 18 6.98651 17.3867 6.98651 16.6267H13.8398Z"
            fill="#2463EB"
            stroke="#2463EB"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M13.8398 15.8267V16.6267H6.98651V15.8267C6.98651 15.4667 7.13318 15.1133 7.38651 14.86L9.44651 12.8C9.97984 12.2667 10.8465 12.2667 11.3798 12.8L13.4398 14.86C13.6932 15.1133 13.8398 15.4667 13.8398 15.8267Z"
            stroke="#2463EB"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M9.03906 10.46H11.7857"
            stroke="#2463EB"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M10.4141 15.0733C10.2807 15.0733 10.1541 15.02 10.0607 14.9267C9.96738 14.8333 9.91405 14.7067 9.91405 14.5733C9.91405 14.5067 9.92738 14.4467 9.95405 14.38C9.98071 14.32 10.0141 14.2667 10.0607 14.22C10.1941 14.08 10.4207 14.04 10.6074 14.1133C10.6674 14.14 10.7207 14.1733 10.7674 14.22C10.8141 14.2667 10.8474 14.32 10.8741 14.38C10.9007 14.4467 10.9141 14.5067 10.9141 14.5733C10.9141 14.7067 10.8607 14.8333 10.7674 14.9267C10.6741 15.02 10.5474 15.0733 10.4141 15.0733Z"
            fill="#2463EB"
          />
        </svg>
      ),
      label: "Pending Approval",
      color: "text-blue-600",
    },
  };

  const { bgColor, icon, label, color } = config[status];

  return (
    <div className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-2xl w-fit", bgColor, color)}>
      {icon}
      <span className="text-sm font-normal capitalize">{label}</span>
    </div>
  );
};

const TeamMember = ({ initials, color }: { initials: string; color: string }) => (
  <div
    className={cn(
      "w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold",
      color
    )}
  >
    {initials}
  </div>
);

export default function FieldTeamOrders() {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  return (
    <div className="min-h-screen bg-white p-4 md:p-6 lg:p-8 xl:p-12">
      <div className="max-w-[1200px] mx-auto flex flex-col gap-9">
        {/* Header Section */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex flex-col gap-1">
              <h1 className="text-task-text-primary font-semibold text-2xl leading-[30px]">
                All Field Team Orders
              </h1>
              <p className="text-task-text-tertiary font-medium text-base leading-4">
                All your field team orders, in one place
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex h-10 items-center gap-2 px-3 rounded-lg border border-white shadow-[0_0_0_1px_#002D5A,0_0_10px_-5px_rgba(0,0,0,0.20)] bg-task-button-primary text-white hover:opacity-90 transition-opacity">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9.99935 4.16675V15.8334M4.16602 10.0001H15.8327" stroke="white" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="font-medium text-base">Create FTO</span>
              </button>
            </div>
          </div>

          {/* Orders Table */}
          <div className="flex flex-col">
            <div className="w-full overflow-hidden rounded-xl border shadow-[0_1px_2px_0_rgba(10,13,18,0.05)]" style={{ borderColor: "rgb(229, 229, 229)" }}>
              {/* Table Header */}
              <div className="flex justify-between items-center px-4 py-3 border-b" style={{ borderColor: "rgb(229, 229, 229)" }}>
                <h2 className="text-task-text-primary font-medium text-[22px] leading-6">
                  Field Team Orders
                </h2>
                <div className="flex items-start gap-2.5">
                  <div className="flex h-9 items-center gap-2 px-3 rounded-lg border shadow-[0_1px_3px_0_rgba(0,0,0,0.03)]" style={{ borderColor: "rgb(229, 229, 229)" }}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17.5 17.5L13.875 13.875M15.8333 9.16667C15.8333 12.8486 12.8486 15.8333 9.16667 15.8333C5.48477 15.8333 2.5 12.8486 2.5 9.16667C2.5 5.48477 5.48477 2.5 9.16667 2.5C12.8486 2.5 15.8333 5.48477 15.8333 9.16667Z" stroke="#303030" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Search..."
                      className="text-task-text-primary font-normal text-base leading-[140%] tracking-[-0.32px] capitalize bg-transparent border-none outline-none placeholder:text-task-text-primary w-32 sm:w-48"
                    />
                  </div>
                  <button className="flex h-9 justify-center items-center gap-2 px-3 rounded-lg border shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] hover:bg-gray-50 transition-colors" style={{ borderColor: "rgb(229, 229, 229)" }}>
                    <span className="text-task-text-primary font-normal text-base leading-[140%] tracking-[-0.32px] capitalize">
                      Filter
                    </span>
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4.5 6.75L9 11.25L13.5 6.75" stroke="#303030" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Table Content - Desktop */}
              <div className="hidden lg:block overflow-x-auto border-b-0">
                <table className="w-full">
                  <thead>
                    <tr className="border-b" style={{ borderColor: "rgb(229, 229, 229)" }}>
                      <th className="px-3 py-3 text-left border-r" style={{ borderColor: "rgb(229, 229, 229)" }}>
                        <div className="flex items-center gap-2">
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M5.33399 5.33325H5.34065M1.33398 3.46658L1.33398 6.44959C1.33398 6.77572 1.33398 6.93878 1.37082 7.09223C1.40349 7.22827 1.45736 7.35833 1.53046 7.47763C1.61292 7.61219 1.72822 7.72749 1.95882 7.95809L7.07124 13.0705C7.86328 13.8625 8.25929 14.2586 8.71595 14.4069C9.11764 14.5375 9.55033 14.5375 9.95202 14.4069C10.4087 14.2586 10.8047 13.8625 11.5967 13.0705L13.0712 11.596C13.8633 10.804 14.2593 10.4079 14.4077 9.95128C14.5382 9.5496 14.5382 9.1169 14.4077 8.71522C14.2593 8.25856 13.8633 7.86254 13.0712 7.07051L7.95882 1.95809C7.72822 1.72749 7.61292 1.61219 7.47836 1.52973C7.35907 1.45663 7.22901 1.40275 7.09296 1.37009C6.93951 1.33325 6.77645 1.33325 6.45033 1.33325L3.46732 1.33325C2.72058 1.33325 2.34721 1.33325 2.062 1.47858C1.81111 1.60641 1.60714 1.81038 1.47931 2.06126C1.33398 2.34648 1.33398 2.71985 1.33398 3.46658ZM5.66732 5.33325C5.66732 5.51735 5.51808 5.66658 5.33399 5.66658C5.14989 5.66658 5.00065 5.51735 5.00065 5.33325C5.00065 5.14916 5.14989 4.99992 5.33399 4.99992C5.51808 4.99992 5.66732 5.14916 5.66732 5.33325Z" stroke="#525252" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <span className="text-task-text-secondary font-medium text-base leading-[140%] tracking-[-0.32px] capitalize">
                            Property
                          </span>
                        </div>
                      </th>
                      <th className="px-3 py-3 text-left border-r" style={{ borderColor: "rgb(229, 229, 229)" }}>
                        <div className="flex items-center gap-2">
                          <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4">
                            <path
                              d="M8.19531 15.9933L17.0553 11.1333L14.5886 8.66663L5.72865 13.5266L5.72198 15.9999L8.19531 15.9933Z"
                              stroke="#525252"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M14.1211 10.92L15.8011 12.6"
                              stroke="#525252"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          <span className="text-task-text-secondary font-medium text-base leading-[140%] tracking-[-0.32px] capitalize">
                            Description
                          </span>
                        </div>
                      </th>
                      <th className="px-3 py-3 text-left border-r" style={{ borderColor: "rgb(229, 229, 229)" }}>
                        <div className="flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                            <path d="M8 2v4" />
                            <path d="M16 2v4" />
                            <rect width="18" height="18" x="3" y="4" rx="2" />
                            <path d="M3 10h18" />
                          </svg>
                          <span className="text-task-text-secondary font-medium text-base leading-[140%] tracking-[-0.32px] capitalize">
                            Due Date
                          </span>
                        </div>
                      </th>
                      <th className="px-3 py-3 text-left border-r" style={{ borderColor: "rgb(229, 229, 229)" }}>
                        <div className="flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                            <path d="M4 22V4a1 1 0 0 1 .4-.8A6 6 0 0 1 8 2c3 0 5 2 7.333 2q2 0 3.067-.8A1 1 0 0 1 20 4v10a1 1 0 0 1-.4.8A6 6 0 0 1 16 16c-3 0-5-2-8-2a6 6 0 0 0-4 1.528" />
                          </svg>
                          <span className="text-task-text-secondary font-medium text-base leading-[140%] tracking-[-0.32px] capitalize">
                            Field Team
                          </span>
                        </div>
                      </th>
                      <th className="px-3 py-3 text-left border-r" style={{ borderColor: "rgb(229, 229, 229)" }}>
                        <div className="flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                            <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" />
                            <circle cx="7.5" cy="7.5" r=".5" fill="currentColor" />
                          </svg>
                          <span className="text-task-text-secondary font-medium text-base leading-[140%] tracking-[-0.32px] capitalize">
                            Status
                          </span>
                        </div>
                      </th>
                      <th className="px-3 py-3 text-left border-r" style={{ borderColor: "rgb(229, 229, 229)" }}>
                        <div className="flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                            <line x1="12" x2="12" y1="2" y2="22" />
                            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                          </svg>
                          <span className="text-task-text-secondary font-medium text-base leading-[140%] tracking-[-0.32px] capitalize">
                            Amount
                          </span>
                        </div>
                      </th>
                      <th className="px-3 py-3 text-left border-l shadow-[-1px_1px_2px_0_rgba(10,13,18,0.05)]" style={{ borderColor: "rgb(229, 229, 229)" }}>
                        <span className="text-task-text-secondary font-medium text-base leading-[140%] tracking-[-0.32px] capitalize">
                          Actions
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="border-b-0">
                    {fieldTeamOrders.map((order, index) => (
                      <tr
                        key={order.id}
                        className={cn(
                          "border-b hover:bg-gray-50 transition-colors",
                          index === fieldTeamOrders.length - 1 ? "border-b-0" : ""
                        )}
                        style={{ borderColor: "rgb(229, 229, 229)" }}
                      >
                        <td
                          className={cn(
                            "px-3 py-3.5 border-r",
                            index === fieldTeamOrders.length - 1 ? "border-b-0" : ""
                          )}
                          style={{ borderColor: "rgb(229, 229, 229)" }}
                        >
                          <div className="text-task-text-primary font-normal text-base leading-[140%] tracking-[-0.32px] capitalize truncate max-w-[155px]">
                            {order.property}
                          </div>
                        </td>
                        <td
                          className={cn(
                            "px-3 py-3.5 border-r",
                            index === fieldTeamOrders.length - 1 ? "border-b-0" : ""
                          )}
                          style={{ borderColor: "rgb(229, 229, 229)" }}
                        >
                          <div className="text-task-text-primary font-normal text-base leading-[140%] tracking-[-0.32px] capitalize truncate max-w-[250px]">
                            {order.description}
                          </div>
                        </td>
                        <td
                          className={cn(
                            "px-3 py-3.5 border-r",
                            index === fieldTeamOrders.length - 1 ? "border-b-0" : ""
                          )}
                          style={{ borderColor: "rgb(229, 229, 229)" }}
                        >
                          <div className="text-task-text-primary font-normal text-base leading-[140%] tracking-[-0.32px] capitalize truncate max-w-[136px]">
                            {order.dueDate}
                          </div>
                        </td>
                        <td
                          className={cn(
                            "px-3 py-3.5 border-r",
                            index === fieldTeamOrders.length - 1 ? "border-b-0" : ""
                          )}
                          style={{ borderColor: "rgb(229, 229, 229)" }}
                        >
                          <div className="flex items-center gap-2.5">
                            {order.fieldTeam.map((member, i) => (
                              <TeamMember key={i} initials={member.initials} color={member.color} />
                            ))}
                          </div>
                        </td>
                        <td
                          className={cn(
                            "px-3 py-3.5 border-r",
                            index === fieldTeamOrders.length - 1 ? "border-b-0" : ""
                          )}
                          style={{ borderColor: "rgb(229, 229, 229)" }}
                        >
                          <StatusBadge status={order.status} />
                        </td>
                        <td
                          className={cn(
                            "px-3 py-3.5 border-r",
                            index === fieldTeamOrders.length - 1 ? "border-b-0" : ""
                          )}
                          style={{ borderColor: "rgb(229, 229, 229)" }}
                        >
                          <div className="text-task-text-primary font-normal text-base leading-[140%] tracking-[-0.32px] capitalize">
                            $ {order.amount}
                          </div>
                        </td>
                        <td
                          className={cn(
                            "px-3 py-3.5 border-l shadow-[-1px_1px_2px_0_rgba(10,13,18,0.05)]",
                            index === fieldTeamOrders.length - 1 ? "border-b-0" : ""
                          )}
                          style={{ borderColor: "rgb(229, 229, 229)" }}
                        >
                          <div className="flex justify-center">
                            <button className="flex h-7 w-7 justify-center items-center rounded-md border border-task-border-DEFAULT shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] hover:bg-gray-50 transition-colors">
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                                <circle cx="12" cy="12" r="1" />
                                <circle cx="19" cy="12" r="1" />
                                <circle cx="5" cy="12" r="1" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            <PropertyTablePagination
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              itemsPerPage={itemsPerPage}
              setItemsPerPage={setItemsPerPage}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
