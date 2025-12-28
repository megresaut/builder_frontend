import React, { useContext } from "react";
import { TabContext } from "@/hooks/useTabContext";

export interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  iconLight?: React.ReactNode;
  iconDark?: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  openTabs: Set<string>;
  selectedTab: string;
  draggedTabId: string | null;
  dropTargetTabId: string | null;
  dropPosition: "before" | "after";
  onTabClick: (tabId: string) => void;
  onTabClose: (tabId: string, isClosing: boolean) => void;
  onDragStart: (e: React.DragEvent, tabId: string) => void;
  onDragOver: (e: React.DragEvent, tabId: string) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, targetTabId: string) => void;
  onAddNewTab: () => void;
  getIconForSection: (sectionId: string | undefined, isSelected: boolean) => React.ReactNode | undefined;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  openTabs,
  selectedTab,
  draggedTabId,
  dropTargetTabId,
  dropPosition,
  onTabClick,
  onTabClose,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onAddNewTab,
  getIconForSection,
}) => {
  const tabContext = useContext(TabContext);

  if (!tabContext) {
    throw new Error("Tabs must be used within TabContext provider");
  }

  return (
    <div
      className="flex items-center gap-0 px-0 py-0 bg-[#f9fafb]"
      style={{
        borderBottomWidth: "0px",
        borderColor: "rgb(210, 209, 207)",
        borderLeftWidth: "0px",
      }}
    >
      {tabs
        .filter((tab) => openTabs.has(tab.id))
        .map((tab) => {
          const isSelected = tab.id === selectedTab;
          const metadata = tabContext.tabMetadata[tab.id];
          const displayLabel = metadata?.label || tab.label;
          const sectionId =
            metadata?.sectionId ||
            (!tab.id.startsWith("new-tab-") ? tab.id : undefined);
          const sectionIcon = getIconForSection(sectionId, isSelected);
          const displayIcon =
            sectionIcon || (isSelected ? (tab.iconDark || tab.icon) : (tab.iconLight || tab.icon));

          return (
            <div
              key={tab.id}
              draggable
              onDragStart={(e) => onDragStart(e, tab.id)}
              onDragOver={(e) => onDragOver(e, tab.id)}
              onDragLeave={onDragLeave}
              onDrop={(e) => onDrop(e, tab.id)}
              className="flex items-center transition-all hover:bg-gray-100 relative"
              onClick={() => onTabClick(tab.id)}
              style={{
                backgroundColor: isSelected
                  ? "rgba(255, 255, 255, 1)"
                  : "#f9fafb",
                borderRadius: isSelected ? "12px 12px 0 0" : "0",
                minHeight: "47px",
                width: "220px",
                margin: "8px 0 -2px",
                padding: "0 12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                overflow: "visible",
                opacity: draggedTabId === tab.id ? 0.5 : 1,
                transition: "opacity 0.2s ease",
                ...(isSelected
                  ? {
                      borderTop: "1px solid #d2d1cf",
                      borderLeft: "1px solid #d2d1cf",
                      borderRight: "1px solid #d2d1cf",
                      borderBottom: "1px solid rgb(255,255,255)",
                    }
                  : {
                      borderTop: "none",
                      borderLeft: "none",
                      borderRight: "none",
                      borderBottom: "1px solid #d2d1cf",
                    }),
              }}
            >
              {dropTargetTabId === tab.id && draggedTabId && (
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                    width: "2px",
                    backgroundColor: "#3b82f6",
                    left: dropPosition === "before" ? "0" : "auto",
                    right: dropPosition === "after" ? "0" : "auto",
                  }}
                />
              )}
              <div
                className="flex items-center gap-2 pointer-events-none min-w-0"
                style={{ overflow: "hidden", flex: 1 }}
              >
                <span
                  className="flex items-center justify-center flex-shrink-0"
                  style={{
                    width: "20px",
                    height: "20px",
                    color: isSelected ? "#303030" : "#717179",
                  }}
                >
                  {displayIcon}
                </span>
                <span
                  className="text-sm font-medium truncate"
                  title={displayLabel}
                  style={{
                    fontFamily:
                      "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                    lineHeight: "24px",
                    color: isSelected ? "#303030" : "#717179",
                    pointerEvents: "auto",
                  }}
                >
                  {displayLabel}
                </span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTabClose(tab.id, true);
                }}
                className="ml-1 text-gray-500 hover:text-gray-700 flex-shrink-0"
                aria-label={`Close ${tab.label} tab`}
                type="button"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          );
        })}
      <div
        className="flex-1 flex items-center h-12 px-2"
        style={{
          borderTopWidth: "0px",
          borderLeftWidth: "0px",
          borderRightWidth: "0px",
          margin: "8px 0 -1px",
          border: "1px solid #d2d1cf",
          backgroundColor: "#f9fafb",
          borderRightColor: "transparent",
          borderLeftColor: "transparent",
          borderTopColor: "transparent",
        }}
      >
        <button
          onClick={onAddNewTab}
          className="text-gray-600 hover:text-gray-900 transition-opacity"
          aria-label="Add new tab"
          type="button"
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
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>
    </div>
  );
};

Tabs.displayName = "Tabs";
