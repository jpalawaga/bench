import { getSetAmount } from "@/lib/utils";
import type { ExerciseSet } from "@/types/models";
import { WorkoutNumberInput } from "./WorkoutNumberInput";

function getProposalLabel(set: ExerciseSet): string | null {
  if (!set.goal.isProposed) return null;
  if (set.goal.proposalSource === "planned") return "PLANNED";
  if (set.goal.proposalSource === "previous") return "PREV";
  return "PLANNED";
}

function getProposalClasses(set: ExerciseSet): string {
  if (set.goal.proposalSource === "previous") {
    return "border-emerald-400/30 bg-emerald-400/12 text-emerald-300";
  }

  return "border-proposed/35 bg-proposed/12 text-proposed";
}

interface SetRowProps {
  set: ExerciseSet;
  onRepsChange: (reps: number) => void;
  onWeightChange: (weight: number) => void;
  onAmountChange: (amount: number) => void;
  onRemove: () => void;
  canRemove: boolean;
}

export function SetRow({
  set,
  onRepsChange,
  onWeightChange,
  onAmountChange,
  onRemove,
  canRemove,
}: SetRowProps) {
  const proposalLabel = getProposalLabel(set);

  return (
    <div className="flex items-center gap-2">
      <span className="w-8 shrink-0 text-sm text-text-muted">
        S{set.setNumber}
      </span>

      <div className="flex flex-1 items-center gap-1">
        <WorkoutNumberInput
          value={set.goal.reps || null}
          onChange={(value) => onRepsChange(value ?? 0)}
          placeholder="Reps"
          min={0}
          className={`
            h-9 w-16 rounded-sm bg-surface-overlay/70 px-1.5 py-1 text-center text-base text-text-primary
            placeholder:text-text-muted focus:bg-surface-overlay/85 focus:outline-none transition-colors
          `}
        />
        <span className="text-text-muted text-sm">x</span>
        <WorkoutNumberInput
          value={set.goal.weight || null}
          onChange={(value) => onWeightChange(value ?? 0)}
          placeholder="lbs"
          className={`
            h-9 w-20 rounded-sm bg-surface-overlay/70 px-1.5 py-1 text-center text-base text-text-primary
            placeholder:text-text-muted focus:bg-surface-overlay/85 focus:outline-none transition-colors
          `}
        />
        <span className="text-text-muted text-sm">lbs</span>
        <select
          value={getSetAmount(set.goal)}
          onChange={(e) => onAmountChange(Number(e.target.value))}
          className="h-9 w-18 rounded-sm bg-surface-overlay/70 px-1.5 py-1 text-center text-sm text-text-primary focus:bg-surface-overlay/85 focus:outline-none"
        >
          {Array.from({ length: 8 }, (_, index) => index + 1).map((amount) => (
            <option key={amount} value={amount}>
              x{amount}
            </option>
          ))}
        </select>
      </div>

      {proposalLabel && (
        <span
          className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-semibold tracking-[0.14em] ${getProposalClasses(set)}`}
        >
          {proposalLabel}
        </span>
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
