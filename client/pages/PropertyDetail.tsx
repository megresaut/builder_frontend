import { useParams } from "react-router-dom";
import { PropertiesTemplate } from "@/layout/PropertiesTemplate";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { StatusBadge, BillStatusBadge, AIInsightBadge } from "./Utilities";

// Mock property data - in a real app, this would come from an API
const propertyData: Record<
  string,
  { address: string; type: string; units: number }
> = {
  "1": {
    address: "22 Indian Chase Dr, Greenwich, CT",
    type: "Concierge",
    units: 1,
  },
  "2": {
    address: "22 Indian Chase Dr, Greenwich, CT",
    type: "Rental",
    units: 1,
  },
  "3": {
    address: "22 Indian Chase Dr, Greenwich, CT",
    type: "Commercial",
    units: 1,
  },
  "4": {
    address: "22 Indian Chase Dr, Greenwich, CT",
    type: "OR",
    units: 1,
  },
  "5": {
    address: "22 Indian Chase Dr, Greenwich, CT",
    type: "HOA",
    units: 1,
  },
  "6": {
    address: "22 Indian Chase Dr, Greenwich, CT",
    type: "Concierge",
    units: 1,
  },
  "7": {
    address: "22 Indian Chase Dr, Greenwich, CT",
    type: "Concierge",
    units: 1,
  },
  "8": {
    address: "22 Indian Chase Dr, Greenwich, CT",
    type: "Concierge",
    units: 1,
  },
  "9": {
    address: "22 Indian Chase Dr, Greenwich, CT",
    type: "Concierge",
    units: 1,
  },
  "10": {
    address: "22 Indian Chase Dr, Greenwich, CT",
    type: "Concierge",
    units: 1,
  },
};

export default function PropertyDetail() {
  const { propertyId, tab } = useParams<{
    propertyId: string;
    tab?: string;
  }>();

  const property = propertyId ? propertyData[propertyId] : null;

  if (!property) {
    return (
      <PropertiesTemplate activeTab={tab || "Overview"}>
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-500 text-lg">Property not found</p>
        </div>
      </PropertiesTemplate>
    );
  }

  const renderTabContent = () => {
    const currentTab = tab || "Overview";

    switch (currentTab) {
      case "Utilities":
        return (
          <div className="flex flex-col gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Utilities for {property.address}
              </h2>
              <p className="text-gray-600 text-base mb-4">
                Manage utility accounts and usage data for this property
              </p>
              <div className="flex flex-col gap-4">
                <div className="border-t pt-4">
                  <p className="text-gray-500 text-sm">
                    Utility accounts information will appear here
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      case "Bills":
        return (
          <div className="flex flex-col gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Bills for {property.address}
              </h2>
              <p className="text-gray-600 text-base">
                View and manage utility bills
              </p>
            </div>
          </div>
        );
      case "Maintenance":
        return (
          <div className="flex flex-col gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Maintenance for {property.address}
              </h2>
              <p className="text-gray-600 text-base">
                Track maintenance requests and schedules
              </p>
            </div>
          </div>
        );
      default:
        return (
          <div className="flex flex-col gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {currentTab}
              </h2>
              <p className="text-gray-600 text-base">
                This is the {currentTab} tab for {property.address}
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <PropertiesTemplate
      propertyAddress={property.address}
      propertyType={property.type}
      propertyUnits={property.units}
      activeTab={tab || "Overview"}
    >
      {renderTabContent()}
    </PropertiesTemplate>
  );
}
