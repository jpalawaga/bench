import { useState, useEffect } from "react";
import { SearchInput } from "@/components/ui/SearchInput";
import { useExercises } from "@/hooks/useExercises";
import { useWorkoutStore } from "@/stores/workoutStore";
import { repository } from "@/db/repository";
import { formatMonthDay, generateId } from "@/lib/utils";
import type { Exercise, ID, TrackingMode } from "@/types/models";

export function ExerciseSelectView() {
  const [query, setQuery] = useState("");
  const [creatingCustom, setCreatingCustom] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customMode, setCustomMode] = useState<TrackingMode>("strength");
  const [frequentExercises, setFrequentExercises] = useState<Exercise[]>([]);
  const [lastPerformedDates, setLastPerformedDates] = useState<
    Record<ID, number>
  >({});
  const { exercises, loading } = useExercises(query);
  const setPendingExercise = useWorkoutStore((s) => s.setPendingExercise);

  useEffect(() => {
    repository.getFrequentExercises(8).then(setFrequentExercises);
    repository.getLastPerformedDates().then(setLastPerformedDates);
  }, []);

  const handleSelect = (exercise: Exercise) => {
    setPendingExercise(exercise.id, exercise.name, exercise.trackingMode);
  };

  const handleCreateCustom = async () => {
    if (!customName.trim()) return;
    const exercise: Exercise = {
      id: generateId(),
      name: customName.trim(),
      isCustom: true,
      trackingMode: customMode,
    };
    await repository.addExercise(exercise);
    setPendingExercise(exercise.id, exercise.name, exercise.trackingMode);
  };

  const isSearching = query.trim().length > 0;
  const showFrequent = !isSearching && frequentExercises.length > 0;

  const frequentIds = new Set(frequentExercises.map((e) => e.id));
  const filteredExercises = showFrequent
    ? exercises.filter((e) => !frequentIds.has(e.id))
    : exercises;

  return (
    <div className="flex flex-col gap-4 flex-1">
      <SearchInput
        value={query}
        onChange={setQuery}
        placeholder="Search exercises..."
      />

      <div className="flex flex-col gap-1 flex-1 overflow-y-auto">
        {loading ? (
          <p className="text-text-muted text-center mt-4">Loading...</p>
        ) : (
          <>
            {showFrequent && (
              <>
                <p className="text-text-secondary text-xs font-semibold uppercase tracking-wider px-4 pt-2 pb-1">
                  My Exercises
                </p>
                {frequentExercises.map((ex) => (
                  <ExerciseRow
                    key={ex.id}
                    exercise={ex}
                    lastPerformedAt={lastPerformedDates[ex.id]}
                    onSelect={handleSelect}
                  />
                ))}

                <p className="text-text-secondary text-xs font-semibold uppercase tracking-wider px-4 pt-4 pb-1">
                  All Exercises
                </p>
              </>
            )}

            {filteredExercises.map((ex) => (
              <ExerciseRow
                key={ex.id}
                exercise={ex}
                lastPerformedAt={lastPerformedDates[ex.id]}
                onSelect={handleSelect}
              />
            ))}

            {creatingCustom ? (
              <div className="px-4 py-3 flex flex-col gap-2">
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Exercise name"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleCreateCustom()}
                  className="flex-1 bg-surface-raised border border-border rounded-lg
                    px-3 py-2 text-base text-text-primary
                    placeholder:text-text-muted focus:outline-none focus:border-accent"
                />
                <div className="flex items-center gap-2">
                  <div
                    role="radiogroup"
                    aria-label="Tracking mode"
                    className="flex flex-1 items-center rounded-lg bg-surface-overlay/30 p-1 text-sm"
                  >
                    <button
                      type="button"
                      role="radio"
                      aria-checked={customMode === "strength"}
                      onClick={() => setCustomMode("strength")}
                      className={`flex-1 rounded-md px-3 py-1.5 font-medium transition-colors ${
                        customMode === "strength"
                          ? "bg-surface-raised text-text-primary"
                          : "text-text-muted active:text-text-primary"
                      }`}
                    >
                      Reps × Weight
                    </button>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={customMode === "cardio"}
                      onClick={() => setCustomMode("cardio")}
                      className={`flex-1 rounded-md px-3 py-1.5 font-medium transition-colors ${
                        customMode === "cardio"
                          ? "bg-surface-raised text-text-primary"
                          : "text-text-muted active:text-text-primary"
                      }`}
                    >
                      Time × Level
                    </button>
                  </div>
                  <button
                    onClick={handleCreateCustom}
                    disabled={!customName.trim()}
                    className="bg-accent text-white px-4 py-2 rounded-lg text-sm font-medium
                      disabled:opacity-40 active:bg-accent-hover min-h-0"
                  >
                    Add
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => {
                  const seed = query.trim();
                  if (seed) setCustomName(seed);
                  setCreatingCustom(true);
                }}
                className="w-full text-left px-4 py-3 rounded-lg active:bg-surface-overlay transition-colors"
              >
                <span className="text-accent">+ Create Custom Exercise</span>
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ExerciseRow({
  exercise,
  lastPerformedAt,
  onSelect,
}: {
  exercise: Exercise;
  lastPerformedAt?: number;
  onSelect: (exercise: Exercise) => void;
}) {
  return (
    <button
      onClick={() => onSelect(exercise)}
      className="w-full text-left px-4 py-3 rounded-lg active:bg-surface-overlay transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="text-text-primary">{exercise.name}</span>
          {exercise.muscleGroup && (
            <span className="ml-2 text-sm text-text-muted">
              {exercise.muscleGroup}
            </span>
          )}
        </div>

        {lastPerformedAt != null && (
          <span className="shrink-0 pt-0.5 text-xs text-text-muted/80">
            {formatMonthDay(lastPerformedAt)}
          </span>
        )}
      </div>
    </button>
  );
}
