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
    <div
      data-testid={`set-row-${setNumber}`}
      className="grid grid-cols-[1.9rem_minmax(0,1fr)_auto] items-center gap-2 rounded-xl bg-surface-overlay/25 px-2.5 py-2"
    >
      <span className="w-7 shrink-0 text-[13px] font-medium text-text-muted">
        S{setNumber}
      </span>

      <div
        data-testid={`set-row-inputs-${setNumber}`}
        className="flex min-w-0 items-center gap-1.5 whitespace-nowrap"
      >
        <WorkoutNumberInput
          value={goal.reps || null}
          onChange={(value) => onRepsChange(value ?? 0)}
          placeholder="Reps"
          min={0}
          className={`
            h-8 w-[3.2rem] rounded-md bg-surface-overlay/70 px-1 py-1 text-center text-sm text-text-primary
            placeholder:text-text-muted focus:bg-surface-overlay/85 focus:outline-none transition-colors
          `}
        />
        <span className="text-text-muted text-xs">x</span>
        <WorkoutNumberInput
          value={goal.weight || null}
          onChange={(value) => onWeightChange(value ?? 0)}
          placeholder="lbs"
          className={`
            h-8 w-[4rem] rounded-md bg-surface-overlay/70 px-1 py-1 text-center text-sm text-text-primary
            placeholder:text-text-muted focus:bg-surface-overlay/85 focus:outline-none transition-colors
          `}
        />
        <span className="text-text-muted text-[11px] uppercase tracking-[0.06em]">
          lbs
        </span>
      </div>

      <div className="flex items-center justify-end gap-1">
        {proposalLabel && (
          <span
            className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[9px] font-semibold leading-none tracking-[0.08em] ${getProposalClasses(goal)}`}
          >
            {proposalLabel}
          </span>
        )}

        {canRemove && (
          <button
            onClick={onRemove}
            aria-label={`Remove set ${setNumber}`}
            className="rounded-full p-0.5 text-text-muted active:text-danger min-h-0 shrink-0"
          >
            <svg
              width="16"
              height="16"
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
    </div>
  );
}
