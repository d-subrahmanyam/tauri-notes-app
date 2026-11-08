import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Note } from "./types";

type ToastState = {
  type: "success" | "error";
  message: string;
};

type NotesState = {
  notes: Note[];
  title: string;
  content: string;
  showCompleted: boolean;
  loading: boolean;
  submitting: boolean;
  saving: boolean;
  error: string | null;
  toast: ToastState | null;
};

const initialState: NotesState = {
  notes: [],
  title: "",
  content: "",
  showCompleted: true,
  loading: true,
  submitting: false,
  saving: false,
  error: null,
  toast: null,
};

export const notesSlice = createSlice({
  name: "notes",
  initialState,
  reducers: {
    loadNotesRequested(state) {
      state.loading = true;
      state.error = null;
    },
    loadNotesSucceeded(state, action: PayloadAction<Note[]>) {
      state.notes = action.payload;
      state.loading = false;
    },
    loadNotesFailed(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
    setTitle(state, action: PayloadAction<string>) {
      state.title = action.payload;
    },
    setContent(state, action: PayloadAction<string>) {
      state.content = action.payload;
    },
    toggleCompletedVisibility(state) {
      state.showCompleted = !state.showCompleted;
    },
    createNoteRequested(state, _action: PayloadAction<{ title: string; content: string }>) {
      state.submitting = true;
      state.error = null;
    },
    createNoteSucceeded(state, action: PayloadAction<Note>) {
      state.notes = [action.payload, ...state.notes];
      state.submitting = false;
      state.title = "";
      state.content = "";
    },
    createNoteFailed(state, action: PayloadAction<string>) {
      state.submitting = false;
      state.error = action.payload;
    },
    updateNoteDetailsRequested(
      state,
      _action: PayloadAction<{ id: string; title: string; content: string }>,
    ) {
      state.saving = true;
      state.error = null;
      state.toast = null;
    },
    updateNoteDetailsSucceeded(state, action: PayloadAction<Note>) {
      state.notes = state.notes.map((note) =>
        note.id === action.payload.id ? action.payload : note,
      );
      state.saving = false;
      state.toast = {
        type: "success",
        message: "Note updated successfully.",
      };
    },
    updateNoteDetailsFailed(state, action: PayloadAction<string>) {
      state.saving = false;
      state.toast = {
        type: "error",
        message: action.payload,
      };
    },
    toggleCompleteRequested(state, _action: PayloadAction<Note>) {
      state.error = null;
    },
    toggleCompleteSucceeded(state, action: PayloadAction<Note>) {
      state.notes = state.notes.map((note) =>
        note.id === action.payload.id ? action.payload : note,
      );
    },
    toggleCompleteFailed(state, action: PayloadAction<string>) {
      state.error = action.payload;
    },
    clearToast(state) {
      state.toast = null;
    },
  },
});

export const {
  loadNotesRequested,
  loadNotesSucceeded,
  loadNotesFailed,
  setTitle,
  setContent,
  toggleCompletedVisibility,
  createNoteRequested,
  createNoteSucceeded,
  createNoteFailed,
  updateNoteDetailsRequested,
  updateNoteDetailsSucceeded,
  updateNoteDetailsFailed,
  toggleCompleteRequested,
  toggleCompleteSucceeded,
  toggleCompleteFailed,
  clearToast,
} = notesSlice.actions;

export const notesReducer = notesSlice.reducer;
