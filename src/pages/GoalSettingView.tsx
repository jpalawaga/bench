import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  GoalSetEditor,
  type EditableSetGoal,
} from "@/components/workout/GoalSetEditor";
import { useWorkoutStore } from "@/stores/workoutStore";
import { repository } from "@/db/repository";
import {
  emptyActualForMode,
  emptyGoalForMode,
  exerciseSetsToGoals,
  expandSetGoals,
  generateId,
  getSetAmount,
  groupConsecutiveSetGoals,
} from "@/lib/utils";
import type {
  BlockExercise,
  CardioSetGoal,
  SetGoal,
  StrengthSetGoal,
  TrackingMode,
} from "@/types/models";

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

function toProposedGoals(
  goals: SetGoal[],
  source: "planned" | "previous",
): SetGoal[] {
  return goals.map((goal) => ({
    ...goal,
    isProposed: true,
    proposalSource: source,
  }));
}

export function GoalSettingView() {
  const pendingExerciseId = useWorkoutStore((s) => s.pendingExerciseId);
  const pendingExerciseName = useWorkoutStore((s) => s.pendingExerciseName);
  const pendingExerciseMode = useWorkoutStore((s) => s.pendingExerciseMode);
  const editingExerciseIndex = useWorkoutStore(
    (s) => s.editingExerciseIndex,
  );
  const editingExercise = useWorkoutStore((s) => {
    if (s.editingExerciseIndex == null || !s.workout) return null;
    const block = s.workout.blocks[s.activeBlockIndex];
    return block?.exercises[s.editingExerciseIndex] ?? null;
  });
  const addExerciseToBlock = useWorkoutStore((s) => s.addExerciseToBlock);
  const updateExerciseSetsInBlock = useWorkoutStore(
    (s) => s.updateExerciseSetsInBlock,
  );
  const isEditing = editingExerciseIndex != null;

  const [sets, setSets] = useState<EditableSetGoal[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!pendingExerciseId || !pendingExerciseMode) return;
    setLoaded(false);
    const mode = pendingExerciseMode;

    if (isEditing && editingExercise) {
      // Seed rows directly from the existing configured sets so the user
      // sees what they previously locked in, not a new suggestion pass.
      const existingGoals = exerciseSetsToGoals(editingExercise.sets);
      setSets(toEditableSetGoals(existingGoals));
      setLoaded(true);
      return;
    }

    const load = async () => {
      const targets = await repository.getNextSessionTargets(
        pendingExerciseId,
        mode,
      );
      if (targets && targets.length > 0) {
        setSets(toEditableSetGoals(toProposedGoals(targets, "planned")));
        setLoaded(true);
        return;
      }

      const lastActuals = await repository.getLastActuals(
        pendingExerciseId,
        mode,
      );
      if (lastActuals && lastActuals.length > 0) {
        const goals: SetGoal[] = lastActuals.map((set) => {
          if (set.goal.mode === "strength" && set.actual.mode === "strength") {
            return {
              mode: "strength",
              reps: set.actual.reps ?? set.goal.reps,
              weight: set.actual.weight ?? set.goal.weight,
              amount: 1,
              isProposed: true,
              proposalSource: "previous",
            } satisfies StrengthSetGoal;
          }
          if (set.goal.mode === "cardio" && set.actual.mode === "cardio") {
            return {
              mode: "cardio",
              seconds: set.actual.seconds ?? set.goal.seconds,
              level: set.actual.level ?? set.goal.level,
              amount: 1,
              isProposed: true,
              proposalSource: "previous",
            } satisfies CardioSetGoal;
          }
          return { ...set.goal, amount: 1, isProposed: true, proposalSource: "previous" };
        });

        setSets(toEditableSetGoals(groupConsecutiveSetGoals(goals)));
        setLoaded(true);
        return;
      }

      setSets([createEditableSetGoal(emptyGoalForMode(mode), 0)]);
      setLoaded(true);
    };

    void load();
  }, [pendingExerciseId, pendingExerciseMode, isEditing, editingExercise]);

  const updateSetGoalField = (
    index: number,
    updater: (goal: SetGoal) => SetGoal,
  ) => {
    setSets((prev) =>
      renumberEditableSetGoals(
        prev.map((s, i) =>
          i === index
            ? {
                ...s,
                goal: {
                  ...updater(s.goal),
                  isProposed: false,
                  proposalSource: undefined,
                },
              }
            : s,
        ),
      ),
    );
  };

  const handleRepsChange = (index: number, reps: number) =>
    updateSetGoalField(index, (goal) =>
      goal.mode === "strength" ? { ...goal, reps } : goal,
    );
  const handleWeightChange = (index: number, weight: number) =>
    updateSetGoalField(index, (goal) =>
      goal.mode === "strength" ? { ...goal, weight } : goal,
    );
  const handleSecondsChange = (index: number, seconds: number) =>
    updateSetGoalField(index, (goal) =>
      goal.mode === "cardio" ? { ...goal, seconds } : goal,
    );
  const handleLevelChange = (index: number, level: number) =>
    updateSetGoalField(index, (goal) =>
      goal.mode === "cardio" ? { ...goal, level } : goal,
    );
  const handleAmountChange = (index: number, amount: number) => {
    setSets((prev) =>
      renumberEditableSetGoals(
        prev.map((s, i) =>
          i === index
            ? {
                ...s,
                goal: {
                  ...s.goal,
                  amount: Math.max(1, amount),
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
    if (!pendingExerciseMode) return;
    const lastSet = sets[sets.length - 1];
    const baseGoal: SetGoal = lastSet
      ? {
          ...lastSet.goal,
          amount: 1,
          isProposed: false,
          proposalSource: undefined,
        }
      : emptyGoalForMode(pendingExerciseMode);

    setSets((prev) =>
      renumberEditableSetGoals([
        ...prev,
        createEditableSetGoal(baseGoal, 0),
      ]),
    );
  };

  const removeSet = (index: number) => {
    setSets((prev) => renumberEditableSetGoals(prev.filter((_, i) => i !== index)));
  };

  const handleLockIn = () => {
    if (!pendingExerciseId || !pendingExerciseName || !pendingExerciseMode) {
      return;
    }
    const mode: TrackingMode = pendingExerciseMode;
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
      actual: emptyActualForMode(mode),
    }));

    if (isEditing && editingExerciseIndex != null) {
      updateExerciseSetsInBlock(editingExerciseIndex, finalizedSets);
      return;
    }

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
        onRepsChange={handleRepsChange}
        onWeightChange={handleWeightChange}
        onSecondsChange={handleSecondsChange}
        onLevelChange={handleLevelChange}
        onAmountChange={handleAmountChange}
        onRemoveSet={removeSet}
        onAddSet={addSet}
      />

      <div className="mt-auto pb-6">
        <Button fullWidth onClick={handleLockIn}>
          {isEditing ? "Save" : "Lock In"}
        </Button>
      </div>
    </div>
  );
}
