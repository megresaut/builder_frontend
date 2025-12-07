import { useState } from "react";
import { cn } from "@/lib/utils";

interface PropertyTablePaginationProps {
  currentPage: number;
  setCurrentPage: (page: number) => void;
  itemsPerPage: number;
  setItemsPerPage: (items: number) => void;
}

export function PropertyTablePagination({
  currentPage,
  setCurrentPage,
  itemsPerPage,
  setItemsPerPage,
}: PropertyTablePaginationProps) {
  return (
    <div className="flex lg:flex-row flex-nowrap justify-between items-start lg:items-center px-6 py-4 border-t w-full relative whitespace-nowrap" style={{ borderColor: "rgb(229, 229, 229)" }}>
      <div className="flex items-center gap-2 flex-nowrap flex-shrink-0">
        <div className="text-task-text-secondary font-medium text-base leading-[140%] tracking-[-0.32px] capitalize whitespace-nowrap flex-shrink-0">
          Showing
        </div>
        <div className="flex items-start rounded-lg border shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] flex-shrink-0" style={{ borderColor: "rgb(229, 229, 229)", backgroundColor: "rgb(251, 251, 251)" }}>
          <button
            className="flex items-center justify-center gap-2 h-10 px-3 rounded-lg transition-all duration-150 whitespace-nowrap"
            style={{ backgroundColor: "rgb(251, 251, 251)" }}
          >
            <div className="text-[#0A0A0A] font-medium text-base leading-[140%] tracking-[-0.32px] capitalize whitespace-nowrap">
              {itemsPerPage}
            </div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="w-[18px] h-[18px]"
              style={{ color: "rgb(163, 163, 163)" }}
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
        </div>
        <div className="text-task-text-secondary font-medium text-base leading-[140%] tracking-[-0.32px] capitalize">
          of 225
        </div>
      </div>
      <div className="flex items-center justify-center h-10 rounded-lg border overflow-hidden" style={{ backgroundColor: "rgb(251, 251, 251)", borderColor: "rgb(229, 229, 229)" }}>
        <button
          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
          className="flex items-center justify-center gap-1.5 px-4 py-2 h-10 border-r transition-all duration-150"
          style={{ backgroundColor: "rgb(255, 255, 255)", borderColor: "rgb(229, 229, 229)" }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="w-5 h-5"
            style={{ color: "rgb(163, 163, 163)" }}
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
          <div className="text-task-text-secondary font-medium text-base leading-[140%] tracking-[-0.32px] capitalize hidden sm:block">
            Previous
          </div>
        </button>
        {[1, 2, 3].map((page) => (
          <button
            key={page}
            onClick={() => setCurrentPage(page)}
            className="flex items-center justify-center min-w-[40px] h-10 px-2 border-r transition-all duration-150"
            style={{
              backgroundColor: "rgb(255, 255, 255)",
              borderColor: "rgb(229, 229, 229)",
              color: currentPage === page ? "rgb(10, 10, 10)" : "rgb(163, 163, 163)",
            }}
          >
            <div className="font-medium text-base leading-[140%] tracking-[-0.32px] capitalize">
              {page}
            </div>
          </button>
        ))}
        <button
          className="flex items-center justify-center min-w-[40px] h-10 px-2 border-r transition-all duration-150"
          style={{
            backgroundColor: "rgb(255, 255, 255)",
            borderColor: "rgb(229, 229, 229)",
            color: "rgb(163, 163, 163)",
          }}
        >
          <div className="font-medium text-base leading-[140%] tracking-[-0.32px] capitalize">
            ...
          </div>
        </button>
        {[8, 9, 10].map((page) => (
          <button
            key={page}
            onClick={() => setCurrentPage(page)}
            className="flex items-center justify-center min-w-[40px] h-10 px-2 border-r transition-all duration-150"
            style={{
              backgroundColor: "rgb(255, 255, 255)",
              borderColor: "rgb(229, 229, 229)",
              color: "rgb(163, 163, 163)",
            }}
          >
            <div className="font-medium text-base leading-[140%] tracking-[-0.32px] capitalize">
              {page}
            </div>
          </button>
        ))}
        <button
          onClick={() => setCurrentPage(currentPage + 1)}
          className="flex items-center justify-center gap-1.5 px-4 py-2 h-10 transition-all duration-150"
          style={{ backgroundColor: "rgb(255, 255, 255)" }}
        >
          <div className="text-task-text-secondary font-medium text-base leading-[140%] tracking-[-0.32px] capitalize hidden sm:block">
            Next
          </div>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="w-5 h-5"
            style={{ color: "rgb(163, 163, 163)" }}
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
