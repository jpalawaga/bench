import type {
  Block,
  BlockExercise,
  CardioSetActual,
  CardioSetGoal,
  Exercise,
  ExerciseSet,
  SetActual,
  SetGoal,
  StrengthSetActual,
  StrengthSetGoal,
  TrackingMode,
  Workout,
} from "@/types/models";

/**
 * Names of seed exercises that should be treated as cardio when migrating
 * legacy records that pre-date the trackingMode field. Matching is
 * case-insensitive on the exercise name.
 */
const LEGACY_CARDIO_NAMES = new Set<string>([
  "treadmill",
  "rowing machine",
  "assault bike",
  "stationary bike",
  "bike",
  "stairmaster",
  "elliptical",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toFiniteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function inferLegacyTrackingMode(exerciseName: string): TrackingMode {
  return LEGACY_CARDIO_NAMES.has(exerciseName.trim().toLowerCase())
    ? "cardio"
    : "strength";
}

export function normalizeExercise(raw: unknown): Exercise | null {
  if (!isRecord(raw)) return null;
  const { id, name, isCustom, muscleGroup, formNotes, trackingMode } = raw;

  if (typeof id !== "string" || typeof name !== "string") return null;

  const mode: TrackingMode =
    trackingMode === "strength" || trackingMode === "cardio"
      ? trackingMode
      : inferLegacyTrackingMode(name);

  return {
    id,
    name,
    isCustom: typeof isCustom === "boolean" ? isCustom : false,
    muscleGroup: typeof muscleGroup === "string" ? muscleGroup : undefined,
    formNotes: typeof formNotes === "string" ? formNotes : undefined,
    trackingMode: mode,
  };
}

function normalizeStrengthGoal(raw: Record<string, unknown>): StrengthSetGoal {
  const reps = toFiniteNumber(raw.reps) ?? 0;
  const weight = toFiniteNumber(raw.weight) ?? 0;
  const amount = toFiniteNumber(raw.amount) ?? undefined;
  const proposalSource =
    raw.proposalSource === "planned" || raw.proposalSource === "previous"
      ? raw.proposalSource
      : undefined;

  return {
    mode: "strength",
    reps,
    weight,
    ...(amount !== undefined ? { amount } : {}),
    isProposed: raw.isProposed === true,
    ...(proposalSource !== undefined ? { proposalSource } : {}),
  };
}

function normalizeCardioGoal(raw: Record<string, unknown>): CardioSetGoal {
  const seconds = toFiniteNumber(raw.seconds) ?? 0;
  const level = toFiniteNumber(raw.level) ?? 0;
  const amount = toFiniteNumber(raw.amount) ?? undefined;
  const proposalSource =
    raw.proposalSource === "planned" || raw.proposalSource === "previous"
      ? raw.proposalSource
      : undefined;

  return {
    mode: "cardio",
    seconds,
    level,
    ...(amount !== undefined ? { amount } : {}),
    isProposed: raw.isProposed === true,
    ...(proposalSource !== undefined ? { proposalSource } : {}),
  };
}

export function normalizeSetGoal(raw: unknown, fallback: TrackingMode): SetGoal {
  const record = isRecord(raw) ? raw : {};
  const mode =
    record.mode === "strength" || record.mode === "cardio"
      ? record.mode
      : fallback;

  return mode === "cardio"
    ? normalizeCardioGoal(record)
    : normalizeStrengthGoal(record);
}

function normalizeStrengthActual(raw: Record<string, unknown>): StrengthSetActual {
  const reps = raw.reps === null ? null : toFiniteNumber(raw.reps);
  const weight = raw.weight === null ? null : toFiniteNumber(raw.weight);
  return {
    mode: "strength",
    reps: reps == null ? null : reps,
    weight: weight == null ? null : weight,
  };
}

function normalizeCardioActual(raw: Record<string, unknown>): CardioSetActual {
  const seconds = raw.seconds === null ? null : toFiniteNumber(raw.seconds);
  const level = raw.level === null ? null : toFiniteNumber(raw.level);
  return {
    mode: "cardio",
    seconds: seconds == null ? null : seconds,
    level: level == null ? null : level,
  };
}

export function normalizeSetActual(
  raw: unknown,
  fallback: TrackingMode,
): SetActual {
  const record = isRecord(raw) ? raw : {};
  const mode =
    record.mode === "strength" || record.mode === "cardio"
      ? record.mode
      : fallback;

  return mode === "cardio"
    ? normalizeCardioActual(record)
    : normalizeStrengthActual(record);
}

export function normalizeExerciseSet(
  raw: unknown,
  fallback: TrackingMode,
): ExerciseSet | null {
  if (!isRecord(raw)) return null;
  const id = typeof raw.id === "string" ? raw.id : null;
  const setNumber = toFiniteNumber(raw.setNumber);
  if (id == null || setNumber == null) return null;

  const goal = normalizeSetGoal(raw.goal, fallback);
  const actual = normalizeSetActual(raw.actual, goal.mode);

  return {
    id,
    setNumber,
    goal,
    actual,
  };
}

export function normalizeBlockExercise(raw: unknown): BlockExercise | null {
  if (!isRecord(raw)) return null;
  const id = typeof raw.id === "string" ? raw.id : null;
  const exerciseId = typeof raw.exerciseId === "string" ? raw.exerciseId : null;
  const exerciseName =
    typeof raw.exerciseName === "string" ? raw.exerciseName : null;
  if (id == null || exerciseId == null || exerciseName == null) return null;

  const fallbackMode = inferFallbackModeFromSets(raw.sets, exerciseName);
  const sets = Array.isArray(raw.sets)
    ? raw.sets
        .map((s) => normalizeExerciseSet(s, fallbackMode))
        .filter((s): s is ExerciseSet => s !== null)
    : [];

  const nextSessionTargets = Array.isArray(raw.nextSessionTargets)
    ? raw.nextSessionTargets.map((g) => normalizeSetGoal(g, fallbackMode))
    : undefined;

  return {
    id,
    exerciseId,
    exerciseName,
    sets,
    notes: typeof raw.notes === "string" ? raw.notes : "",
    ...(nextSessionTargets !== undefined ? { nextSessionTargets } : {}),
  };
}

function inferFallbackModeFromSets(
  rawSets: unknown,
  exerciseName: string,
): TrackingMode {
  if (Array.isArray(rawSets)) {
    for (const set of rawSets) {
      if (!isRecord(set)) continue;
      const goal = set.goal;
      if (isRecord(goal)) {
        if (goal.mode === "cardio") return "cardio";
        if (goal.mode === "strength") return "strength";
        if ("seconds" in goal || "level" in goal) return "cardio";
      }
    }
  }
  return inferLegacyTrackingMode(exerciseName);
}

export function normalizeBlock(raw: unknown): Block | null {
  if (!isRecord(raw)) return null;
  const id = typeof raw.id === "string" ? raw.id : null;
  const order = toFiniteNumber(raw.order);
  if (id == null || order == null) return null;

  const status =
    raw.status === "planning" ||
    raw.status === "in-progress" ||
    raw.status === "finished"
      ? raw.status
      : "planning";

  const exercises = Array.isArray(raw.exercises)
    ? raw.exercises
        .map((e) => normalizeBlockExercise(e))
        .filter((e): e is BlockExercise => e !== null)
    : [];

  const restTimerSeconds =
    raw.restTimerSeconds === null
      ? null
      : toFiniteNumber(raw.restTimerSeconds);

  return {
    id,
    order,
    status,
    restTimerSeconds: restTimerSeconds === undefined ? null : restTimerSeconds,
    notes: typeof raw.notes === "string" ? raw.notes : "",
    exercises,
  };
}

export function normalizeWorkout(raw: unknown): Workout | null {
  if (!isRecord(raw)) return null;
  const id = typeof raw.id === "string" ? raw.id : null;
  const startedAt = toFiniteNumber(raw.startedAt);
  if (id == null || startedAt == null) return null;

  const status = raw.status === "active" ? "active" : "completed";
  const completedAt =
    raw.completedAt === null ? null : toFiniteNumber(raw.completedAt);
  const blocks = Array.isArray(raw.blocks)
    ? raw.blocks
        .map((b) => normalizeBlock(b))
        .filter((b): b is Block => b !== null)
    : [];

  return {
    id,
    status,
    startedAt,
    completedAt: completedAt === undefined ? null : completedAt,
    notes: typeof raw.notes === "string" ? raw.notes : "",
    blocks,
  };
}
