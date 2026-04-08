import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/Button";
import { BackupRestoreModal } from "@/components/ui/BackupRestoreModal";
import { Modal } from "@/components/ui/Modal";
import { WorkoutListItem } from "@/components/log/WorkoutListItem";
import { WorkoutDetail } from "@/components/log/WorkoutDetail";
import { useWorkoutHistory } from "@/hooks/useWorkoutHistory";
import { repository } from "@/db/repository";
import { generateId } from "@/lib/utils";
import type { Workout } from "@/types/models";
import { useWorkoutStore } from "@/stores/workoutStore";

const TITLE_LONG_PRESS_MS = 700;

export function LogPage() {
  const { workouts, loading, refresh } = useWorkoutHistory();
  const navigate = useNavigate();
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Workout | null>(null);
  const [showBuildLabel, setShowBuildLabel] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const longPressTimerRef = useRef<number | null>(null);
  const suppressTitleClickRef = useRef(false);

  const clearTitleLongPress = useCallback(() => {
    if (longPressTimerRef.current == null) return;
    window.clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = null;
  }, []);

  useEffect(() => clearTitleLongPress, [clearTitleLongPress]);

  const startWorkout = async () => {
    const workout: Workout = {
      id: generateId(),
      status: "active",
      startedAt: Date.now(),
      completedAt: null,
      blocks: [],
    };
    await repository.saveWorkout(workout);
    navigate(`/workout/${workout.id}`);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await repository.deleteWorkout(deleteTarget.id);
    setDeleteTarget(null);
    setSelectedWorkout(null);
    refresh();
  };

  const handleTitlePointerDown = () => {
    clearTitleLongPress();
    longPressTimerRef.current = window.setTimeout(() => {
      suppressTitleClickRef.current = true;
      longPressTimerRef.current = null;
      setShowBackupModal(true);
    }, TITLE_LONG_PRESS_MS);
  };

  const handleTitlePointerEnd = () => {
    clearTitleLongPress();
  };

  const handleTitleClick = () => {
    if (suppressTitleClickRef.current) {
      suppressTitleClickRef.current = false;
      return;
    }

    setShowBuildLabel((prev) => !prev);
  };

  const handleBackupImported = async () => {
    useWorkoutStore.getState().reset();
    setSelectedWorkout(null);
    setDeleteTarget(null);
    setShowBackupModal(false);
    await refresh();
  };

  // Show workout detail view
  if (selectedWorkout) {
    return (
      <>
        <WorkoutDetail
          workout={selectedWorkout}
          onClose={() => setSelectedWorkout(null)}
          onDelete={() => setDeleteTarget(selectedWorkout)}
        />
        <Modal
          open={deleteTarget !== null}
          title="Delete Workout"
          message="Are you sure you want to delete this workout? This cannot be undone."
          confirmLabel="Delete"
          confirmVariant="danger"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      </>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col px-4 pt-safe-top pb-safe-bottom">
      <header className="flex items-start justify-between gap-4 py-6">
        <button
          onClick={handleTitleClick}
          onPointerDown={handleTitlePointerDown}
          onPointerUp={handleTitlePointerEnd}
          onPointerCancel={handleTitlePointerEnd}
          onPointerLeave={handleTitlePointerEnd}
          onContextMenu={(event) => event.preventDefault()}
          className="flex min-h-0 items-start gap-2 text-left"
          aria-label="Toggle build version or long-press for database backup"
        >
          <span className="text-2xl font-bold text-text-primary">
            Benchpress
          </span>
          {showBuildLabel && (
            <span className="flex flex-col pt-0.5 text-[11px] font-medium leading-[1.05] text-text-muted">
              <span>{__APP_BUILD_VERSION__}</span>
              <span className="tracking-[0.01em]">{__APP_BUILD_STAMP__}</span>
            </span>
          )}
        </button>
        <button
          onClick={() => navigate("/exercises")}
          className="mt-1 flex h-8 w-8 min-h-0 min-w-0 items-center justify-center rounded-full text-text-secondary transition-colors active:bg-surface-raised/70 active:text-text-primary"
          style={{ minHeight: "2rem", minWidth: "2rem" }}
          aria-label="Edit exercise library"
        >
          <span className="text-base leading-none">💪</span>
        </button>
      </header>

      <Button fullWidth onClick={startWorkout}>
        Start New Workout
      </Button>

      <div className="mt-6 flex flex-col gap-3 flex-1">
        {loading ? (
          <p className="text-text-muted text-center mt-8">Loading...</p>
        ) : workouts.length === 0 ? (
          <p className="text-text-muted text-center mt-8">
            No workouts yet. Start your first one!
          </p>
        ) : (
          workouts.map((w) => (
            <WorkoutListItem
              key={w.id}
              workout={w}
              onClick={() =>
                w.status === "active"
                  ? navigate(`/workout/${w.id}`)
                  : setSelectedWorkout(w)
              }
            />
          ))
        )}
      </div>

      <Modal
        open={deleteTarget !== null}
        title="Delete Workout"
        message="Are you sure you want to delete this workout? This cannot be undone."
        confirmLabel="Delete"
        confirmVariant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
      <BackupRestoreModal
        open={showBackupModal}
        onClose={() => setShowBackupModal(false)}
        onImported={handleBackupImported}
      />
    </div>
  );
}
