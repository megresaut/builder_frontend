import { useState } from "react";
import { StarRatingInput } from "./StarRatingInput";

export interface WorkOrderEvaluationData {
  rating: number; // 1-5
  notes: string;
  submittedAt: string; // ISO string
}

interface WorkOrderEvaluationProps {
  vendorName: string;
  existingEvaluation?: WorkOrderEvaluationData;
  onSubmit: (data: WorkOrderEvaluationData) => void;
}

/**
 * Pure content component — no outer card wrapper.
 * Meant to be placed inside a SectionCard or similar shell.
 */
export function WorkOrderEvaluation({
  vendorName,
  existingEvaluation,
  onSubmit,
}: WorkOrderEvaluationProps) {
  const [isEditing, setIsEditing] = useState(!existingEvaluation);
  const [rating, setRating] = useState(existingEvaluation?.rating ?? 0);
  const [notes, setNotes] = useState(existingEvaluation?.notes ?? "");

  const handleSubmit = () => {
    if (rating === 0) return;
    onSubmit({
      rating,
      notes: notes.trim(),
      submittedAt: new Date().toISOString(),
    });
    setIsEditing(false);
  };

  const handleEdit = () => {
    setRating(existingEvaluation?.rating ?? 0);
    setNotes(existingEvaluation?.notes ?? "");
    setIsEditing(true);
  };

  const handleCancel = () => {
    setRating(existingEvaluation?.rating ?? 0);
    setNotes(existingEvaluation?.notes ?? "");
    setIsEditing(false);
  };

  // Submitted / read-only view
  if (existingEvaluation && !isEditing) {
    return (
      <div className="flex flex-col gap-3 px-4 py-4">
        <StarRatingInput value={existingEvaluation.rating} onChange={() => {}} readOnly size={22} />
        {existingEvaluation.notes && (
          <p className="text-[#303030] text-sm leading-relaxed">{existingEvaluation.notes}</p>
        )}
        <div className="flex items-center justify-between">
          <p className="text-[#717179] text-xs">
            Submitted{" "}
            {new Date(existingEvaluation.submittedAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
          <button
            onClick={handleEdit}
            className="text-[#013764] text-xs font-medium hover:underline"
          >
            Edit
          </button>
        </div>
      </div>
    );
  }

  // Form view (new or editing)
  return (
    <div className="flex flex-col gap-4 px-4 py-4">
      <div className="flex flex-col gap-0.5">
        <p className="text-[#717179] text-xs">How did {vendorName} perform?</p>
      </div>

      <StarRatingInput value={rating} onChange={setRating} size={28} />

      <div className="flex flex-col gap-1.5">
        <label className="text-[#717179] font-medium text-xs">
          Feedback{" "}
          <span className="font-normal text-[#aaaaaa]">(optional)</span>
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Quality, timeliness, communication..."
          rows={3}
          className="w-full px-3 py-2 text-sm text-[#303030] bg-[#f9f9f9] border border-[#e5e5e5] rounded-md resize-none placeholder:text-[#aaaaaa] focus:outline-none focus:ring-1 focus:ring-[#013764] focus:border-[#013764]"
        />
      </div>

      <div className="flex items-center justify-between">
        {existingEvaluation ? (
          <button
            onClick={handleCancel}
            className="text-[#717179] text-sm hover:text-[#303030]"
          >
            Cancel
          </button>
        ) : (
          <div />
        )}
        <button
          onClick={handleSubmit}
          disabled={rating === 0}
          className="px-4 py-1.5 text-sm font-medium text-white bg-[#013764] rounded-md hover:bg-[#012a4d] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {existingEvaluation ? "Update" : "Submit"}
        </button>
      </div>
    </div>
  );
}
