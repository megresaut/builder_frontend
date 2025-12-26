import React from "react";
import { Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DotsIcon } from "@/components/icons";

export interface EntityListItem {
  id: number | string;
  [key: string]: any;
}

export interface EntityListAction {
  label: string;
  onClick: (item: EntityListItem) => void;
  isDangerous?: boolean;
}

interface EntityListSectionProps<T extends EntityListItem> {
  title: string;
  items: T[];
  onAddClick: () => void;
  renderItem: (item: T) => React.ReactNode;
  actions?: EntityListAction[];
  emptyMessage?: string;
  addButtonLabel?: string;
}

export const EntityListSection = React.forwardRef<
  HTMLDivElement,
  EntityListSectionProps<EntityListItem>
>(
  (
    {
      title,
      items,
      onAddClick,
      renderItem,
      actions = [],
      emptyMessage = "No items found.",
      addButtonLabel = "Add",
    },
    ref
  ) => (
    <div ref={ref} className="mt-5 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap font-medium">
        <h2 className="text-[#303030] text-xl font-medium leading-[1.1]">
          {title}
        </h2>
        <button
          onClick={onAddClick}
          className="flex items-center gap-1 text-[#2463EB] text-sm font-medium leading-[1.4] tracking-[-0.28px] whitespace-nowrap rounded-lg hover:opacity-80 transition-opacity"
        >
          <Plus className="w-3 h-3" />
          <span>{addButtonLabel}</span>
        </button>
      </div>

      {/* Content */}
      {items.length === 0 ? (
        <div className="mt-3 flex items-center gap-1 w-full px-3 py-1.5 bg-[#F9F9F9] border border-[#DADADA] rounded">
          <p className="text-[#303030] text-sm font-normal leading-[1.29]">
            {emptyMessage}
          </p>
        </div>
      ) : (
        <div className="mt-3 border border-[#DADADA] rounded-lg overflow-hidden">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-6 px-3 py-2 border-b border-[#DADADA] last:border-b-0"
            >
              <div className="flex-1">{renderItem(item)}</div>

              {actions.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                      className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors"
                      aria-label="Actions"
                    >
                      <DotsIcon width={18} height={18} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="z-[99999] bg-white flex flex-col justify-center items-start gap-4 p-4 rounded-lg"
                    style={{ border: "0.5px solid #DADADA" }}
                  >
                    {actions.map((action, idx) => (
                      <DropdownMenuItem
                        key={idx}
                        onSelect={() => action.onClick(item)}
                        className={`w-full cursor-pointer text-left font-normal text-base leading-[140%] tracking-[-0.32px] focus:bg-transparent whitespace-nowrap ${
                          action.isDangerous
                            ? "text-[#982740] focus:text-[#982740]"
                            : "text-[#303030] focus:text-[#303030]"
                        }`}
                      >
                        {action.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
);

EntityListSection.displayName = "EntityListSection";

export default EntityListSection;
