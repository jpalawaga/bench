import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  GoalSetEditor,
  type EditableSetGoal,
} from "@/components/workout/GoalSetEditor";
import { useWorkoutStore } from "@/stores/workoutStore";
import { repository } from "@/db/repository";
import {
  expandSetGoals,
  generateId,
  getSetAmount,
  groupConsecutiveSetGoals,
} from "@/lib/utils";
import type { BlockExercise, SetGoal } from "@/types/models";

function createEditableSetGoal(
  goal: SetGoal,
  setNumber: number,
): EditableSetGoal {
  return {
    id: generateId(),
    setNumber,
    goal: {
      ...goal,
      amount: getSetAmount(goal),
    },
  };
}

function renumberEditableSetGoals(
  sets: EditableSetGoal[],
): EditableSetGoal[] {
  let nextSetNumber = 1;

  return sets.map((set) => {
    const amount = getSetAmount(set.goal);
    const renumberedSet = {
      ...set,
      setNumber: nextSetNumber,
      goal: {
        ...set.goal,
        amount,
      },
    };

    nextSetNumber += amount;
    return renumberedSet;
  });
}

function toEditableSetGoals(goals: SetGoal[]): EditableSetGoal[] {
  return renumberEditableSetGoals(
    groupConsecutiveSetGoals(goals).map((goal) =>
      createEditableSetGoal(goal, 0),
    ),
  );
}

export function GoalSettingView() {
  const pendingExerciseId = useWorkoutStore((s) => s.pendingExerciseId);
  const pendingExerciseName = useWorkoutStore((s) => s.pendingExerciseName);
  const addExerciseToBlock = useWorkoutStore((s) => s.addExerciseToBlock);

  const [sets, setSets] = useState<EditableSetGoal[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!pendingExerciseId) return;
    setLoaded(false);

    const load = async () => {
      // Check for next-session targets first, then fall back to last actuals
      const targets = await repository.getNextSessionTargets(pendingExerciseId);
      if (targets && targets.length > 0) {
        setSets(
          toEditableSetGoals(
            targets.map((target) => ({
              ...target,
              isProposed: true,
              proposalSource: "planned",
            })),
          ),
        );
        setLoaded(true);
        return;
      }

      const lastActuals = await repository.getLastActuals(pendingExerciseId);
      if (lastActuals && lastActuals.length > 0) {
        setSets(
          toEditableSetGoals(
            groupConsecutiveSetGoals(
              lastActuals.map((s) => ({
                reps: s.actual.reps ?? s.goal.reps,
                weight: s.actual.weight ?? s.goal.weight,
                amount: 1,
                isProposed: true,
                proposalSource: "previous",
              })),
            ),
          ),
        );
        setLoaded(true);
        return;
      }

      // Default: one empty set
      setSets([
        createEditableSetGoal(
          { reps: 0, weight: 0, amount: 1, isProposed: false },
          0,
        ),
      ]);
      setLoaded(true);
    };

    void load();
  }, [pendingExerciseId]);

  const updateSetGoal = (
    index: number,
    field: keyof Pick<SetGoal, "reps" | "weight" | "amount">,
    value: number,
  ) => {
    setSets((prev) =>
      renumberEditableSetGoals(
        prev.map((s, i) =>
          i === index
            ? {
                ...s,
                goal: {
                  ...s.goal,
                  [field]:
                    field === "amount" ? Math.max(1, value) : value,
                  isProposed: false,
                  proposalSource: undefined,
                },
              }
            : s,
        ),
      ),
    );
  };

  const addSet = () => {
    const lastSet = sets[sets.length - 1];
    setSets((prev) =>
      renumberEditableSetGoals([
        ...prev,
        createEditableSetGoal(
          lastSet
            ? {
                ...lastSet.goal,
                amount: 1,
                isProposed: false,
                proposalSource: undefined,
              }
            : { reps: 0, weight: 0, amount: 1, isProposed: false },
          0,
        ),
      ]),
    );
  };

  const removeSet = (index: number) => {
    setSets((prev) => renumberEditableSetGoals(prev.filter((_, i) => i !== index)));
  };

  const handleLockIn = () => {
    if (!pendingExerciseId || !pendingExerciseName) return;
    const finalizedGoals = expandSetGoals(
      sets.map((set) => ({
        ...set.goal,
        amount: getSetAmount(set.goal),
      })),
    );
    const finalizedSets = finalizedGoals.map((goal, index) => ({
        id: generateId(),
        setNumber: index + 1,
        goal: { ...goal, amount: 1 },
        actual: { reps: null, weight: null },
    }));
    const exercise: BlockExercise = {
      id: generateId(),
      exerciseId: pendingExerciseId,
      exerciseName: pendingExerciseName,
      sets: finalizedSets,
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

      <GoalSetEditor
        sets={sets}
        onRepsChange={(index, reps) => updateSetGoal(index, "reps", reps)}
        onWeightChange={(index, weight) =>
          updateSetGoal(index, "weight", weight)
        }
        onAmountChange={(index, amount) =>
          updateSetGoal(index, "amount", amount)
        }
        onRemoveSet={removeSet}
        onAddSet={addSet}
      />

      <div className="mt-auto pb-6">
        <Button fullWidth onClick={handleLockIn}>
          Lock In
        </Button>
      </div>
    </div>
  );
}
