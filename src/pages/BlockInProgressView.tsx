import { useEffect, useRef, useState } from "react";
import { RestTimer } from "@/components/workout/RestTimer";
import { RestTimerSlider } from "@/components/workout/RestTimerSlider";
import { WorkoutNumberInput } from "@/components/workout/WorkoutNumberInput";
import { TabBar } from "@/components/ui/TabBar";
import { Button } from "@/components/ui/Button";
import {
  getFirstIncompleteSetIndex,
  useWorkoutStore,
} from "@/stores/workoutStore";
import {
  repository,
  type ExerciseNoteHistoryEntry,
} from "@/db/repository";
import { formatDateTime } from "@/lib/utils";

type NotesMode = "hidden" | "view";
type ExerciseTransitionDirection = "forward" | "backward";

interface ExerciseTransitionState {
  from: number;
  to: number;
  direction: ExerciseTransitionDirection;
}

const EXERCISE_TRANSITION_MS = 220;

export function BlockInProgressView() {
  const workout = useWorkoutStore((s) => s.workout);
  const activeBlockIndex = useWorkoutStore((s) => s.activeBlockIndex);
  const activeExerciseTabIndex = useWorkoutStore(
    (s) => s.activeExerciseTabIndex,
  );
  const activeSetExerciseIndex = useWorkoutStore((s) => s.activeSetExerciseIndex);
  const activeSetIndex = useWorkoutStore((s) => s.activeSetIndex);
  const recordActual = useWorkoutStore((s) => s.recordActual);
  const setActiveSet = useWorkoutStore((s) => s.setActiveSet);
  const advanceActiveSet = useWorkoutStore((s) => s.advanceActiveSet);
  const addSetToExercise = useWorkoutStore((s) => s.addSetToExercise);
  const removeSetFromExercise = useWorkoutStore(
    (s) => s.removeSetFromExercise,
  );
  const setRestTimer = useWorkoutStore((s) => s.setRestTimer);
  const finishBlock = useWorkoutStore((s) => s.finishBlock);
  const updateExerciseNotes = useWorkoutStore((s) => s.updateExerciseNotes);
  const [recentNotes, setRecentNotes] = useState<ExerciseNoteHistoryEntry[]>([]);
  const [activeExerciseFormNotes, setActiveExerciseFormNotes] = useState("");
  const [timerStartSignal, setTimerStartSignal] = useState(0);
  const [showTimerConfigurator, setShowTimerConfigurator] = useState(false);
  const [notesMode, setNotesMode] = useState<NotesMode>("hidden");
  const [exerciseTransition, setExerciseTransition] =
    useState<ExerciseTransitionState | null>(null);
  const [isExerciseTransitionAnimating, setIsExerciseTransitionAnimating] =
    useState(false);
  const [seenNotesByExerciseId, setSeenNotesByExerciseId] = useState<
    Record<string, boolean>
  >({});
  const [expandedWorkingNotesByExerciseId, setExpandedWorkingNotesByExerciseId] =
    useState<Record<string, boolean>>({});
  const previousExerciseTabIndexRef = useRef(activeExerciseTabIndex);
  const exerciseTransitionTimeoutRef = useRef<number | null>(null);
  const exerciseTransitionStartTimeoutRef = useRef<number | null>(null);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const block = workout?.blocks[activeBlockIndex];
  const exerciseNames = block?.exercises.map((e) => e.exerciseName) ?? [];
  const activeExercise = block?.exercises[activeExerciseTabIndex];
  const hasExerciseNotes = Boolean(activeExerciseFormNotes.trim());
  const hasSeenNotes = activeExercise
    ? Boolean(seenNotesByExerciseId[activeExercise.exerciseId])
    : false;
  const notesButtonClassName = hasExerciseNotes
    ? hasSeenNotes
      ? "text-text-secondary"
      : "text-text-primary/90"
    : "text-text-muted";

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
    if (!activeExercise?.exerciseId) {
      setActiveExerciseFormNotes("");
      return;
    }

    let cancelled = false;
    setActiveExerciseFormNotes("");

    void repository
      .getExercise(activeExercise.exerciseId)
      .then((exercise) => {
        if (!cancelled) {
          setActiveExerciseFormNotes(exercise?.formNotes?.trim() ?? "");
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
    const previousIndex = previousExerciseTabIndexRef.current;

    if (activeExerciseTabIndex === previousIndex) {
      return;
    }

    if (exerciseTransitionTimeoutRef.current != null) {
      window.clearTimeout(exerciseTransitionTimeoutRef.current);
    }
    if (exerciseTransitionStartTimeoutRef.current != null) {
      window.clearTimeout(exerciseTransitionStartTimeoutRef.current);
    }

    setExerciseTransition({
      from: previousIndex,
      to: activeExerciseTabIndex,
      direction: activeExerciseTabIndex > previousIndex ? "forward" : "backward",
    });
    setIsExerciseTransitionAnimating(false);
    previousExerciseTabIndexRef.current = activeExerciseTabIndex;

    exerciseTransitionStartTimeoutRef.current = window.setTimeout(() => {
      setIsExerciseTransitionAnimating(true);
      exerciseTransitionStartTimeoutRef.current = null;
    }, 20);

    exerciseTransitionTimeoutRef.current = window.setTimeout(() => {
      setExerciseTransition(null);
      setIsExerciseTransitionAnimating(false);
      exerciseTransitionTimeoutRef.current = null;
    }, EXERCISE_TRANSITION_MS);
  }, [activeExerciseTabIndex]);

  useEffect(() => {
    return () => {
      if (exerciseTransitionTimeoutRef.current != null) {
        window.clearTimeout(exerciseTransitionTimeoutRef.current);
      }
      if (exerciseTransitionStartTimeoutRef.current != null) {
        window.clearTimeout(exerciseTransitionStartTimeoutRef.current);
      }
    };
  }, []);

  if (!workout || !block) return null;

  const getInputKey = (
    exerciseIndex: number,
    setIndex: number,
    field: "reps" | "weight",
  ) => `${exerciseIndex}-${setIndex}-${field}`;

  const focusInput = (
    exerciseIndex: number,
    setIndex: number,
    field: "reps" | "weight",
  ) => {
    inputRefs.current[getInputKey(exerciseIndex, setIndex, field)]?.focus();
  };

  const resolveActiveSetIndex = (exerciseIndex: number) => {
    if (activeSetExerciseIndex === exerciseIndex && activeSetIndex != null) {
      return activeSetIndex;
    }

    return getFirstIncompleteSetIndex(block.exercises[exerciseIndex]);
  };

  const completeSet = (exerciseIndex: number, setIndex: number) => {
    const set = block.exercises[exerciseIndex]?.sets[setIndex];
    if (!set) return;

    recordActual(
      exerciseIndex,
      setIndex,
      set.actual.reps ?? set.goal.reps,
      set.actual.weight ?? set.goal.weight,
    );
    advanceActiveSet(exerciseIndex, setIndex);
    setTimerStartSignal((prev) => prev + 1);
  };

  const handleTabChange = (index: number) => {
    const nextActiveSetIndex = getFirstIncompleteSetIndex(block.exercises[index]);
    useWorkoutStore.setState({
      activeExerciseTabIndex: index,
      activeSetExerciseIndex: nextActiveSetIndex != null ? index : null,
      activeSetIndex: nextActiveSetIndex,
    });
  };

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

    if (activeExerciseFormNotes.trim()) {
      markNotesSeen();
    }

    setNotesMode("view");
  };

  const renderExercisePane = (
    exerciseIndex: number,
    paneRole: "static" | "transition",
  ) => {
    const exercise = block.exercises[exerciseIndex];
    if (!exercise) return null;

    const isVisibleExercise = exerciseIndex === activeExerciseTabIndex;
    const paneNotesButtonClassName = isVisibleExercise
      ? notesButtonClassName
      : "text-text-muted";
    const paneRecentNotes = isVisibleExercise ? recentNotes : [];
    const paneExerciseFormNotes = isVisibleExercise ? activeExerciseFormNotes : "";
    const shouldShowWorkingNotesEditor =
      Boolean(exercise.notes.trim()) ||
      Boolean(expandedWorkingNotesByExerciseId[exercise.exerciseId]);
    const showWorkingNotesEmptyState =
      !shouldShowWorkingNotesEditor && paneRecentNotes.length === 0;

    return (
      <div
        key={`${exercise.id}-${paneRole}`}
        className={`flex min-w-0 flex-col gap-3 ${
          !isVisibleExercise ? "pointer-events-none" : ""
        }`}
      >
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-2">
          <h2 className="min-w-0 break-words text-lg font-bold text-text-primary">
            {exercise.exerciseName}
          </h2>
          <button
            onClick={isVisibleExercise ? handleNotesButtonClick : undefined}
            disabled={!isVisibleExercise}
            className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[13px] font-semibold leading-none transition-colors ${paneNotesButtonClassName}`}
          >
            {isVisibleExercise && hasExerciseNotes && !hasSeenNotes && (
              <span className="h-1 w-1 rounded-full bg-orange-400" />
            )}
            <span>Notes &gt;</span>
          </button>
        </div>

        {isVisibleExercise && notesMode !== "hidden" && (
          <div className="min-w-0 max-w-full pl-1">
            <div className="ml-3 h-3 w-3 rotate-45 border-l border-t border-border bg-surface-raised/95" />
            <div className="-mt-1 w-full min-w-0 max-w-full rounded-2xl bg-surface-raised/95 p-4 shadow-[0_18px_48px_rgba(0,0,0,0.3)] sm:max-w-[22rem]">
              <div className="flex flex-col gap-3">
                {paneExerciseFormNotes ? (
                  <p className="min-w-0 break-words text-sm leading-6 text-text-secondary">
                    <LinkedText text={paneExerciseFormNotes} />
                  </p>
                ) : (
                  <p className="text-sm leading-6 text-text-muted">
                    No exercise guidance yet. Edit this exercise in the library
                    to add form cues and reminders.
                  </p>
                )}

                <div className="flex justify-end">
                  <button
                    onClick={() => setNotesMode("hidden")}
                    className="text-xs font-medium uppercase tracking-[0.14em] text-text-muted active:text-text-primary"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <span className="w-6 shrink-0" />
            <span className="w-8">Set</span>
            <span className="w-16 text-center">Goal</span>
            <span className="w-4 shrink-0" />
            <span className="flex-1 text-center">Actual</span>
            <span className="w-6 shrink-0" />
          </div>

          {exercise.sets.map((set, si) => {
            const isFilled =
              set.actual.reps != null && set.actual.weight != null;
            const isActiveSet = resolveActiveSetIndex(exerciseIndex) === si;

            return (
              <div
                key={set.id}
                className={`flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors ${
                  isActiveSet
                    ? "border border-accent/25 bg-surface-overlay/45"
                    : "border border-transparent"
                }`}
              >
                <button
                  onClick={() => completeSet(exerciseIndex, si)}
                  disabled={!isVisibleExercise}
                  className={`
                    flex h-6 w-6 min-h-0 shrink-0 items-center justify-center rounded-full transition-colors
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

                <span className="text-text-muted text-sm w-16 text-center shrink-0">
                  {set.goal.reps}x{set.goal.weight}
                </span>

                <span className="w-4 shrink-0 text-center text-text-muted text-xs">
                  &rarr;
                </span>

                <div className="flex items-center gap-1 flex-1">
                  <WorkoutNumberInput
                    value={set.actual.reps}
                    onActivate={() => setActiveSet(exerciseIndex, si)}
                    onChange={(value) =>
                      recordActual(
                        exerciseIndex,
                        si,
                        value,
                        set.actual.weight,
                      )
                    }
                    placeholder={String(set.goal.reps)}
                    fallbackValue={set.goal.reps}
                    min={0}
                    enterKeyHint="next"
                    onSubmit={() => {
                      setActiveSet(exerciseIndex, si);
                      focusInput(exerciseIndex, si, "weight");
                    }}
                    externalRef={(node) => {
                      inputRefs.current[getInputKey(exerciseIndex, si, "reps")] = node;
                    }}
                    className="h-9 w-14 rounded-sm bg-surface-overlay/70 px-1.5 py-1 text-center text-base text-text-primary placeholder:text-text-muted focus:bg-surface-overlay/85 focus:outline-none"
                  />
                  <span className="text-text-muted text-sm">x</span>
                  <WorkoutNumberInput
                    value={set.actual.weight}
                    onActivate={() => setActiveSet(exerciseIndex, si)}
                    onChange={(value) =>
                      recordActual(
                        exerciseIndex,
                        si,
                        set.actual.reps,
                        value,
                      )
                    }
                    placeholder={String(set.goal.weight)}
                    fallbackValue={set.goal.weight}
                    enterKeyHint="done"
                    onSubmit={() => completeSet(exerciseIndex, si)}
                    externalRef={(node) => {
                      inputRefs.current[getInputKey(exerciseIndex, si, "weight")] = node;
                    }}
                    className="h-9 w-18 rounded-sm bg-surface-overlay/70 px-1.5 py-1 text-center text-base text-text-primary placeholder:text-text-muted focus:bg-surface-overlay/85 focus:outline-none"
                  />
                </div>

                {exercise.sets.length > 1 && (
                  <button
                    onClick={() => removeSetFromExercise(exerciseIndex, si)}
                    disabled={!isVisibleExercise}
                    className="flex h-6 w-6 min-h-0 shrink-0 items-center justify-center text-text-muted active:text-danger"
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
          onClick={() => addSetToExercise(exerciseIndex)}
          disabled={!isVisibleExercise}
          className="text-accent text-sm font-medium py-2 active:opacity-70"
        >
          + Add Set
        </button>

        <div className="rounded-2xl border border-border bg-surface-raised/70 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-secondary">
              Working Notes
            </p>
            {!shouldShowWorkingNotesEditor ? (
              <button
                onClick={() =>
                  setExpandedWorkingNotesByExerciseId((prev) => ({
                    ...prev,
                    [exercise.exerciseId]: true,
                  }))
                }
                disabled={!isVisibleExercise}
                className="text-sm font-medium text-text-muted active:text-text-primary"
              >
                + Add Note
              </button>
            ) : !exercise.notes.trim() ? (
              <button
                onClick={() =>
                  setExpandedWorkingNotesByExerciseId((prev) => ({
                    ...prev,
                    [exercise.exerciseId]: false,
                  }))
                }
                disabled={!isVisibleExercise}
                className="text-sm font-medium text-text-muted active:text-text-primary"
              >
                Hide
              </button>
            ) : null}
          </div>

          {shouldShowWorkingNotesEditor && (
            <textarea
              value={exercise.notes}
              onChange={(event) =>
                updateExerciseNotes(exerciseIndex, event.target.value)
              }
              placeholder="Pain, failed-rep reason, equipment issue, setup change"
              rows={3}
              className="mt-3 w-full resize-none rounded-lg bg-surface-overlay/45 px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:bg-surface-overlay/60 focus:outline-none"
            />
          )}

          {showWorkingNotesEmptyState && (
            <p className="mt-3 text-sm italic text-text-muted">
              There are no notes.
            </p>
          )}

          {paneRecentNotes.length > 0 && (
            <div className="mt-3 flex flex-col gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-secondary">
                Recent Notes
              </p>
              {paneRecentNotes.map((entry, index) => (
                <div
                  key={`${entry.startedAt}-${index}`}
                  className="rounded-xl border border-border bg-surface-overlay/30 p-3"
                >
                  <p className="text-[11px] uppercase tracking-[0.12em] text-text-muted">
                    {formatDateTime(entry.startedAt)}
                  </p>
                  <p className="mt-2 text-sm text-text-muted">
                    <LinkedText text={entry.note} />
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const exercisePaneIndexes = exerciseTransition
    ? exerciseTransition.direction === "forward"
      ? [exerciseTransition.from, exerciseTransition.to]
      : [exerciseTransition.to, exerciseTransition.from]
    : [activeExerciseTabIndex];
  const exerciseTrackTranslatePercent = exerciseTransition
    ? exerciseTransition.direction === "forward"
      ? isExerciseTransitionAnimating
        ? -50
        : 0
      : isExerciseTransitionAnimating
        ? 0
        : -50
    : 0;

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
      <div className="sticky top-0 z-10 -mx-4 flex min-w-0 flex-col gap-3 bg-surface/95 px-4 pb-3 backdrop-blur-sm">
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
          onTabChange={handleTabChange}
        />
      </div>

      {/* Active Exercise */}
      {activeExercise && (
        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 overflow-y-auto pb-6">
          {exerciseTransition ? (
            <div className="overflow-hidden">
              <div
                className={`flex w-[200%] transition-transform duration-200 ease-out will-change-transform ${
                  isExerciseTransitionAnimating ? "pointer-events-none" : ""
                }`}
                style={{
                  transform: `translate3d(${exerciseTrackTranslatePercent}%, 0, 0)`,
                }}
              >
                {exercisePaneIndexes.map((exerciseIndex) => (
                  <div key={block.exercises[exerciseIndex]?.id} className="w-1/2 shrink-0">
                    {renderExercisePane(exerciseIndex, "transition")}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            renderExercisePane(activeExerciseTabIndex, "static")
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
