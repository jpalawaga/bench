import { Button } from "@/components/ui/Button";
import { ExerciseCard } from "@/components/workout/ExerciseCard";
import { RestTimerSlider } from "@/components/workout/RestTimerSlider";
import { useWorkoutStore } from "@/stores/workoutStore";

export function NewBlockView() {
  const workout = useWorkoutStore((s) => s.workout);
  const activeBlockIndex = useWorkoutStore((s) => s.activeBlockIndex);
  const setView = useWorkoutStore((s) => s.setView);
  const setRestTimer = useWorkoutStore((s) => s.setRestTimer);
  const startBlock = useWorkoutStore((s) => s.startBlock);
  const removeExerciseFromBlock = useWorkoutStore(
    (s) => s.removeExerciseFromBlock,
  );

  if (!workout) return null;
  const block = workout.blocks[activeBlockIndex];
  if (!block) return null;

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
          {block.exercises.map((ex) => (
            <ExerciseCard
              key={ex.id}
              exercise={ex}
              onClick={() => {}}
              onRemove={() => removeExerciseFromBlock(ex.id)}
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
