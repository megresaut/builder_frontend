import React from "react";
import { UnitsList } from "./UnitsList";

interface UnitsProps {
  propertyAddress: string;
  propertyType: string;
  propertyUnits: number;
}

export const Units: React.FC<UnitsProps> = ({
  propertyAddress,
  propertyType,
  propertyUnits,
}) => {
  return (
    <UnitsList
      propertyAddress={propertyAddress}
      propertyType={propertyType}
      propertyUnits={propertyUnits}
    />
  );
};
