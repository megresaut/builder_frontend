import { useParams, useNavigate, Outlet, useOutletContext } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchJSON } from "@/api/fetchJSON";
import { usePropertyBreadcrumb } from "@/hooks/PropertyBreadcrumbContext";

import { PropertiesTemplate } from "@/layout/PropertiesTemplate";
import { Overview } from "./properties/Overview";
import { Units } from "./properties/Units";
import { Locations } from "./properties/Locations";
import { Utilities } from "./properties/Utilities";
import { Maintenance } from "./properties/Maintenance";
import { Tasks } from "./properties/Tasks";
import Inspections from "./properties/Inspections";
import { Vendors } from "./properties/Vendors";
import { Bills } from "./properties/Bills";
import { Notes } from "./properties/Notes";
import { Invoicing } from "./properties/Invoicing";
import { Insurance } from "./properties/Insurance";
import { PropertyAccounting } from "./properties/PropertyAccounting";

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
  /** Number of units for this property (from backend COUNT) */
  units_count?: number;
  /** Number of locations for this property (from backend COUNT) */
  locations_count?: number;
};

/** Context passed from PropertyLayout to tab content via Outlet */
export type PropertyOutletContext = {
  property: BackendProperty;
  propertyAddress: string;
  propertyType: string;
  propertyUnits: number;
  propertyDisplayTitle: string;
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

// Map DB code → display type
function formatType(t: string) {
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
}

/**
 * Renders the tab content only. Used as the child route under PropertyLayout.
 * Header never re-renders when switching tabs; only this content swaps.
 */
export function PropertyTabContent() {
  const { property, propertyAddress, propertyType, propertyUnits } =
    useOutletContext<PropertyOutletContext>();
  const { tab } = useParams<{ tab: string }>();
  const currentTab = tab || "Overview";
  const effectiveTab =
    currentTab === "Units" && propertyType === "Concierge"
      ? "Overview"
      : currentTab === "Invoicing" && propertyType !== "Concierge"
        ? "Overview"
        : currentTab;

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
    case "Locations":
      return (
        <Locations
          propertyAddress={propertyAddress}
          propertyType={propertyType}
          propertyId={property.id}
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
    case "Insurance":
      return (
        <Insurance
          propertyAddress={propertyAddress}
          propertyType={propertyType}
          propertyUnits={propertyUnits}
          propertyId={property.id}
        />
      );
    case "Accounting":
      return (
        <PropertyAccounting
          propertyAddress={propertyAddress}
          propertyType={propertyType}
          propertyUnits={propertyUnits}
          propertyId={property.id}
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
}

// Cache property by id so that if the layout remounts on tab change we show real header immediately
const propertyCache = new Map<string, BackendProperty>();

/**
 * Layout that loads property once and renders header + Outlet.
 * Uses a cache so that even if the layout remounts on tab change, we never flash the loading header.
 */
export default function PropertyLayout() {
  const { propertyId, tab } = useParams<{ propertyId: string; tab?: string }>();
  const navigate = useNavigate();
  const { setPropertyDisplayName } = usePropertyBreadcrumb();
  // Initialize from cache when available so we never show loading header on remount (e.g. tab switch)
  const [property, setProperty] = useState<BackendProperty | null>(() =>
    propertyId ? propertyCache.get(propertyId) ?? null : null
  );
  const [loading, setLoading] = useState(() => !(propertyId && propertyCache.has(propertyId)));

  const handleDeactivate = async () => {
    if (!propertyId || !confirm("Are you sure you want to deactivate this property?")) return;
    try {
      await fetchJSON(`/properties/${propertyId}`, { method: "DELETE" });
      propertyCache.delete(propertyId);
      navigate("/all-properties");
    } catch (err: unknown) {
      alert("Failed to deactivate: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  useEffect(() => {
    if (!propertyId) return;
    const cached = propertyCache.get(propertyId);
    if (cached) {
      setProperty(cached);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchJSON(`/properties/${propertyId}`)
      .then((data) => {
        if (!cancelled) {
          propertyCache.set(propertyId, data);
          setProperty(data);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [propertyId]);

  // Sync property display name to top nav breadcrumb (Properties > property name > tab)
  useEffect(() => {
    if (property) {
      const isHOA = property.property_type?.toLowerCase() === "hoa";
      const title = isHOA && property.name ? property.name : property.address_line1;
      setPropertyDisplayName(title);
    } else {
      setPropertyDisplayName(null);
    }
    return () => setPropertyDisplayName(null);
  }, [property, setPropertyDisplayName]);

  const currentTab = tab || "Overview";

  // First load only: show same shell with loading in header and content so layout doesn’t jump
  if (loading && !property) {
    return (
      <PropertiesTemplate
        activeTab={currentTab}
        propertyAddress="Loading..."
        propertyType=""
        propertyUnits={0}
      >
        <div className="p-10 text-gray-500">Loading...</div>
      </PropertiesTemplate>
    );
  }

  if (!property) {
    return (
      <PropertiesTemplate
        activeTab={currentTab}
        propertyAddress="Property not found"
        propertyType=""
        propertyUnits={0}
      >
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-500 text-lg">Property not found</p>
        </div>
      </PropertiesTemplate>
    );
  }

  const propertyAddress = property.address_line1;
  const isHOA = property.property_type?.toLowerCase() === "hoa";
  const propertyDisplayTitle =
    isHOA && property.name ? property.name : property.address_line1;
  const propertyType = formatType(property.property_type);
  const propertyUnits = Math.max(0, Number(property.units_count) || 0);
  const propertyLocationsCount = Math.max(0, Number(property.locations_count) ?? 0);

  const outletContext: PropertyOutletContext = {
    property,
    propertyAddress,
    propertyType,
    propertyUnits,
    propertyDisplayTitle,
  };

  return (
    <PropertiesTemplate
      propertyAddress={propertyDisplayTitle}
      propertyType={propertyType}
      propertyUnits={propertyUnits}
      propertyLocationsCount={propertyLocationsCount}
      activeTab={currentTab}
      onDeactivate={handleDeactivate}
      propertyEditData={toEditPayload(property)}
    >
      <Outlet context={outletContext} />
    </PropertiesTemplate>
  );
}