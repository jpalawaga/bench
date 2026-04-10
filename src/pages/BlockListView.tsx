import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { BlockCard } from "@/components/workout/BlockCard";
import { useWorkoutStore } from "@/stores/workoutStore";
import { repository, type WorkoutNoteHistoryEntry } from "@/db/repository";
import { formatDateTime } from "@/lib/utils";

export function BlockListView() {
  const workout = useWorkoutStore((s) => s.workout);
  const addBlock = useWorkoutStore((s) => s.addBlock);
  const removeBlock = useWorkoutStore((s) => s.removeBlock);
  const setActiveBlock = useWorkoutStore((s) => s.setActiveBlock);
  const setView = useWorkoutStore((s) => s.setView);
  const finishWorkout = useWorkoutStore((s) => s.finishWorkout);
  const updateWorkoutNotes = useWorkoutStore((s) => s.updateWorkoutNotes);
  const [deleteBlockIndex, setDeleteBlockIndex] = useState<number | null>(null);
  const [recentWorkoutNotes, setRecentWorkoutNotes] = useState<
    WorkoutNoteHistoryEntry[]
  >([]);

  useEffect(() => {
    let cancelled = false;

    void repository.getRecentWorkoutNotes(2).then((entries) => {
      if (!cancelled) {
        setRecentWorkoutNotes(entries);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!workout) return null;

  const handleBlockClick = (index: number) => {
    const block = workout.blocks[index];
    if (!block) return;
    setActiveBlock(index);
    if (block.status === "planning") {
      setView("new-block");
    } else if (
      block.status === "in-progress" ||
      block.status === "finished"
    ) {
      setView("block-in-progress");
    }
  };

  const deleteTarget =
    deleteBlockIndex != null ? workout.blocks[deleteBlockIndex] : null;

  return (
    <div className="flex flex-col gap-4 flex-1">
      <Button fullWidth onClick={addBlock}>
        Add Block
      </Button>

      <div className="rounded-2xl bg-surface-raised p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-secondary">
          Workout Notes
        </p>
        <textarea
          value={workout.notes ?? ""}
          onChange={(event) => updateWorkoutNotes(event.target.value)}
          placeholder="How the whole workout felt, energy, recovery, anything to remember next time"
          rows={4}
          className="mt-3 w-full resize-none rounded-lg bg-surface-overlay/70 px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:bg-surface-overlay/85 focus:outline-none"
        />

        {recentWorkoutNotes.length > 0 && (
          <div className="mt-4 flex flex-col gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-secondary">
              Recent Workout Notes
            </p>
            {recentWorkoutNotes.map((entry, index) => (
              <div
                key={`${entry.startedAt}-${index}`}
                className="rounded-xl border border-border bg-surface-overlay/35 p-3"
              >
                <p className="text-[11px] uppercase tracking-[0.12em] text-text-muted">
                  {formatDateTime(entry.startedAt)}
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-text-secondary">
                  {entry.note}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {workout.blocks.length === 0 ? (
        <p className="text-text-muted text-center mt-8">
          No blocks yet. Add your first block to get started.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {workout.blocks.map((block, i) => (
            <BlockCard
              key={block.id}
              block={block}
              onClick={() => handleBlockClick(i)}
              onLongPress={
                block.status === "in-progress"
                  ? undefined
                  : () => setDeleteBlockIndex(i)
              }
            />
          ))}
        </div>
      )}

      <div className="mt-auto pb-6">
        <Button
          fullWidth
          variant="secondary"
          disabled={workout.blocks.length === 0}
          onClick={finishWorkout}
        >
          Finish Workout
        </Button>
      </div>

      <Modal
        open={deleteTarget !== null}
        title="Delete Block"
        message={`Remove Block ${deleteTarget?.order ?? ""} from this workout?`}
        confirmLabel="Delete"
        confirmVariant="danger"
        onConfirm={() => {
          if (deleteBlockIndex != null) {
            removeBlock(deleteBlockIndex);
          }
          setDeleteBlockIndex(null);
        }}
        onCancel={() => setDeleteBlockIndex(null)}
      />
    </div>
  );
}
