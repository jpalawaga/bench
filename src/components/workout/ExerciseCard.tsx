import type { BlockExercise } from "@/types/models";

interface ExerciseCardProps {
  exercise: BlockExercise;
  onClick: () => void;
  onRemove?: () => void;
}

export function ExerciseCard({
  exercise,
  onClick,
  onRemove,
}: ExerciseCardProps) {
  const setsSummary = exercise.sets
    .map((s) => `${s.goal.reps}x${s.goal.weight}`)
    .join(", ");

  return (
    <div className="flex items-start gap-3 rounded-xl bg-surface-raised p-4">
      <button
        onClick={onClick}
        className="min-w-0 flex-1 text-left transition-colors active:opacity-80"
      >
        <p className="font-semibold text-text-primary">
          {exercise.exerciseName}
        </p>
        <p className="mt-1 text-sm text-text-secondary">
          {exercise.sets.length} set{exercise.sets.length !== 1 ? "s" : ""}
          {setsSummary ? ` — ${setsSummary}` : ""}
        </p>
      </button>

      {onRemove && (
        <button
          onClick={onRemove}
          className="flex h-8 w-8 min-h-0 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors active:bg-surface-overlay active:text-danger"
          aria-label={`Remove ${exercise.exerciseName}`}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </div>
  );
}
