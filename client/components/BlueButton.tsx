import { ReactNode } from "react";

interface BlueButtonProps {
  children: ReactNode;
  icon?: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  className?: string;
}

export default function BlueButton({
  children,
  icon,
  onClick,
  type = "button",
  disabled = false,
  className = "",
}: BlueButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`flex h-9 items-center gap-2 px-4 rounded-lg border border-white bg-[#013764] hover:bg-[#003a73] transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      style={{
        boxShadow: "0 0 0 1px #002D5A, 0 0 10px -5px rgba(0, 0, 0, 0.20)",
      }}
    >
      {icon && <div className="flex-shrink-0 text-white">{icon}</div>}
      <span className="text-white font-medium text-base leading-normal">
        {children}
      </span>
    </button>
  );
}
