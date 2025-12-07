import React from "react";

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
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Overview
        </h2>
        <p className="text-gray-600 text-base">
          Property overview for {propertyAddress}
        </p>
      </div>
    </div>
  );
};
