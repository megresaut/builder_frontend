import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SectionCard from "@/components/SectionCard";

const PLACEHOLDER_IMAGE =
  "https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/067809472377195b06444da037ab0e0c9542bf94?placeholderIfAbsent=true";

interface TaskLocationCardProps {
  propertyImage?: string;
  propertyName?: string;
  propertyAddress?: string;
  mapImage?: string;
  propertyId?: string;
  variant?: "default" | "gray";
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
  propertyId,
  variant = "default",
}) => {
  const navigate = useNavigate();
  const [imageLoadFailed, setImageLoadFailed] = useState(false);
  const displayImage =
    propertyImage && !imageLoadFailed ? propertyImage : PLACEHOLDER_IMAGE;

  useEffect(() => {
    setImageLoadFailed(false);
  }, [propertyImage]);

  const handlePropertyNameClick = () => {
    if (propertyId) {
      navigate(`/property/${propertyId}`);
    }
  };

  return (
    <SectionCard variant={variant} title="Location">
      <div className="flex flex-col w-full text-sm">
        {/* Property Image */}
        {displayImage && (
          <img
            src={displayImage}
            alt="Property"
            onError={() => setImageLoadFailed(true)}
            className="w-full aspect-[1.8] rounded-lg object-cover"
          />
        )}

        {/* Property Info */}
        {(propertyName || propertyAddress) && (
          <div className="mt-4 w-full">
            {propertyName && (
              <div className="text-sm font-['Inter',sans-serif] font-medium">
                <button
                  onClick={handlePropertyNameClick}
                  disabled={!propertyId}
                  className={`font-['Geist',sans-serif] font-bold ${
                    propertyId
                      ? "text-[#2463eb] cursor-pointer hover:underline transition-colors"
                      : "text-[#2463eb]"
                  }`}
                >
                  {propertyName}
                </button>
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
          <button
            onClick={() => {
              if (propertyAddress) {
                const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(propertyAddress)}`;
                window.open(mapsUrl, "_blank");
              }
            }}
            className={`mt-6 w-full rounded-lg overflow-hidden transition-transform hover:scale-105 ${
              propertyAddress ? "cursor-pointer" : "cursor-default"
            }`}
            disabled={!propertyAddress}
            title={propertyAddress ? "Click to view on Google Maps" : ""}
          >
            <img
              src={mapImage}
              alt="Map"
              className="w-full aspect-[2.33] object-cover"
            />
          </button>
        )}
      </div>
    </SectionCard>
  );
};

export default TaskLocationCard;
