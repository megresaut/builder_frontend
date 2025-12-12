import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AddPropertyModal from "@/components/AddPropertyModal";

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
  const { propertyId } = useParams<{ propertyId: string }>();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

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

  return (
    <div className="flex-1 overflow-auto bg-white">
      <div
        className="bg-white"
        style={{
          borderLeftWidth: "1px",
          borderLeftColor: "rgb(210, 209, 207)",
          padding: "32px 32px 150px",
        }}
      >
        <div className="max-w-full flex flex-col gap-6">
          {/* Property Header */}
          <div className="flex justify-between items-center w-full">
            <div className="flex flex-col items-start gap-1">
              <h1 className="text-[#303030] font-semibold text-2xl leading-[30px]">
                {propertyAddress}
              </h1>
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
                <a
                  href="#"
                  className="text-[#1357D5] font-medium text-base leading-[140%] hover:underline"
                >
                  View on Map
                </a>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="flex h-10 items-center gap-2 px-4 rounded-lg border border-white bg-[#013764] hover:bg-[#003a73] transition-colors"
                style={{
                  boxShadow:
                    "0 0 0 1px #002D5A, 0 0 10px -5px rgba(0, 0, 0, 0.20)",
                }}
              >
                <span className="text-white font-medium text-base leading-normal">
                  Edit Property
                </span>
              </button>
              <button
                className="flex w-10 h-10 justify-center items-center gap-2.5 rounded-lg border border-[#DADADA] bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] hover:bg-gray-50 transition-colors"
                style={{ borderWidth: "0.5px" }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M9.99984 10.8335C10.4601 10.8335 10.8332 10.4604 10.8332 10.0002C10.8332 9.53993 10.4601 9.16683 9.99984 9.16683C9.5396 9.16683 9.1665 9.53993 9.1665 10.0002C9.1665 10.4604 9.5396 10.8335 9.99984 10.8335Z"
                    stroke="#303030"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M9.99984 5.00016C10.4601 5.00016 10.8332 4.62707 10.8332 4.16683C10.8332 3.70659 10.4601 3.3335 9.99984 3.3335C9.5396 3.3335 9.1665 3.70659 9.1665 4.16683C9.1665 4.62707 9.5396 5.00016 9.99984 5.00016Z"
                    stroke="#303030"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M9.99984 16.6668C10.4601 16.6668 10.8332 16.2937 10.8332 15.8335C10.8332 15.3733 10.4601 15.0002 9.99984 15.0002C9.5396 15.0002 9.1665 15.3733 9.1665 15.8335C9.1665 16.2937 9.5396 16.6668 9.99984 16.6668Z"
                    stroke="#303030"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex h-9 items-start gap-6 self-stretch border-b border-[#E5E5E5]">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabClick(tab)}
                className={`flex items-center gap-1.5 pb-2 border-b-[1.5px] transition-colors ${
                  activeTab === tab
                    ? "border-b-[#09090B]"
                    : "border-b-transparent"
                }`}
              >
                <span
                  className={`font-medium text-base leading-5 transition-colors ${
                    activeTab === tab
                      ? "text-[#09090B]"
                      : "text-[#717179] hover:text-[#303030]"
                  }`}
                >
                  {tab}
                </span>
              </button>
            ))}
          </div>

          {/* Page Content */}
          {children}
        </div>
      </div>

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
          }}
        />
      )}
    </div>
  );
};
