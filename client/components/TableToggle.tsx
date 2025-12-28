import React from "react";

export interface TableTab {
  id: string;
  label: string;
}

interface TableToggleProps {
  tabs: TableTab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export const TableToggle: React.FC<TableToggleProps> = ({
  tabs,
  activeTab,
  onTabChange,
}) => {
  return (
    <div
      className="flex items-start min-w-[240px] max-w-[601px] flex-1 p-0.5 rounded-lg bg-[#F9F9F9] overflow-hidden"
      style={{ boxShadow: "0px 0px 0px 1px #D2D1CF" }}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex-1 flex items-center justify-center px-4 py-1.5 rounded-md text-sm font-medium text-center whitespace-nowrap transition-all ${
            activeTab === tab.id
              ? "bg-white text-[#09090B] font-medium shadow-[0_1px_1px_0_rgba(11,19,36,0.1),0_1px_3px_0_rgba(11,19,36,0.1)]"
              : "text-[#282828] hover:text-[#09090B]"
          }`}
          style={{ lineHeight: "1.43" }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default TableToggle;
