import React from "react";
import { PropertyDetails } from "@/components/PropertyDetails";

interface OverviewProps {
  propertyAddress: string;
  propertyType: string;
  propertyUnits: number;
  propertyLocation?: string;
  propertyId: number;
}

export const Overview: React.FC<OverviewProps> = ({
  propertyAddress,
  propertyType,
  propertyUnits,
  propertyLocation,
  propertyId,
}) => {
  return (
    <div className="flex flex-col gap-6">
      <PropertyDetails
        propertyAddress={propertyAddress}
        propertyLocation={propertyLocation || ""}
        propertyType={propertyType}
        rentalOwner="Eunice Bae"
        propertyManager="Jake Delardi"
        propertyId={propertyId}
      />
    </div>
  );
};
