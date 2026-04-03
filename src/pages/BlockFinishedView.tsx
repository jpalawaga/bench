import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { WorkoutNumberInput } from "@/components/workout/WorkoutNumberInput";
import { useWorkoutStore } from "@/stores/workoutStore";
import {
  getSetAmount,
  groupConsecutiveSetGoals,
  groupExerciseSetsToGoals,
} from "@/lib/utils";
import type { SetGoal } from "@/types/models";

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
          currentSets={groupExerciseSetsToGoals(ex.sets)}
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

function getEditableTargets(targets: SetGoal[]): SetGoal[] {
  return groupConsecutiveSetGoals(targets).map((target) => ({
    ...target,
    amount: getSetAmount(target),
    isProposed: false,
    proposalSource: undefined,
  }));
}

function NextSessionPrompt({
  exerciseName,
  savedTargets,
  currentSets,
  onSave,
}: NextSessionPromptProps) {
  const [expanded, setExpanded] = useState(false);
  const [targets, setTargets] = useState<SetGoal[]>(() =>
    getEditableTargets(currentSets),
  );
  const hasSavedTargets = Boolean(savedTargets?.length);

  useEffect(() => {
    if (hasSavedTargets && savedTargets) {
      setTargets(getEditableTargets(savedTargets));
      return;
    }

    setTargets(getEditableTargets(currentSets));
  }, [currentSets, hasSavedTargets, savedTargets]);

  const updateTarget = (
    index: number,
    field: "reps" | "weight",
    value: number,
  ) => {
    setTargets((prev) =>
      prev.map((t, i) => (i === index ? { ...t, [field]: value } : t)),
    );
  };

  const handleSave = () => {
    onSave(targets);
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
      <div className="flex flex-col gap-2">
        {targets.map((t, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-text-muted text-sm w-8">S{i + 1}</span>
            <WorkoutNumberInput
              value={t.reps || null}
              onChange={(value) => updateTarget(i, "reps", value ?? 0)}
              placeholder="Reps"
              min={0}
              className="h-9 w-16 rounded-sm bg-surface-overlay/70 px-1.5 py-1 text-center text-sm text-text-primary focus:bg-surface-overlay/85 focus:outline-none"
            />
            <span className="text-text-muted text-xs">x</span>
            <WorkoutNumberInput
              value={t.weight || null}
              onChange={(value) => updateTarget(i, "weight", value ?? 0)}
              placeholder="lbs"
              className="h-9 w-20 rounded-sm bg-surface-overlay/70 px-1.5 py-1 text-center text-sm text-text-primary focus:bg-surface-overlay/85 focus:outline-none"
            />
            <span className="text-text-muted text-xs">lbs</span>
            <select
              value={getSetAmount(t)}
              onChange={(e) =>
                setTargets((prev) =>
                  prev.map((target, index) =>
                    index === i
                      ? {
                          ...target,
                          amount: Number(e.target.value),
                        }
                      : target,
                  ),
                )
              }
              className="h-9 w-18 rounded-sm bg-surface-overlay/70 px-1.5 py-1 text-center text-sm text-text-primary focus:bg-surface-overlay/85 focus:outline-none"
            >
              {Array.from({ length: 8 }, (_, index) => index + 1).map((amount) => (
                <option key={amount} value={amount}>
                  x{amount}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
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
