import { FiCheckCircle, FiClock, FiFileText } from "react-icons/fi";
import ReactMarkdown from "react-markdown";
import type { Note } from "../types";

type NoteCardProps = {
  note: Note;
  onToggleComplete: (note: Note) => void;
  onOpen: (note: Note) => void;
};

export function NoteCard({ note, onToggleComplete, onOpen }: NoteCardProps) {
  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onOpen(note)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen(note);
        }
      }}
      className={`w-[240px] rounded-2xl border p-5 shadow-sm transition ${
        note.completed ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white"
      }`}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <h3
          className={`max-w-[120px] truncate text-lg font-semibold ${
            note.completed ? "text-emerald-900 line-through" : "text-slate-900"
          }`}
          title={note.title}
        >
          {note.title}
        </h3>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onToggleComplete(note);
          }}
          aria-label={note.completed ? "Completed" : "Mark completed"}
          title={note.completed ? "Completed" : "Mark completed"}
          className={`inline-flex items-center rounded-lg p-2 text-sm font-medium transition ${
            note.completed
              ? "bg-emerald-600 text-white hover:bg-emerald-700"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          <FiCheckCircle />
        </button>
      </div>

      <div
        className={`mb-4 max-h-12 overflow-hidden text-sm ${
          note.completed ? "text-emerald-800" : "text-slate-700"
        }`}
        title={note.content}
      >
        <ReactMarkdown>{note.content}</ReactMarkdown>
      </div>

      <p className="inline-flex items-center gap-1 text-xs text-slate-500">
        <FiClock />
        Due {new Date(note.target_completion_at).toLocaleString()}
      </p>

      <p className="mt-1 inline-flex items-center gap-1 text-xs text-slate-500">
        <FiFileText />
        Updated {new Date(note.updated_at).toLocaleString()}
      </p>
    </article>
  );
}
