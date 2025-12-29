import { useNavigate } from "react-router-dom";
import BlueButton from "@/components/BlueButton";
import { ApproveIcon, CalendarIcon, BuildingIcon } from "@/components/icons";

interface FtoOrderCardProps {
  id: number;
  name: string;
  dueDate: string;
  description: string;
  property: string;
  unit: string;
  priority: "low" | "normal" | "high";
  createdBy: string;
}

export default function FtoOrderCard({
  id,
  name,
  dueDate,
  description,
  property,
  unit,
  priority,
  createdBy,
}: FtoOrderCardProps) {
  const navigate = useNavigate();

  const getPriorityColor = (priorityLevel: string) => {
    switch (priorityLevel) {
      case "high":
        return "#D97706";
      case "low":
        return "#059669";
      case "normal":
        return "#2463EB";
      default:
        return "#6B7280";
    }
  };

  const handleCardClick = () => {
    navigate(`/fto/submission/${id}`, {
      state: {
        property,
        unit,
        description,
      },
    });
  };

  const handleSubmitClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/fto/submission/${id}`, {
      state: {
        property,
        unit,
        description,
      },
    });
  };

  return (
    <div
      onClick={handleCardClick}
      className="w-full bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm text-gray-900 truncate">{name}</h3>
          <p className="text-xs text-gray-600 truncate mt-0.5">{description}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: getPriorityColor(priority) }}
          />
          <span className="text-xs font-medium text-gray-600 capitalize">
            {priority}
          </span>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <BuildingIcon width={14} height={14} />
          <span className="truncate">{property}</span>
          {unit && unit !== "N/A" && (
            <>
              <span>•</span>
              <span className="truncate">{unit}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <CalendarIcon width={14} height={14} />
          <span>{dueDate}</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <span className="text-xs text-gray-500">By {createdBy}</span>
        <BlueButton
          icon={<ApproveIcon width={14} height={14} className="brightness-0 invert" />}
          onClick={handleSubmitClick}
          className="h-7 px-2 text-xs"
        >
          Submit
        </BlueButton>
      </div>
    </div>
  );
}
