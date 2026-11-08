import { type FormEvent, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  FiCode,
  FiEdit3,
  FiEye,
  FiHash,
  FiLink,
  FiList,
  FiMessageSquare,
  FiSave,
  FiType,
  FiX,
} from "react-icons/fi";
import { MdFormatBold, MdFormatItalic } from "react-icons/md";
import type { Note } from "../types";

type NoteOverlayProps = {
  note: Note;
  saving: boolean;
  onSave: (payload: { id: string; title: string; content: string }) => void;
  onClose: () => void;
};

export function NoteOverlay({ note, saving, onSave, onClose }: NoteOverlayProps) {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [mode, setMode] = useState<"write" | "preview">("write");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setTitle(note.title);
    setContent(note.content);
    setMode("write");
  }, [note.id, note.title, note.content]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSave({ id: note.id, title, content });
  }

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  function applyWrap(prefix: string, suffix = prefix, placeholder = "text") {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.slice(start, end) || placeholder;
    const nextValue = `${content.slice(0, start)}${prefix}${selected}${suffix}${content.slice(end)}`;
    setContent(nextValue);

    requestAnimationFrame(() => {
      textarea.focus();
      const cursor = start + prefix.length + selected.length + suffix.length;
      textarea.setSelectionRange(cursor, cursor);
    });
  }

  function applyLinePrefix(prefix: string) {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.slice(start, end);
    const replacement = selected
      ? selected
          .split("\n")
          .map((line) => `${prefix}${line}`)
          .join("\n")
      : `${prefix}item`;
    const nextValue = `${content.slice(0, start)}${replacement}${content.slice(end)}`;
    setContent(nextValue);

    requestAnimationFrame(() => {
      textarea.focus();
      const cursor = start + replacement.length;
      textarea.setSelectionRange(cursor, cursor);
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
      onClick={onClose}
    >
      <section
        className="relative h-full w-full overflow-y-auto rounded-2xl bg-white p-6 shadow-xl sm:h-auto sm:max-h-[90vh] sm:max-w-3xl"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          aria-label="Close note details"
        >
          <FiX className="text-xl" />
        </button>

        <form className="grid gap-4" onSubmit={handleSubmit}>
          <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700" htmlFor="overlay-title">
            <FiType />
            <span>Title</span>
          </label>
          <input
            id="overlay-title"
            value={title}
            onChange={(event) => setTitle(event.currentTarget.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none ring-emerald-500 transition focus:ring-2"
          />

          <div className="flex flex-wrap items-center justify-between gap-2">
            <label
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-700"
              htmlFor="overlay-markdown"
            >
              <FiEdit3 />
              <span>Description (Markdown)</span>
            </label>

            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
              <button
                type="button"
                onClick={() => setMode("write")}
                className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ${
                  mode === "write" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"
                }`}
              >
                <FiEdit3 />
                Write
              </button>
              <button
                type="button"
                onClick={() => setMode("preview")}
                className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ${
                  mode === "preview" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"
                }`}
              >
                <FiEye />
                Preview
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2 text-slate-700">
            <button
              type="button"
              aria-label="Bold"
              title="Bold"
              onClick={() => applyWrap("**")}
              className="rounded-md p-2 transition hover:bg-slate-200"
            >
              <MdFormatBold />
            </button>
            <button
              type="button"
              aria-label="Italic"
              title="Italic"
              onClick={() => applyWrap("*")}
              className="rounded-md p-2 transition hover:bg-slate-200"
            >
              <MdFormatItalic />
            </button>
            <button
              type="button"
              aria-label="Heading"
              title="Heading"
              onClick={() => applyLinePrefix("# ")}
              className="rounded-md p-2 transition hover:bg-slate-200"
            >
              <FiHash />
            </button>
            <button
              type="button"
              aria-label="List"
              title="List"
              onClick={() => applyLinePrefix("- ")}
              className="rounded-md p-2 transition hover:bg-slate-200"
            >
              <FiList />
            </button>
            <button
              type="button"
              aria-label="Quote"
              title="Quote"
              onClick={() => applyLinePrefix("> ")}
              className="rounded-md p-2 transition hover:bg-slate-200"
            >
              <FiMessageSquare />
            </button>
            <button
              type="button"
              aria-label="Code"
              title="Code"
              onClick={() => applyWrap("`")}
              className="rounded-md p-2 transition hover:bg-slate-200"
            >
              <FiCode />
            </button>
            <button
              type="button"
              aria-label="Link"
              title="Link"
              onClick={() => applyWrap("[", "](https://example.com)", "text")}
              className="rounded-md p-2 transition hover:bg-slate-200"
            >
              <FiLink />
            </button>
          </div>

          {mode === "write" ? (
            <textarea
              id="overlay-markdown"
              ref={textareaRef}
              value={content}
              onChange={(event) => setContent(event.currentTarget.value)}
              rows={10}
              className="w-full resize-y rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm outline-none ring-emerald-500 transition focus:ring-2"
            />
          ) : (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="mb-2 inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                <FiEye />
                Markdown Preview
              </p>
              <div className="max-w-none whitespace-pre-wrap break-words text-sm text-slate-700">
                <ReactMarkdown>{content || "_No content_"}</ReactMarkdown>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              aria-label="Discard changes"
              title="Discard changes"
              className="rounded-lg border border-slate-300 p-2 text-slate-700 transition hover:bg-slate-100"
            >
              <FiX className="text-lg" />
            </button>
            <button
              type="submit"
              disabled={saving}
              aria-label="Save changes"
              title="Save changes"
              className="rounded-lg bg-emerald-600 p-2 text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <FiSave className="text-lg" />
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
