import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { SearchInput } from "@/components/ui/SearchInput";
import { repository } from "@/db/repository";
import type { Exercise } from "@/types/models";

export function ExerciseLibraryPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      const nextExercises = query.trim()
        ? await repository.searchExercises(query)
        : await repository.getAllExercises();

      if (!cancelled) {
        setExercises(nextExercises);
        setLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [query]);

  return (
    <div className="min-h-dvh flex flex-col px-4 pt-safe-top pb-safe-bottom">
      <header className="grid min-h-14 grid-cols-[2rem_1fr] items-center gap-3 py-4">
        <button
          onClick={() => navigate("/")}
          className="flex h-8 w-8 min-h-0 items-center justify-center text-text-secondary active:text-text-primary"
          aria-label="Back"
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
        <h1 className="truncate text-xl leading-none font-bold text-text-primary">
          Exercise Library
        </h1>
      </header>

      <SearchInput
        value={query}
        onChange={setQuery}
        placeholder="Search exercises..."
        autoFocus={false}
      />

      <div className="mt-5 flex flex-1 flex-col gap-3">
        {loading ? (
          <p className="mt-8 text-center text-text-muted">Loading...</p>
        ) : exercises.length === 0 ? (
          <p className="mt-8 text-center text-text-muted">
            No exercises found.
          </p>
        ) : (
          exercises.map((exercise) => (
            <button
              key={exercise.id}
              onClick={() => navigate(`/exercises/${exercise.id}`)}
              className="w-full rounded-xl bg-surface-raised p-4 text-left transition-colors active:bg-surface-overlay"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-text-primary">
                    {exercise.name}
                  </p>
                  {exercise.formNotes && (
                    <p className="mt-1 line-clamp-2 text-sm text-text-secondary">
                      {exercise.formNotes}
                    </p>
                  )}
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
          ))
        )}
      </div>
    </div>
  );
}
