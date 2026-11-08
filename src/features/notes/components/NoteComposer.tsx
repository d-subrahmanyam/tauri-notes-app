import { type FormEvent } from "react";
import { FiLoader, FiPlus } from "react-icons/fi";

type NoteComposerProps = {
  title: string;
  content: string;
  submitting: boolean;
  onTitleChange: (value: string) => void;
  onContentChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function NoteComposer({
  title,
  content,
  submitting,
  onTitleChange,
  onContentChange,
  onSubmit,
}: NoteComposerProps) {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="mb-4 inline-flex items-center gap-2 text-xl font-semibold">
        <FiPlus />
        New Note
      </h2>

      <form className="grid gap-4" onSubmit={onSubmit}>
        <input
          value={title}
          onChange={(event) => onTitleChange(event.currentTarget.value)}
          placeholder="Note title"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none ring-emerald-500 transition focus:ring-2"
        />
        <textarea
          value={content}
          onChange={(event) => onContentChange(event.currentTarget.value)}
          placeholder="Note description"
          rows={4}
          className="w-full resize-y rounded-lg border border-slate-300 px-3 py-2 outline-none ring-emerald-500 transition focus:ring-2"
        />
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex w-fit items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {submitting ? <FiLoader className="animate-spin" /> : <FiPlus />}
          {submitting ? "Creating..." : "Create note"}
        </button>
      </form>
    </section>
  );
}
