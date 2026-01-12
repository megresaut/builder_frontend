import React from "react";

export interface PersonAvatarsPerson {
  id?: string | number;
  name: string;
  initials: string;
  label?: string;
}

interface PersonAvatarsProps {
  people: PersonAvatarsPerson[];
  type?: "assignee" | "collaborator";
  fallback?: string;
  size?: "sm" | "md" | "lg";
}

export const PersonAvatars: React.FC<PersonAvatarsProps> = ({
  people,
  type = "assignee",
  fallback = "None",
  size = "md",
}) => {
  // Determine border and text color based on type
  const borderColor = type === "collaborator" ? "border-[#10b981]" : "border-[#2463eb]";
  const textColor = type === "collaborator" ? "text-[#10b981]" : "text-[#2463eb]";

  const sizeClass = {
    sm: "w-6 h-6 text-xs",
    md: "w-8 h-8 text-xs",
    lg: "w-10 h-10 text-sm",
  }[size];

  if (!people || people.length === 0) {
    return <span className="text-sm text-[#303030] font-medium mt-0.5">{fallback}</span>;
  }

  return (
    <div className="flex items-center gap-2 mt-1">
      {people.map((person, idx) => {
        const name = person.name || person.label || "Unknown";
        const initials = person.initials || (name || "?").split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
        return (
          <div key={`${person.id || idx}-${idx}`} className="relative group/avatar">
            <div
              className={`flex items-center justify-center ${sizeClass} bg-white ${borderColor} rounded-full ${textColor} font-semibold leading-[0.8] flex-shrink-0`}
              title={name}
            >
              {initials}
            </div>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-[#303030] text-white text-xs rounded whitespace-nowrap opacity-0 group-hover/avatar:opacity-100 transition-opacity pointer-events-none z-50">
              {name}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PersonAvatars;
