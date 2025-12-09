import React, { useState } from "react";

interface MaintenanceProps {
  propertyAddress: string;
  propertyType: string;
  propertyUnits: number;
}

export const Maintenance: React.FC<MaintenanceProps> = ({
  propertyAddress,
  propertyType,
  propertyUnits,
}) => {
  const [activeTab, setActiveTab] = useState<
    "tasks" | "recurring" | "workorders" | "fieldteam"
  >("recurring");

  const tabs = [
    { id: "tasks" as const, label: "Tasks" },
    { id: "recurring" as const, label: "Recurring Tasks" },
    { id: "workorders" as const, label: "Work Orders" },
    { id: "fieldteam" as const, label: "Field Team Orders" },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Navigation and Action Button */}
      <div className="flex items-start justify-between gap-6 flex-wrap">
        {/* Segmented Tabs */}
        <div
          className="flex items-start min-w-[240px] max-w-[601px] flex-1 p-0.5 rounded-lg bg-[#F9F9F9] overflow-hidden"
          style={{ boxShadow: "0px 0px 0px 1px #D2D1CF" }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
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

        {/* Add Recurring Task Button */}
        <button
          className="flex items-center gap-2 px-3 py-2 min-h-[36px] rounded-lg bg-[#013764] text-white font-medium text-base overflow-hidden transition-colors hover:bg-[#002D5A]"
          style={{ boxShadow: "0px 0px 0px 1px #002D5A" }}
        >
          <img
            loading="lazy"
            src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/1a46511ba98f469f36b0bbeec24c0e7684e3ff9a?placeholderIfAbsent=true"
            alt=""
            className="w-5 h-5 object-contain"
          />
          <span>Add Recurring Task</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {activeTab === "tasks" && (
          <>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Tasks</h2>
            <p className="text-gray-600 text-base">
              View and manage tasks for {propertyAddress}
            </p>
          </>
        )}

        {activeTab === "recurring" && (
          <>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Recurring Tasks
            </h2>
            <p className="text-gray-600 text-base">
              Manage recurring maintenance tasks for {propertyAddress}
            </p>
          </>
        )}

        {activeTab === "workorders" && (
          <>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Work Orders
            </h2>
            <p className="text-gray-600 text-base">
              Track work orders for {propertyAddress}
            </p>
          </>
        )}

        {activeTab === "fieldteam" && (
          <>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Field Team Orders
            </h2>
            <p className="text-gray-600 text-base">
              View field team orders for {propertyAddress}
            </p>
          </>
        )}
      </div>
    </div>
  );
};
