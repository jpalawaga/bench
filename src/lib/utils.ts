import { nanoid } from "nanoid";
import type {
  CardioSetActual,
  CardioSetGoal,
  ExerciseSet,
  SetActual,
  SetGoal,
  StrengthSetActual,
  StrengthSetGoal,
  TrackingMode,
  Workout,
} from "@/types/models";

export function generateId(): string {
  return nanoid();
}

export function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(timestamp));
}

export function formatMonthDay(timestamp: number): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(timestamp));
}

export function formatDateTime(timestamp: number): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

export function formatDuration(startMs: number, endMs: number): string {
  const totalMinutes = Math.round((endMs - startMs) / 60_000);
  if (totalMinutes < 60) {
    return `${totalMinutes}m`;
  }
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
}

export function formatTimerDisplay(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function selectInputValue(input: HTMLInputElement): void {
  input.select();
}

export function getSetAmount(goal: Pick<SetGoal, "amount">): number {
  return Math.max(1, goal.amount ?? 1);
}

// ─── Mode-aware helpers ─────────────────────────────────

export function emptyStrengthGoal(overrides: Partial<StrengthSetGoal> = {}): StrengthSetGoal {
  return {
    mode: "strength",
    reps: 0,
    weight: 0,
    amount: 1,
    isProposed: false,
    ...overrides,
  };
}

export function emptyCardioGoal(overrides: Partial<CardioSetGoal> = {}): CardioSetGoal {
  return {
    mode: "cardio",
    seconds: 0,
    level: 0,
    amount: 1,
    isProposed: false,
    ...overrides,
  };
}

export function emptyGoalForMode(mode: TrackingMode): SetGoal {
  return mode === "cardio" ? emptyCardioGoal() : emptyStrengthGoal();
}

export function emptyActualForMode(mode: TrackingMode): SetActual {
  return mode === "cardio"
    ? { mode: "cardio", seconds: null, level: null }
    : { mode: "strength", reps: null, weight: null };
}

export function isSetActualComplete(actual: SetActual): boolean {
  if (actual.mode === "strength") {
    return actual.reps != null && actual.weight != null;
  }
  return actual.seconds != null && actual.level != null;
}

export function goalMatchesMode<M extends TrackingMode>(
  goal: SetGoal,
  mode: M,
): goal is M extends "strength" ? StrengthSetGoal : CardioSetGoal {
  return goal.mode === mode;
}

export function actualMatchesMode<M extends TrackingMode>(
  actual: SetActual,
  mode: M,
): actual is M extends "strength" ? StrengthSetActual : CardioSetActual {
  return actual.mode === mode;
}

/**
 * Returns the pair of numeric metrics for a goal, regardless of mode.
 * Used for formatting and grouping: strength → [reps, weight], cardio → [seconds, level].
 */
function goalMetrics(goal: SetGoal): [number, number] {
  if (goal.mode === "strength") return [goal.reps, goal.weight];
  return [goal.seconds, goal.level];
}

function cloneBareGoal(goal: SetGoal, overrides: Partial<SetGoal> = {}): SetGoal {
  if (goal.mode === "strength") {
    return { ...goal, ...(overrides as Partial<StrengthSetGoal>) };
  }
  return { ...goal, ...(overrides as Partial<CardioSetGoal>) };
}

export function normalizeSetGoal(goal: SetGoal): SetGoal {
  return cloneBareGoal(goal, { amount: getSetAmount(goal) });
}

export function expandSetGoals(goals: SetGoal[]): SetGoal[] {
  return goals.flatMap((rawGoal) => {
    const goal = normalizeSetGoal(rawGoal);
    return Array.from({ length: getSetAmount(goal) }, () =>
      cloneBareGoal(goal, { amount: 1 }),
    );
  });
}

function goalsShareMetrics(a: SetGoal, b: SetGoal): boolean {
  if (a.mode !== b.mode) return false;
  const [a1, a2] = goalMetrics(a);
  const [b1, b2] = goalMetrics(b);
  return a1 === b1 && a2 === b2;
}

export function groupConsecutiveSetGoals(goals: SetGoal[]): SetGoal[] {
  const grouped: SetGoal[] = [];

  for (const rawGoal of goals) {
    const goal = normalizeSetGoal(rawGoal);
    const previousGoal = grouped[grouped.length - 1];

    if (
      previousGoal &&
      goalsShareMetrics(previousGoal, goal) &&
      previousGoal.isProposed === goal.isProposed &&
      previousGoal.proposalSource === goal.proposalSource
    ) {
      previousGoal.amount = getSetAmount(previousGoal) + getSetAmount(goal);
      continue;
    }

    grouped.push(cloneBareGoal(goal, { amount: getSetAmount(goal) }));
  }

  return grouped;
}

export function groupExerciseSetsToGoals(sets: ExerciseSet[]): SetGoal[] {
  return groupConsecutiveSetGoals(exerciseSetsToGoals(sets));
}

export function exerciseSetsToGoals(sets: ExerciseSet[]): SetGoal[] {
  return sets.map((set) => {
    if (set.goal.mode === "strength") {
      const actual =
        set.actual.mode === "strength" ? set.actual : { reps: null, weight: null };
      return {
        mode: "strength",
        reps: actual.reps ?? set.goal.reps,
        weight: actual.weight ?? set.goal.weight,
        amount: 1,
        isProposed: false,
        proposalSource: undefined,
      } satisfies StrengthSetGoal;
    }

    const actual =
      set.actual.mode === "cardio" ? set.actual : { seconds: null, level: null };
    return {
      mode: "cardio",
      seconds: actual.seconds ?? set.goal.seconds,
      level: actual.level ?? set.goal.level,
      amount: 1,
      isProposed: false,
      proposalSource: undefined,
    } satisfies CardioSetGoal;
  });
}

export function formatDurationCompact(totalSeconds: number | null): string {
  if (totalSeconds == null) return "—";
  const rounded = Math.max(0, Math.round(totalSeconds));
  const mins = Math.floor(rounded / 60);
  const secs = rounded % 60;
  if (mins === 0) return `${secs}s`;
  if (secs === 0) return `${mins}m`;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function formatGoalMetrics(goal: SetGoal): string {
  if (goal.mode === "strength") {
    return `${goal.reps}x${goal.weight}`;
  }
  return `${formatDurationCompact(goal.seconds)}·L${goal.level}`;
}

export function formatActualMetrics(
  actual: SetActual,
  goal: SetGoal,
): string {
  if (actual.mode === "strength" && goal.mode === "strength") {
    return `${actual.reps ?? "—"}x${actual.weight ?? "—"}`;
  }
  if (actual.mode === "cardio" && goal.mode === "cardio") {
    const time = actual.seconds == null ? "—" : formatDurationCompact(actual.seconds);
    const level = actual.level == null ? "—" : `L${actual.level}`;
    return `${time}·${level}`;
  }
  return "—";
}

function formatPerformedToken(goal: SetGoal, actual: SetActual): string {
  if (goal.mode === "strength" && actual.mode === "strength") {
    const reps = actual.reps ?? goal.reps;
    const weight = actual.weight ?? goal.weight;
    return `${reps}@${weight}`;
  }
  if (goal.mode === "cardio" && actual.mode === "cardio") {
    const seconds = actual.seconds ?? goal.seconds;
    const level = actual.level ?? goal.level;
    return `${formatDurationCompact(seconds)}@L${level}`;
  }
  return "—";
}

function formatSetSequence(
  entries: Array<{ goal: SetGoal; actual: SetActual }>,
): string {
  const grouped: Array<{
    token: string;
    count: number;
  }> = [];

  for (const entry of entries) {
    const token = formatPerformedToken(entry.goal, entry.actual);
    const previous = grouped[grouped.length - 1];
    if (previous && previous.token === token) {
      previous.count += 1;
      continue;
    }
    grouped.push({ token, count: 1 });
  }

  return grouped
    .map((entry) =>
      entry.count > 1 ? `${entry.token} x${entry.count}` : entry.token,
    )
    .join(", ");
}

export function formatWorkoutForClipboard(workout: Workout): string {
  const lines: string[] = [formatMonthDay(workout.startedAt)];

  for (const block of workout.blocks) {
    for (const [index, exercise] of block.exercises.entries()) {
      const prefix =
        block.exercises.length <= 1
          ? ""
          : index === 0
            ? "┌ "
            : index === block.exercises.length - 1
              ? "└ "
              : "├ ";

      const performed = formatSetSequence(
        exercise.sets.map((set) => ({ goal: set.goal, actual: set.actual })),
      );

      lines.push(`${prefix}${exercise.exerciseName}: ${performed}`);
    }
  }

  return lines.join("\n");
}
