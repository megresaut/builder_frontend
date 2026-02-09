import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchJSON } from "@/api/fetchJSON";

import { PropertiesTemplate } from "@/layout/PropertiesTemplate";
import { Overview } from "./properties/Overview";
import { Units } from "./properties/Units";
import { Utilities } from "./properties/Utilities";
import { Maintenance } from "./properties/Maintenance";
import { Tasks } from "./properties/Tasks";
import Inspections from "./properties/Inspections";
import { Vendors } from "./properties/Vendors";
import { Bills } from "./properties/Bills";
import { Notes } from "./properties/Notes";
import { Invoicing } from "./properties/Invoicing";

type BackendProperty = {
  id: number;
  name: string;
  buildium_property_id: string;
  property_type: string; // R, C, HOA, OR, Comm
  address_line1: string;
  city: string;
  state: string;
  postal_code: string;
  active: boolean;
  created_at: string;
};

export default function PropertyDetail() {
  const { propertyId, tab } = useParams<{ propertyId: string; tab?: string }>();

  const [property, setProperty] = useState<BackendProperty | null>(null);
  const [loading, setLoading] = useState(true);

  // Map DB code → display type
  const formatType = (t: string) => {
    switch (t) {
      case "R":
        return "Rental";
      case "C":
        return "Concierge";
      case "HOA":
        return "HOA";
      case "OR":
        return "OR";
      case "Comm":
        return "Commercial";
      default:
        return t;
    }
  };

  useEffect(() => {
    async function load() {
      if (!propertyId) return;

      try {
        setLoading(true);
        const data = await fetchJSON(`/properties/${propertyId}`);
        setProperty(data);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [propertyId]);

  if (loading) {
    return (
      <PropertiesTemplate activeTab={tab || "Overview"}>
        <div className="p-10 text-gray-500">Loading...</div>
      </PropertiesTemplate>
    );
  }

  if (!property) {
    return (
      <PropertiesTemplate activeTab={tab || "Overview"}>
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-500 text-lg">Property not found</p>
        </div>
      </PropertiesTemplate>
    );
  }

  // Derived values for UI: for HOAs show name in top bar, otherwise address
  const propertyAddress = property.address_line1;
  const isHOA = property.property_type?.toLowerCase() === "hoa";
  const propertyDisplayTitle =
    isHOA && property.name ? property.name : property.address_line1;
  const propertyType = formatType(property.property_type);
  const propertyUnits = 1; // hardcoded for now

  const renderPageContent = () => {
    const currentTab = tab || "Overview";

    switch (currentTab) {
      case "Overview":
        return (
          <Overview
            propertyAddress={propertyAddress}
            propertyType={propertyType}
            propertyUnits={propertyUnits}
            propertyId={property.id}
          />
        );

      case "Units":
        return (
          <Units
            propertyAddress={propertyAddress}
            propertyType={propertyType}
            propertyUnits={propertyUnits}
          />
        );

      case "Utilities":
        return (
          <Utilities
            propertyAddress={propertyAddress}
            propertyType={propertyType}
            propertyUnits={propertyUnits}
          />
        );

      case "Maintenance":
        return (
          <Maintenance
            propertyAddress={propertyAddress}
            propertyType={propertyType}
            propertyUnits={propertyUnits}
            propertyId={property.id}
          />
        );

      case "Inspections":
        return (
          <Inspections
            propertyAddress={propertyAddress}
            propertyType={propertyType}
            propertyUnits={propertyUnits}
          />
        );

      case "Tasks":
        return (
          <Tasks
            propertyAddress={propertyAddress}
            propertyType={propertyType}
            propertyUnits={propertyUnits}
          />
        );

      case "Vendors":
        return (
          <Vendors
            propertyAddress={propertyAddress}
            propertyType={propertyType}
            propertyUnits={propertyUnits}
          />
        );

      case "Bills":
        return (
          <Bills
            propertyAddress={propertyAddress}
            propertyType={propertyType}
            propertyUnits={propertyUnits}
          />
        );

      case "Notes":
        return (
          <Notes
            propertyAddress={propertyAddress}
            propertyType={propertyType}
            propertyUnits={propertyUnits}
          />
        );

      case "Invoicing":
        return (
          <Invoicing
            propertyAddress={propertyAddress}
            propertyType={propertyType}
            propertyUnits={propertyUnits}
          />
        );

      default:
        return (
          <Overview
            propertyAddress={propertyAddress}
            propertyType={propertyType}
            propertyUnits={propertyUnits}
            propertyId={property.id}
          />
        );
    }
  };

  return (
    <PropertiesTemplate
      propertyAddress={propertyDisplayTitle}
      propertyType={propertyType}
      propertyUnits={propertyUnits}
      activeTab={tab || "Overview"}
    >
      {renderPageContent()}
    </PropertiesTemplate>
  );
}