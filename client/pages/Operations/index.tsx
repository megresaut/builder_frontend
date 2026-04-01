import { useSearchParams } from "react-router-dom";
import OperationsCalendar from "./OperationsCalendar";
import Reminders from "./Reminders";
import MyTodos from "./MyTodos";
import { cn } from "@/lib/utils";

type Tab = "calendar" | "reminders" | "todos";

export default function Operations() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab: Tab = (searchParams.get("tab") as Tab) ?? "calendar";

  function switchTab(tab: Tab) {
    setSearchParams({ tab }, { replace: true });
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Tab bar */}
      <div className="flex items-center gap-1 px-4 pt-3 pb-0 border-b border-[#e8e8e8] bg-white flex-shrink-0">
        {(
          [
            { id: "calendar", label: "Calendar" },
            { id: "reminders", label: "Reminders" },
            { id: "todos", label: "To-Dos" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => switchTab(tab.id)}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px",
              activeTab === tab.id
                ? "border-[#013764] text-[#013764]"
                : "border-transparent text-[#717179] hover:text-[#303030]"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "calendar" ? (
          <OperationsCalendar />
        ) : activeTab === "reminders" ? (
          <div className="h-full overflow-y-auto">
            <Reminders />
          </div>
        ) : (
          <div className="h-full overflow-y-auto">
            <MyTodos />
          </div>
        )}
      </div>
    </div>
  );
}
