import React from "react";
import type { NavLayoutMode } from "@/hooks/useNavLayoutMode";

interface NavLayoutToggleProps {
  mode: NavLayoutMode;
  onChange: (mode: NavLayoutMode) => void;
  className?: string;
}

const SideLayoutIcon = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="1.5" y="2.5" width="13" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
    <path d="M6 2.5V13.5" stroke="currentColor" strokeWidth="1.3" />
  </svg>
);

const TopLayoutIcon = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="1.5" y="2.5" width="13" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
    <path d="M1.5 6H14.5" stroke="currentColor" strokeWidth="1.3" />
  </svg>
);

/**
 * Segmented control for switching between the left sidebar and the
 * horizontal top nav. Rendered in both Sidebar's footer and TopNav so
 * it's always reachable near Settings/the user's profile.
 */
export default function NavLayoutToggle({ mode, onChange, className = "" }: NavLayoutToggleProps) {
  return (
    <div
      className={`flex items-center gap-0.5 rounded-lg border border-gray-300 bg-white p-0.5 ${className}`}
      role="group"
      aria-label="Navigation layout"
    >
      <button
        type="button"
        onClick={() => onChange("side")}
        title="Side navigation"
        aria-label="Use side navigation"
        aria-pressed={mode === "side"}
        className={`flex items-center justify-center rounded-md p-1.5 transition-colors ${
          mode === "side" ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-100"
        }`}
      >
        <SideLayoutIcon />
      </button>
      <button
        type="button"
        onClick={() => onChange("top")}
        title="Top navigation"
        aria-label="Use top navigation"
        aria-pressed={mode === "top"}
        className={`flex items-center justify-center rounded-md p-1.5 transition-colors ${
          mode === "top" ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-100"
        }`}
      >
        <TopLayoutIcon />
      </button>
    </div>
  );
}
