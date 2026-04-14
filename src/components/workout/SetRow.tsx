import type { SetGoal } from "@/types/models";
import { getSetAmount } from "@/lib/utils";
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
  onAmountChange: (amount: number) => void;
  onRemove: () => void;
  canRemove: boolean;
}

export function SetRow({
  goal,
  setNumber,
  onRepsChange,
  onWeightChange,
  onAmountChange,
  onRemove,
  canRemove,
}: SetRowProps) {
  const proposalLabel = getProposalLabel(goal);
  const amount = getSetAmount(goal);
  const setLabel =
    amount > 1 ? `S${setNumber}-${setNumber + amount - 1}` : `S${setNumber}`;
  const amountOptions = Array.from(
    { length: Math.max(10, amount) },
    (_, index) => index + 1,
  );

  return (
    <div
      data-testid={`set-row-${setNumber}`}
      className="grid grid-cols-[2.5rem_minmax(0,1fr)_auto_auto] items-center gap-1.5 rounded-lg bg-surface-overlay/18 px-2 py-1.5"
    >
      <span className="w-9 shrink-0 text-[13px] font-medium text-text-muted">
        {setLabel}
      </span>

      <div
        data-testid={`set-row-inputs-${setNumber}`}
        className="flex min-w-0 items-center gap-1 whitespace-nowrap"
      >
        <WorkoutNumberInput
          value={goal.reps || null}
          onChange={(value) => onRepsChange(value ?? 0)}
          placeholder="Reps"
          min={0}
          className={`
            h-8 w-[2.7rem] rounded-md bg-surface-overlay/70 px-1 py-1 text-center text-sm text-text-primary
            placeholder:text-text-muted focus:bg-surface-overlay/85 focus:outline-none transition-colors
          `}
        />
        <span className="text-text-muted text-xs">x</span>
        <WorkoutNumberInput
          value={goal.weight || null}
          onChange={(value) => onWeightChange(value ?? 0)}
          placeholder="lbs"
          className={`
            h-8 w-[3.2rem] rounded-md bg-surface-overlay/70 px-1 py-1 text-center text-sm text-text-primary
            placeholder:text-text-muted focus:bg-surface-overlay/85 focus:outline-none transition-colors
          `}
        />
        <span className="text-text-muted text-xs">x</span>
        <div className="relative shrink-0">
          <select
            value={amount}
            onChange={(event) => onAmountChange(Number(event.target.value))}
            aria-label={`Set count for ${setLabel}`}
            className="h-8 w-[2.9rem] appearance-none rounded-md bg-surface-overlay/70 px-1.5 pr-5 text-sm text-text-primary focus:bg-surface-overlay/85 focus:outline-none"
          >
            {amountOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <svg
            aria-hidden="true"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-text-muted"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>

      <div
        data-testid={`set-row-badge-slot-${setNumber}`}
        className="flex min-w-0 items-center justify-center"
      >
        {proposalLabel && (
          <span
            className={`shrink-0 rounded-full border px-1.25 py-0.5 text-[8px] font-semibold leading-none tracking-[0.08em] ${getProposalClasses(goal)}`}
          >
            {proposalLabel}
          </span>
        )}
      </div>

      <div className="flex items-center justify-end">
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
