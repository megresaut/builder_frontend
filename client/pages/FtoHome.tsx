import { useState } from "react";
import PageTemplate from "@/layout/PageTemplate";
import SubPageHeaderV2 from "@/components/SubPageHeaderV2";
import TableToggle from "@/components/TableToggle";
import BlueButton from "@/components/BlueButton";
import { PlusIcon } from "@/components/icons";

export default function FtoHome() {
  const [activeTab, setActiveTab] = useState<"open" | "closed">("open");

  const tabs = [
    { id: "open" as const, label: "Open" },
    { id: "closed" as const, label: "Closed" },
  ];

  return (
    <PageTemplate>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Home</h1>
          <p className="text-gray-600 mt-2">Welcome to Field Team Orders</p>
        </div>

        <SubPageHeaderV2
          leftContent={
            <TableToggle
              tabs={tabs}
              activeTab={activeTab}
              onTabChange={(tabId) => setActiveTab(tabId as "open" | "closed")}
            />
          }
          rightContent={
            <BlueButton icon={<PlusIcon width={20} height={20} />}>
              Submit
            </BlueButton>
          }
        />

        <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
          <p className="text-gray-700">
            This is your home page for managing field team orders.
          </p>
        </div>
      </div>
    </PageTemplate>
  );
}
