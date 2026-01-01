import { useReducer } from "react";

type Modal =
  | null
  | "uploadPhoto"
  | "editProperty"
  | "editRates"
  | "addNote"
  | "addFile"
  | "viewNote"
  | "viewFile";

export interface RecentNote {
  id: number;
  text: string;
  type: string;
  date: string;
  author: string;
}

export interface RecentFile {
  id: number;
  name: string;
  subtitle?: string;
  category: string;
  date: string;
  author: string;
  type: string;
  icon: string;
  url?: string;
}

interface State {
  activeModal: Modal;
  editingSection: "customFields" | "rates" | null;
  selection: {
    noteId: number | null;
    fileId: number | null;
  };
  drafts: {
    viewNote: {
      id: number | null;
      body: string;
    };
    customFields: {
      managementAgreementDate: string;
      inspectionFrequency: string;
    };
    rates: {
      monthlyRate: string;
      defaultRate: string;
      emergencyRate: string;
    };
  };
  lists: {
    recentNotes: RecentNote[];
    recentFiles: RecentFile[];
  };
}

type Action =
  | { type: "OPEN_MODAL"; modal: Exclude<Modal, null> }
  | { type: "CLOSE_MODAL" }
  | { type: "ENTER_EDIT_MODE"; section: "customFields" | "rates" }
  | { type: "EXIT_EDIT_MODE" }
  | { type: "SELECT_NOTE"; noteId: number | null }
  | { type: "SELECT_FILE"; fileId: number | null }
  | { type: "SET_VIEW_NOTE_DRAFT"; id: number | null; body: string }
  | {
      type: "PATCH_CUSTOM_FIELDS";
      patch: Partial<State["drafts"]["customFields"]>;
    }
  | { type: "PATCH_RATES"; patch: Partial<State["drafts"]["rates"]> }
  | { type: "SET_RECENT_NOTES"; notes: RecentNote[] }
  | { type: "SET_RECENT_FILES"; files: RecentFile[] }
  | {
      type: "DELETE_NOTE";
      noteId: number;
    }
  | {
      type: "UPDATE_NOTE";
      noteId: number;
      text: string;
      date: string;
    }
  | {
      type: "ADD_NOTE";
      note: RecentNote;
    }
  | {
      type: "DELETE_FILE";
      fileId: number;
    }
  | {
      type: "ADD_FILE";
      file: RecentFile;
    };

const initialState: State = {
  activeModal: null,
  editingSection: null,
  selection: {
    noteId: null,
    fileId: null,
  },
  drafts: {
    viewNote: {
      id: null,
      body: "",
    },
    customFields: {
      managementAgreementDate: "",
      inspectionFrequency: "Monthly",
    },
    rates: {
      monthlyRate: "$700.00 / month",
      defaultRate: "$60 / hour",
      emergencyRate: "$50 / hour",
    },
  },
  lists: {
    recentNotes: [],
    recentFiles: [],
  },
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "OPEN_MODAL":
      return { ...state, activeModal: action.modal };

    case "CLOSE_MODAL":
      return {
        ...state,
        activeModal: null,
        drafts: {
          ...state.drafts,
          viewNote: { id: null, body: "" },
        },
      };

    case "ENTER_EDIT_MODE":
      return {
        ...state,
        editingSection: action.section,
      };

    case "EXIT_EDIT_MODE":
      return {
        ...state,
        editingSection: null,
      };

    case "SELECT_NOTE":
      return {
        ...state,
        selection: { ...state.selection, noteId: action.noteId },
      };

    case "SELECT_FILE":
      return {
        ...state,
        selection: { ...state.selection, fileId: action.fileId },
      };

    case "SET_VIEW_NOTE_DRAFT":
      return {
        ...state,
        drafts: {
          ...state.drafts,
          viewNote: { id: action.id, body: action.body },
        },
      };

    case "PATCH_CUSTOM_FIELDS":
      return {
        ...state,
        drafts: {
          ...state.drafts,
          customFields: {
            ...state.drafts.customFields,
            ...action.patch,
          },
        },
      };

    case "PATCH_RATES":
      return {
        ...state,
        drafts: {
          ...state.drafts,
          rates: {
            ...state.drafts.rates,
            ...action.patch,
          },
        },
      };

    case "SET_RECENT_NOTES":
      return {
        ...state,
        lists: { ...state.lists, recentNotes: action.notes },
      };

    case "SET_RECENT_FILES":
      return {
        ...state,
        lists: { ...state.lists, recentFiles: action.files },
      };

    case "DELETE_NOTE":
      return {
        ...state,
        lists: {
          ...state.lists,
          recentNotes: state.lists.recentNotes.filter(
            (n) => n.id !== action.noteId
          ),
        },
        selection: { ...state.selection, noteId: null },
      };

    case "UPDATE_NOTE":
      return {
        ...state,
        lists: {
          ...state.lists,
          recentNotes: state.lists.recentNotes.map((n) =>
            n.id === action.noteId
              ? { ...n, text: action.text, date: action.date }
              : n
          ),
        },
      };

    case "ADD_NOTE":
      return {
        ...state,
        lists: {
          ...state.lists,
          recentNotes: [...state.lists.recentNotes, action.note],
        },
      };

    case "DELETE_FILE":
      return {
        ...state,
        lists: {
          ...state.lists,
          recentFiles: state.lists.recentFiles.filter(
            (f) => f.id !== action.fileId
          ),
        },
        selection: { ...state.selection, fileId: null },
      };

    case "ADD_FILE":
      return {
        ...state,
        lists: {
          ...state.lists,
          recentFiles: [...state.lists.recentFiles, action.file],
        },
      };

    default:
      return state;
  }
}

export function usePropertyDetailsState() {
  const [state, dispatch] = useReducer(reducer, initialState);
  return { state, dispatch };
}
