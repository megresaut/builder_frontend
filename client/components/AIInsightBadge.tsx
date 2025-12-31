import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

export const AIInsightBadge = ({
  insight,
}: {
  insight: "High" | "Normal" | "Low";
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const badgeRef = useRef<HTMLSpanElement>(null);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });

  const colors = {
    High: "#C24A4A",
    Normal: "#3A71C4",
    Low: "#37A74B",
  };

  const explanations = {
    High: "Usage is above average. Consider optimizing your energy consumption or reviewing connected devices.",
    Normal:
      "Usage is within normal range. Your consumption is consistent with typical patterns.",
    Low: "Usage is below average. Great job maintaining efficient energy consumption.",
  };

  useEffect(() => {
    if (showTooltip && badgeRef.current) {
      const rect = badgeRef.current.getBoundingClientRect();
      setTooltipPos({
        top: rect.bottom + 8,
        left: rect.left + rect.width / 2,
      });
    }
  }, [showTooltip]);

  return (
    <>
      <span
        ref={badgeRef}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-2xl text-sm font-normal cursor-help relative"
        style={{
          color: colors[insight],
          boxShadow:
            "-1px 1px 1px 0 rgba(255, 28, 198, 0.10) inset, 1px -1px 1px 0 rgba(3, 57, 219, 0.10) inset, 2px -2px 5px 0 rgba(3, 57, 219, 0.10) inset, -2px 2px 5px 0 rgba(255, 28, 198, 0.10) inset, 0 0 1px 0 #A3A6D1, 0 1px 2px 0 rgba(0, 0, 0, 0.04), 0 1px 2px 0 rgba(0, 0, 0, 0.02)",
          letterSpacing: "-0.32px",
          lineHeight: "140%",
        }}
      >
        {insight}
      </span>

      {showTooltip &&
        createPortal(
          <div
            className="bg-[#303030] text-white px-3 py-2 rounded-lg text-sm max-w-xs shadow-lg z-50 pointer-events-none"
            style={{
              position: "fixed",
              top: tooltipPos.top + "px",
              left: tooltipPos.left + "px",
              transform: "translateX(-50%)",
              whiteSpace: "normal",
              wordWrap: "break-word",
            }}
          >
            {explanations[insight]}
            <div
              className="absolute w-2 h-2 bg-[#303030] transform -top-1 left-1/2 -translate-x-1/2 rotate-45"
              style={{
                position: "absolute",
                top: "-4px",
                left: "50%",
                marginLeft: "-4px",
              }}
            />
          </div>,
          document.body,
        )}
    </>
  );
};
