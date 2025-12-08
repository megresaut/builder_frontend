import { Search, ChevronDown, MoreVertical, Plus } from "lucide-react";
import { useState } from "react";

const mockRecurringTasks = [
  {
    id: 1,
    task: "Doors need to be repaired",
    nextDate: "Oct 2, 2025",
    priority: "High",
    category: "Cansaas",
    assignees: 2,
  },
  {
    id: 2,
    task: "Doors need to be repaired",
    nextDate: "Sep 29, 2025",
    priority: "Low",
    category: "Cansaas",
    assignees: 2,
  },
  {
    id: 3,
    task: "Doors need to be repaired",
    nextDate: "Sep 10, 2025",
    priority: "Normal",
    category: "Cansaas",
    assignees: 2,
  },
  {
    id: 4,
    task: "Doors need to be repaired",
    nextDate: "Sep 6, 2025",
    priority: "Normal",
    category: "Cansaas",
    assignees: 2,
  },
  {
    id: 5,
    task: "Doors need to be repaired",
    nextDate: "Sep 5, 2025",
    priority: "Normal",
    category: "Cansaas",
    assignees: 2,
  },
  {
    id: 6,
    task: "Doors need to be repaired",
    nextDate: "Sep 4, 2025",
    priority: "Normal",
    category: "Cansaas",
    assignees: 2,
  },
  {
    id: 7,
    task: "Doors need to be repaired",
    nextDate: "Sep 4, 2025",
    priority: "Normal",
    category: "Cansaas",
    assignees: 2,
  },
  {
    id: 8,
    task: "Doors need to be repaired",
    nextDate: "Sep 3, 2025",
    priority: "Normal",
    category: "Cansaas",
    assignees: 2,
  },
  {
    id: 9,
    task: "Doors need to be repaired",
    nextDate: "Sep 1, 2025",
    priority: "Normal",
    category: "Cansaas",
    assignees: 2,
  },
  {
    id: 10,
    task: "Doors need to be repaired",
    nextDate: "Sep 1, 2025",
    priority: "Normal",
    category: "Cansaas",
    assignees: 2,
  },
];

export default function RecurringTasks() {
  const [activeTab, setActiveTab] = useState<
    "tasks" | "recurring" | "workorders" | "fieldteam"
  >("recurring");

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "bg-[#fef3c7] text-[#d97706]";
      case "Low":
        return "bg-[#d1fae5] text-[#059669]";
      case "Normal":
        return "bg-[#dbe9fe] text-[#2463eb]";
      default:
        return "bg-[#dbe9fe] text-[#2463eb]";
    }
  };

  return (
    <div className="flex flex-col w-full bg-white">
      <div className="flex items-start gap-6 justify-between px-6 py-6 flex-wrap">
        <div className="flex flex-col gap-1 min-w-[240px]">
          <div className="text-[24px] text-[#303030] font-semibold">
            Recurring Tasks
          </div>
          <div className="text-base text-[#717179] font-medium">
            All your recurring tasks, in one place
          </div>
        </div>
        <button className="flex items-center gap-2 px-3 py-2 bg-[#013764] text-white rounded-lg border border-[#002d5a] font-['Geist',sans-serif] text-base font-medium hover:bg-[#014777] transition-colors">
          <Plus className="w-5 h-5" />
          Create Recurring Task
        </button>
      </div>

      <div className="flex items-start gap-6 justify-between px-6 py-4 flex-wrap">
        <div className="flex items-center gap-2 bg-[#f9f9f9] rounded-lg border border-[#d2d1cf] p-0.5 font-['Geist',sans-serif] text-sm text-[#282828] text-center">
          <button
            onClick={() => setActiveTab("tasks")}
            className={`px-4 py-1.5 rounded-md transition-colors ${
              activeTab === "tasks"
                ? "bg-white shadow-sm text-[#09090b] font-medium"
                : "text-[#282828]"
            }`}
          >
            Tasks
          </button>
          <button
            onClick={() => setActiveTab("recurring")}
            className={`px-4 py-1.5 rounded-md transition-colors ${
              activeTab === "recurring"
                ? "bg-white shadow-sm text-[#09090b] font-medium"
                : "text-[#282828]"
            }`}
          >
            Recurring Tasks
          </button>
          <button
            onClick={() => setActiveTab("workorders")}
            className={`px-4 py-1.5 rounded-md transition-colors ${
              activeTab === "workorders"
                ? "bg-white shadow-sm text-[#09090b] font-medium"
                : "text-[#282828]"
            }`}
          >
            Work Orders
          </button>
          <button
            onClick={() => setActiveTab("fieldteam")}
            className={`px-4 py-1.5 rounded-md transition-colors ${
              activeTab === "fieldteam"
                ? "bg-white shadow-sm text-[#09090b] font-medium"
                : "text-[#282828]"
            }`}
          >
            Field Team Orders
          </button>
        </div>
      </div>

      <div className="mt-6 mx-6 mb-6 bg-white">
        <div className="border border-[#e5e5e5] rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-4 bg-white flex items-center justify-between gap-6 flex-wrap">
            <div className="flex items-center gap-4 font-['Geist',sans-serif]">
              <h2 className="text-[22px] text-[#303030] font-medium">
                Recurring Tasks
              </h2>
            </div>

            <div className="flex items-center gap-2.5 font-['Geist',sans-serif] text-base">
              <div className="flex items-center gap-2 px-3 py-2 bg-[#fbfbfb] border border-[#dadada] rounded-lg shadow-sm min-w-[280px]">
                <Search className="w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="flex-1 bg-transparent outline-none text-[#303030] placeholder:text-[#a1a1a9]"
                />
              </div>
              <button className="flex items-center gap-2 px-3 py-1.5 bg-[#fbfbfb] border border-[#dadada] rounded-lg shadow-sm hover:bg-gray-50 transition-colors">
                <span className="text-[#303030]">Filter</span>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path
                    d="M4.5 6.75H13.5M6 9.75H12M7.875 12.75H10.125"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>

          <div className="border-t border-[#dadada] bg-white overflow-x-auto">
            <table className="w-full font-['Geist',sans-serif]">
              <thead>
                <tr className="bg-[#fbfbfb] border-b border-[#dadada]">
                  <th className="px-3 py-3 text-left">
                    <div className="flex items-center gap-2 text-[#525252] text-base font-medium">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <path
                          d="M5.33333 2.66667V4.66667M10.6667 2.66667V4.66667M4 7.33333H12M3.33333 13.3333H12.6667C13.403 13.3333 14 12.7364 14 12V4.66667C14 3.93029 13.403 3.33333 12.6667 3.33333H3.33333C2.59695 3.33333 2 3.93029 2 4.66667V12C2 12.7364 2.59695 13.3333 3.33333 13.3333Z"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span>Task</span>
                    </div>
                  </th>
                  <th className="px-3 py-3 text-left min-w-[187px]">
                    <div className="flex items-center gap-2 text-[#525252] text-base font-medium">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <path
                          d="M5.33333 2.66667V4.66667M10.6667 2.66667V4.66667M4 7.33333H12M3.33333 13.3333H12.6667C13.403 13.3333 14 12.7364 14 12V4.66667C14 3.93029 13.403 3.33333 12.6667 3.33333H3.33333C2.59695 3.33333 2 3.93029 2 4.66667V12C2 12.7364 2.59695 13.3333 3.33333 13.3333Z"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span>Next Date</span>
                    </div>
                  </th>
                  <th className="px-3 py-3 text-left min-w-[154px]">
                    <div className="flex items-center gap-2 text-[#525252] text-base font-medium">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <path
                          d="M8 4V8L10.6667 9.33333M14.6667 8C14.6667 11.6819 11.6819 14.6667 8 14.6667C4.3181 14.6667 1.33333 11.6819 1.33333 8C1.33333 4.3181 4.3181 1.33333 8 1.33333C11.6819 1.33333 14.6667 4.3181 14.6667 8Z"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span>Priority</span>
                    </div>
                  </th>
                  <th className="px-3 py-3 text-left min-w-[212px]">
                    <div className="flex items-center gap-2 text-[#525252] text-base font-medium">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <path
                          d="M2.66667 14V7.33333L8 2L13.3333 7.33333V14H10V10H6V14H2.66667Z"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span>Category</span>
                    </div>
                  </th>
                  <th className="px-3 py-3 text-left min-w-[175px]">
                    <div className="flex items-center gap-2 text-[#525252] text-base font-medium">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <path
                          d="M5.33333 14C6.80609 14 8 12.8061 8 11.3333C8 9.86057 6.80609 8.66667 5.33333 8.66667C3.86057 8.66667 2.66667 9.86057 2.66667 11.3333C2.66667 12.8061 3.86057 14 5.33333 14Z"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M10.6667 7.33333C12.1394 7.33333 13.3333 6.13943 13.3333 4.66667C13.3333 3.19391 12.1394 2 10.6667 2C9.19391 2 8 3.19391 8 4.66667C8 6.13943 9.19391 7.33333 10.6667 7.33333Z"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span>Assignees</span>
                    </div>
                  </th>
                  <th className="px-3 py-3 text-left w-[79px]">
                    <div className="text-[#525252] text-base font-medium">
                      Actions
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {mockRecurringTasks.map((task) => (
                  <tr
                    key={task.id}
                    className="border-b border-[#dadada] hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-3 py-4">
                      <div className="text-[#303030] text-base">
                        {task.task}
                      </div>
                    </td>
                    <td className="px-3 py-4">
                      <div className="text-[#303030] text-base">
                        {task.nextDate}
                      </div>
                    </td>
                    <td className="px-3 py-4">
                      <div
                        className={`inline-flex items-center px-3 py-1 rounded-2xl text-base ${getPriorityColor(
                          task.priority
                        )}`}
                      >
                        {task.priority}
                      </div>
                    </td>
                    <td className="px-3 py-4">
                      <button className="flex items-center gap-2 px-3 py-1.5 bg-[#fbfbfb] border border-[#dadada] rounded-lg shadow-sm hover:bg-gray-50 transition-colors">
                        <span className="text-[#303030] text-base">
                          {task.category}
                        </span>
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex items-center gap-1">
                        <div className="w-7 h-7 rounded-full bg-[#fff0ef] border border-[rgba(188,66,62,0.22)] flex items-center justify-center">
                          <img
                            src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/1e4df0d6a9f453fa97f21f7bd0951081b33b6c2f?placeholderIfAbsent=true"
                            alt=""
                            className="w-5 h-5"
                          />
                        </div>
                        <div className="w-7 h-7 rounded-full bg-[#fff0ef] border border-[rgba(188,66,62,0.22)] flex items-center justify-center">
                          <img
                            src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/1e4df0d6a9f453fa97f21f7bd0951081b33b6c2f?placeholderIfAbsent=true"
                            alt=""
                            className="w-5 h-5"
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-4">
                      <button className="flex items-center justify-center w-7 h-7 bg-[#fbfbfb] border border-[#dadada] rounded-md shadow-sm hover:bg-gray-50 transition-colors">
                        <MoreVertical className="w-[18px] h-[18px]" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 bg-white border-t border-[#e5e5e5] flex items-center justify-between gap-6 flex-wrap font-['Geist',sans-serif] text-base font-medium">
            <div className="flex items-center gap-2 text-[#525252]">
              <span>Showing</span>
              <button className="flex items-center gap-2 px-3 py-2 bg-[#fbfbfb] border border-[#dadada] rounded-lg shadow-sm hover:bg-gray-50 transition-colors text-[#0a0a0a]">
                <span>10</span>
                <ChevronDown className="w-[18px] h-[18px]" />
              </button>
              <span>of 225</span>
            </div>

            <div className="flex items-center gap-0 bg-[#fbfbfb] border border-[#dadada] rounded-lg shadow-sm overflow-hidden">
              <button className="flex items-center gap-1.5 px-4 py-2 border-r border-[#e5e5e5] bg-white text-[#525252] hover:bg-gray-50 transition-colors">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path
                    d="M12.5 15L7.5 10L12.5 5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>Previous</span>
              </button>
              <button className="px-3 py-2 border-r border-[#e5e5e5] bg-white text-[#0a0a0a] hover:bg-gray-50 transition-colors">
                1
              </button>
              <button className="px-3 py-2 border-r border-[#e5e5e5] bg-white text-[#a3a3a3] hover:bg-gray-50 transition-colors">
                2
              </button>
              <button className="px-3 py-2 border-r border-[#e5e5e5] bg-white text-[#a3a3a3] hover:bg-gray-50 transition-colors">
                3
              </button>
              <button className="px-3 py-2 border-r border-[#e5e5e5] bg-white text-[#a3a3a3] hover:bg-gray-50 transition-colors">
                ...
              </button>
              <button className="px-3 py-2 border-r border-[#e5e5e5] bg-white text-[#a3a3a3] hover:bg-gray-50 transition-colors">
                8
              </button>
              <button className="px-3 py-2 border-r border-[#e5e5e5] bg-white text-[#a3a3a3] hover:bg-gray-50 transition-colors">
                9
              </button>
              <button className="px-3 py-2 border-r border-[#e5e5e5] bg-white text-[#a3a3a3] hover:bg-gray-50 transition-colors">
                10
              </button>
              <button className="flex items-center gap-1.5 px-4 py-2 bg-white text-[#525252] hover:bg-gray-50 transition-colors">
                <span>Next</span>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path
                    d="M7.5 15L12.5 10L7.5 5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
