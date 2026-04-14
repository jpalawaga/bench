import type { SetGoal } from "@/types/models";
import { WorkoutNumberInput } from "./WorkoutNumberInput";

function getProposalLabel(goal: SetGoal): string | null {
  if (!goal.isProposed) return null;
  if (goal.proposalSource === "planned") return "PLANNED";
  if (goal.proposalSource === "previous") return "PREV";
  return "PLANNED";
}

function getProposalClasses(goal: SetGoal): string {
  if (goal.proposalSource === "previous") {
    return "border-emerald-400/30 bg-emerald-400/12 text-emerald-300";
  }

  return "border-proposed/35 bg-proposed/12 text-proposed";
}

interface SetRowProps {
  goal: SetGoal;
  setNumber: number;
  onRepsChange: (reps: number) => void;
  onWeightChange: (weight: number) => void;
  onRemove: () => void;
  canRemove: boolean;
}

export function SetRow({
  goal,
  setNumber,
  onRepsChange,
  onWeightChange,
  onRemove,
  canRemove,
}: SetRowProps) {
  const proposalLabel = getProposalLabel(goal);

  return (
    <div className="grid grid-cols-[2rem_minmax(0,1fr)] gap-x-2 gap-y-2">
      <span className="w-8 shrink-0 text-sm text-text-muted">
        S{setNumber}
      </span>

      <div className="flex items-center justify-end gap-2">
        {proposalLabel && (
          <span
            className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-semibold tracking-[0.14em] ${getProposalClasses(goal)}`}
          >
            {proposalLabel}
          </span>
        )}

        {canRemove && (
          <button
            onClick={onRemove}
            aria-label={`Remove set ${setNumber}`}
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

      <div className="col-span-2 flex flex-wrap items-center gap-1">
        <WorkoutNumberInput
          value={goal.reps || null}
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
          value={goal.weight || null}
          onChange={(value) => onWeightChange(value ?? 0)}
          placeholder="lbs"
          className={`
            h-9 w-20 rounded-sm bg-surface-overlay/70 px-1.5 py-1 text-center text-base text-text-primary
            placeholder:text-text-muted focus:bg-surface-overlay/85 focus:outline-none transition-colors
          `}
        />
        <span className="text-text-muted text-sm">lbs</span>
      </div>
    </div>
  );
}
