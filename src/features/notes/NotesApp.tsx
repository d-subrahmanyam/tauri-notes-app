import { type FormEvent, useEffect, useMemo, useState } from "react";
import { FiCalendar } from "react-icons/fi";
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
  setTargetCompletionAt,
  setTitle,
  toggleCompletedVisibility,
  toggleCompleteRequested,
  updateNoteDetailsRequested,
} from "./notesSlice";

export function NotesApp() {
  const dispatch = useAppDispatch();
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [pendingFilter, setPendingFilter] = useState<"all" | "today" | "custom">("all");
  const [customFilterDate, setCustomFilterDate] = useState("");
  const {
    notes,
    title,
    content,
    targetCompletionAt,
    showCompleted,
    loading,
    submitting,
    saving,
    error,
    toast,
  } = useAppSelector((state) => state.notes);

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
    dispatch(createNoteRequested({ title, content, targetCompletionAt }));
  }

  function handleToggleComplete(note: Note) {
    dispatch(toggleCompleteRequested(note));
  }

  const selectedNote = useMemo(
    () => notes.find((note) => note.id === selectedNoteId) ?? null,
    [notes, selectedNoteId],
  );

  const notesToDisplay = useMemo(() => {
    if (pendingFilter === "all") {
      return notes;
    }

    if (pendingFilter === "custom" && !customFilterDate) {
      return [];
    }

    const targetDate = new Date();
    if (pendingFilter === "custom" && customFilterDate) {
      targetDate.setTime(new Date(`${customFilterDate}T23:59:59`).getTime());
    } else {
      targetDate.setHours(23, 59, 59, 999);
    }

    return notes.filter((note) => {
      if (note.completed) {
        return false;
      }
      const dueAt = new Date(note.target_completion_at);
      return dueAt.getTime() <= targetDate.getTime();
    });
  }, [customFilterDate, notes, pendingFilter]);

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
          targetCompletionAt={targetCompletionAt}
          submitting={submitting}
          onTitleChange={(value) => dispatch(setTitle(value))}
          onContentChange={(value) => dispatch(setContent(value))}
          onTargetCompletionAtChange={(value) => dispatch(setTargetCompletionAt(value))}
          onSubmit={handleCreateNote}
        />

        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
            <FiCalendar />
            Pending filter
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={pendingFilter}
              onChange={(event) =>
                setPendingFilter(event.currentTarget.value as "all" | "today" | "custom")
              }
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-emerald-500 transition focus:ring-2"
            >
              <option value="all">All notes</option>
              <option value="today">Pending by today</option>
              <option value="custom">Pending by custom date</option>
            </select>

            {pendingFilter === "custom" ? (
              <input
                type="date"
                aria-label="Pending custom date"
                value={customFilterDate}
                onChange={(event) => setCustomFilterDate(event.currentTarget.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-emerald-500 transition focus:ring-2"
              />
            ) : null}
          </div>
        </section>

        {error ? (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </p>
        ) : null}

        {pendingFilter === "custom" && !customFilterDate ? (
          <section className="rounded-2xl bg-white p-6 text-center text-sm text-slate-600 shadow-sm">
            Pick a custom date to view pending notes.
          </section>
        ) : null}

        <NotesContent
          showCompleted={showCompleted}
          loading={loading}
          notes={notesToDisplay}
          onToggleComplete={handleToggleComplete}
          onOpenNote={(note) => setSelectedNoteId(note.id)}
        />
      </div>

      {selectedNote ? (
        <NoteOverlay
          note={selectedNote}
          saving={saving}
          onSave={({ id, title: nextTitle, content: nextContent, targetCompletionAt: dueAt }) => {
            dispatch(
              updateNoteDetailsRequested({
                id,
                title: nextTitle,
                content: nextContent,
                targetCompletionAt: dueAt,
              }),
            );
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
