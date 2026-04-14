import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { BlockCard } from "@/components/workout/BlockCard";
import { useWorkoutStore } from "@/stores/workoutStore";

export function BlockListView() {
  const workout = useWorkoutStore((s) => s.workout);
  const addBlock = useWorkoutStore((s) => s.addBlock);
  const removeBlock = useWorkoutStore((s) => s.removeBlock);
  const setActiveBlock = useWorkoutStore((s) => s.setActiveBlock);
  const setView = useWorkoutStore((s) => s.setView);
  const finishWorkout = useWorkoutStore((s) => s.finishWorkout);
  const [deleteBlockIndex, setDeleteBlockIndex] = useState<number | null>(null);

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
