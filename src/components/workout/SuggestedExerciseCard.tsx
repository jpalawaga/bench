import type { Exercise } from "@/types/models";

interface SuggestedExerciseCardProps {
  exercise: Exercise;
  onAdd: () => void;
}

export function SuggestedExerciseCard({
  exercise,
  onAdd,
}: SuggestedExerciseCardProps) {
  return (
    <button
      onClick={onAdd}
      aria-label={`Superset ${exercise.name}`}
      className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-border/60 bg-surface-raised/40 p-4 text-left transition-colors active:bg-surface-raised/60"
    >
      <div className="min-w-0">
        <p className="truncate font-medium text-text-secondary/80">
          {exercise.name}
        </p>
        {exercise.muscleGroup && (
          <p className="mt-1 truncate text-xs text-text-muted">
            {exercise.muscleGroup}
          </p>
        )}
      </div>
      <span className="shrink-0 rounded-full bg-surface-overlay/60 px-3 py-1 text-xs font-semibold text-white/90">
        + Superset
      </span>
    </button>
  );
}
