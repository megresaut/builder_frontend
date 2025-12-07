import { useParams } from "react-router-dom";
import { PropertiesTemplate } from "@/layout/PropertiesTemplate";

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

  return (
    <PropertiesTemplate 
      propertyAddress={property.address}
      propertyType={property.type}
      propertyUnits={property.units}
      activeTab={tab || "Overview"}
    >
      {/* Blank page content - can be filled in based on active tab */}
      <div className="flex flex-col gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-gray-600 text-base">
            This is the {tab || "Overview"} tab for {property.address}
          </p>
        </div>
      </div>
    </PropertiesTemplate>
  );
}
