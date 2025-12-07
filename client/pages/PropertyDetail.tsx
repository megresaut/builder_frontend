import { useParams } from "react-router-dom";
import { PropertiesTemplate } from "@/layout/PropertiesTemplate";
import { Overview } from "./properties/Overview";
import { Units } from "./properties/Units";
import { Utilities } from "./properties/Utilities";
import { Maintenance } from "./properties/Maintenance";
import { Tasks } from "./properties/Tasks";
import { Vendors } from "./properties/Vendors";
import { Bills } from "./properties/Bills";
import { Notes } from "./properties/Notes";
import { Invoicing } from "./properties/Invoicing";

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

  const renderPageContent = () => {
    const currentTab = tab || "Overview";

    switch (currentTab) {
      case "Overview":
        return (
          <Overview
            propertyAddress={property.address}
            propertyType={property.type}
            propertyUnits={property.units}
          />
        );
      case "Units":
        return (
          <Units
            propertyAddress={property.address}
            propertyType={property.type}
            propertyUnits={property.units}
          />
        );
      case "Utilities":
        return (
          <Utilities
            propertyAddress={property.address}
            propertyType={property.type}
            propertyUnits={property.units}
          />
        );
      case "Maintenance":
        return (
          <Maintenance
            propertyAddress={property.address}
            propertyType={property.type}
            propertyUnits={property.units}
          />
        );
      case "Tasks":
        return (
          <Tasks
            propertyAddress={property.address}
            propertyType={property.type}
            propertyUnits={property.units}
          />
        );
      case "Vendors":
        return (
          <Vendors
            propertyAddress={property.address}
            propertyType={property.type}
            propertyUnits={property.units}
          />
        );
      case "Bills":
        return (
          <Bills
            propertyAddress={property.address}
            propertyType={property.type}
            propertyUnits={property.units}
          />
        );
      case "Notes":
        return (
          <Notes
            propertyAddress={property.address}
            propertyType={property.type}
            propertyUnits={property.units}
          />
        );
      case "Invoicing":
        return (
          <Invoicing
            propertyAddress={property.address}
            propertyType={property.type}
            propertyUnits={property.units}
          />
        );
      default:
        return (
          <Overview
            propertyAddress={property.address}
            propertyType={property.type}
            propertyUnits={property.units}
          />
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
      {renderPageContent()}
    </PropertiesTemplate>
  );
}
