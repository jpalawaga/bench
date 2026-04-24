import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  GoalSetEditor,
  type EditableSetGoal,
} from "@/components/workout/GoalSetEditor";
import { useWorkoutStore } from "@/stores/workoutStore";
import {
  emptyGoalForMode,
  exerciseSetsToGoals,
  generateId,
  getSetAmount,
  groupConsecutiveSetGoals,
} from "@/lib/utils";
import type { SetGoal, TrackingMode } from "@/types/models";

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
      isProposed: false,
      proposalSource: undefined,
    },
  };
}

function createEditableSetGoals(goals: SetGoal[]): EditableSetGoal[] {
  return renumberEditableSetGoals(
    groupConsecutiveSetGoals(goals).map((goal) =>
      createEditableSetGoal(goal, 0),
    ),
  );
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

function inferModeFromGoals(goals: SetGoal[]): TrackingMode {
  return goals[0]?.mode ?? "strength";
}

export function BlockFinishedView() {
  const workout = useWorkoutStore((s) => s.workout);
  const activeBlockIndex = useWorkoutStore((s) => s.activeBlockIndex);
  const setNextSessionTargets = useWorkoutStore(
    (s) => s.setNextSessionTargets,
  );
  const setView = useWorkoutStore((s) => s.setView);
  const finishWorkout = useWorkoutStore((s) => s.finishWorkout);

  if (!workout) return null;
  const block = workout.blocks[activeBlockIndex];
  if (!block) return null;

  return (
    <div className="flex flex-col gap-6 flex-1">
      <div className="text-center py-4">
        <p className="text-2xl font-bold text-green-400">Block Complete!</p>
        <p className="text-text-secondary mt-1">
          {block.exercises.map((e) => e.exerciseName).join(", ")}
        </p>
      </div>

      {block.exercises.map((ex, ei) => (
        <NextSessionPrompt
          key={ex.id}
          exerciseName={ex.exerciseName}
          savedTargets={ex.nextSessionTargets}
          currentSets={exerciseSetsToGoals(ex.sets)}
          onSave={(targets) => setNextSessionTargets(ei, targets)}
        />
      ))}

      <div className="mt-auto flex flex-col gap-3 pb-6">
        <Button fullWidth onClick={() => setView("block-list")}>
          Continue Workout
        </Button>
        <Button
          fullWidth
          variant="secondary"
          onClick={() => {
            void finishWorkout();
          }}
        >
          Finish Workout
        </Button>
      </div>
    </div>
  );
}

interface NextSessionPromptProps {
  exerciseName: string;
  savedTargets?: SetGoal[];
  currentSets: SetGoal[];
  onSave: (targets: SetGoal[]) => void;
}

function NextSessionPrompt({
  exerciseName,
  savedTargets,
  currentSets,
  onSave,
}: NextSessionPromptProps) {
  const mode = inferModeFromGoals(
    savedTargets && savedTargets.length > 0 ? savedTargets : currentSets,
  );
  const [expanded, setExpanded] = useState(false);
  const [targets, setTargets] = useState<EditableSetGoal[]>(() =>
    createEditableSetGoals(currentSets),
  );
  const hasSavedTargets = Boolean(savedTargets?.length);

  useEffect(() => {
    if (hasSavedTargets && savedTargets) {
      setTargets(createEditableSetGoals(savedTargets));
      return;
    }

    setTargets(createEditableSetGoals(currentSets));
  }, [currentSets, hasSavedTargets, savedTargets]);

  const updateTargetField = (
    index: number,
    updater: (goal: SetGoal) => SetGoal,
  ) => {
    setTargets((prev) =>
      renumberEditableSetGoals(
        prev.map((target, i) =>
          i === index
            ? {
                ...target,
                goal: {
                  ...updater(target.goal),
                  isProposed: false,
                  proposalSource: undefined,
                },
              }
            : target,
        ),
      ),
    );
  };

  const handleRepsChange = (index: number, reps: number) =>
    updateTargetField(index, (goal) =>
      goal.mode === "strength" ? { ...goal, reps } : goal,
    );
  const handleWeightChange = (index: number, weight: number) =>
    updateTargetField(index, (goal) =>
      goal.mode === "strength" ? { ...goal, weight } : goal,
    );
  const handleSecondsChange = (index: number, seconds: number) =>
    updateTargetField(index, (goal) =>
      goal.mode === "cardio" ? { ...goal, seconds } : goal,
    );
  const handleLevelChange = (index: number, level: number) =>
    updateTargetField(index, (goal) =>
      goal.mode === "cardio" ? { ...goal, level } : goal,
    );
  const handleAmountChange = (index: number, amount: number) => {
    setTargets((prev) =>
      renumberEditableSetGoals(
        prev.map((target, i) =>
          i === index
            ? {
                ...target,
                goal: {
                  ...target.goal,
                  amount: Math.max(1, amount),
                  isProposed: false,
                  proposalSource: undefined,
                },
              }
            : target,
        ),
      ),
    );
  };

  const addTarget = () => {
    const lastTarget = targets[targets.length - 1];
    const baseGoal: SetGoal = lastTarget
      ? {
          ...lastTarget.goal,
          amount: 1,
          isProposed: false,
          proposalSource: undefined,
        }
      : emptyGoalForMode(mode);

    setTargets((prev) =>
      renumberEditableSetGoals([
        ...prev,
        createEditableSetGoal(baseGoal, 0),
      ]),
    );
  };

  const removeTarget = (index: number) => {
    setTargets((prev) =>
      renumberEditableSetGoals(prev.filter((_, i) => i !== index)),
    );
  };

  const handleSave = () => {
    onSave(
      groupConsecutiveSetGoals(
        targets.map((target) => ({
          ...target.goal,
          amount: getSetAmount(target.goal),
          isProposed: false,
          proposalSource: undefined,
        })),
      ),
    );
    setExpanded(false);
  };

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="w-full rounded-lg bg-surface-overlay/16 px-3.5 py-3 text-left transition-colors active:bg-surface-overlay/26"
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted">
              For Next Time
            </p>
            <p className="mt-1 font-medium text-text-primary">{exerciseName}</p>
            <div
              className={`mt-1 flex items-center gap-2 text-sm ${
                hasSavedTargets ? "text-green-400" : "text-text-muted"
              }`}
            >
              {hasSavedTargets && (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
              <span>
                {hasSavedTargets ? "Targets set" : "Set optional targets"}
              </span>
            </div>
          </div>

          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="shrink-0 text-text-muted"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
      </button>
    );
  }

  return (
    <div className="rounded-lg bg-surface-overlay/16 px-3.5 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted">
        For Next Time
      </p>
      <p className="mt-1 text-sm font-medium text-text-primary">
        {exerciseName}
      </p>
      <GoalSetEditor
        sets={targets}
        onRepsChange={handleRepsChange}
        onWeightChange={handleWeightChange}
        onSecondsChange={handleSecondsChange}
        onLevelChange={handleLevelChange}
        onAmountChange={handleAmountChange}
        onRemoveSet={removeTarget}
        onAddSet={addTarget}
      />
      <div className="mt-2.5 flex gap-2">
        <Button
          variant="secondary"
          className="flex-1"
          onClick={() => setExpanded(false)}
        >
          Close
        </Button>
        <Button className="flex-1" onClick={handleSave}>
          Save Targets
        </Button>
      </div>
    </div>
  );
}
