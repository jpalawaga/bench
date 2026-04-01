import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { SetRow } from "@/components/workout/SetRow";
import { useWorkoutStore } from "@/stores/workoutStore";
import { repository } from "@/db/repository";
import { generateId } from "@/lib/utils";
import type { BlockExercise, ExerciseSet, SetGoal } from "@/types/models";

export function GoalSettingView() {
  const pendingExerciseId = useWorkoutStore((s) => s.pendingExerciseId);
  const pendingExerciseName = useWorkoutStore((s) => s.pendingExerciseName);
  const addExerciseToBlock = useWorkoutStore((s) => s.addExerciseToBlock);

  const [sets, setSets] = useState<ExerciseSet[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!pendingExerciseId) return;

    const load = async () => {
      // Check for next-session targets first, then fall back to last actuals
      const targets = await repository.getNextSessionTargets(pendingExerciseId);
      if (targets && targets.length > 0) {
        setSets(
          targets.map((t, i) => ({
            id: generateId(),
            setNumber: i + 1,
            goal: { ...t, isProposed: true, proposalSource: "planned" },
            actual: { reps: null, weight: null },
          })),
        );
        setLoaded(true);
        return;
      }

      const lastActuals = await repository.getLastActuals(pendingExerciseId);
      if (lastActuals && lastActuals.length > 0) {
        setSets(
          lastActuals.map((s, i) => ({
            id: generateId(),
            setNumber: i + 1,
            goal: {
              reps: s.actual.reps ?? s.goal.reps,
              weight: s.actual.weight ?? s.goal.weight,
              isProposed: true,
              proposalSource: "previous",
            },
            actual: { reps: null, weight: null },
          })),
        );
        setLoaded(true);
        return;
      }

      // Default: one empty set
      setSets([
        {
          id: generateId(),
          setNumber: 1,
          goal: { reps: 0, weight: 0, isProposed: false },
          actual: { reps: null, weight: null },
        },
      ]);
      setLoaded(true);
    };

    load();
  }, [pendingExerciseId]);

  const updateSetGoal = (
    index: number,
    field: keyof Pick<SetGoal, "reps" | "weight">,
    value: number,
  ) => {
    setSets((prev) =>
      prev.map((s, i) =>
        i === index
          ? {
              ...s,
              goal: {
                ...s.goal,
                [field]: value,
                isProposed: false,
                proposalSource: undefined,
              },
            }
          : s,
      ),
    );
  };

  const addSet = () => {
    const lastSet = sets[sets.length - 1];
    setSets((prev) => [
      ...prev,
      {
        id: generateId(),
        setNumber: prev.length + 1,
        goal: lastSet
          ? {
              ...lastSet.goal,
              isProposed: false,
              proposalSource: undefined,
            }
          : { reps: 0, weight: 0, isProposed: false },
        actual: { reps: null, weight: null },
      },
    ]);
  };

  const removeSet = (index: number) => {
    setSets((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((s, i) => ({ ...s, setNumber: i + 1 })),
    );
  };

  const handleLockIn = () => {
    if (!pendingExerciseId || !pendingExerciseName) return;
    const exercise: BlockExercise = {
      id: generateId(),
      exerciseId: pendingExerciseId,
      exerciseName: pendingExerciseName,
      sets,
      notes: "",
    };
    addExerciseToBlock(exercise);
  };

  if (!loaded) {
    return (
      <div className="flex items-center justify-center flex-1">
        <p className="text-text-muted">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 flex-1">
      <h2 className="text-xl font-bold text-text-primary">
        {pendingExerciseName}
      </h2>

      <div className="flex flex-col gap-3">
        {sets.map((s, i) => (
          <SetRow
            key={s.id}
            set={s}
            onRepsChange={(reps) => updateSetGoal(i, "reps", reps)}
            onWeightChange={(weight) => updateSetGoal(i, "weight", weight)}
            onRemove={() => removeSet(i)}
            canRemove={sets.length > 1}
          />
        ))}
      </div>

      <button
        onClick={addSet}
        className="text-accent text-sm font-medium py-2 active:opacity-70"
      >
        + Add Set
      </button>

      <div className="mt-auto pb-6">
        <Button fullWidth onClick={handleLockIn}>
          Lock In
        </Button>
      </div>
    </div>
  );
}
