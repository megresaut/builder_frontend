import { useParams } from "react-router-dom";
import { PropertiesTemplate } from "@/layout/PropertiesTemplate";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Overview } from "./properties/Overview";
import { Units } from "./properties/Units";
import { Utilities } from "./properties/Utilities";
import { Maintenance } from "./properties/Maintenance";
import { Tasks } from "./properties/Tasks";
import { Vendors } from "./properties/Vendors";
import { Bills } from "./properties/Bills";
import { Notes } from "./properties/Notes";
import { Invoicing } from "./properties/Invoicing";

interface Manager {
  id: number;
  name: string;
  initials: string;
  color: string;
}

interface Property {
  id: number;
  address: string;
  location: string;
  managers: Manager[];
  type: string;
  buildingId: string;
  status: "active" | "inactive";
  units: number;
  rentalOwner?: string;
}

// Mock property data - in a real app, this would come from an API
const propertyData: Record<string, Property> = {
  "1": {
    id: 1,
    address: "22 Indian Chase Dr",
    location: "Greenwich, CT 06831",
    managers: [
      { id: 1, name: "Jerry Sanchez", initials: "JS", color: "bg-blue-500" },
      { id: 2, name: "John Doe", initials: "JD", color: "bg-purple-500" },
    ],
    type: "Concierge",
    buildingId: "624090",
    status: "inactive",
    units: 1,
    rentalOwner: "Eunice Bae",
  },
  "2": {
    id: 2,
    address: "22 Indian Chase Dr",
    location: "Greenwich, CT 06831",
    managers: [
      { id: 1, name: "Jerry Sanchez", initials: "JS", color: "bg-blue-500" },
      { id: 3, name: "Jane Smith", initials: "JMS", color: "bg-green-500" },
    ],
    type: "Rental",
    buildingId: "624090",
    status: "active",
    units: 1,
    rentalOwner: "Eunice Bae",
  },
  "3": {
    id: 3,
    address: "22 Indian Chase Dr",
    location: "Greenwich, CT 06831",
    managers: [
      { id: 1, name: "Jerry Sanchez", initials: "JS", color: "bg-blue-500" },
      { id: 4, name: "Mike Johnson", initials: "MJ", color: "bg-orange-500" },
    ],
    type: "Commercial",
    buildingId: "624090",
    status: "active",
    units: 1,
    rentalOwner: "Eunice Bae",
  },
  "4": {
    id: 4,
    address: "22 Indian Chase Dr",
    location: "Greenwich, CT 06831",
    managers: [
      { id: 2, name: "John Doe", initials: "JD", color: "bg-purple-500" },
    ],
    type: "OR",
    buildingId: "624090",
    status: "active",
    units: 1,
    rentalOwner: "Eunice Bae",
  },
  "5": {
    id: 5,
    address: "22 Indian Chase Dr",
    location: "Greenwich, CT 06831",
    managers: [
      { id: 3, name: "Jane Smith", initials: "JMS", color: "bg-green-500" },
      { id: 4, name: "Mike Johnson", initials: "MJ", color: "bg-orange-500" },
    ],
    type: "HOA",
    buildingId: "624090",
    status: "active",
    units: 1,
    rentalOwner: "Eunice Bae",
  },
  "6": {
    id: 6,
    address: "22 Indian Chase Dr",
    location: "Greenwich, CT 06831",
    managers: [
      { id: 1, name: "Jerry Sanchez", initials: "JS", color: "bg-blue-500" },
    ],
    type: "Concierge",
    buildingId: "624090",
    status: "active",
    units: 1,
    rentalOwner: "Eunice Bae",
  },
  "7": {
    id: 7,
    address: "22 Indian Chase Dr",
    location: "Greenwich, CT 06831",
    managers: [
      { id: 2, name: "John Doe", initials: "JD", color: "bg-purple-500" },
      { id: 3, name: "Jane Smith", initials: "JMS", color: "bg-green-500" },
    ],
    type: "Concierge",
    buildingId: "624090",
    status: "active",
    units: 1,
    rentalOwner: "Eunice Bae",
  },
  "8": {
    id: 8,
    address: "22 Indian Chase Dr",
    location: "Greenwich, CT 06831",
    managers: [
      { id: 4, name: "Mike Johnson", initials: "MJ", color: "bg-orange-500" },
    ],
    type: "Concierge",
    buildingId: "624090",
    status: "active",
    units: 1,
    rentalOwner: "Eunice Bae",
  },
  "9": {
    id: 9,
    address: "22 Indian Chase Dr",
    location: "Greenwich, CT 06831",
    managers: [
      { id: 1, name: "Jerry Sanchez", initials: "JS", color: "bg-blue-500" },
      { id: 4, name: "Mike Johnson", initials: "MJ", color: "bg-orange-500" },
    ],
    type: "Concierge",
    buildingId: "624090",
    status: "active",
    units: 1,
    rentalOwner: "Eunice Bae",
  },
  "10": {
    id: 10,
    address: "22 Indian Chase Dr",
    location: "Greenwich, CT 06831",
    managers: [
      { id: 3, name: "Jane Smith", initials: "JMS", color: "bg-green-500" },
    ],
    type: "Concierge",
    buildingId: "624090",
    status: "active",
    units: 1,
    rentalOwner: "Eunice Bae",
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
            propertyLocation={property.location}
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
            propertyLocation={property.location}
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
      property={property}
      propertyAddress={property.address}
      propertyType={property.type}
      propertyUnits={property.units}
      activeTab={tab || "Overview"}
    >
      {renderPageContent()}
    </PropertiesTemplate>
  );
}
