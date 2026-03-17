import React, { useState, memo, useCallback } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import AddPropertyModal from "@/components/AddPropertyModal";
import PageHeader from "@/components/PageHeader";
import PageTemplate from "@/layout/PageTemplate";

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

// Same shape as AddPropertyModal's editData (PropertyEditData)
export interface PropertyEditData {
  id: number;
  name: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postal_code: string;
  property_type: string;
  buildium_property_id: string;
  active: boolean;
  management_fee_cents: number | null;
  hourly_rate_cents: number | null;
  emergency_hourly_rate_cents: number | null;
  manager_ids: number[];
  manager_names: string[];
  rental_owners?: string[];
}

interface PropertiesTemplateProps {
  children: React.ReactNode;
  activeTab?: string;
  propertyAddress?: string;
  propertyType?: string;
  propertyUnits?: number;
  propertyLocationsCount?: number;
  property?: Property;
  onDeactivate?: () => void;
  /** When provided, Edit Property opens the modal pre-filled with this data (e.g. from property detail page). */
  propertyEditData?: PropertyEditData;
}

/** Memoized header + tabs so the top section doesn’t re-render when only tab content changes. */
const PropertyPageHeader = memo(function PropertyPageHeader({
  propertyAddress,
  propertyType,
  propertyUnits,
  propertyLocationsCount = 0,
  propertyId,
  currentActiveTab,
  onDeactivate,
  onEditClick,
  onViewOnMap,
  property,
  isConcierge,
}: {
  propertyAddress: string;
  propertyType: string;
  propertyUnits: number;
  propertyLocationsCount?: number;
  propertyId: string | undefined;
  currentActiveTab: string;
  onDeactivate?: () => void;
  onEditClick: () => void;
  onViewOnMap: () => void;
  property?: Property;
  isConcierge: boolean;
}) {
  const navigate = useNavigate();
  const tabs = [
    "Overview",
    ...(isConcierge ? [] : ["Units"]),
    ...(propertyLocationsCount > 0 ? ["Locations"] : []),
    "Utilities",
    "Maintenance",
    "Inspections",
    "Vendors",
    "Bills",
    "Insurance",
    "Notes",
    ...(isConcierge ? ["Invoicing"] : []),
  ];

  const handleTabClick = (tab: string) => {
    if (propertyId) {
      navigate(`/property/${propertyId}/${tab}`);
    }
  };

  return (
    <>
      <PageHeader
        title={propertyAddress}
        subtitle={
          <div className="flex items-center gap-3">
            <span className="text-[#717179] font-medium text-base leading-4">
              {propertyType}
            </span>
            {!isConcierge && (
              <>
                <svg width="4" height="4" viewBox="0 0 4 4" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="2" cy="2" r="2" fill="#717179" />
                </svg>
                <span className="text-[#717179] font-medium text-base leading-4">
                  {propertyUnits} Unit{propertyUnits !== 1 ? "s" : ""}
                </span>
              </>
            )}
            <svg width="4" height="4" viewBox="0 0 4 4" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="2" cy="2" r="2" fill="#717179" />
            </svg>
            <button
              onClick={onViewOnMap}
              className="text-[#1357D5] font-medium text-base leading-[140%] hover:underline bg-none border-none cursor-pointer p-0"
            >
              View on Map
            </button>
          </div>
        }
        action={{ label: "Edit Property", onClick: onEditClick }}
        secondaryAction={
          onDeactivate ? { label: "Deactivate", onClick: onDeactivate } : undefined
        }
      />
      <div className="flex items-start gap-6 min-h-[36px] w-full border-b border-[#e5e5e5] font-['Geist',sans-serif] text-base text-[#717179] font-medium flex-nowrap overflow-x-auto shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabClick(tab)}
            className={`flex items-center gap-1.5 py-2 whitespace-nowrap ${
              currentActiveTab === tab
                ? "border-b-2 border-[#09090b] text-[#09090b]"
                : "hover:text-[#09090b]"
            } transition-colors`}
          >
            {tab}
          </button>
        ))}
      </div>
    </>
  );
});

export const PropertiesTemplate: React.FC<PropertiesTemplateProps> = ({
  children,
  activeTab = "Utilities",
  propertyAddress = "3 Hekma Road, Greenwich, CT 06831",
  propertyType = "Single-Family",
  propertyUnits = 1,
  propertyLocationsCount = 0,
  property,
  onDeactivate,
  propertyEditData,
}) => {
  const location = useLocation();
  const params = useParams<{ propertyId: string; tab?: string; "*"?: string }>();
  const propertyId = params.propertyId;
  // Tab may come from :tab (legacy) or from splat * when route is /property/:propertyId/*
  const tabFromUrl = params.tab ?? params["*"];
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Determine the actual active tab by extracting from URL
  const determineActiveTab = () => {
    if (tabFromUrl) {
      return tabFromUrl;
    }

    // Otherwise extract from the pathname (e.g. /property/445/Inspections)
    const pathParts = location.pathname.split("/");
    if (pathParts.length >= 4 && pathParts[1] === "property") {
      const tabName = pathParts[3];
      if (tabName) {
        return tabName;
      }
    }

    return activeTab;
  };

  const currentActiveTab = determineActiveTab();
  const isConcierge = propertyType?.toLowerCase() === "concierge";

  const handleViewOnMap = useCallback(() => {
    const location = property?.location || "Greenwich, CT 06831";
    const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(`${propertyAddress}, ${location}`)}`;
    window.open(mapsUrl, "_blank");
  }, [property?.location, propertyAddress]);

  const handleEditClick = useCallback(() => setIsEditModalOpen(true), []);

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-white">
      <PageTemplate>
        <div className="flex flex-col flex-1 min-h-0 w-fit min-w-full">
          {/* Stable top section: header + tabs (memoized, only updates when tab/address etc. change) */}
          <div className="shrink-0 flex flex-col gap-6" style={{ contain: "layout" }}>
            <PropertyPageHeader
              propertyAddress={propertyAddress}
              propertyType={propertyType}
              propertyUnits={propertyUnits}
              propertyLocationsCount={propertyLocationsCount}
              propertyId={propertyId}
              currentActiveTab={currentActiveTab}
              onDeactivate={onDeactivate}
              onEditClick={handleEditClick}
              onViewOnMap={handleViewOnMap}
              property={property}
              isConcierge={isConcierge}
            />
          </div>

          {/* Warning banner when Buildium ID is missing */}
          {property && !property.buildingId && (
            <div className="mx-6 mt-4 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              No Buildium property ID found for this property. Please contact an administrator to resolve this.
            </div>
          )}

          {/* Only this content area updates when switching tabs; scrolls independently */}
          <div className="flex-1 min-h-0 overflow-auto pt-6">
            {children}
          </div>
        </div>
      </PageTemplate>

      {/* Edit Property Modal – shown when Edit is clicked; prefilled when propertyEditData is passed (e.g. from property detail). */}
      {(propertyEditData != null || property != null) && (
        <AddPropertyModal
          open={isEditModalOpen}
          onOpenChange={(open) => {
            setIsEditModalOpen(open);
          }}
          editData={
            propertyEditData ??
            (property
              ? {
                  id: property.id,
                  name: property.address,
                  address_line1: property.address,
                  address_line2: "",
                  city: property.location?.split(",")[0]?.trim() ?? "",
                  state: property.location?.split(",")[1]?.trim() ?? "",
                  postal_code: "",
                  property_type: (property.type ?? "").toLowerCase(),
                  buildium_property_id: property.buildingId ?? "",
                  active: property.status === "active",
                  management_fee_cents: null,
                  hourly_rate_cents: null,
                  emergency_hourly_rate_cents: null,
                  manager_ids: property.managers?.map((m) => m.id) ?? [],
                  manager_names: property.managers?.map((m) => m.name) ?? [],
                  rental_owners: property.rentalOwner ? [property.rentalOwner] : [],
                }
              : undefined)
          }
        />
      )}
    </div>
  );
};
