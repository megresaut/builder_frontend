import { useState, useRef, useEffect, ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface ActionItem {
  label: string | ((row: any) => string);
  icon: ReactNode | ((row: any) => ReactNode);
  onClick: (row: any) => void;
  className?: string;
}

interface GlobalActionsDropdownProps {
  row: any;
  rowKey: string;
  actions: ActionItem[];
  openMenuId: string | number | null;
  setOpenMenuId: (id: string | number | null) => void;
}

export default function GlobalActionsDropdown({
  row,
  rowKey,
  actions,
  openMenuId,
  setOpenMenuId,
}: GlobalActionsDropdownProps) {
  const taskId: string | number = row[rowKey];
  const showMenu = openMenuId === taskId;
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    let animationFrameId: number;

    const updateMenuPos = () => {
      if (showMenu && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setMenuPos({
          top: rect.bottom + 8,
          left: rect.right - 145,
        });
      }

      if (showMenu) {
        animationFrameId = requestAnimationFrame(updateMenuPos);
      }
    };

    if (showMenu) {
      updateMenuPos();
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [showMenu]);

  useEffect(() => {
    if (!showMenu) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        !buttonRef.current?.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
        setOpenMenuId(null);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenMenuId(null);
      }
    };

    const handleMouseMove = (event: MouseEvent) => {
      const buttonRect = buttonRef.current?.getBoundingClientRect();
      const menuRect = menuRef.current?.getBoundingClientRect();

      if (!buttonRect || !menuRect) return;

      const { clientX, clientY } = event;
      const DISTANCE_THRESHOLD = 150;

      const isNearButton =
        clientX >= buttonRect.left - DISTANCE_THRESHOLD &&
        clientX <= buttonRect.right + DISTANCE_THRESHOLD &&
        clientY >= buttonRect.top - DISTANCE_THRESHOLD &&
        clientY <= buttonRect.bottom + DISTANCE_THRESHOLD;

      const isNearMenu =
        clientX >= menuRect.left - DISTANCE_THRESHOLD &&
        clientX <= menuRect.right + DISTANCE_THRESHOLD &&
        clientY >= menuRect.top - DISTANCE_THRESHOLD &&
        clientY <= menuRect.bottom + DISTANCE_THRESHOLD;

      if (!isNearButton && !isNearMenu) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    document.addEventListener("mousemove", handleMouseMove);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousemove", handleMouseMove);
    };
  }, [showMenu, setOpenMenuId]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label="Actions"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpenMenuId(showMenu ? null : taskId);
        }}
        className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="1" />
          <circle cx="19" cy="12" r="1" />
          <circle cx="5" cy="12" r="1" />
        </svg>
      </button>

      {showMenu &&
        createPortal(
          <div
            ref={menuRef}
            className="ra-actions-dropdown bg-white flex flex-col justify-center items-start gap-4 p-4"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            style={{
              width: "145px",
              border: "0.5px solid #DADADA",
              borderRadius: "8px",
              boxShadow:
                "0 38px 11px 0 rgba(0, 0, 0, 0.00), 0 24px 10px 0 rgba(0, 0, 0, 0.01), 0 14px 8px 0 rgba(0, 0, 0, 0.04), 0 6px 6px 0 rgba(0, 0, 0, 0.06), 0 2px 3px 0 rgba(0, 0, 0, 0.07)",
              zIndex: 99999,
              position: "fixed",
              top: menuPos.top + "px",
              left: menuPos.left + "px",
              pointerEvents: "auto",
            }}
            onMouseLeave={() => {
              setOpenMenuId(null);
            }}
          >
            {actions.map((action, idx) => {
              const resolvedLabel =
                typeof action.label === "function" ? action.label(row) : action.label;
              const resolvedIcon =
                typeof action.icon === "function" ? action.icon(row) : action.icon;

              return (
                <button
                key={idx}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setOpenMenuId(null);
                  action.onClick(row);
                }}
                className={cn(
                  "ra-action-item flex justify-between items-center w-full hover:opacity-70 transition-opacity",
                  action.className
                )}
              >
                <span
                  className="text-[#303030] font-normal text-base leading-[140%] tracking-[-0.32px] capitalize"
                  style={{
                    fontFamily:
                      "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                  }}
                >
                  {resolvedLabel}
                </span>
                {resolvedIcon}
              </button>
              );
            })}
          </div>,
          document.body,
        )}
    </>
  );
}
