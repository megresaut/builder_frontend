import React from "react";
import { PropertyDetails } from "@/components/PropertyDetails";

interface OverviewProps {
  propertyAddress: string;
  propertyType: string;
  propertyUnits: number;
}

export const Overview: React.FC<OverviewProps> = ({
  propertyAddress,
  propertyType,
  propertyUnits,
}) => {
  return (
    <div className="flex flex-col gap-6">
      <PropertyDetails
        propertyAddress={propertyAddress}
        propertyLocation="Westport, CT, 28282"
        rentalOwner="Eunice Bae"
        propertyManager="Jake Delardi"
      />
    </div>
  );
};
