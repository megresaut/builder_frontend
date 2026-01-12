import React from "react";
import { EditIcon, DeleteIcon } from "@/components/icons";
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
  isLast?: boolean;
  emptyMessage?: string;
  hideHeader?: boolean;
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
  isLast = true,
  emptyMessage = "You don't have any files right now.",
  hideHeader = false,
}) => {
  return (
    <SectionRowTemplate isLast={isLast}>
      {!hideHeader && (
        <div className="flex items-center justify-between gap-4 flex-wrap font-medium">
          <h2 className="text-[#303030] text-base font-medium leading-[1.1]">
            Recent Files
          </h2>
          <SectionActionTemplate label="Add" onClick={onAdd} />
        </div>
      )}

      {files.length === 0 ? (
        <EmptyStateTemplate message={emptyMessage} />
      ) : (
        <RecordListTemplate>
          {[...files].reverse().map((file, idx) => (
            <RecordRowTemplate
              key={file.id}
              isLast={idx === files.length - 1}
              leftSlot={
                <div className="flex-1">
                  {file.url ? (
                    <button
                      onClick={() => onView(file)}
                      className="text-[#2463EB] text-sm font-medium leading-[1.29] hover:underline bg-none border-none cursor-pointer p-0 text-left"
                    >
                      {file.name}
                    </button>
                  ) : (
                    <div className="text-[#303030] text-sm font-normal leading-[1.29]">
                      {file.name}
                    </div>
                  )}
                  <div className="text-[#71717A] text-xs mt-1">
                    {file.uploadedAt || (file as any).date}
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
                <PopoverActionsDropdown
                  row={file}
                  rowKey="id"
                  actions={[
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
              }
            />
          ))}
        </RecordListTemplate>
      )}
    </SectionRowTemplate>
  );
};

export default FilesTemplate;
