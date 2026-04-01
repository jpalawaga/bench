import type { ExerciseSet } from "@/types/models";

interface SetRowProps {
  set: ExerciseSet;
  onRepsChange: (reps: number) => void;
  onWeightChange: (weight: number) => void;
  onRemove: () => void;
  canRemove: boolean;
}

export function SetRow({
  set,
  onRepsChange,
  onWeightChange,
  onRemove,
  canRemove,
}: SetRowProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-text-muted text-sm w-8 shrink-0">
        S{set.setNumber}
      </span>

      <div className="flex items-center gap-1 flex-1">
        <input
          type="number"
          inputMode="numeric"
          pattern="[0-9]*"
          value={set.goal.reps || ""}
          onChange={(e) => onRepsChange(Number(e.target.value) || 0)}
          placeholder="Reps"
          className={`
            w-16 bg-surface-raised border rounded-lg px-2 py-2 text-center text-base text-text-primary
            placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors
            ${set.goal.isProposed ? "border-proposed" : "border-border"}
          `}
        />
        <span className="text-text-muted text-sm">x</span>
        <input
          type="number"
          inputMode="numeric"
          pattern="[0-9]*"
          value={set.goal.weight || ""}
          onChange={(e) => onWeightChange(Number(e.target.value) || 0)}
          placeholder="lbs"
          className={`
            w-20 bg-surface-raised border rounded-lg px-2 py-2 text-center text-base text-text-primary
            placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors
            ${set.goal.isProposed ? "border-proposed" : "border-border"}
          `}
        />
        <span className="text-text-muted text-sm">lbs</span>
      </div>

      {set.goal.isProposed && (
        <span className="text-proposed text-xs shrink-0">Proposed</span>
      )}

      {canRemove && (
        <button
          onClick={onRemove}
          className="text-text-muted active:text-danger p-1 min-h-0 shrink-0"
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
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </div>
  );
}
