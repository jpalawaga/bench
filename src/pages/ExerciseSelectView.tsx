import { useState, useEffect } from "react";
import { SearchInput } from "@/components/ui/SearchInput";
import { useExercises } from "@/hooks/useExercises";
import { useWorkoutStore } from "@/stores/workoutStore";
import { repository } from "@/db/repository";
import { generateId } from "@/lib/utils";
import type { Exercise } from "@/types/models";

export function ExerciseSelectView() {
  const [query, setQuery] = useState("");
  const [creatingCustom, setCreatingCustom] = useState(false);
  const [customName, setCustomName] = useState("");
  const [frequentExercises, setFrequentExercises] = useState<Exercise[]>([]);
  const { exercises, loading } = useExercises(query);
  const setPendingExercise = useWorkoutStore((s) => s.setPendingExercise);

  useEffect(() => {
    repository.getFrequentExercises(8).then(setFrequentExercises);
  }, []);

  const handleSelect = (id: string, name: string) => {
    setPendingExercise(id, name);
  };

  const handleCreateCustom = async () => {
    if (!customName.trim()) return;
    const exercise = {
      id: generateId(),
      name: customName.trim(),
      isCustom: true,
    };
    await repository.addExercise(exercise);
    setPendingExercise(exercise.id, exercise.name);
  };

  const isSearching = query.trim().length > 0;
  const showFrequent = !isSearching && frequentExercises.length > 0;

  // When showing frequent exercises, filter them out of the main list to avoid dupes
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
            {/* My Exercises — frequent */}
            {showFrequent && (
              <>
                <p className="text-text-secondary text-xs font-semibold uppercase tracking-wider px-4 pt-2 pb-1">
                  My Exercises
                </p>
                {frequentExercises.map((ex) => (
                  <ExerciseRow
                    key={ex.id}
                    exercise={ex}
                    onSelect={handleSelect}
                  />
                ))}

                <p className="text-text-secondary text-xs font-semibold uppercase tracking-wider px-4 pt-4 pb-1">
                  All Exercises
                </p>
              </>
            )}

            {/* All / search results */}
            {filteredExercises.map((ex) => (
              <ExerciseRow
                key={ex.id}
                exercise={ex}
                onSelect={handleSelect}
              />
            ))}

            {/* Create custom exercise */}
            {creatingCustom ? (
              <div className="px-4 py-3 flex items-center gap-2">
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
                <button
                  onClick={handleCreateCustom}
                  disabled={!customName.trim()}
                  className="bg-accent text-white px-4 py-2 rounded-lg text-sm font-medium
                    disabled:opacity-40 active:bg-accent-hover min-h-0"
                >
                  Add
                </button>
              </div>
            ) : (
              <button
                onClick={() => setCreatingCustom(true)}
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
  onSelect,
}: {
  exercise: Exercise;
  onSelect: (id: string, name: string) => void;
}) {
  return (
    <button
      onClick={() => onSelect(exercise.id, exercise.name)}
      className="w-full text-left px-4 py-3 rounded-lg active:bg-surface-overlay transition-colors"
    >
      <span className="text-text-primary">{exercise.name}</span>
      {exercise.muscleGroup && (
        <span className="text-text-muted text-sm ml-2">
          {exercise.muscleGroup}
        </span>
      )}
    </button>
  );
}
