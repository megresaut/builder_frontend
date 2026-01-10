import React from "react";
import SectionCard from "@/components/SectionCard";

interface TaskLocationCardProps {
  propertyImage?: string;
  propertyName?: string;
  propertyAddress?: string;
  mapImage?: string;
}

/**
 * TaskLocationCard
 *
 * Displays location information with property image and map.
 * Composed using SectionCard.
 */
export const TaskLocationCard: React.FC<TaskLocationCardProps> = ({
  propertyImage,
  propertyName,
  propertyAddress,
  mapImage,
}) => {
  return (
    <SectionCard title="Location">
      <div className="flex flex-col w-full text-sm">
        {/* Property Image */}
        {propertyImage && (
          <img
            src={propertyImage}
            alt="Property"
            className="w-full aspect-[1.8] rounded-lg object-cover"
          />
        )}

        {/* Property Info */}
        {(propertyName || propertyAddress) && (
          <div className="mt-4 w-full">
            {propertyName && (
              <div className="text-sm font-['Inter',sans-serif] font-medium">
                <span className="font-['Geist',sans-serif] font-bold text-[#2463eb]">
                  {propertyName}
                </span>
              </div>
            )}
            {propertyAddress && (
              <div className="mt-2 text-sm text-[#717179] font-['Geist',sans-serif]">
                {propertyAddress}
              </div>
            )}
          </div>
        )}

        {/* Map Image */}
        {mapImage && (
          <img
            src={mapImage}
            alt="Map"
            className="mt-6 w-full aspect-[2.33] rounded-lg object-cover"
          />
        )}
      </div>
    </SectionCard>
  );
};

export default TaskLocationCard;
