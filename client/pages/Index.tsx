import { useState } from "react";
import { cn } from "@/lib/utils";
import { PropertyTablePagination } from "@/components/PropertyTable";

type TaskStatus = "completed" | "in-progress";
type TaskPriority = "normal" | "low" | "high";

interface Task {
  id: number;
  status: TaskStatus;
  task: string;
  property: string;
  due: string;
  updated: string;
  age: string;
  priority: TaskPriority;
  assignees: number;
}

const tasks: Task[] = [
  { id: 1, status: "completed", task: "Doors need to be repaired", property: "22 Indian Chase Dr", due: "Oct 2, 2025", updated: "Oct 2, 2025", age: "6 Days", priority: "normal", assignees: 2 },
  { id: 2, status: "in-progress", task: "Doors need to be repaired", property: "22 Indian Chase Dr", due: "Sep 29, 2025", updated: "Sep 29, 2025", age: "6 Days", priority: "low", assignees: 2 },
  { id: 3, status: "completed", task: "Doors need to be repaired", property: "22 Indian Chase Dr", due: "Sep 10, 2025", updated: "Sep 10, 2025", age: "6 Days", priority: "normal", assignees: 2 },
  { id: 4, status: "completed", task: "Doors need to be repaired", property: "22 Indian Chase Dr", due: "Sep 6, 2025", updated: "Sep 6, 2025", age: "6 Days", priority: "high", assignees: 2 },
  { id: 5, status: "completed", task: "Doors need to be repaired", property: "22 Indian Chase Dr", due: "Sep 5, 2025", updated: "Sep 5, 2025", age: "6 Days", priority: "normal", assignees: 2 },
  { id: 6, status: "completed", task: "Doors need to be repaired", property: "22 Indian Chase Dr", due: "Sep 4, 2025", updated: "Sep 4, 2025", age: "6 Days", priority: "normal", assignees: 2 },
  { id: 7, status: "completed", task: "Doors need to be repaired", property: "22 Indian Chase Dr", due: "Sep 4, 2025", updated: "Sep 4, 2025", age: "6 Days", priority: "normal", assignees: 2 },
  { id: 8, status: "completed", task: "Doors need to be repaired", property: "22 Indian Chase Dr", due: "Sep 3, 2025", updated: "Sep 3, 2025", age: "6 Days", priority: "normal", assignees: 2 },
  { id: 9, status: "completed", task: "Doors need to be repaired", property: "22 Indian Chase Dr", due: "Sep 1, 2025", updated: "Sep 1, 2025", age: "6 Days", priority: "normal", assignees: 2 },
  { id: 10, status: "completed", task: "Doors need to be repaired", property: "22 Indian Chase Dr", due: "Sep 1, 2025", updated: "Sep 1, 2025", age: "6 Days", priority: "normal", assignees: 2 },
];

const StatusBadge = ({ status }: { status: TaskStatus }) => (
  <div className="flex items-center gap-2.5">
    <div
      className={cn(
        "w-2 h-2 rounded-full flex-shrink-0",
        status === "completed" ? "bg-task-status-completed" : "bg-task-status-inprogress"
      )}
    />
    <span className="text-task-text-primary font-normal text-base leading-[140%] tracking-[-0.32px] capitalize">
      {status === "completed" ? "Completed" : "In progress"}
    </span>
  </div>
);

const PriorityBadge = ({ priority }: { priority: TaskPriority }) => {
  const config = {
    normal: {
      color: "text-task-priority-normal",
      bgColor: "bg-[#EFF6FF]",
      icon: (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M2.91602 7H11.0827" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      label: "Normal",
      hasPill: true,
    },
    low: {
      color: "text-task-priority-low",
      bgColor: "bg-[#DCFCE7]",
      icon: (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6.99935 2.91675V11.0834M6.99935 11.0834L11.0827 7.00008M6.99935 11.0834L2.91602 7.00008" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      label: "Low",
      hasPill: true,
    },
    high: {
      color: "text-task-priority-high",
      bgColor: "bg-[#FEF3C7]",
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8.00065 5.33325V7.99992M8.00065 10.6666H8.00732M14.6673 7.99992C14.6673 11.6818 11.6825 14.6666 8.00065 14.6666C4.31875 14.6666 1.33398 11.6818 1.33398 7.99992C1.33398 4.31802 4.31875 1.33325 8.00065 1.33325C11.6825 1.33325 14.6673 4.31802 14.6673 7.99992Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      label: "High",
      hasPill: true,
    },
  };

  const { color, bgColor, icon, label, hasPill } = config[priority];

  return (
    <div className={cn("flex items-center gap-1 h-[30px]", color, hasPill ? `${bgColor} px-2 rounded-2xl` : "")}>
      {icon}
      <span className={cn("text-sm font-normal leading-[140%] tracking-[-0.28px] capitalize truncate", priority === "high" ? "text-base" : "")}>
        {label}
      </span>
    </div>
  );
};

const UserAvatar = () => (
  <div className="w-7 h-7 rounded-full border border-task-avatar/20 shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] flex items-center justify-center flex-shrink-0">
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" clipRule="evenodd" d="M2.84931 15.2527C4.49344 13.0767 7.08325 11.6667 10.0009 11.6667C12.9185 11.6667 15.5083 13.0767 17.1524 15.2527C17.1598 15.2625 17.1673 15.2724 17.1748 15.2823C17.3162 15.4692 17.4677 15.6697 17.5761 15.8631C17.7072 16.0971 17.8043 16.3679 17.7983 16.6972C17.7935 16.9619 17.7133 17.2097 17.6159 17.4054C17.5185 17.6011 17.3691 17.8145 17.1608 17.9779C16.8831 18.1959 16.5806 18.273 16.312 18.3053C16.0763 18.3335 15.797 18.3335 15.5161 18.3334C15.5035 18.3334 15.4908 18.3334 15.4782 18.3334H4.52355C4.51089 18.3334 4.49823 18.3334 4.48558 18.3334C4.20475 18.3335 3.92543 18.3335 3.68972 18.3053C3.42107 18.273 3.11864 18.1959 2.84087 17.9779C2.63259 17.8145 2.48323 17.6011 2.38583 17.4054C2.28844 17.2097 2.20823 16.9619 2.20339 16.6972C2.19737 16.3679 2.29454 16.0971 2.42565 15.8631C2.53398 15.6697 2.68555 15.4692 2.82692 15.2823C2.83441 15.2724 2.84188 15.2625 2.84931 15.2527Z" fill="#BC423E" />
      <path fillRule="evenodd" clipRule="evenodd" d="M5.41752 6.25008C5.41752 3.71878 7.46955 1.66675 10.0009 1.66675C12.5322 1.66675 14.5842 3.71878 14.5842 6.25008C14.5842 8.78139 12.5322 10.8334 10.0009 10.8334C7.46955 10.8334 5.41752 8.78139 5.41752 6.25008Z" fill="#BC423E" />
    </svg>
  </div>
);

export default function Index() {
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
                All Tasks
              </h1>
              <p className="text-task-text-tertiary font-medium text-base leading-4">
                All your tasks, in one place
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex h-10 items-center gap-2 px-3 rounded-lg border border-white shadow-[0_0_0_1px_#002D5A,0_0_10px_-5px_rgba(0,0,0,0.20)] bg-task-button-primary text-white hover:opacity-90 transition-opacity">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9.99935 4.16675V15.8334M4.16602 10.0001H15.8327" stroke="white" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="font-medium text-base">Add task</span>
              </button>
              <button className="w-10 h-10 flex justify-center items-center rounded-lg border border-task-border-DEFAULT shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] hover:bg-gray-50 transition-colors">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9.99935 10.8333C10.4596 10.8333 10.8327 10.4602 10.8327 9.99992C10.8327 9.53968 10.4596 9.16659 9.99935 9.16659C9.53911 9.16659 9.16602 9.53968 9.16602 9.99992C9.16602 10.4602 9.53911 10.8333 9.99935 10.8333Z" stroke="#303030" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M9.99935 4.99992C10.4596 4.99992 10.8327 4.62682 10.8327 4.16659C10.8327 3.70635 10.4596 3.33325 9.99935 3.33325C9.53911 3.33325 9.16602 3.70635 9.16602 4.16659C9.16602 4.62682 9.53911 4.99992 9.99935 4.99992Z" stroke="#303030" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M9.99935 16.6666C10.4596 16.6666 10.8327 16.2935 10.8327 15.8333C10.8327 15.373 10.4596 14.9999 9.99935 14.9999C9.53911 14.9999 9.16602 15.373 9.16602 15.8333C9.16602 16.2935 9.53911 16.6666 9.99935 16.6666Z" stroke="#303030" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>

          {/* Tasks Table */}
          <div className="flex flex-col">
            <div className="w-full overflow-hidden rounded-xl border shadow-[0_1px_2px_0_rgba(10,13,18,0.05)]" style={{ borderColor: "rgb(229, 229, 229)" }}>
              {/* Table Header */}
              <div className="flex justify-between items-center px-4 py-3 border-b" style={{ borderColor: "rgb(229, 229, 229)" }}>
                <h2 className="text-task-text-primary font-medium text-[22px] leading-6">
                  Tasks
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
                      <th className="px-3 py-3 text-left border-r border-task-border-DEFAULT">
                        <div className="flex items-center gap-2">
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M5.33399 5.33325H5.34065M1.33398 3.46658L1.33398 6.44959C1.33398 6.77572 1.33398 6.93878 1.37082 7.09223C1.40349 7.22827 1.45736 7.35833 1.53046 7.47763C1.61292 7.61219 1.72822 7.72749 1.95882 7.95809L7.07124 13.0705C7.86328 13.8625 8.25929 14.2586 8.71595 14.4069C9.11764 14.5375 9.55033 14.5375 9.95202 14.4069C10.4087 14.2586 10.8047 13.8625 11.5967 13.0705L13.0712 11.596C13.8633 10.804 14.2593 10.4079 14.4077 9.95128C14.5382 9.5496 14.5382 9.1169 14.4077 8.71522C14.2593 8.25856 13.8633 7.86254 13.0712 7.07051L7.95882 1.95809C7.72822 1.72749 7.61292 1.61219 7.47836 1.52973C7.35907 1.45663 7.22901 1.40275 7.09296 1.37009C6.93951 1.33325 6.77645 1.33325 6.45033 1.33325L3.46732 1.33325C2.72058 1.33325 2.34721 1.33325 2.062 1.47858C1.81111 1.60641 1.60714 1.81038 1.47931 2.06126C1.33398 2.34648 1.33398 2.71985 1.33398 3.46658ZM5.66732 5.33325C5.66732 5.51735 5.51808 5.66658 5.33399 5.66658C5.14989 5.66658 5.00065 5.51735 5.00065 5.33325C5.00065 5.14916 5.14989 4.99992 5.33399 4.99992C5.51808 4.99992 5.66732 5.14916 5.66732 5.33325Z" stroke="#525252" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <span className="text-task-text-secondary font-medium text-base leading-[140%] tracking-[-0.32px] capitalize">
                            Status
                          </span>
                        </div>
                      </th>
                      <th className="px-3 py-3 text-left border-r border-task-border-DEFAULT">
                        <div className="flex items-center gap-2">
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M6.66758 8.00008C6.66758 7.2637 7.26454 6.66675 8.00092 6.66675C8.7373 6.66675 9.33425 7.2637 9.33425 8.00008C9.33425 8.73646 8.7373 9.33341 8.00092 9.33341C7.26454 9.33341 6.66758 8.73646 6.66758 8.00008Z" fill="#525252" />
                            <path fillRule="evenodd" clipRule="evenodd" d="M8.00092 2.66675C6.09314 2.66675 4.53782 3.5099 3.38542 4.4717C2.23458 5.4322 1.44556 6.54294 1.0504 7.16865L1.03434 7.19397C0.955928 7.3174 0.854119 7.47765 0.802652 7.70219C0.761095 7.8835 0.761095 8.11667 0.802652 8.29797C0.854119 8.52251 0.955928 8.68276 1.03434 8.80619L1.0504 8.83152C1.44556 9.45722 2.23459 10.568 3.38542 11.5285C4.53782 12.4903 6.09314 13.3334 8.00092 13.3334C9.9087 13.3334 11.464 12.4903 12.6164 11.5285C13.7673 10.568 14.5563 9.45722 14.9514 8.83152L14.9675 8.8062C15.0459 8.68277 15.1477 8.52252 15.1992 8.29797C15.2407 8.11667 15.2407 7.8835 15.1992 7.70219C15.1477 7.47765 15.0459 7.31739 14.9675 7.19396L14.9514 7.16865C14.5563 6.54294 13.7673 5.4322 12.6164 4.4717C11.464 3.50989 9.9087 2.66675 8.00092 2.66675ZM8.00092 5.33341C6.52816 5.33341 5.33425 6.52732 5.33425 8.00008C5.33425 9.47284 6.52816 10.6667 8.00092 10.6667C9.47368 10.6667 10.6676 9.47284 10.6676 8.00008C10.6676 6.52732 9.47368 5.33341 8.00092 5.33341Z" fill="#525252" />
                          </svg>
                          <span className="text-task-text-secondary font-medium text-base leading-[140%] tracking-[-0.32px] capitalize">
                            Task
                          </span>
                        </div>
                      </th>
                      <th className="px-3 py-3 text-left border-r border-task-border-DEFAULT">
                        <div className="flex items-center gap-2">
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M5.00065 7.33333H3.06732C2.69395 7.33333 2.50727 7.33333 2.36466 7.406C2.23922 7.46991 2.13723 7.5719 2.07331 7.69734C2.00065 7.83995 2.00065 8.02663 2.00065 8.4V14M11.0007 7.33333H12.934C13.3074 7.33333 13.494 7.33333 13.6366 7.406C13.7621 7.46991 13.8641 7.5719 13.928 7.69734C14.0007 7.83995 14.0007 8.02663 14.0007 8.4V14M11.0007 14V4.13333C11.0007 3.3866 11.0007 3.01323 10.8553 2.72801C10.7275 2.47713 10.5235 2.27316 10.2726 2.14532C9.98742 2 9.61405 2 8.86732 2H7.13398C6.38725 2 6.01388 2 5.72866 2.14532C5.47778 2.27316 5.27381 2.47713 5.14598 2.72801C5.00065 3.01323 5.00065 3.3866 5.00065 4.13333V14M14.6673 14H1.33398M7.33398 4.66667H8.66732M7.33398 7.33333H8.66732M7.33398 10H8.66732" stroke="#525252" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <span className="text-task-text-secondary font-medium text-base leading-[140%] tracking-[-0.32px] capitalize">
                            Property
                          </span>
                        </div>
                      </th>
                      <th className="px-3 py-3 text-left border-r border-task-border-DEFAULT">
                        <div className="flex items-center gap-2">
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M14 6.66658H2M10.6667 1.33325V3.99992M5.33333 1.33325V3.99992M5.2 14.6666H10.8C11.9201 14.6666 12.4802 14.6666 12.908 14.4486C13.2843 14.2569 13.5903 13.9509 13.782 13.5746C14 13.1467 14 12.5867 14 11.4666V5.86659C14 4.74648 14 4.18643 13.782 3.7586C13.5903 3.38228 13.2843 3.07632 12.908 2.88457C12.4802 2.66659 11.9201 2.66659 10.8 2.66659H5.2C4.0799 2.66659 3.51984 2.66659 3.09202 2.88457C2.71569 3.07632 2.40973 3.38228 2.21799 3.7586C2 4.18643 2 4.74648 2 5.86658V11.4666C2 12.5867 2 13.1467 2.21799 13.5746C2.40973 13.9509 2.71569 14.2569 3.09202 14.4486C3.51984 14.6666 4.0799 14.6666 5.2 14.6666Z" stroke="#525252" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <span className="text-task-text-secondary font-medium text-base leading-[140%] tracking-[-0.32px] capitalize">
                            Due
                          </span>
                        </div>
                      </th>
                      <th className="px-3 py-3 text-left border-r border-task-border-DEFAULT">
                        <div className="flex items-center gap-2">
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M14 6.66658H2M10.6667 1.33325V3.99992M5.33333 1.33325V3.99992M5.2 14.6666H10.8C11.9201 14.6666 12.4802 14.6666 12.908 14.4486C13.2843 14.2569 13.5903 13.9509 13.782 13.5746C14 13.1467 14 12.5867 14 11.4666V5.86659C14 4.74648 14 4.18643 13.782 3.7586C13.5903 3.38228 13.2843 3.07632 12.908 2.88457C12.4802 2.66659 11.9201 2.66659 10.8 2.66659H5.2C4.0799 2.66659 3.51984 2.66659 3.09202 2.88457C2.71569 3.07632 2.40973 3.38228 2.21799 3.7586C2 4.18643 2 4.74648 2 5.86658V11.4666C2 12.5867 2 13.1467 2.21799 13.5746C2.40973 13.9509 2.71569 14.2569 3.09202 14.4486C3.51984 14.6666 4.0799 14.6666 5.2 14.6666Z" stroke="#525252" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <span className="text-task-text-secondary font-medium text-base leading-[140%] tracking-[-0.32px] capitalize">
                            Updated
                          </span>
                        </div>
                      </th>
                      <th className="px-3 py-3 text-left border-r border-task-border-DEFAULT">
                        <div className="flex items-center gap-2">
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M8.00065 2.66659C5.05513 2.66659 2.66732 5.0544 2.66732 7.99992C2.66732 10.9454 5.05513 13.3333 8.00065 13.3333C10.5281 13.3333 12.6449 11.5752 13.1949 9.21518L12.9386 9.47139C12.6782 9.7317 12.2561 9.73164 11.9958 9.47125C11.7355 9.21086 11.7356 8.78875 11.996 8.52844L13.3297 7.19511C13.4547 7.0701 13.6243 6.99989 13.8011 6.99992C13.9779 6.99994 14.1475 7.07021 14.2725 7.19525L15.6054 8.52858C15.8657 8.78897 15.8657 9.21108 15.6053 9.47139C15.3449 9.7317 14.9228 9.73164 14.6625 9.47125L14.5324 9.3411C13.9116 12.3802 11.2232 14.6666 8.00065 14.6666C4.31875 14.6666 1.33398 11.6818 1.33398 7.99992C1.33398 4.31802 4.31875 1.33325 8.00065 1.33325C10.4473 1.33325 12.5854 2.65164 13.7443 4.61357C13.9316 4.93058 13.8264 5.33938 13.5094 5.52664C13.1924 5.71391 12.7836 5.60873 12.5963 5.29172C11.6673 3.71904 9.95653 2.66659 8.00065 2.66659Z" fill="#525252" />
                            <path d="M8.66732 4.66659C8.66732 4.2984 8.36884 3.99992 8.00065 3.99992C7.63246 3.99992 7.33398 4.2984 7.33398 4.66659V7.99992C7.33398 8.22282 7.44538 8.43097 7.63085 8.55462L9.63085 9.88795C9.9372 10.0922 10.3511 10.0094 10.5554 9.70305C10.7596 9.3967 10.6768 8.98279 10.3705 8.77855L8.66732 7.64313V4.66659Z" fill="#525252" />
                          </svg>
                          <span className="text-task-text-secondary font-medium text-base leading-[140%] tracking-[-0.32px] capitalize truncate">
                            Age
                          </span>
                        </div>
                      </th>
                      <th className="px-3 py-3 text-left border-r border-task-border-DEFAULT">
                        <div className="flex items-center gap-2">
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 4.33341H13.137C13.4228 4.33341 13.5657 4.33341 13.6517 4.3936C13.7268 4.44615 13.777 4.52732 13.7904 4.61803C13.8058 4.7219 13.7419 4.84969 13.6141 5.10526L12.7792 6.77496C12.7379 6.85769 12.7172 6.89905 12.7084 6.94253C12.7006 6.98105 12.6997 7.02064 12.7058 7.05947C12.7125 7.1033 12.7313 7.14556 12.7689 7.23008L13.6667 9.25014C13.7778 9.50008 13.8333 9.62504 13.8151 9.72593C13.7992 9.81409 13.7485 9.89214 13.6744 9.94248C13.5896 10.0001 13.4528 10.0001 13.1793 10.0001H8.06667C7.6933 10.0001 7.50661 10.0001 7.36401 9.92742C7.23856 9.8635 7.13658 9.76152 7.07266 9.63607C7 9.49347 7 9.30678 7 8.93341V7.33341M2 14.0001L2 2.33341M2 7.33341H7.93333C8.3067 7.33341 8.49339 7.33341 8.63599 7.26075C8.76143 7.19684 8.86342 7.09485 8.92734 6.96941C9 6.8268 9 6.64012 9 6.26675V2.73341C9 2.36005 9 2.17336 8.92734 2.03075C8.86342 1.90531 8.76143 1.80333 8.63599 1.73941C8.49339 1.66675 8.3067 1.66675 7.93333 1.66675L3.06667 1.66675C2.6933 1.66675 2.50661 1.66675 2.36401 1.73941C2.23856 1.80333 2.13658 1.90531 2.07266 2.03075C2 2.17336 2 2.36005 2 2.73341V7.33341Z" stroke="#525252" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <span className="text-task-text-secondary font-medium text-base leading-[140%] tracking-[-0.32px] capitalize">
                            Priority
                          </span>
                        </div>
                      </th>
                      <th className="px-3 py-3 text-left border-r border-task-border-DEFAULT">
                        <div className="flex items-center gap-2">
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" clipRule="evenodd" d="M11.4048 10.2586C11.5701 9.92957 11.9708 9.79684 12.2998 9.96212C13.3894 10.5095 14.3105 11.3809 14.9771 12.4547C15.0781 12.6174 15.2251 12.8346 15.2707 13.129C15.3196 13.4442 15.234 13.7456 15.1066 13.9748C14.9791 14.204 14.7681 14.4357 14.4745 14.5604C14.1954 14.679 13.8918 14.6666 13.6672 14.6666C13.299 14.6666 13.0005 14.3681 13.0005 13.9999C13.0005 13.6317 13.299 13.3333 13.6672 13.3333C13.8107 13.3333 13.8861 13.3328 13.9399 13.3292L13.9413 13.3267C13.9541 13.3038 13.8572 13.1788 13.8443 13.158C13.2961 12.2749 12.5529 11.5814 11.7013 11.1536C11.3723 10.9883 11.2395 10.5876 11.4048 10.2586Z" fill="#525252" />
                            <path fillRule="evenodd" clipRule="evenodd" d="M10.0702 2.01507C10.2341 1.68535 10.6342 1.55089 10.9639 1.71475C12.1696 2.31394 13.0005 3.55928 13.0005 4.99992C13.0005 6.44056 12.1696 7.6859 10.9639 8.28509C10.6342 8.44894 10.2341 8.31449 10.0702 7.98477C9.90635 7.65505 10.0408 7.25493 10.3705 7.09107C11.1404 6.70845 11.6672 5.91509 11.6672 4.99992C11.6672 4.08475 11.1404 3.29138 10.3705 2.90877C10.0408 2.74491 9.90635 2.34479 10.0702 2.01507Z" fill="#525252" />
                            <path fillRule="evenodd" clipRule="evenodd" d="M2.66722 4.99992C2.66722 2.97487 4.30884 1.33325 6.33388 1.33325C8.35893 1.33325 10.0005 2.97487 10.0005 4.99992C10.0005 7.02496 8.35893 8.66659 6.33388 8.66659C4.30884 8.66659 2.66722 7.02496 2.66722 4.99992Z" fill="#525252" />
                            <path fillRule="evenodd" clipRule="evenodd" d="M6.33388 9.33325C8.46471 9.33325 10.3696 10.536 11.532 12.28C11.6344 12.4336 11.7436 12.5975 11.8199 12.7532C11.9118 12.9407 11.9778 13.156 11.9624 13.4131C11.9501 13.6182 11.882 13.8085 11.8012 13.9596C11.7203 14.1107 11.5996 14.2728 11.4357 14.3967C11.2162 14.5627 10.9796 14.6209 10.7705 14.6453C10.5863 14.6667 10.3682 14.6666 10.1485 14.6666C7.60641 14.6661 5.06234 14.6661 2.51926 14.6666C2.29957 14.6666 2.08147 14.6667 1.89731 14.6453C1.68818 14.6209 1.45158 14.5627 1.23204 14.3967C1.06816 14.2728 0.947505 14.1107 0.86661 13.9596C0.785715 13.8085 0.71768 13.6182 0.705369 13.4131C0.689933 13.156 0.755933 12.9407 0.847831 12.7532C0.924183 12.5975 1.03339 12.4336 1.1358 12.28C2.29819 10.536 4.20306 9.33325 6.33388 9.33325Z" fill="#525252" />
                          </svg>
                          <span className="text-task-text-secondary font-medium text-base leading-[140%] tracking-[-0.32px] capitalize truncate">
                            Assignees
                          </span>
                        </div>
                      </th>
                      <th className="px-3 py-3 text-left border-l border-task-border-DEFAULT shadow-[-1px_1px_2px_0_rgba(10,13,18,0.05)]">
                        <span className="text-task-text-secondary font-medium text-base leading-[140%] tracking-[-0.32px] capitalize">
                          Actions
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="border-b-0">
                    {tasks.map((task, index) => (
                      <tr key={task.id} className={cn(
                        "border-b border-task-border-DEFAULT hover:bg-gray-50 transition-colors",
                        index === tasks.length - 1 ? "border-b-0" : ""
                      )}>
                        <td className={cn("px-3 py-3.5 border-r border-task-border-DEFAULT", index === tasks.length - 1 ? "border-b-0" : "")}>
                          <StatusBadge status={task.status} />
                        </td>
                        <td className={cn("px-3 py-3.5 border-r border-task-border-DEFAULT", index === tasks.length - 1 ? "border-b-0" : "")}>
                          <div className="text-task-text-primary font-normal text-base leading-[140%] tracking-[-0.32px] capitalize truncate max-w-[186px]">
                            {task.task}
                          </div>
                        </td>
                        <td className={cn("px-3 py-3.5 border-r border-task-border-DEFAULT", index === tasks.length - 1 ? "border-b-0" : "")}>
                          <div className="text-task-text-primary font-normal text-base leading-[140%] tracking-[-0.32px] capitalize truncate max-w-[155px]">
                            {task.property}
                          </div>
                        </td>
                        <td className={cn("px-3 py-3.5 border-r border-task-border-DEFAULT", index === tasks.length - 1 ? "border-b-0" : "")}>
                          <div className="text-task-text-primary font-normal text-base leading-[140%] tracking-[-0.32px] capitalize truncate max-w-[136px]">
                            {task.due}
                          </div>
                        </td>
                        <td className={cn("px-3 py-3.5 border-r border-task-border-DEFAULT", index === tasks.length - 1 ? "border-b-0" : "")}>
                          <div className="text-task-text-primary font-normal text-base leading-[140%] tracking-[-0.32px] capitalize truncate max-w-[121px]">
                            {task.updated}
                          </div>
                        </td>
                        <td className={cn("px-3 py-3.5 border-r border-task-border-DEFAULT", index === tasks.length - 1 ? "border-b-0" : "")}>
                          <div className="text-task-text-primary font-normal text-base leading-[140%] tracking-[-0.32px] capitalize">
                            {task.age}
                          </div>
                        </td>
                        <td className={cn("px-3 py-3.5 border-r border-task-border-DEFAULT", index === tasks.length - 1 ? "border-b-0" : "")}>
                          <PriorityBadge priority={task.priority} />
                        </td>
                        <td className={cn("px-3 py-3.5 border-r border-task-border-DEFAULT", index === tasks.length - 1 ? "border-b-0" : "")}>
                          <div className="flex items-center gap-1">
                            <UserAvatar />
                            <UserAvatar />
                          </div>
                        </td>
                        <td className={cn("px-3 py-3.5 border-l border-task-border-DEFAULT", index === tasks.length - 1 ? "border-b-0" : "")}>
                          <button className="w-7 h-7 flex justify-center items-center gap-2 rounded-md border border-task-border-DEFAULT shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] hover:bg-gray-100 transition-colors">
                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M9 9.75C9.41421 9.75 9.75 9.41421 9.75 9C9.75 8.58579 9.41421 8.25 9 8.25C8.58579 8.25 8.25 8.58579 8.25 9C8.25 9.41421 8.58579 9.75 9 9.75Z" stroke="#525252" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              <path d="M14.25 9.75C14.6642 9.75 15 9.41421 15 9C15 8.58579 14.6642 8.25 14.25 8.25C13.8358 8.25 13.5 8.58579 13.5 9C13.5 9.41421 13.8358 9.75 14.25 9.75Z" stroke="#525252" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              <path d="M3.75 9.75C4.16421 9.75 4.5 9.41421 4.5 9C4.5 8.58579 4.16421 8.25 3.75 8.25C3.33579 8.25 3 8.58579 3 9C3 9.41421 3.33579 9.75 3.75 9.75Z" stroke="#525252" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination - Inside Table */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-6 py-4 border-t border-task-border-DEFAULT">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-task-text-secondary font-medium text-base leading-[140%] tracking-[-0.32px] capitalize">
                    Showing
                  </span>
                  <div className="relative">
                    <select
                      value={itemsPerPage}
                      onChange={(e) => setItemsPerPage(Number(e.target.value))}
                      className="h-10 px-3 pr-8 rounded-lg border border-task-border-light shadow-[0_1px_2px_0_rgba(10,13,18,0.05)] text-[#0A0A0A] font-medium text-base leading-[140%] tracking-[-0.32px] capitalize bg-white appearance-none cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                    </select>
                    <svg className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4.5 6.75L9 11.25L13.5 6.75" stroke="#A3A3A3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span className="text-task-text-secondary font-medium text-base leading-[140%] tracking-[-0.32px] capitalize">
                    of 225
                  </span>
                </div>
                <div className="flex h-10 items-center rounded-lg border border-task-border-DEFAULT shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] divide-x divide-task-border-light overflow-hidden">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="flex h-full items-center gap-1.5 px-3 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M16.6673 10H3.33398M3.33398 10L8.33398 15M3.33398 10L8.33398 5" stroke="#A3A3A3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="text-task-text-secondary font-medium text-base leading-[140%] tracking-[-0.32px] capitalize hidden sm:inline">
                      Previous
                    </span>
                  </button>
                  {[1, 2, 3].map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={cn(
                        "flex h-full min-w-[40px] justify-center items-center px-2 hover:bg-gray-50 transition-colors font-medium text-base leading-[140%] tracking-[-0.32px] capitalize",
                        currentPage === page ? "text-[#0A0A0A]" : "text-task-text-muted"
                      )}
                    >
                      {page}
                    </button>
                  ))}
                  <button className="flex h-full min-w-[40px] justify-center items-center px-2 text-task-text-muted font-medium text-base leading-[140%] tracking-[-0.32px] capitalize">
                    ...
                  </button>
                  {[8, 9, 10].map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className="flex h-full min-w-[40px] justify-center items-center px-2 hover:bg-gray-50 transition-colors text-task-text-muted font-medium text-base leading-[140%] tracking-[-0.32px] capitalize"
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    className="flex h-full items-center gap-1.5 px-3 hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-task-text-secondary font-medium text-base leading-[140%] tracking-[-0.32px] capitalize hidden sm:inline">
                      Next
                    </span>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3.33398 10H16.6673M16.6673 10L11.6673 5M16.6673 10L11.6673 15" stroke="#A3A3A3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Table Content - Mobile/Tablet */}
              <div className="lg:hidden divide-y divide-task-border-DEFAULT">
                {tasks.map((task) => (
                  <div key={task.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <StatusBadge status={task.status} />
                        <div className="mt-2 text-task-text-primary font-normal text-base leading-[140%] tracking-[-0.32px] capitalize">
                          {task.task}
                        </div>
                      </div>
                      <button className="w-7 h-7 flex-shrink-0 flex justify-center items-center rounded-md border border-task-border-DEFAULT shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] hover:bg-gray-100 transition-colors">
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M9 9.75C9.41421 9.75 9.75 9.41421 9.75 9C9.75 8.58579 9.41421 8.25 9 8.25C8.58579 8.25 8.25 8.58579 8.25 9C8.25 9.41421 8.58579 9.75 9 9.75Z" stroke="#525252" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M14.25 9.75C14.6642 9.75 15 9.41421 15 9C15 8.58579 14.6642 8.25 14.25 8.25C13.8358 8.25 13.5 8.58579 13.5 9C13.5 9.41421 13.8358 9.75 14.25 9.75Z" stroke="#525252" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M3.75 9.75C4.16421 9.75 4.5 9.41421 4.5 9C4.5 8.58579 4.16421 8.25 3.75 8.25C3.33579 8.25 3 8.58579 3 9C3 9.41421 3.33579 9.75 3.75 9.75Z" stroke="#525252" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-task-text-secondary">Property: </span>
                        <span className="text-task-text-primary">{task.property}</span>
                      </div>
                      <div>
                        <span className="text-task-text-secondary">Due: </span>
                        <span className="text-task-text-primary">{task.due}</span>
                      </div>
                      <div>
                        <span className="text-task-text-secondary">Age: </span>
                        <span className="text-task-text-primary">{task.age}</span>
                      </div>
                      <div>
                        <PriorityBadge priority={task.priority} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-task-text-secondary text-sm">Assignees:</span>
                      <div className="flex items-center gap-1">
                        <UserAvatar />
                        <UserAvatar />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
