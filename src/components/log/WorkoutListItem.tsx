import type { Workout } from "@/types/models";
import { formatDate, formatDuration } from "@/lib/utils";

interface WorkoutListItemProps {
  workout: Workout;
  onClick: () => void;
}

export function WorkoutListItem({ workout, onClick }: WorkoutListItemProps) {
  const exerciseNames = workout.blocks
    .flatMap((b) => b.exercises.map((e) => e.exerciseName))
    .filter(Boolean);

  const uniqueExercises = [...new Set(exerciseNames)];
  const summary =
    uniqueExercises.length > 0
      ? uniqueExercises.slice(0, 3).join(", ") +
        (uniqueExercises.length > 3
          ? ` +${uniqueExercises.length - 3} more`
          : "")
      : "No exercises";

  const duration =
    workout.completedAt != null
      ? formatDuration(workout.startedAt, workout.completedAt)
      : "In progress";

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-xl bg-surface-raised p-4 active:bg-surface-overlay transition-colors"
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-text-primary font-semibold">
          {formatDate(workout.startedAt)}
        </span>
        <span className="text-text-muted text-sm">{duration}</span>
      </div>
      <p className="text-text-secondary text-sm">{summary}</p>
    </button>
  );
}
