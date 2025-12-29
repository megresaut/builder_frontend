import { useNavigate } from "react-router-dom";
import BlueButton from "@/components/BlueButton";
import { PropertyManagerAvatar } from "@/components/PropertyManagerAvatar";
import {
  CalendarIcon,
  BuildingIcon,
  UserIcon,
  EyeIcon,
} from "@/components/icons";

interface SubmissionHistoryCardProps {
  id: number;
  name: string;
  description: string;
  dateOfWork: string;
  property: string;
  unit: string;
  createdBy: string;
  status: "pending" | "approved" | "rejected";
  priority: "low" | "normal" | "high";
  onViewTask?: () => void;
}

export default function SubmissionHistoryCard({
  id,
  name,
  description,
  dateOfWork,
  property,
  unit,
  createdBy,
  status,
  priority,
  onViewTask,
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
    if (onViewTask) {
      onViewTask();
      return;
    }

    navigate(`/fto/submission/${id}`, {
      state: {
        isApproved: status === "approved",
      },
    });
  };

  const handleViewClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (onViewTask) {
      onViewTask();
    } else if (status === "pending" || status === "rejected") {
      navigate(`/fto/submission/${id}`, {
        state: {
          isApproved: false,
          canEdit: true,
          property,
          unit,
          task: name,
          description,
        },
      });
    } else {
      navigate(`/fto/submission/${id}`, {
        state: {
          isApproved: status === "approved",
        },
      });
    }
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

      <div className="flex items-center gap-1 mb-3">
        <div
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: getStatusColor(status) }}
        />
        <span className="text-xs font-medium text-gray-600 capitalize">
          {status}
        </span>
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
          <span>{dateOfWork}</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <PropertyManagerAvatar name={createdBy} isCreator={true} />
        <BlueButton
          icon={
            <EyeIcon width={14} height={14} className="brightness-0 invert" />
          }
          onClick={handleViewClick}
          className="h-7 px-2 text-xs"
        >
          {status === "pending" || status === "rejected"
            ? "Edit Submission"
            : "View Summary"}
        </BlueButton>
      </div>
    </div>
  );
}
