import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  GoalSetEditor,
  type EditableSetGoal,
} from "@/components/workout/GoalSetEditor";
import { useWorkoutStore } from "@/stores/workoutStore";
import {
  exerciseSetsToGoals,
  expandSetGoals,
  generateId,
} from "@/lib/utils";
import type { SetGoal } from "@/types/models";

function createEditableSetGoal(
  goal: SetGoal,
  setNumber: number,
): EditableSetGoal {
  return {
    id: generateId(),
    setNumber,
    goal: {
      ...goal,
      amount: 1,
      isProposed: false,
      proposalSource: undefined,
    },
  };
}

function createEditableSetGoals(goals: SetGoal[]): EditableSetGoal[] {
  return expandSetGoals(goals).map((goal, index) =>
    createEditableSetGoal(goal, index + 1),
  );
}

function renumberEditableSetGoals(
  sets: EditableSetGoal[],
): EditableSetGoal[] {
  return sets.map((set, index) => ({
    ...set,
    setNumber: index + 1,
  }));
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

      {/* Next session targets per exercise */}
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

  const updateTarget = (
    index: number,
    field: "reps" | "weight",
    value: number,
  ) => {
    setTargets((prev) =>
      prev.map((target, i) =>
        i === index
          ? {
              ...target,
              goal: {
                ...target.goal,
                [field]: value,
                amount: 1,
                isProposed: false,
                proposalSource: undefined,
              },
            }
          : target,
      ),
    );
  };

  const addTarget = () => {
    const lastTarget = targets[targets.length - 1];

    setTargets((prev) => [
      ...prev,
      createEditableSetGoal(
        lastTarget
          ? {
              ...lastTarget.goal,
              amount: 1,
              isProposed: false,
              proposalSource: undefined,
            }
          : { reps: 0, weight: 0, amount: 1, isProposed: false },
        prev.length + 1,
      ),
    ]);
  };

  const removeTarget = (index: number) => {
    setTargets((prev) =>
      renumberEditableSetGoals(prev.filter((_, i) => i !== index)),
    );
  };

  const handleSave = () => {
    onSave(
      targets.map((target) => ({
        ...target.goal,
        amount: 1,
        isProposed: false,
        proposalSource: undefined,
      })),
    );
    setExpanded(false);
  };

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="w-full rounded-xl bg-surface-raised p-4 text-left transition-colors active:bg-surface-overlay"
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-medium text-text-primary">{exerciseName}</p>
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
    <div className="rounded-xl bg-surface-raised p-4">
      <p className="text-text-primary font-medium mb-3">
        {exerciseName} — Next Time
      </p>
      <GoalSetEditor
        sets={targets}
        onRepsChange={(index, reps) => updateTarget(index, "reps", reps)}
        onWeightChange={(index, weight) => updateTarget(index, "weight", weight)}
        onRemoveSet={removeTarget}
        onAddSet={addTarget}
      />
      <div className="flex gap-2 mt-3">
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
