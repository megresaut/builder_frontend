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

export interface Note {
  id: number;
  text: string;
  date: string;
  author: string;
  [key: string]: any;
}

interface NotesTemplateProps {
  notes: Note[];
  onAdd: () => void;
  onEdit: (note: Note) => void;
  onDelete: (noteId: number) => void;
  isLast?: boolean;
  emptyMessage?: string;
}

/**
 * NotesTemplate
 *
 * Reusable template for displaying notes sections with edit/delete actions.
 * Provides consistent layout and behavior across pages.
 */
export const NotesTemplate: React.FC<NotesTemplateProps> = ({
  notes,
  onAdd,
  onEdit,
  onDelete,
  isLast = true,
  emptyMessage = "You don't have any notes right now.",
}) => {
  return (
    <SectionRowTemplate isLast={isLast}>
      <div className="flex items-center justify-between gap-4 flex-wrap font-medium">
        <h2 className="text-[#303030] text-xl font-medium leading-[1.1]">
          Recent Notes
        </h2>
        <SectionActionTemplate label="Add" onClick={onAdd} />
      </div>

      {notes.length === 0 ? (
        <EmptyStateTemplate message={emptyMessage} />
      ) : (
        <RecordListTemplate>
          {notes.map((note, idx) => (
            <RecordRowTemplate
              key={note.id}
              isLast={idx === notes.length - 1}
              leftSlot={
                <div className="flex-1">
                  <div className="text-[#303030] text-sm font-normal leading-[1.29] whitespace-pre-line">
                    {note.text}
                  </div>
                  <div className="flex items-center gap-8 mt-2 text-xs text-[#71717A]">
                    <span>{note.date}</span>
                    <span>{note.author}</span>
                  </div>
                </div>
              }
              rightSlot={
                <PopoverActionsDropdown
                  row={note}
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
                      onClick: () => onEdit(note),
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
                      onClick: () => onDelete(note.id),
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

export default NotesTemplate;
