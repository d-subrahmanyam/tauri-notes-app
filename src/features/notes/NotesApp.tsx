import { type FormEvent, useEffect, useMemo, useState } from "react";
import { NoteComposer } from "./components/NoteComposer";
import { NoteOverlay } from "./components/NoteOverlay";
import { NotesContent } from "./components/NotesContent";
import { NotesHeader } from "./components/NotesHeader";
import type { Note } from "./types";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  clearToast,
  createNoteRequested,
  loadNotesRequested,
  setContent,
  setTitle,
  toggleCompletedVisibility,
  toggleCompleteRequested,
  updateNoteDetailsRequested,
} from "./notesSlice";

export function NotesApp() {
  const dispatch = useAppDispatch();
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const { notes, title, content, showCompleted, loading, submitting, saving, error, toast } =
    useAppSelector((state) => state.notes);

  const completedCount = useMemo(
    () => notes.filter((note) => note.completed).length,
    [notes],
  );

  useEffect(() => {
    dispatch(loadNotesRequested());
  }, [dispatch]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer = window.setTimeout(() => {
      dispatch(clearToast());
    }, 3000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [dispatch, toast]);

  function handleCreateNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    dispatch(createNoteRequested({ title, content }));
  }

  function handleToggleComplete(note: Note) {
    dispatch(toggleCompleteRequested(note));
  }

  const selectedNote = useMemo(
    () => notes.find((note) => note.id === selectedNoteId) ?? null,
    [notes, selectedNoteId],
  );

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-8 text-slate-900">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <NotesHeader
          totalCount={notes.length}
          completedCount={completedCount}
          showCompleted={showCompleted}
          onToggleCompletedVisibility={() => dispatch(toggleCompletedVisibility())}
        />

        <NoteComposer
          title={title}
          content={content}
          submitting={submitting}
          onTitleChange={(value) => dispatch(setTitle(value))}
          onContentChange={(value) => dispatch(setContent(value))}
          onSubmit={handleCreateNote}
        />

        {error ? (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </p>
        ) : null}

        <NotesContent
          showCompleted={showCompleted}
          loading={loading}
          notes={notes}
          onToggleComplete={handleToggleComplete}
          onOpenNote={(note) => setSelectedNoteId(note.id)}
        />
      </div>

      {selectedNote ? (
        <NoteOverlay
          note={selectedNote}
          saving={saving}
          onSave={({ id, title: nextTitle, content: nextContent }) => {
            dispatch(updateNoteDetailsRequested({ id, title: nextTitle, content: nextContent }));
            setSelectedNoteId(null);
          }}
          onClose={() => setSelectedNoteId(null)}
        />
      ) : null}

      {toast ? (
        <div className="pointer-events-none fixed right-5 top-5 z-[60]">
          <div
            role="status"
            className={`rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg ${
              toast.type === "success" ? "bg-emerald-600" : "bg-rose-600"
            }`}
          >
            {toast.message}
          </div>
        </div>
      ) : null}
    </main>
  );
}
