import type { Note } from "../types";
import { NoteCard } from "./NoteCard";

type NotesContentProps = {
  showCompleted: boolean;
  loading: boolean;
  notes: Note[];
  onToggleComplete: (note: Note) => void;
  onOpenNote: (note: Note) => void;
};

export function NotesContent({
  showCompleted,
  loading,
  notes,
  onToggleComplete,
  onOpenNote,
}: NotesContentProps) {
  if (loading) {
    return (
      <section className="rounded-2xl bg-white p-8 text-center text-slate-600 shadow-sm">
        Loading notes...
      </section>
    );
  }

  if (notes.length === 0) {
    return (
      <section className="rounded-2xl bg-white p-8 text-center text-slate-600 shadow-sm">
        No notes yet. Create one to get started.
      </section>
    );
  }

  const visibleNotes = showCompleted ? notes : notes.filter((note) => !note.completed);
  if (visibleNotes.length === 0) {
    return (
      <section className="rounded-2xl bg-white p-8 text-center text-slate-600 shadow-sm">
        Completed notes are hidden. Show completed notes to view them.
      </section>
    );
  }

  return (
    <section className="grid grid-cols-[repeat(auto-fit,minmax(240px,240px))] justify-center gap-4">
      {visibleNotes.map((note) => (
        <NoteCard
          key={note.id}
          note={note}
          onToggleComplete={onToggleComplete}
          onOpen={onOpenNote}
        />
      ))}
    </section>
  );
}
