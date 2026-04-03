import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { WorkoutListItem } from "@/components/log/WorkoutListItem";
import { WorkoutDetail } from "@/components/log/WorkoutDetail";
import { useWorkoutHistory } from "@/hooks/useWorkoutHistory";
import { repository } from "@/db/repository";
import { generateId } from "@/lib/utils";
import type { Workout } from "@/types/models";

export function LogPage() {
  const { workouts, loading, refresh } = useWorkoutHistory();
  const navigate = useNavigate();
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Workout | null>(null);

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
      <header className="flex items-center justify-between gap-4 py-6">
        <h1 className="text-2xl font-bold text-text-primary">Benchpress</h1>
        <button
          onClick={() => navigate("/exercises")}
          className="flex h-10 w-10 min-h-0 items-center justify-center rounded-full bg-surface-raised text-text-secondary transition-colors active:bg-surface-overlay active:text-text-primary"
          aria-label="Edit exercise library"
        >
          <span className="text-lg leading-none">💪</span>
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
    </div>
  );
}
