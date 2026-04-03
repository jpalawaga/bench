import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Modal } from "@/components/ui/Modal";
import { repository, type ExerciseHistoryEntry } from "@/db/repository";
import { formatDateTime } from "@/lib/utils";
import type { Exercise } from "@/types/models";

function formatPerformedSets(entry: ExerciseHistoryEntry): string {
  return entry.performedSets
    .map((set) => `${set.actual.reps ?? set.goal.reps}x${set.actual.weight ?? set.goal.weight}`)
    .join(", ");
}

export function ExerciseDetailPage() {
  const { exerciseId } = useParams<{ exerciseId: string }>();
  const navigate = useNavigate();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [name, setName] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [history, setHistory] = useState<ExerciseHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (!exerciseId) return;

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      const [nextExercise, nextHistory] = await Promise.all([
        repository.getExercise(exerciseId),
        repository.getExerciseHistory(exerciseId),
      ]);

      if (cancelled) return;

      if (!nextExercise) {
        navigate("/exercises", { replace: true });
        return;
      }

      setExercise(nextExercise);
      setName(nextExercise.name);
      setFormNotes(nextExercise.formNotes ?? "");
      setHistory(nextHistory);
      setLoading(false);
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [exerciseId, navigate]);

  const hasChanges = useMemo(() => {
    if (!exercise) return false;
    return (
      name.trim() !== exercise.name ||
      formNotes.trim() !== (exercise.formNotes ?? "")
    );
  }, [exercise, formNotes, name]);

  const handleSave = async () => {
    if (!exercise) return;

    const trimmedName = name.trim();
    if (!trimmedName) return;

    const updatedExercise: Exercise = {
      ...exercise,
      name: trimmedName,
      formNotes: formNotes.trim() || undefined,
    };
    await repository.updateExercise(updatedExercise);
    setExercise(updatedExercise);
    setName(updatedExercise.name);
    setFormNotes(updatedExercise.formNotes ?? "");
  };

  const handleDelete = async () => {
    if (!exerciseId) return;

    await repository.deleteExercise(exerciseId);
    navigate("/exercises", { replace: true });
  };

  const handleBack = async () => {
    if (hasChanges && name.trim()) {
      await handleSave();
    }

    navigate("/exercises");
  };

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <p className="text-text-muted">Loading exercise...</p>
      </div>
    );
  }

  if (!exercise) return null;

  return (
    <>
      <div className="min-h-dvh flex flex-col px-4 pt-safe-top pb-safe-bottom">
        <header className="grid min-h-14 grid-cols-[2rem_1fr_2rem] items-center gap-3 py-4">
          <button
            onClick={() => {
              void handleBack();
            }}
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
            Edit Exercise
          </h1>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex h-8 w-8 min-h-0 min-w-0 items-center justify-center rounded-full border border-red-400/40 bg-red-950/55 text-red-200 transition-colors active:bg-red-950/75 active:text-red-100"
            style={{ minHeight: "2rem", minWidth: "2rem" }}
            aria-label="Delete exercise"
          >
            <span className="-mt-px text-xl font-bold leading-none">−</span>
          </button>
        </header>

        <div className="flex flex-1 flex-col gap-5 pb-6">
          <div className="rounded-2xl bg-surface-raised p-4">
            <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-text-secondary">
              Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Exercise name"
              className="mt-2 w-full rounded-lg bg-surface-overlay/70 px-3 py-2.5 text-base text-text-primary placeholder:text-text-muted focus:bg-surface-overlay/85 focus:outline-none"
            />

            <label className="mt-4 block text-xs font-semibold uppercase tracking-[0.14em] text-text-secondary">
              Notes
            </label>
            <textarea
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder="Form cues, setup notes, reminders"
              rows={5}
              className="mt-2 w-full resize-none rounded-lg bg-surface-overlay/70 px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:bg-surface-overlay/85 focus:outline-none"
            />

          </div>

          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-secondary">
              History
            </p>

            {history.length === 0 ? (
              <div className="rounded-2xl bg-surface-raised p-4">
                <p className="text-sm text-text-muted">
                  No completed workouts for this exercise yet.
                </p>
              </div>
            ) : (
              history.map((entry) => (
                <div
                  key={`${entry.workoutId}-${entry.startedAt}`}
                  className="rounded-2xl bg-surface-raised p-4"
                >
                  <p className="text-[11px] uppercase tracking-[0.12em] text-text-muted">
                    {formatDateTime(entry.startedAt)}
                  </p>
                  {entry.isSuperset && (
                    <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-accent">
                      {entry.supersetPartners.length > 0
                        ? `Superset with ${entry.supersetPartners.join(", ")}`
                        : "Superset"}
                    </p>
                  )}
                  <p className="mt-2 text-sm text-text-primary">
                    {formatPerformedSets(entry)}
                  </p>
                  {entry.notes && (
                    <p className="mt-2 text-sm leading-6 text-text-secondary">
                      {entry.notes}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <Modal
        open={showDeleteModal}
        title="Delete Exercise"
        message="Delete this exercise from your library? Historical workouts will remain, but the exercise will no longer appear in the library."
        confirmLabel="Delete"
        confirmVariant="danger"
        onConfirm={() => {
          void handleDelete();
        }}
        onCancel={() => setShowDeleteModal(false)}
      />
    </>
  );
}
