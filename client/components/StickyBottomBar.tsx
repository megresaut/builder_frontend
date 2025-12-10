import React from "react";

interface StickyBottomBarProps {
  leftContent?: React.ReactNode;
  rightContent?: React.ReactNode;
  onCancel?: () => void;
  onSubmit?: () => void;
  cancelLabel?: string;
  submitLabel?: string;
}

export const StickyBottomBar: React.FC<StickyBottomBarProps> = ({
  leftContent,
  rightContent,
  onCancel,
  onSubmit,
  cancelLabel = "Cancel",
  submitLabel = "Submit",
}) => {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E5E7EB] z-50"
      style={{
        height: "80px",
        padding: "20px 32px",
      }}
    >
      <div className="flex items-center justify-between h-full max-w-full">
        {/* Left Content - Secondary Actions */}
        <div className="flex items-center gap-2">
          {leftContent || (
            <button
              onClick={onCancel}
              className="rounded-lg flex min-h-9 px-3 py-1.5 items-center gap-2 text-[#303030] font-normal whitespace-nowrap tracking-[-0.32px] leading-[1.4] hover:bg-gray-100 transition-colors"
            >
              <span>{cancelLabel}</span>
            </button>
          )}
        </div>

        {/* Right Content - Primary Action */}
        <div className="flex items-center gap-2">
          {rightContent || (
            <button
              onClick={onSubmit}
              className="rounded-lg bg-[#013764] shadow-[0_0_0_1px_rgba(0,45,90,1)] flex min-h-9 px-3 py-2 items-center gap-2 overflow-hidden text-white font-medium hover:bg-[#002a4f] transition-colors"
            >
              <span>{submitLabel}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
