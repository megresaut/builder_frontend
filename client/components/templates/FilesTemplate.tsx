import React from "react";
import { EditIcon, DeleteIcon, DownloadIcon } from "@/components/icons";
import PopoverActionsDropdown from "@/components/PopoverActionsDropdown";
import {
  SectionRowTemplate,
  SectionActionTemplate,
  EmptyStateTemplate,
  RecordListTemplate,
  RecordRowTemplate,
} from "@/components/templates";

export interface File {
  id: number;
  name: string;
  url?: string;
  uploadedAt?: string;
  category?: string;
  description?: string;
  [key: string]: any;
}

interface FilesTemplateProps {
  files: File[];
  onAdd: () => void;
  onEdit: (file: File) => void;
  onDelete: (fileId: number) => void;
  onView: (file: File) => void;
  onDownload?: (file: File) => void;
  isLast?: boolean;
  emptyMessage?: string;
}

/**
 * FilesTemplate
 *
 * Reusable template for displaying files sections with edit/delete actions.
 * Provides consistent layout and behavior across pages.
 */
export const FilesTemplate: React.FC<FilesTemplateProps> = ({
  files,
  onAdd,
  onEdit,
  onDelete,
  onView,
  onDownload,
  isLast = true,
  emptyMessage = "You don't have any files right now.",
}) => {
  return (
    <SectionRowTemplate isLast={isLast}>
      <div className="flex items-center justify-between gap-4 flex-wrap font-medium">
        <h2 className="text-[#303030] text-xl font-medium leading-[1.1]">
          Recent Files
        </h2>
        <SectionActionTemplate label="Add" onClick={onAdd} />
      </div>

      {files.length === 0 ? (
        <EmptyStateTemplate message={emptyMessage} />
      ) : (
        <RecordListTemplate>
          {[...files].reverse().map((file, idx) => {
            const source = (file as any).source as string | undefined;
            const sourceName = (file as any).source_entity_name as string | null | undefined;
            const isAggregated = source && source !== "task";
            const sourceLabel =
              source === "work_order"
                ? `WO: ${sourceName ?? "Work Order"}`
                : source === "fto_receipt"
                  ? `FTO Receipt: ${sourceName ?? ""}`.trim()
                  : null;
            return (
              <RecordRowTemplate
                key={`${source ?? "task"}-${file.id}`}
                isLast={idx === files.length - 1}
                leftSlot={
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => onView(file)}
                        className="text-[#2463EB] text-sm font-medium leading-[1.29] hover:underline bg-none border-none cursor-pointer p-0 text-left"
                      >
                        {file.name}
                      </button>
                      {sourceLabel && (
                        <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                          {sourceLabel}
                        </span>
                      )}
                    </div>
                    <div className="text-[#71717A] text-xs mt-1">
                      {file.uploadedAt || (file as any).date}
                      {(file as any).author && (
                        <span className="ml-2">· {(file as any).author}</span>
                      )}
                    </div>
                    {(file.category || file.description) && (
                      <div className="text-[#71717A] text-xs mt-2 space-y-1">
                        {file.category && (
                          <div>Category: {file.category}</div>
                        )}
                        {file.description && (
                          <div>Description: {file.description}</div>
                        )}
                      </div>
                    )}
                  </div>
                }
                rightSlot={
                  isAggregated ? null : (
                    <PopoverActionsDropdown
                      row={file}
                      rowKey="id"
                      actions={[
                        ...(onDownload ? [{
                          label: "Download",
                          icon: (
                            <DownloadIcon
                              width={18}
                              height={18}
                              color="#303030"
                            />
                          ),
                          onClick: () => onDownload(file),
                        }] : []),
                        {
                          label: "Edit",
                          icon: (
                            <EditIcon
                              width={18}
                              height={18}
                              color="#303030"
                            />
                          ),
                          onClick: () => onEdit(file),
                        },
                        {
                          label: "Delete",
                          icon: (
                            <DeleteIcon
                              width={18}
                              height={18}
                              color="#982740"
                            />
                          ),
                          onClick: () => onDelete(file.id),
                        },
                      ]}
                    />
                  )
                }
              />
            );
          })}
        </RecordListTemplate>
      )}
    </SectionRowTemplate>
  );
};

export default FilesTemplate;
