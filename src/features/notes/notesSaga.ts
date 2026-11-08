import { call, put, takeEvery, takeLatest } from "redux-saga/effects";
import { createNote, listNotes, updateNote } from "./noteApi";
import type { Note } from "./types";
import {
  createNoteFailed,
  createNoteRequested,
  createNoteSucceeded,
  loadNotesFailed,
  loadNotesRequested,
  loadNotesSucceeded,
  toggleCompleteFailed,
  toggleCompleteRequested,
  toggleCompleteSucceeded,
  updateNoteDetailsFailed,
  updateNoteDetailsRequested,
  updateNoteDetailsSucceeded,
} from "./notesSlice";

function* loadNotesWorker() {
  try {
    const notes: Note[] = yield call(listNotes);
    yield put(loadNotesSucceeded(notes));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load notes";
    yield put(loadNotesFailed(message));
  }
}

function* createNoteWorker(action: ReturnType<typeof createNoteRequested>) {
  const title = action.payload.title.trim();
  const content = action.payload.content.trim();

  if (!title || !content) {
    yield put(createNoteFailed("Title and description are required."));
    return;
  }

  try {
    const created: Note = yield call(createNote, { title, content });
    yield put(createNoteSucceeded(created));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create note";
    yield put(createNoteFailed(message));
  }
}

function* toggleCompleteWorker(action: ReturnType<typeof toggleCompleteRequested>) {
  const note = action.payload;

  try {
    const updated: Note = yield call(updateNote, note.id, {
      completed: !note.completed,
    });
    yield put(toggleCompleteSucceeded(updated));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update note";
    yield put(toggleCompleteFailed(message));
  }
}

function* updateNoteDetailsWorker(action: ReturnType<typeof updateNoteDetailsRequested>) {
  const title = action.payload.title.trim();
  const content = action.payload.content.trim();

  if (!title || !content) {
    yield put(updateNoteDetailsFailed("Title and description are required."));
    return;
  }

  try {
    const updated: Note = yield call(updateNote, action.payload.id, {
      title,
      content,
    });
    yield put(updateNoteDetailsSucceeded(updated));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update note";
    yield put(updateNoteDetailsFailed(message));
  }
}

export function* notesSaga() {
  yield takeLatest(loadNotesRequested.type, loadNotesWorker);
  yield takeLatest(createNoteRequested.type, createNoteWorker);
  yield takeLatest(updateNoteDetailsRequested.type, updateNoteDetailsWorker);
  yield takeEvery(toggleCompleteRequested.type, toggleCompleteWorker);
}
