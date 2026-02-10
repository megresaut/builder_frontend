import { useParams, useNavigate } from "react-router-dom";
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

// API response from GET /properties/{id} – may include extra fields
type BackendProperty = {
  id: number;
  name: string;
  buildium_property_id: string;
  property_type: string;
  address_line1: string;
  address_line2?: string | null;
  city: string;
  state: string;
  postal_code: string;
  active: boolean;
  created_at: string;
  manager_ids?: number[];
  manager_names?: string[];
  management_fee_cents?: number | null;
  hourly_rate_cents?: number | null;
  emergency_hourly_rate_cents?: number | null;
  /** JSON array of { name: string } or raw from backend */
  owners?: unknown;
};

/** Parse backend `owners` into array of owner names for the edit modal. */
function parseOwnerNames(owners: unknown): string[] {
  if (!owners) return [];
  if (Array.isArray(owners)) {
    return owners
      .map((o: any) => (o && typeof o.name === "string" ? o.name : String(o ?? "")))
      .filter(Boolean);
  }
  if (typeof owners === "string") {
    try {
      const parsed = JSON.parse(owners);
      return Array.isArray(parsed)
        ? parsed.map((o: any) => (o && o.name) || "").filter(Boolean)
        : [];
    } catch {
      return [];
    }
  }
  return [];
}

// Same shape as AllProperties passes to AddPropertyModal for edit
function toEditPayload(full: BackendProperty) {
  return {
    id: full.id,
    name: full.name,
    address_line1: full.address_line1,
    address_line2: full.address_line2 ?? "",
    city: full.city,
    state: full.state,
    postal_code: full.postal_code,
    property_type: (full.property_type ?? "").toLowerCase(),
    buildium_property_id: full.buildium_property_id,
    active: full.active,
    manager_ids: full.manager_ids ?? [],
    manager_names: full.manager_names ?? [],
    hourly_rate_cents: full.hourly_rate_cents ?? null,
    emergency_hourly_rate_cents: full.emergency_hourly_rate_cents ?? null,
    management_fee_cents: full.management_fee_cents ?? null,
    rental_owners: parseOwnerNames(full.owners),
  };
}

export default function PropertyDetail() {
  const { propertyId, tab } = useParams<{ propertyId: string; tab?: string }>();
  const navigate = useNavigate();

  const [property, setProperty] = useState<BackendProperty | null>(null);
  const [loading, setLoading] = useState(true);

  const handleDeactivate = async () => {
    if (!propertyId || !confirm("Are you sure you want to deactivate this property?")) return;
    try {
      await fetchJSON(`/properties/${propertyId}`, { method: "DELETE" });
      navigate("/");
    } catch (err: unknown) {
      alert("Failed to deactivate: " + (err instanceof Error ? err.message : String(err)));
    }
  };

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
    // Concierge properties don't have Units; show Overview if someone deep-links to Units
    const effectiveTab =
      currentTab === "Units" && propertyType === "Concierge" ? "Overview" : currentTab;

    switch (effectiveTab) {
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

  const propertyEditData = toEditPayload(property);

  return (
    <PropertiesTemplate
      propertyAddress={propertyDisplayTitle}
      propertyType={propertyType}
      propertyUnits={propertyUnits}
      activeTab={tab || "Overview"}
      onDeactivate={handleDeactivate}
      propertyEditData={propertyEditData}
    >
      {renderPageContent()}
    </PropertiesTemplate>
  );
}