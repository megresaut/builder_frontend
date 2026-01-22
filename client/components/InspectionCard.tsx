import { useNavigate } from "react-router-dom";
import BlueButton from "@/components/BlueButton";
import { CalendarIcon, BuildingIcon, EyeIcon, EditIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

interface InspectionCardProps {
  id: number;
  property: string;
  unit: string;
  date: string;
  month?: string;
  inspector: string;
  status: "Completed" | "Draft";
  onAction: (row: { id: number; property: string; unit: string; date: string; month?: string; inspector: string; status: "Completed" | "Draft" }) => void;
}

export default function InspectionCard({
  id,
  property,
  unit,
  date,
  month,
  inspector,
  status,
  onAction,
}: InspectionCardProps) {
  const navigate = useNavigate();

  const row = { id, property, unit, date, month, inspector, status };

  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAction(row);
  };

  const handleCardClick = () => {
    navigate(`/fto/inspections/${id}`);
  };

  const statusColor = status === "Completed" ? "#059669" : "#6b7280";
  const actionLabel = status === "Completed" ? "View Inspection" : "Upload Inspection";

  return (
    <div
      onClick={handleCardClick}
      className="w-full bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
    >
      {/* Header: Property & Status */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm text-gray-900 truncate">{property}</h3>
          <p className="text-xs text-gray-600 truncate mt-0.5">{unit}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: statusColor }}
          />
          <span className="text-xs font-medium text-gray-600 capitalize">
            {status}
          </span>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <CalendarIcon width={14} height={14} />
          <span>{date}</span>
          {month && (
            <>
              <span>•</span>
              <span>{month}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <BuildingIcon width={14} height={14} />
          <span className="truncate">Inspector: {inspector}</span>
        </div>
      </div>

      {/* Action Button */}
      <div className="pt-3 border-t border-gray-100">
        <BlueButton
          icon={<EditIcon width={16} height={16} className="brightness-0 invert" />}
          onClick={handleActionClick}
          className="h-10 px-4 text-sm w-full"
        >
          {actionLabel}
        </BlueButton>
      </div>
    </div>
  );
}
