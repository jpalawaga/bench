import type { BlockExercise } from "@/types/models";

interface ExerciseCardProps {
  exercise: BlockExercise;
  onClick: () => void;
}

export function ExerciseCard({ exercise, onClick }: ExerciseCardProps) {
  const setsSummary = exercise.sets
    .map((s) => `${s.goal.reps}x${s.goal.weight}`)
    .join(", ");

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-xl bg-surface-raised p-4 active:bg-surface-overlay transition-colors"
    >
      <p className="text-text-primary font-semibold">
        {exercise.exerciseName}
      </p>
      <p className="text-text-secondary text-sm mt-1">
        {exercise.sets.length} set{exercise.sets.length !== 1 ? "s" : ""}
        {setsSummary ? ` — ${setsSummary}` : ""}
      </p>
    </button>
  );
}
