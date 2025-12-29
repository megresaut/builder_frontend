import { useNavigate } from "react-router-dom";
import { CalendarIcon, BuildingIcon, UserIcon, DocumentIcon } from "@/components/icons";

interface SubmissionHistoryCardProps {
  id: number;
  name: string;
  dateOfWork: string;
  property: string;
  unit: string;
  createdBy: string;
  status: "pending" | "approved" | "rejected";
}

export default function SubmissionHistoryCard({
  id,
  name,
  dateOfWork,
  property,
  unit,
  createdBy,
  status,
}: SubmissionHistoryCardProps) {
  const navigate = useNavigate();

  const getStatusColor = (statusValue: string) => {
    switch (statusValue) {
      case "approved":
        return "#059669";
      case "rejected":
        return "#DC2626";
      case "pending":
        return "#2463EB";
      default:
        return "#6B7280";
    }
  };

  const handleCardClick = () => {
    navigate(`/fto/submission/${id}`, {
      state: {
        isApproved: status === "approved",
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
          <p className="text-xs text-gray-600 truncate mt-0.5">{dateOfWork}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: getStatusColor(status) }}
          />
          <span className="text-xs font-medium text-gray-600 capitalize">
            {status}
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
          <UserIcon width={14} height={14} />
          <span className="truncate">{createdBy}</span>
        </div>
      </div>

      <div className="pt-3 border-t border-gray-100">
        <button
          onClick={handleCardClick}
          className="w-full text-xs font-medium text-blue-600 hover:text-blue-700 py-2"
        >
          View Details →
        </button>
      </div>
    </div>
  );
}
