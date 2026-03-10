import { useState, useEffect } from "react";
import { fetchJSON } from "@/api/fetchJSON";

interface AIGeneratedBannerProps {
  entityType: "fto" | "task" | "work_order";
  entityId: number | undefined | null;
}

/**
 * Shows a subtle info banner when an entity was created by AI classification.
 * Fetches the AI origin check on mount and displays reasoning + confidence.
 */
export default function AIGeneratedBanner({ entityType, entityId }: AIGeneratedBannerProps) {
  const [aiInfo, setAiInfo] = useState<{
    ai_generated: boolean;
    confidence?: number;
    reasoning?: string;
    source?: string;
  } | null>(null);

  useEffect(() => {
    if (!entityId) return;
    let cancelled = false;
    fetchJSON(`/ai/drafts/by-entity?type=${entityType}&entity_id=${entityId}`)
      .then((data) => {
        if (!cancelled) setAiInfo(data);
      })
      .catch(() => {
        // silently ignore - not AI generated or endpoint not available
      });
    return () => { cancelled = true; };
  }, [entityType, entityId]);

  if (!aiInfo?.ai_generated) return null;

  const sourceLabel = aiInfo.source === "calendar" ? "Outlook Calendar" : aiInfo.source === "sms" ? "SMS" : aiInfo.source;
  const confidencePct = Math.round((aiInfo.confidence || 0) * 100);

  return (
    <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 2L12.09 7.26L18 8.27L14 12.14L14.81 18.02L10 15.27L5.19 18.02L6 12.14L2 8.27L7.91 7.26L10 2Z" fill="#F59E0B" stroke="#D97706" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-amber-800">
            AI Generated — please verify details
          </p>
          <p className="text-xs text-amber-700 mt-1">
            Created from {sourceLabel} with {confidencePct}% confidence.
            {aiInfo.reasoning && (
              <span className="block mt-1 italic">"{aiInfo.reasoning}"</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
