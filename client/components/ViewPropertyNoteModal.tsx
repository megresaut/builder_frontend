import { useState, useEffect } from "react";
import {
  ModalTemplate,
  ModalButtons,
} from "@/components/ui/ModalTemplate";
import { FormLayout, FormSection } from "@/components/ui/form-layout";
import { TextAreaField } from "@/components/forms";

interface RecentNote {
  id: number;
  text: string;
  type: string;
  date: string;
  author: string;
}

interface ViewPropertyNoteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note: RecentNote | null;
  onSaveNote?: (id: number, newText: string) => void;
  onDeleteNote?: (id: number) => void;
}

export default function ViewPropertyNoteModal({
  open,
  onOpenChange,
  note,
  onSaveNote,
  onDeleteNote,
}: ViewPropertyNoteModalProps) {
  const [viewNoteDraft, setViewNoteDraft] = useState("");

  useEffect(() => {
    if (open && note) {
      setViewNoteDraft(note.text);
    }
  }, [open, note]);

  const handleSave = () => {
    const nextText = viewNoteDraft.trim();
    if (!nextText || !note) return;

    onSaveNote?.(note.id, nextText);
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (!note) return;
    onDeleteNote?.(note.id);
    onOpenChange(false);
  };

  if (!note) return null;

  return (
    <ModalTemplate
      open={open}
      onOpenChange={onOpenChange}
      title="Note Details"
      size="sm"
      footer={
        <div style={{ display: "flex", gap: "8px", width: "100%" }}>
          <button
            onClick={handleDelete}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              paddingLeft: "12px",
              paddingRight: "12px",
              paddingTop: "8px",
              paddingBottom: "8px",
              minHeight: "36px",
              borderRadius: "8px",
              backgroundColor: "#fbfbfb",
              border: "1px solid #dadada",
              color: "#dc2626",
              fontWeight: 400,
              fontSize: "16px",
              cursor: "pointer",
              transition: "background-color 0.2s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#f0f0f0")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "#fbfbfb")
            }
          >
            Delete
          </button>
          <div style={{ display: "flex", gap: "8px", flex: 1 }}>
            <button
              onClick={() => onOpenChange(false)}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                paddingLeft: "12px",
                paddingRight: "12px",
                paddingTop: "8px",
                paddingBottom: "8px",
                minHeight: "36px",
                borderRadius: "8px",
                backgroundColor: "#fbfbfb",
                border: "1px solid #dadada",
                color: "#303030",
                fontWeight: 400,
                fontSize: "16px",
                cursor: "pointer",
                transition: "background-color 0.2s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#f0f0f0")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "#fbfbfb")
              }
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!viewNoteDraft.trim()}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                paddingLeft: "12px",
                paddingRight: "12px",
                paddingTop: "8px",
                paddingBottom: "8px",
                minHeight: "36px",
                borderRadius: "8px",
                backgroundColor: "#013764",
                border: "1px solid white",
                color: "white",
                fontWeight: 500,
                fontSize: "16px",
                cursor: "pointer",
                transition: "background-color 0.2s",
                opacity: viewNoteDraft.trim() ? 1 : 0.5,
              }}
              onMouseEnter={(e) =>
                viewNoteDraft.trim() &&
                (e.currentTarget.style.backgroundColor = "#014777")
              }
              onMouseLeave={(e) =>
                viewNoteDraft.trim() &&
                (e.currentTarget.style.backgroundColor = "#013764")
              }
            >
              Save
            </button>
          </div>
        </div>
      }
    >
      <FormLayout>
        <FormSection showDivider={false}>
          <TextAreaField
            label="Note"
            value={viewNoteDraft}
            onChange={setViewNoteDraft}
            rows={6}
          />
          <div style={{ paddingTop: "12px" }}>
            <div
              style={{
                fontSize: "14px",
                color: "#71717a",
                marginBottom: "4px",
              }}
            >
              <strong>Author:</strong> {note.author}
            </div>
            <div style={{ fontSize: "14px", color: "#71717a" }}>
              <strong>Date:</strong> {note.date}
            </div>
          </div>
        </FormSection>
      </FormLayout>
    </ModalTemplate>
  );
}
