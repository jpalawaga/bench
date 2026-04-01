import type { Block } from "@/types/models";

interface BlockCardProps {
  block: Block;
  onClick: () => void;
}

export function BlockCard({ block, onClick }: BlockCardProps) {
  const exerciseNames = block.exercises.map((e) => e.exerciseName).join(", ");
  const totalSets = block.exercises.reduce(
    (sum, e) => sum + e.sets.length,
    0,
  );
  const isFinished = block.status === "finished";

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-xl bg-surface-raised p-4 active:bg-surface-overlay transition-colors"
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-text-primary font-semibold">
          Block {block.order}
        </span>
        <span className="text-sm">
          {isFinished ? (
            <span className="text-green-400">Done</span>
          ) : block.status === "in-progress" ? (
            <span className="text-accent">In Progress</span>
          ) : (
            <span className="text-text-muted">Planning</span>
          )}
        </span>
      </div>
      {block.exercises.length > 0 ? (
        <>
          <p className="text-text-secondary text-sm">{exerciseNames}</p>
          <p className="text-text-muted text-xs mt-1">
            {totalSets} set{totalSets !== 1 ? "s" : ""}
          </p>
        </>
      ) : (
        <p className="text-text-muted text-sm">No exercises yet</p>
      )}
    </button>
  );
}
