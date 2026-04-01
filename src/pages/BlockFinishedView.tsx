import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useWorkoutStore } from "@/stores/workoutStore";
import type { SetGoal } from "@/types/models";

export function BlockFinishedView() {
  const workout = useWorkoutStore((s) => s.workout);
  const activeBlockIndex = useWorkoutStore((s) => s.activeBlockIndex);
  const setNextSessionTargets = useWorkoutStore(
    (s) => s.setNextSessionTargets,
  );
  const setView = useWorkoutStore((s) => s.setView);

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
          currentSets={ex.sets.map((s) => ({
            reps: s.actual.reps ?? s.goal.reps,
            weight: s.actual.weight ?? s.goal.weight,
            isProposed: false,
          }))}
          onSave={(targets) => setNextSessionTargets(ei, targets)}
        />
      ))}

      <div className="mt-auto pb-6">
        <Button fullWidth onClick={() => setView("block-list")}>
          Continue Workout
        </Button>
      </div>
    </div>
  );
}

interface NextSessionPromptProps {
  exerciseName: string;
  currentSets: SetGoal[];
  onSave: (targets: SetGoal[]) => void;
}

function NextSessionPrompt({
  exerciseName,
  currentSets,
  onSave,
}: NextSessionPromptProps) {
  const [expanded, setExpanded] = useState(false);
  const [targets, setTargets] = useState<SetGoal[]>(currentSets);

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
        className="w-full text-left rounded-xl bg-surface-raised p-4 active:bg-surface-overlay transition-colors"
      >
        <p className="text-text-primary font-medium">{exerciseName}</p>
        <p className="text-text-muted text-sm mt-1">
          Set targets for next time &rarr;
        </p>
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
            <input
              type="number"
              inputMode="numeric"
              value={t.reps || ""}
              onChange={(e) =>
                updateTarget(i, "reps", Number(e.target.value) || 0)
              }
              placeholder="Reps"
              className="w-16 bg-surface-overlay border border-border rounded-lg px-2 py-2 text-center text-sm text-text-primary focus:outline-none focus:border-accent"
            />
            <span className="text-text-muted text-xs">x</span>
            <input
              type="number"
              inputMode="numeric"
              value={t.weight || ""}
              onChange={(e) =>
                updateTarget(i, "weight", Number(e.target.value) || 0)
              }
              placeholder="lbs"
              className="w-20 bg-surface-overlay border border-border rounded-lg px-2 py-2 text-center text-sm text-text-primary focus:outline-none focus:border-accent"
            />
            <span className="text-text-muted text-xs">lbs</span>
          </div>
        ))}
      </div>
      <div className="flex gap-2 mt-3">
        <Button
          variant="secondary"
          className="flex-1"
          onClick={() => setExpanded(false)}
        >
          Skip
        </Button>
        <Button className="flex-1" onClick={handleSave}>
          Save
        </Button>
      </div>
    </div>
  );
}
