import { useEffect, useState } from "react";
import { RestTimer } from "@/components/workout/RestTimer";
import { RestTimerSlider } from "@/components/workout/RestTimerSlider";
import { TabBar } from "@/components/ui/TabBar";
import { Button } from "@/components/ui/Button";
import { useWorkoutStore } from "@/stores/workoutStore";
import {
  repository,
  type ExerciseNoteHistoryEntry,
} from "@/db/repository";
import { formatDateTime } from "@/lib/utils";

type NotesMode = "hidden" | "view" | "edit";

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
  const setRestTimer = useWorkoutStore((s) => s.setRestTimer);
  const finishBlock = useWorkoutStore((s) => s.finishBlock);
  const updateExerciseNotes = useWorkoutStore((s) => s.updateExerciseNotes);
  const [recentNotes, setRecentNotes] = useState<ExerciseNoteHistoryEntry[]>([]);
  const [timerStartSignal, setTimerStartSignal] = useState(0);
  const [showTimerConfigurator, setShowTimerConfigurator] = useState(false);
  const [notesMode, setNotesMode] = useState<NotesMode>("hidden");
  const [seenNotesByExerciseId, setSeenNotesByExerciseId] = useState<
    Record<string, boolean>
  >({});

  const setTabIndex = (index: number) =>
    useWorkoutStore.setState({ activeExerciseTabIndex: index });

  const block = workout?.blocks[activeBlockIndex];
  const exerciseNames = block?.exercises.map((e) => e.exerciseName) ?? [];
  const activeExercise = block?.exercises[activeExerciseTabIndex];
  const hasRestTimer = (block?.restTimerSeconds ?? 0) > 0;
  const hasExerciseNotes = Boolean(activeExercise?.notes.trim());
  const hasSeenNotes = activeExercise
    ? Boolean(seenNotesByExerciseId[activeExercise.exerciseId])
    : false;

  useEffect(() => {
    if (!activeExercise?.exerciseId) {
      setRecentNotes([]);
      return;
    }

    let cancelled = false;

    void repository
      .getRecentExerciseNotes(activeExercise.exerciseId, 2)
      .then((entries) => {
        if (!cancelled) {
          setRecentNotes(entries);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeExercise?.exerciseId]);

  useEffect(() => {
    setNotesMode("hidden");
  }, [activeExercise?.exerciseId]);

  useEffect(() => {
    if (hasRestTimer) {
      setShowTimerConfigurator(false);
    }
  }, [hasRestTimer]);

  if (!workout || !block) return null;

  const markNotesSeen = () => {
    if (!activeExercise) return;
    setSeenNotesByExerciseId((prev) => ({
      ...prev,
      [activeExercise.exerciseId]: true,
    }));
  };

  const handleNotesButtonClick = () => {
    if (!activeExercise) return;

    if (notesMode !== "hidden") {
      setNotesMode("hidden");
      return;
    }

    if (activeExercise.notes.trim()) {
      markNotesSeen();
      setNotesMode("view");
      return;
    }

    setNotesMode("edit");
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="sticky top-0 z-10 -mx-4 flex flex-col gap-3 bg-surface/95 px-4 pb-3 backdrop-blur-sm">
        {/* Rest Timer */}
        <RestTimer
          durationSeconds={block.restTimerSeconds ?? 0}
          autoStartSignal={timerStartSignal}
          onConfigureRequested={() => setShowTimerConfigurator(true)}
        />

        {showTimerConfigurator && (
          <div className="rounded-2xl border border-border bg-surface-raised/95 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-text-primary">
                Rest Timer
              </p>
              <button
                onClick={() => setShowTimerConfigurator(false)}
                className="text-xs font-medium uppercase tracking-[0.14em] text-text-muted active:text-text-primary"
              >
                Close
              </button>
            </div>
            <RestTimerSlider
              value={block.restTimerSeconds}
              onChange={setRestTimer}
            />
          </div>
        )}

        {/* Exercise Tabs (for supersets) */}
        <TabBar
          tabs={exerciseNames}
          activeIndex={activeExerciseTabIndex}
          onTabChange={setTabIndex}
        />
      </div>

      {/* Active Exercise */}
      {activeExercise && (
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pb-6">
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-lg font-bold text-text-primary">
              {activeExercise.exerciseName}
            </h2>

            <button
              onClick={handleNotesButtonClick}
              className={`flex items-center gap-2 text-sm transition-colors ${
                hasExerciseNotes ? "text-text-primary" : "text-text-secondary"
              }`}
            >
              {hasExerciseNotes && !hasSeenNotes && (
                <span className="h-2 w-2 rounded-full bg-orange-400" />
              )}
              <span>Notes &gt;</span>
            </button>
          </div>

          {notesMode !== "hidden" && (
            <div className="relative rounded-2xl bg-surface-raised/95 p-4 shadow-[0_18px_48px_rgba(0,0,0,0.3)]">
              <div className="absolute -top-2 right-7 h-4 w-4 rotate-45 border-l border-t border-border bg-surface-raised/95" />

              {notesMode === "view" ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm leading-6 text-text-secondary">
                      <LinkedText text={activeExercise.notes} />
                    </p>
                    <button
                      onClick={() => setNotesMode("edit")}
                      className="shrink-0 text-text-secondary active:text-text-primary"
                      aria-label="Edit note"
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                      </svg>
                    </button>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() => setNotesMode("hidden")}
                      className="text-xs font-medium uppercase tracking-[0.14em] text-text-muted active:text-text-primary"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <textarea
                    autoFocus
                    value={activeExercise.notes}
                    onChange={(e) =>
                      updateExerciseNotes(activeExerciseTabIndex, e.target.value)
                    }
                    placeholder="Add a note or paste a link"
                    rows={4}
                    className="w-full rounded-lg bg-surface-overlay/55 px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:bg-surface-overlay/75 resize-none"
                  />
                  <div className="flex justify-between gap-3">
                    <span className="text-xs text-text-muted">
                      Links become tappable when viewed.
                    </span>
                    <button
                      onClick={() => {
                        if (activeExercise.notes.trim()) {
                          markNotesSeen();
                          setNotesMode("view");
                        } else {
                          setNotesMode("hidden");
                        }
                      }}
                      className="text-xs font-medium uppercase tracking-[0.14em] text-text-primary active:text-text-secondary"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

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
                    onClick={() => {
                      recordActual(
                        activeExerciseTabIndex,
                        si,
                        set.goal.reps,
                        set.goal.weight,
                      );
                      setTimerStartSignal((prev) => prev + 1);
                    }}
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

          {recentNotes.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-secondary">
                Recent Notes
              </p>
              {recentNotes.map((entry, index) => (
                <div
                  key={`${entry.startedAt}-${index}`}
                  className="rounded-xl border border-border bg-surface-raised/70 p-3"
                >
                  <p className="text-[11px] uppercase tracking-[0.12em] text-text-muted">
                    {formatDateTime(entry.startedAt)}
                  </p>
                  <p className="mt-2 text-sm text-text-secondary">
                    <LinkedText text={entry.note} />
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="pb-6">
        <Button fullWidth variant="secondary" onClick={finishBlock}>
          Finish Block
        </Button>
      </div>
    </div>
  );
}

function LinkedText({ text }: { text: string }) {
  const parts = text.split(/(https?:\/\/[^\s]+|www\.[^\s]+)/g);

  return parts.map((part, index) => {
    if (!part) return null;

    if (/^(https?:\/\/|www\.)/.test(part)) {
      const href = part.startsWith("http") ? part : `https://${part}`;
      return (
        <a
          key={`${part}-${index}`}
          href={href}
          target="_blank"
          rel="noreferrer"
          className="break-all text-accent underline underline-offset-2"
        >
          {part}
        </a>
      );
    }

    return (
      <span key={`${part}-${index}`} className="whitespace-pre-wrap">
        {part}
      </span>
    );
  });
}
