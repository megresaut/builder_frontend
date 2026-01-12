import { useReducer } from "react";
import type { Note } from "@/components/templates";
import type { File } from "@/components/templates";
import type { LinkedTaskData } from "@/components/LinkTaskModal";

export interface TaskSummaryUIState {
  // Tab state
  activeTab: "summary" | "workorders" | "fieldteam";
  selectedWorkOrderId: number | null;

  // Modal open/close states
  modals: {
    addNote: boolean;
    viewNote: boolean;
    addFile: boolean;
    editTaskDetails: boolean;
    editTask: boolean;
    linkTask: boolean;
    pdfViewer: boolean;
  };

  // Editing/selection state
  editingNoteId: number | null;
  editingFileId: number | null;
  viewingNote: Note | null;

  // Attachment/file viewer state
  viewingAttachment: { id?: string; name: string; url: string } | null;
  isRenamingAttachment: boolean;
  renamingAttachmentName: string;

  // Linked tasks
  linkedTasks: LinkedTaskData[];
}

export type TaskSummaryUIAction =
  | { type: "SET_ACTIVE_TAB"; payload: "summary" | "workorders" | "fieldteam" }
  | { type: "SET_SELECTED_WORK_ORDER_ID"; payload: number | null }
  | { type: "OPEN_MODAL"; payload: keyof TaskSummaryUIState["modals"] }
  | { type: "CLOSE_MODAL"; payload: keyof TaskSummaryUIState["modals"] }
  | { type: "CLOSE_ALL_MODALS" }
  | { type: "SET_EDITING_NOTE_ID"; payload: number | null }
  | { type: "SET_EDITING_FILE_ID"; payload: number | null }
  | { type: "SET_VIEWING_NOTE"; payload: Note | null }
  | { type: "SET_VIEWING_ATTACHMENT"; payload: { id?: string; name: string; url: string } | null }
  | { type: "START_RENAMING_ATTACHMENT"; payload: string }
  | { type: "CANCEL_RENAMING_ATTACHMENT" }
  | { type: "SET_RENAMING_ATTACHMENT_NAME"; payload: string }
  | { type: "SET_LINKED_TASKS"; payload: LinkedTaskData[] }
  | { type: "ADD_LINKED_TASK"; payload: LinkedTaskData }
  | { type: "REMOVE_LINKED_TASK"; payload: number };

const initialState: TaskSummaryUIState = {
  activeTab: "summary",
  selectedWorkOrderId: null,

  modals: {
    addNote: false,
    viewNote: false,
    addFile: false,
    editTaskDetails: false,
    editTask: false,
    linkTask: false,
    pdfViewer: false,
  },

  editingNoteId: null,
  editingFileId: null,
  viewingNote: null,

  viewingAttachment: null,
  isRenamingAttachment: false,
  renamingAttachmentName: "",

  linkedTasks: [],
};

const taskSummaryUIReducer = (
  state: TaskSummaryUIState,
  action: TaskSummaryUIAction
): TaskSummaryUIState => {
  switch (action.type) {
    case "SET_ACTIVE_TAB":
      return { ...state, activeTab: action.payload };

    case "SET_SELECTED_WORK_ORDER_ID":
      return { ...state, selectedWorkOrderId: action.payload };

    case "OPEN_MODAL":
      return {
        ...state,
        modals: { ...state.modals, [action.payload]: true },
      };

    case "CLOSE_MODAL":
      // Reset related state when closing modal
      if (action.payload === "addNote") {
        return {
          ...state,
          modals: { ...state.modals, addNote: false },
          editingNoteId: null,
          viewingNote: null,
        };
      }
      if (action.payload === "viewNote") {
        return {
          ...state,
          modals: { ...state.modals, viewNote: false },
          viewingNote: null,
        };
      }
      if (action.payload === "addFile") {
        return {
          ...state,
          modals: { ...state.modals, addFile: false },
          editingFileId: null,
        };
      }
      if (action.payload === "pdfViewer") {
        return {
          ...state,
          modals: { ...state.modals, pdfViewer: false },
          viewingAttachment: null,
          isRenamingAttachment: false,
          renamingAttachmentName: "",
        };
      }
      return {
        ...state,
        modals: { ...state.modals, [action.payload]: false },
      };

    case "CLOSE_ALL_MODALS":
      return {
        ...state,
        modals: {
          addNote: false,
          viewNote: false,
          addFile: false,
          editTaskDetails: false,
          editTask: false,
          linkTask: false,
          pdfViewer: false,
        },
        editingNoteId: null,
        editingFileId: null,
        viewingNote: null,
        viewingAttachment: null,
        isRenamingAttachment: false,
        renamingAttachmentName: "",
      };

    case "SET_EDITING_NOTE_ID":
      return { ...state, editingNoteId: action.payload };

    case "SET_EDITING_FILE_ID":
      return { ...state, editingFileId: action.payload };

    case "SET_VIEWING_NOTE":
      return { ...state, viewingNote: action.payload };

    case "SET_VIEWING_ATTACHMENT":
      return {
        ...state,
        viewingAttachment: action.payload,
        isRenamingAttachment: false,
        renamingAttachmentName: "",
      };

    case "START_RENAMING_ATTACHMENT":
      return {
        ...state,
        isRenamingAttachment: true,
        renamingAttachmentName: action.payload,
      };

    case "CANCEL_RENAMING_ATTACHMENT":
      return {
        ...state,
        isRenamingAttachment: false,
        renamingAttachmentName: "",
      };

    case "SET_RENAMING_ATTACHMENT_NAME":
      return { ...state, renamingAttachmentName: action.payload };

    case "SET_LINKED_TASKS":
      return { ...state, linkedTasks: action.payload };

    case "ADD_LINKED_TASK":
      return {
        ...state,
        linkedTasks: [action.payload, ...state.linkedTasks],
        modals: { ...state.modals, linkTask: false },
      };

    case "REMOVE_LINKED_TASK":
      return {
        ...state,
        linkedTasks: state.linkedTasks.filter((t) => t.id !== action.payload),
      };

    default:
      return state;
  }
};

export const useTaskSummaryUI = (initialActiveTab: "summary" | "workorders" | "fieldteam" = "summary") => {
  const [state, dispatch] = useReducer(taskSummaryUIReducer, {
    ...initialState,
    activeTab: initialActiveTab,
  });

  return { state, dispatch };
};
