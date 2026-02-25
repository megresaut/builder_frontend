import React from "react";
import { LocationsList } from "./LocationsList";

interface LocationsProps {
  propertyAddress: string;
  propertyType: string;
  propertyId: number;
}

export const Locations: React.FC<LocationsProps> = ({
  propertyAddress,
  propertyType,
  propertyId,
}) => {
  return (
    <LocationsList
      propertyAddress={propertyAddress}
      propertyType={propertyType}
      propertyId={propertyId}
    />
  );
};
