import { useState } from "react";
import type { Workout } from "@/types/models";
import {
  formatActualMetrics,
  formatDate,
  formatDuration,
  formatGoalMetrics,
  formatWorkoutForClipboard,
} from "@/lib/utils";
import { Button } from "@/components/ui/Button";

interface WorkoutDetailProps {
  workout: Workout;
  onDelete: () => void;
  onClose: () => void;
}

export function WorkoutDetail({
  workout,
  onDelete,
  onClose,
}: WorkoutDetailProps) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">(
    "idle",
  );
  const duration =
    workout.completedAt != null
      ? formatDuration(workout.startedAt, workout.completedAt)
      : "In progress";

  const handleCopyWorkout = async () => {
    try {
      await navigator.clipboard.writeText(formatWorkoutForClipboard(workout));
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
  };

  return (
    <div className="min-h-dvh flex flex-col px-4 pt-safe-top pb-safe-bottom">
      <header className="py-4 flex items-center gap-3">
        <button
          onClick={onClose}
          className="text-text-secondary active:text-text-primary p-1 -ml-1 min-h-0"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 className="text-xl font-bold text-text-primary">
          {formatDate(workout.startedAt)}
        </h1>
        <span className="text-text-muted text-sm ml-auto">{duration}</span>
      </header>

      <div className="flex flex-col gap-4 flex-1">
        {workout.blocks.length === 0 ? (
          <p className="text-text-muted text-center mt-8">
            No exercises recorded.
          </p>
        ) : (
          workout.blocks.map((block) => (
            <div
              key={block.id}
              className="rounded-xl bg-surface-raised p-4"
            >
              <p className="text-text-muted text-xs mb-2">
                Block {block.order}
              </p>
              {block.exercises.map((ex) => (
                <div key={ex.id} className="mb-3 last:mb-0">
                  <p className="text-text-primary font-semibold">
                    {ex.exerciseName}
                  </p>
                  <div className="mt-1 flex flex-col gap-1">
                    {ex.sets.map((set) => (
                      <div
                        key={set.id}
                        className="flex items-center gap-2 text-sm"
                      >
                        <span className="text-text-muted w-8">
                          S{set.setNumber}
                        </span>
                        <span className="text-text-secondary">
                          Goal: {formatGoalMetrics(set.goal)}
                        </span>
                        <span className="text-text-muted">&rarr;</span>
                        <span className="text-text-primary">
                          {formatActualMetrics(set.actual, set.goal)}
                        </span>
                      </div>
                    ))}
                  </div>
                  {ex.notes && (
                    <p className="text-text-muted text-xs mt-1 italic">
                      {ex.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      <div className="mt-auto flex flex-col gap-3 py-6">
        {workout.completedAt != null && (
          <Button fullWidth onClick={() => void handleCopyWorkout()}>
            {copyState === "copied"
              ? "Copied Workout"
              : copyState === "error"
                ? "Copy Failed"
                : "Copy Workout"}
          </Button>
        )}
        <Button fullWidth variant="danger" onClick={onDelete}>
          Delete Workout
        </Button>
      </div>
    </div>
  );
}
