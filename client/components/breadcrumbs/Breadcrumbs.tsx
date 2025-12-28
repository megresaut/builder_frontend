import React from "react";
import { useNavigate } from "react-router-dom";
import { BreadcrumbItem } from "./useBreadcrumbs";
import { ChevronRightIcon } from "@/components/icons";

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
  const navigate = useNavigate();

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="hidden md:flex items-center gap-2 text-gray-700 truncate flex-1 min-w-0 h-10">
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {item.href ? (
            <button
              onClick={() => navigate(item.href)}
              className="text-sm font-medium flex-shrink-0 hover:text-gray-900 hover:underline"
              type="button"
            >
              {item.label}
            </button>
          ) : (
            <span
              className={`text-sm font-medium ${
                index === items.length - 1 ? "truncate" : "flex-shrink-0"
              }`}
            >
              {item.label}
            </span>
          )}
          {index < items.length - 1 && (
            <ChevronRightIcon width={16} height={16} className="flex-shrink-0 block" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

Breadcrumbs.displayName = "Breadcrumbs";
