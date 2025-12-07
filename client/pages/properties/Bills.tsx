import React from "react";

interface BillsProps {
  propertyAddress: string;
  propertyType: string;
  propertyUnits: number;
}

export const Bills: React.FC<BillsProps> = ({
  propertyAddress,
  propertyType,
  propertyUnits,
}) => {
  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Bills</h2>
        <p className="text-gray-600 text-base">
          View and manage utility bills for {propertyAddress}
        </p>
      </div>
    </div>
  );
};
