import { RestTimer } from "@/components/workout/RestTimer";
import { TabBar } from "@/components/ui/TabBar";
import { Button } from "@/components/ui/Button";
import { useWorkoutStore } from "@/stores/workoutStore";

export function BlockInProgressView() {
  const workout = useWorkoutStore((s) => s.workout);
  const activeBlockIndex = useWorkoutStore((s) => s.activeBlockIndex);
  const activeExerciseTabIndex = useWorkoutStore(
    (s) => s.activeExerciseTabIndex,
  );
  const recordActual = useWorkoutStore((s) => s.recordActual);
  const addSetToExercise = useWorkoutStore((s) => s.addSetToExercise);
  const removeSetFromExercise = useWorkoutStore(
    (s) => s.removeSetFromExercise,
  );
  const finishBlock = useWorkoutStore((s) => s.finishBlock);
  const updateExerciseNotes = useWorkoutStore((s) => s.updateExerciseNotes);

  const setTabIndex = (index: number) =>
    useWorkoutStore.setState({ activeExerciseTabIndex: index });

  if (!workout) return null;
  const block = workout.blocks[activeBlockIndex];
  if (!block) return null;

  const exerciseNames = block.exercises.map((e) => e.exerciseName);
  const activeExercise = block.exercises[activeExerciseTabIndex];

  return (
    <div className="flex flex-col gap-4 flex-1">
      {/* Rest Timer */}
      {block.restTimerSeconds != null && block.restTimerSeconds > 0 && (
        <RestTimer durationSeconds={block.restTimerSeconds} />
      )}

      {/* Exercise Tabs (for supersets) */}
      <TabBar
        tabs={exerciseNames}
        activeIndex={activeExerciseTabIndex}
        onTabChange={setTabIndex}
      />

      {/* Active Exercise */}
      {activeExercise && (
        <div className="flex flex-col gap-3 flex-1">
          <h2 className="text-lg font-bold text-text-primary">
            {activeExercise.exerciseName}
          </h2>

          {/* Set rows */}
          <div className="flex flex-col gap-2">
            {/* Header */}
            <div className="flex items-center gap-2 text-text-muted text-xs px-1">
              <span className="w-8">Set</span>
              <span className="w-16 text-center">Goal</span>
              <span className="w-4" />
              <span className="flex-1 text-center">Actual</span>
              <span className="w-6" />
            </div>

            {activeExercise.sets.map((set, si) => {
              const isFilled =
                set.actual.reps != null && set.actual.weight != null;

              return (
                <div key={set.id} className="flex items-center gap-2">
                  {/* Quick-fill check: copies goal into actuals */}
                  <button
                    onClick={() =>
                      recordActual(
                        activeExerciseTabIndex,
                        si,
                        set.goal.reps,
                        set.goal.weight,
                      )
                    }
                    className={`
                      p-1 min-h-0 shrink-0 rounded-full transition-colors
                      ${isFilled ? "text-green-400" : "text-text-muted active:text-green-400"}
                    `}
                  >
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </button>

                  <span className="text-text-muted text-sm w-8 shrink-0">
                    S{set.setNumber}
                  </span>

                  {/* Goal (read-only) */}
                  <span className="text-text-muted text-sm w-16 text-center shrink-0">
                    {set.goal.reps}x{set.goal.weight}
                  </span>

                  <span className="text-text-muted text-xs shrink-0">
                    &rarr;
                  </span>

                  {/* Actual (editable) */}
                  <div className="flex items-center gap-1 flex-1">
                    <input
                      type="number"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={set.actual.reps ?? ""}
                      onChange={(e) =>
                        recordActual(
                          activeExerciseTabIndex,
                          si,
                          e.target.value ? Number(e.target.value) : null,
                          set.actual.weight,
                        )
                      }
                      placeholder={String(set.goal.reps)}
                      className="w-14 bg-surface-raised border border-border rounded-lg px-2 py-2 text-center text-base text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
                    />
                    <span className="text-text-muted text-sm">x</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={set.actual.weight ?? ""}
                      onChange={(e) =>
                        recordActual(
                          activeExerciseTabIndex,
                          si,
                          set.actual.reps,
                          e.target.value ? Number(e.target.value) : null,
                        )
                      }
                      placeholder={String(set.goal.weight)}
                      className="w-18 bg-surface-raised border border-border rounded-lg px-2 py-2 text-center text-base text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
                    />
                  </div>

                  {/* Remove set */}
                  {activeExercise.sets.length > 1 && (
                    <button
                      onClick={() =>
                        removeSetFromExercise(activeExerciseTabIndex, si)
                      }
                      className="text-text-muted active:text-danger p-1 min-h-0 shrink-0"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <button
            onClick={() => addSetToExercise(activeExerciseTabIndex)}
            className="text-accent text-sm font-medium py-2 active:opacity-70"
          >
            + Add Set
          </button>

          {/* Notes */}
          <div className="mt-2">
            <textarea
              value={activeExercise.notes}
              onChange={(e) =>
                updateExerciseNotes(activeExerciseTabIndex, e.target.value)
              }
              placeholder="Notes (optional)"
              rows={2}
              className="w-full bg-surface-raised border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent resize-none"
            />
          </div>
        </div>
      )}

      <div className="mt-auto pb-6">
        <Button fullWidth variant="secondary" onClick={finishBlock}>
          Finish Block
        </Button>
      </div>
    </div>
  );
}
