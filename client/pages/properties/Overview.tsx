import React from "react";
import PageHeader from "@/components/PageHeader";
import { PropertyDetails } from "@/components/PropertyDetails";

interface OverviewProps {
  propertyAddress: string;
  propertyType: string;
  propertyUnits: number;
  propertyLocation?: string;
}

export const Overview: React.FC<OverviewProps> = ({
  propertyAddress,
  propertyType,
  propertyUnits,
  propertyLocation,
}) => {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Property Overview"
        subtitle={`${propertyAddress} - ${propertyType} - ${propertyUnits} Units`}
        actionButton={{
          label: "View on Map",
          onClick: () => {
            // Placeholder for navigation to map view
          },
        }}
        moreOptions={{}}
      />
      <PropertyDetails
        propertyAddress={propertyAddress}
        propertyLocation={propertyLocation || ""}
        propertyType={propertyType}
        rentalOwner="Eunice Bae"
        propertyManager="Jake Delardi"
      />
    </div>
  );
};
