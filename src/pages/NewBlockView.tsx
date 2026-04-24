import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ExerciseCard } from "@/components/workout/ExerciseCard";
import { RestTimerSlider } from "@/components/workout/RestTimerSlider";
import { SuggestedExerciseCard } from "@/components/workout/SuggestedExerciseCard";
import { useWorkoutStore } from "@/stores/workoutStore";
import { repository } from "@/db/repository";
import type { Exercise } from "@/types/models";

const MAX_SUGGESTIONS = 2;

export function NewBlockView() {
  const workout = useWorkoutStore((s) => s.workout);
  const activeBlockIndex = useWorkoutStore((s) => s.activeBlockIndex);
  const setView = useWorkoutStore((s) => s.setView);
  const setRestTimer = useWorkoutStore((s) => s.setRestTimer);
  const startBlock = useWorkoutStore((s) => s.startBlock);
  const removeExerciseFromBlock = useWorkoutStore(
    (s) => s.removeExerciseFromBlock,
  );
  const setPendingExercise = useWorkoutStore((s) => s.setPendingExercise);
  const beginEditingExercise = useWorkoutStore(
    (s) => s.beginEditingExercise,
  );

  const block = workout?.blocks[activeBlockIndex];
  const anchorIdsKey =
    block?.exercises.map((e) => e.exerciseId).join(",") ?? "";
  const workoutExerciseIdsKey = workout
    ? workout.blocks
        .flatMap((b) => b.exercises.map((e) => e.exerciseId))
        .join(",")
    : "";

  const [suggestions, setSuggestions] = useState<Exercise[]>([]);

  useEffect(() => {
    if (!anchorIdsKey) {
      setSuggestions([]);
      return;
    }

    let cancelled = false;
    const anchors = anchorIdsKey.split(",");
    const exclude = workoutExerciseIdsKey
      ? workoutExerciseIdsKey.split(",")
      : [];
    void repository
      .getSupersetSuggestions(anchors, MAX_SUGGESTIONS, exclude)
      .then((next) => {
        if (!cancelled) setSuggestions(next);
      });

    return () => {
      cancelled = true;
    };
  }, [anchorIdsKey, workoutExerciseIdsKey]);

  if (!workout || !block) return null;

  const hasExercises = block.exercises.length > 0;

  return (
    <div className="flex flex-col gap-4 flex-1">
      <Button fullWidth onClick={() => setView("exercise-select")}>
        {hasExercises ? "Create Superset" : "Add Exercise"}
      </Button>

      {!hasExercises ? (
        <p className="text-text-muted text-center mt-8">
          Add an exercise to get started.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {block.exercises.map((ex, index) => (
            <ExerciseCard
              key={ex.id}
              exercise={ex}
              onClick={() => beginEditingExercise(index)}
              onRemove={() => removeExerciseFromBlock(ex.id)}
            />
          ))}
          {suggestions.map((exercise) => (
            <SuggestedExerciseCard
              key={exercise.id}
              exercise={exercise}
              onAdd={() =>
                setPendingExercise(
                  exercise.id,
                  exercise.name,
                  exercise.trackingMode,
                )
              }
            />
          ))}
        </div>
      )}

      <div className="mt-auto flex flex-col gap-4 pb-6">
        {/* Rest Timer Slider */}
        <RestTimerSlider
          value={block.restTimerSeconds}
          onChange={setRestTimer}
        />

        <Button
          fullWidth
          variant="success"
          disabled={!hasExercises}
          onClick={startBlock}
        >
          Start Block
        </Button>
      </div>
    </div>
  );
}
