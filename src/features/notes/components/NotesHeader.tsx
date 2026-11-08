import { FiEye, FiEyeOff } from "react-icons/fi";

type NotesHeaderProps = {
  totalCount: number;
  completedCount: number;
  showCompleted: boolean;
  onToggleCompletedVisibility: () => void;
};

export function NotesHeader({
  totalCount,
  completedCount,
  showCompleted,
  onToggleCompletedVisibility,
}: NotesHeaderProps) {
  return (
    <header className="flex items-center justify-between gap-3 rounded-2xl bg-white p-6 shadow-sm">
      <div>
        <h1 className="text-3xl font-semibold">Jot Notes</h1>
        <p className="text-sm text-slate-600">
          {completedCount} of {totalCount} notes completed
        </p>
      </div>

      <button
        type="button"
        onClick={onToggleCompletedVisibility}
        aria-label={showCompleted ? "Hide completed notes" : "Show completed notes"}
        title={showCompleted ? "Hide completed notes" : "Show completed notes"}
        className={`inline-flex items-center rounded-lg border px-4 py-2 text-sm font-medium transition ${
          showCompleted
            ? "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-200"
            : "border-indigo-300 bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
        }`}
      >
        {showCompleted ? <FiEyeOff /> : <FiEye />}
      </button>
    </header>
  );
}
