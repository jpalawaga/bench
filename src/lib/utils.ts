import { nanoid } from "nanoid";
import type { ExerciseSet, SetGoal, Workout } from "@/types/models";

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

export function normalizeSetGoal(goal: SetGoal): SetGoal {
  return {
    ...goal,
    amount: getSetAmount(goal),
  };
}

export function groupConsecutiveSetGoals(goals: SetGoal[]): SetGoal[] {
  const grouped: SetGoal[] = [];

  for (const rawGoal of goals) {
    const goal = normalizeSetGoal(rawGoal);
    const previousGoal = grouped[grouped.length - 1];

    if (
      previousGoal &&
      previousGoal.reps === goal.reps &&
      previousGoal.weight === goal.weight &&
      previousGoal.isProposed === goal.isProposed &&
      previousGoal.proposalSource === goal.proposalSource
    ) {
      previousGoal.amount = getSetAmount(previousGoal) + getSetAmount(goal);
      continue;
    }

    grouped.push({
      ...goal,
      amount: getSetAmount(goal),
    });
  }

  return grouped;
}

export function groupExerciseSetsToGoals(sets: ExerciseSet[]): SetGoal[] {
  return groupConsecutiveSetGoals(
    sets.map((set) => ({
      ...set.goal,
      reps: set.actual.reps ?? set.goal.reps,
      weight: set.actual.weight ?? set.goal.weight,
      amount: 1,
      isProposed: false,
      proposalSource: undefined,
    })),
  );
}

function formatSetToken(reps: number | null, weight: number | null): string {
  return `${reps ?? "—"}@${weight ?? "—"}`;
}

function formatSetSequence(
  sets: Array<{
    reps: number | null;
    weight: number | null;
  }>,
): string {
  const grouped: Array<{
    reps: number | null;
    weight: number | null;
    count: number;
  }> = [];

  for (const set of sets) {
    const previous = grouped[grouped.length - 1];

    if (
      previous &&
      previous.reps === set.reps &&
      previous.weight === set.weight
    ) {
      previous.count += 1;
      continue;
    }

    grouped.push({
      ...set,
      count: 1,
    });
  }

  return grouped
    .map((set) =>
      set.count > 1
        ? `${formatSetToken(set.reps, set.weight)} x${set.count}`
        : formatSetToken(set.reps, set.weight),
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
        exercise.sets.map((set) => ({
          reps: set.actual.reps ?? set.goal.reps,
          weight: set.actual.weight ?? set.goal.weight,
        })),
      );

      lines.push(`${prefix}${exercise.exerciseName}: ${performed}`);
    }
  }

  return lines.join("\n");
}
