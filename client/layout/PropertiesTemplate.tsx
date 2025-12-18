import React, { useState } from "react";
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

interface PropertiesTemplateProps {
  children: React.ReactNode;
  activeTab?: string;
  propertyAddress?: string;
  propertyType?: string;
  propertyUnits?: number;
  property?: Property;
}

export const PropertiesTemplate: React.FC<PropertiesTemplateProps> = ({
  children,
  activeTab = "Utilities",
  propertyAddress = "3 Hekma Road, Greenwich, CT 06831",
  propertyType = "Single-Family",
  propertyUnits = 1,
  property,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { propertyId, tab } = useParams<{ propertyId: string; tab?: string }>();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Determine the actual active tab by extracting from URL path
  const determineActiveTab = () => {
    // First try to use the tab parameter from useParams
    if (tab) {
      return tab;
    }

    // Otherwise, extract from the pathname
    const pathParts = location.pathname.split("/");
    // URL format: /property/:propertyId/:tab
    if (pathParts.length >= 4 && pathParts[1] === "property") {
      const tabName = pathParts[3];
      if (tabName) {
        return tabName;
      }
    }

    // Fall back to the prop, then to default
    return activeTab;
  };

  const currentActiveTab = determineActiveTab();

  const tabs = [
    "Overview",
    "Units",
    "Utilities",
    "Maintenance",
    "Vendors",
    "Bills",
    "Notes",
    "Invoicing",
  ];

  const handleTabClick = (tab: string) => {
    if (propertyId) {
      navigate(`/property/${propertyId}/${tab}`);
    }
  };

  const handleViewOnMap = () => {
    const location = property?.location || "Greenwich, CT 06831";
    const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(`${propertyAddress}, ${location}`)}`;
    window.open(mapsUrl, "_blank");
  };

  return (
    <div className="flex-1 overflow-auto bg-white">
      <PageTemplate>
        <div className="flex flex-col gap-6 w-fit min-w-full">
          {/* Property Header */}
          <PageHeader
            title={propertyAddress}
            subtitle={
              <div className="flex items-center gap-3">
                <span className="text-[#717179] font-medium text-base leading-4">
                  {propertyType}
                </span>
                <svg
                  width="4"
                  height="4"
                  viewBox="0 0 4 4"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle cx="2" cy="2" r="2" fill="#717179" />
                </svg>
                <span className="text-[#717179] font-medium text-base leading-4">
                  {propertyUnits} Unit{propertyUnits !== 1 ? "s" : ""}
                </span>
                <svg
                  width="4"
                  height="4"
                  viewBox="0 0 4 4"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle cx="2" cy="2" r="2" fill="#717179" />
                </svg>
                <button
                  onClick={handleViewOnMap}
                  className="text-[#1357D5] font-medium text-base leading-[140%] hover:underline bg-none border-none cursor-pointer p-0"
                >
                  View on Map
                </button>
              </div>
            }
            actionButton={{
              label: "Edit Property",
              onClick: () => setIsEditModalOpen(true),
            }}
            moreOptions={{}}
          />

          {/* Tab Navigation */}
          <div className="flex items-start gap-6 min-h-[36px] w-full border-b border-[#e5e5e5] font-['Geist',sans-serif] text-base text-[#717179] font-medium flex-nowrap overflow-x-auto">
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

          {/* Page Content */}
          {children}
        </div>
      </PageTemplate>

      {/* Edit Property Modal */}
      {property && (
        <AddPropertyModal
          open={isEditModalOpen}
          onOpenChange={(open) => {
            setIsEditModalOpen(open);
          }}
          editData={{
            address: property.address,
            location: property.location,
            type: property.type,
            buildingId: property.buildingId,
            status: property.status,
            managers: property.managers,
            rentalOwner: property.rentalOwner,
          }}
        />
      )}
    </div>
  );
};
