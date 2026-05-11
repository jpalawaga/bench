import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import {
  GoalSetEditor,
  type EditableSetGoal,
} from "@/components/workout/GoalSetEditor";
import { repository, type ExerciseHistoryEntry } from "@/db/repository";
import {
  emptyGoalForMode,
  formatActualMetrics,
  formatDateTime,
  formatGoalMetrics,
  generateId,
  getSetAmount,
  groupConsecutiveSetGoals,
} from "@/lib/utils";
import type { Exercise, SetGoal, TrackingMode } from "@/types/models";

function formatPerformedSets(entry: ExerciseHistoryEntry): string {
  return entry.performedSets
    .map((set) => formatActualMetrics(set.actual, set.goal))
    .join(", ");
}

function createEditableSetGoal(
  goal: SetGoal,
  setNumber: number,
): EditableSetGoal {
  return {
    id: generateId(),
    setNumber,
    goal: {
      ...goal,
      amount: getSetAmount(goal),
      isProposed: false,
      proposalSource: undefined,
    },
  };
}

function renumberEditableSetGoals(
  sets: EditableSetGoal[],
): EditableSetGoal[] {
  let nextSetNumber = 1;

  return sets.map((set) => {
    const amount = getSetAmount(set.goal);
    const renumberedSet = {
      ...set,
      setNumber: nextSetNumber,
      goal: {
        ...set.goal,
        amount,
      },
    };

    nextSetNumber += amount;
    return renumberedSet;
  });
}

function createEditableSetGoals(goals: SetGoal[]): EditableSetGoal[] {
  return renumberEditableSetGoals(
    groupConsecutiveSetGoals(goals).map((goal) =>
      createEditableSetGoal(goal, 0),
    ),
  );
}

function createDefaultTarget(mode: TrackingMode): EditableSetGoal[] {
  return [createEditableSetGoal(emptyGoalForMode(mode), 1)];
}

function finalizeTargets(targets: EditableSetGoal[]): SetGoal[] {
  return groupConsecutiveSetGoals(
    targets.map((target) => ({
      ...target.goal,
      amount: getSetAmount(target.goal),
      isProposed: false,
      proposalSource: undefined,
    })),
  );
}

function formatTargetSetLabel(target: EditableSetGoal): string {
  const amount = getSetAmount(target.goal);
  const endSetNumber = target.setNumber + amount - 1;
  return amount > 1
    ? `S${target.setNumber}-${endSetNumber}`
    : `S${target.setNumber}`;
}

export function ExerciseDetailPage() {
  const { exerciseId } = useParams<{ exerciseId: string }>();
  const navigate = useNavigate();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [name, setName] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [nextTargets, setNextTargets] = useState<SetGoal[]>([]);
  const [targetRows, setTargetRows] = useState<EditableSetGoal[]>([]);
  const [editingTargets, setEditingTargets] = useState(false);
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

      const targets =
        nextExercise.nextSessionTargets?.length &&
        nextExercise.nextSessionTargets[0]?.mode === nextExercise.trackingMode
          ? nextExercise.nextSessionTargets
          : await repository.getNextSessionTargets(
              exerciseId,
              nextExercise.trackingMode,
            );

      if (cancelled) return;

      const loadedTargets = targets ?? [];
      setNextTargets(loadedTargets);
      setTargetRows(
        loadedTargets.length > 0
          ? createEditableSetGoals(loadedTargets)
          : createDefaultTarget(nextExercise.trackingMode),
      );
      setEditingTargets(false);
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
  const targetSummaryRows = useMemo(
    () => createEditableSetGoals(nextTargets),
    [nextTargets],
  );

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

  const updateTargetField = (
    index: number,
    updater: (goal: SetGoal) => SetGoal,
  ) => {
    setTargetRows((prev) =>
      renumberEditableSetGoals(
        prev.map((target, i) =>
          i === index
            ? {
                ...target,
                goal: {
                  ...updater(target.goal),
                  isProposed: false,
                  proposalSource: undefined,
                },
              }
            : target,
        ),
      ),
    );
  };

  const handleTargetRepsChange = (index: number, reps: number) =>
    updateTargetField(index, (goal) =>
      goal.mode === "strength" ? { ...goal, reps } : goal,
    );

  const handleTargetWeightChange = (index: number, weight: number) =>
    updateTargetField(index, (goal) =>
      goal.mode === "strength" ? { ...goal, weight } : goal,
    );

  const handleTargetSecondsChange = (index: number, seconds: number) =>
    updateTargetField(index, (goal) =>
      goal.mode === "cardio" ? { ...goal, seconds } : goal,
    );

  const handleTargetLevelChange = (index: number, level: number) =>
    updateTargetField(index, (goal) =>
      goal.mode === "cardio" ? { ...goal, level } : goal,
    );

  const handleTargetAmountChange = (index: number, amount: number) => {
    setTargetRows((prev) =>
      renumberEditableSetGoals(
        prev.map((target, i) =>
          i === index
            ? {
                ...target,
                goal: {
                  ...target.goal,
                  amount: Math.max(1, amount),
                  isProposed: false,
                  proposalSource: undefined,
                },
              }
            : target,
        ),
      ),
    );
  };

  const handleAddTarget = () => {
    if (!exercise) return;
    const lastTarget = targetRows[targetRows.length - 1];
    const baseGoal: SetGoal = lastTarget
      ? {
          ...lastTarget.goal,
          amount: 1,
          isProposed: false,
          proposalSource: undefined,
        }
      : emptyGoalForMode(exercise.trackingMode);

    setTargetRows((prev) =>
      renumberEditableSetGoals([
        ...prev,
        createEditableSetGoal(baseGoal, 0),
      ]),
    );
  };

  const handleRemoveTarget = (index: number) => {
    setTargetRows((prev) =>
      renumberEditableSetGoals(prev.filter((_, i) => i !== index)),
    );
  };

  const handleEditTargets = () => {
    if (!exercise) return;
    setTargetRows(
      nextTargets.length > 0
        ? createEditableSetGoals(nextTargets)
        : createDefaultTarget(exercise.trackingMode),
    );
    setEditingTargets(true);
  };

  const handleCancelTargets = () => {
    if (!exercise) return;
    setTargetRows(
      nextTargets.length > 0
        ? createEditableSetGoals(nextTargets)
        : createDefaultTarget(exercise.trackingMode),
    );
    setEditingTargets(false);
  };

  const handleSaveTargets = async () => {
    if (!exercise) return;
    const savedTargets = finalizeTargets(targetRows);
    const updatedExercise: Exercise = {
      ...exercise,
      name: name.trim() || exercise.name,
      formNotes: formNotes.trim() || undefined,
      nextSessionTargets: savedTargets,
    };

    await repository.updateExercise(updatedExercise);
    setExercise(updatedExercise);
    setName(updatedExercise.name);
    setFormNotes(updatedExercise.formNotes ?? "");
    setNextTargets(savedTargets);
    setTargetRows(createEditableSetGoals(savedTargets));
    setEditingTargets(false);
  };

  const handleClearTargets = async () => {
    if (!exercise) return;
    const updatedExercise: Exercise = {
      ...exercise,
      name: name.trim() || exercise.name,
      formNotes: formNotes.trim() || undefined,
      nextSessionTargets: undefined,
    };

    await repository.updateExercise(updatedExercise);
    setExercise(updatedExercise);
    setName(updatedExercise.name);
    setFormNotes(updatedExercise.formNotes ?? "");
    setNextTargets([]);
    setTargetRows(createDefaultTarget(updatedExercise.trackingMode));
    setEditingTargets(false);
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

          <div className="rounded-2xl bg-surface-raised p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-secondary">
                  Next Targets
                </p>
                <p className="mt-1 text-sm text-text-muted">
                  Planned goals for the next time you add this exercise.
                </p>
              </div>
              {!editingTargets && (
                <button
                  onClick={handleEditTargets}
                  className="shrink-0 text-sm font-medium text-accent active:opacity-70"
                >
                  {nextTargets.length > 0 ? "Edit" : "Configure"}
                </button>
              )}
            </div>

            {editingTargets ? (
              <div className="mt-4">
                <GoalSetEditor
                  sets={targetRows}
                  onRepsChange={handleTargetRepsChange}
                  onWeightChange={handleTargetWeightChange}
                  onSecondsChange={handleTargetSecondsChange}
                  onLevelChange={handleTargetLevelChange}
                  onAmountChange={handleTargetAmountChange}
                  onRemoveSet={handleRemoveTarget}
                  onAddSet={handleAddTarget}
                />
                <div className="mt-2.5 flex gap-2">
                  <Button
                    variant="secondary"
                    className="flex-1"
                    onClick={handleCancelTargets}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => void handleSaveTargets()}
                  >
                    Save Targets
                  </Button>
                </div>
                {exercise.nextSessionTargets?.length ? (
                  <button
                    onClick={() => void handleClearTargets()}
                    className="mt-3 w-full text-sm font-medium text-text-muted active:text-danger"
                  >
                    Clear Targets
                  </button>
                ) : null}
              </div>
            ) : nextTargets.length === 0 ? (
              <p className="mt-4 text-sm text-text-muted">No targets set.</p>
            ) : (
              <div className="mt-4 flex flex-col gap-2">
                {targetSummaryRows.map((target) => (
                  <div
                    key={target.id}
                    className="flex items-center justify-between gap-3 rounded-lg bg-surface-overlay/32 px-3 py-2 text-sm"
                  >
                    <span className="text-text-muted">
                      {formatTargetSetLabel(target)}
                    </span>
                    <span className="font-medium text-text-primary">
                      {formatGoalMetrics(target.goal)}
                    </span>
                  </div>
                ))}
              </div>
            )}
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
