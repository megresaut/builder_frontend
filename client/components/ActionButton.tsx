import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export const ActionButton = ({
  propertyId,
  openMenuId,
  setOpenMenuId,
  onEdit,
  onImport,
  onView,
}: {
  propertyId: number;
  openMenuId: number | null;
  setOpenMenuId: (id: number | null) => void;
  onEdit?: () => void;
  onImport?: () => void;
  onView?: () => void;
}) => {
  const showMenu = openMenuId === propertyId;
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
        menuRef.current &&
        buttonRef.current &&
        !menuRef.current.contains(target) &&
        !buttonRef.current.contains(target)
      ) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenu, setOpenMenuId]);

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setOpenMenuId(showMenu ? null : propertyId)}
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
            className="bg-white flex flex-col justify-center items-start gap-4 p-4"
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
            onMouseLeave={() => setOpenMenuId(null)}
          >
            {onEdit && (
              <button
                onClick={() => {
                  if (onEdit) {
                    onEdit();
                  }
                  setOpenMenuId(null);
                }}
                className="flex justify-between items-center w-full hover:opacity-70 transition-opacity"
              >
                <span
                  className="text-[#303030] font-normal text-base leading-[140%] tracking-[-0.32px] capitalize"
                  style={{
                    fontFamily:
                      "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                  }}
                >
                  Edit
                </span>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M15.75 15.7502H9.75002M1.875 16.1252L6.03695 14.5245C6.30316 14.4221 6.43626 14.3709 6.56079 14.3041C6.6714 14.2447 6.77685 14.1761 6.87603 14.0992C6.98769 14.0125 7.08853 13.9117 7.29021 13.71L15.75 5.25023C16.5784 4.4218 16.5784 3.07865 15.75 2.25023C14.9216 1.4218 13.5784 1.4218 12.75 2.25022L4.29021 10.71C4.08853 10.9117 3.98769 11.0125 3.90104 11.1242C3.82408 11.2234 3.75555 11.3288 3.69618 11.4394C3.62933 11.564 3.57814 11.6971 3.47575 11.9633L1.875 16.1252ZM1.875 16.1252L3.41859 12.1119C3.52905 11.8248 3.58428 11.6812 3.67901 11.6154C3.76179 11.5579 3.86423 11.5362 3.96322 11.5551C4.0765 11.5767 4.18529 11.6855 4.40286 11.9031L6.09718 13.5974C6.31475 13.815 6.42354 13.9237 6.44517 14.037C6.46408 14.136 6.44234 14.2385 6.38486 14.3212C6.31908 14.416 6.17549 14.4712 5.8883 14.5817L1.875 16.1252Z"
                    stroke="#525252"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            )}
            {onImport && (
              <button
                onClick={() => {
                  onImport();
                  setOpenMenuId(null);
                }}
                className="flex justify-between items-center w-full hover:opacity-70 transition-opacity"
              >
                <span
                  className="text-[#303030] font-normal text-base leading-[140%] tracking-[-0.32px] capitalize"
                  style={{
                    fontFamily:
                      "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                  }}
                >
                  Import
                </span>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M9 1.5V11.25M9 1.5L5.25 5.25M9 1.5L12.75 5.25M2.25 8.25V14.25C2.25 14.8023 2.48705 15.3 2.9051 15.6239C3.32315 15.9477 3.88437 16.125 4.5 16.125H13.5C14.1156 16.125 14.6768 15.9477 15.0949 15.6239C15.513 15.3 15.75 14.8023 15.75 14.25V8.25"
                    stroke="#525252"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            )}
            {onView ? (
              <button
                onClick={() => {
                  onView();
                  setOpenMenuId(null);
                }}
                className="flex justify-between items-center w-full hover:opacity-70 transition-opacity"
              >
                <span
                  className="text-[#303030] font-normal text-base leading-[140%] tracking-[-0.32px] capitalize"
                  style={{
                    fontFamily:
                      "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                  }}
                >
                  View Bill
                </span>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M9 3C5.13 3 1.83 5.34 1.25 8.5C1.83 11.66 5.13 14 9 14C12.87 14 16.17 11.66 16.75 8.5C16.17 5.34 12.87 3 9 3ZM9 12.5C7.07 12.5 5.5 10.93 5.5 9C5.5 7.07 7.07 5.5 9 5.5C10.93 5.5 12.5 7.07 12.5 9C12.5 10.93 10.93 12.5 9 12.5ZM9 7C8.17 7 7.5 7.67 7.5 8.5C7.5 9.33 8.17 10 9 10C9.83 10 10.5 9.33 10.5 8.5C10.5 7.67 9.83 7 9 7Z"
                    fill="#525252"
                  />
                </svg>
              </button>
            ) : (
              <button
                onClick={() => {
                  console.log("Delete clicked for property", propertyId);
                  setOpenMenuId(null);
                }}
                className="flex justify-between items-center w-full hover:opacity-70 transition-opacity"
              >
                <span
                  className="text-[#303030] font-normal text-base leading-[140%] tracking-[-0.32px] capitalize"
                  style={{
                    fontFamily:
                      "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                  }}
                >
                  Delete
                </span>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M6.75 2.25H11.25M2.25 4.5H15.75M14.25 4.5L13.724 12.3895C13.6451 13.5732 13.6057 14.165 13.35 14.6138C13.1249 15.0088 12.7854 15.3265 12.3762 15.5248C11.9115 15.75 11.3183 15.75 10.132 15.75H7.86799C6.68168 15.75 6.08852 15.75 5.62375 15.5248C5.21457 15.3265 4.87507 15.0088 4.64999 14.6138C4.39433 14.165 4.35488 13.5732 4.27596 12.3895L3.75 4.5M7.5 7.875V11.625M10.5 7.875V11.625"
                    stroke="#982740"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            )}
          </div>,
          document.body,
        )}
    </>
  );
};
