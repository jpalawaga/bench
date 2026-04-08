import { db } from "./database";
import type {
  Block,
  BlockExercise,
  Exercise,
  ExerciseSet,
  SetActual,
  SetGoal,
  Workout,
} from "@/types/models";

const BACKUP_FORMAT = "benchpress-backup";
const BACKUP_VERSION = 1;

export interface DatabaseBackup {
  format: typeof BACKUP_FORMAT;
  version: typeof BACKUP_VERSION;
  exportedAt: number;
  workouts: Workout[];
  exercises: Exercise[];
}

export interface DatabaseBackupSummary {
  workoutCount: number;
  exerciseCount: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isSetGoal(value: unknown): value is SetGoal {
  if (!isRecord(value)) return false;

  return (
    isFiniteNumber(value.reps) &&
    isFiniteNumber(value.weight) &&
    typeof value.isProposed === "boolean" &&
    (value.amount === undefined || isFiniteNumber(value.amount)) &&
    (value.proposalSource === undefined ||
      value.proposalSource === "planned" ||
      value.proposalSource === "previous")
  );
}

function isSetActual(value: unknown): value is SetActual {
  if (!isRecord(value)) return false;

  return (
    (value.reps === null || isFiniteNumber(value.reps)) &&
    (value.weight === null || isFiniteNumber(value.weight))
  );
}

function isExerciseSet(value: unknown): value is ExerciseSet {
  if (!isRecord(value)) return false;

  return (
    isString(value.id) &&
    isFiniteNumber(value.setNumber) &&
    isSetGoal(value.goal) &&
    isSetActual(value.actual)
  );
}

function isBlockExercise(value: unknown): value is BlockExercise {
  if (!isRecord(value) || !Array.isArray(value.sets)) return false;

  return (
    isString(value.id) &&
    isString(value.exerciseId) &&
    isString(value.exerciseName) &&
    isString(value.notes) &&
    value.sets.every(isExerciseSet) &&
    (value.nextSessionTargets === undefined ||
      (Array.isArray(value.nextSessionTargets) &&
        value.nextSessionTargets.every(isSetGoal)))
  );
}

function isBlock(value: unknown): value is Block {
  if (!isRecord(value) || !Array.isArray(value.exercises)) return false;

  return (
    isString(value.id) &&
    isFiniteNumber(value.order) &&
    (value.status === "planning" ||
      value.status === "in-progress" ||
      value.status === "finished") &&
    (value.restTimerSeconds === null || isFiniteNumber(value.restTimerSeconds)) &&
    value.exercises.every(isBlockExercise)
  );
}

function isWorkout(value: unknown): value is Workout {
  if (!isRecord(value) || !Array.isArray(value.blocks)) return false;

  return (
    isString(value.id) &&
    (value.status === "active" || value.status === "completed") &&
    isFiniteNumber(value.startedAt) &&
    (value.completedAt === null || isFiniteNumber(value.completedAt)) &&
    value.blocks.every(isBlock)
  );
}

function isExercise(value: unknown): value is Exercise {
  if (!isRecord(value)) return false;

  return (
    isString(value.id) &&
    isString(value.name) &&
    typeof value.isCustom === "boolean" &&
    (value.muscleGroup === undefined || isString(value.muscleGroup)) &&
    (value.formNotes === undefined || isString(value.formNotes))
  );
}

function isDatabaseBackup(value: unknown): value is DatabaseBackup {
  if (!isRecord(value)) return false;
  if (!Array.isArray(value.workouts) || !Array.isArray(value.exercises)) {
    return false;
  }

  return (
    value.format === BACKUP_FORMAT &&
    value.version === BACKUP_VERSION &&
    isFiniteNumber(value.exportedAt) &&
    value.workouts.every(isWorkout) &&
    value.exercises.every(isExercise)
  );
}

export async function createDatabaseBackup(): Promise<DatabaseBackup> {
  const [workouts, exercises] = await Promise.all([
    db.workouts.toArray(),
    db.exercises.toArray(),
  ]);

  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: Date.now(),
    workouts,
    exercises,
  };
}

export async function exportDatabaseBackup(): Promise<string> {
  const backup = await createDatabaseBackup();
  return JSON.stringify(backup, null, 2);
}

export function parseDatabaseBackup(json: string): DatabaseBackup {
  let parsed: unknown;

  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error("Backup JSON is not valid JSON.");
  }

  if (!isDatabaseBackup(parsed)) {
    throw new Error("Backup JSON does not match the Benchpress backup format.");
  }

  return parsed;
}

export async function importDatabaseBackup(
  json: string,
): Promise<DatabaseBackupSummary> {
  const backup = parseDatabaseBackup(json);

  await db.transaction("rw", db.workouts, db.exercises, async () => {
    await db.workouts.clear();
    await db.exercises.clear();

    if (backup.workouts.length > 0) {
      await db.workouts.bulkPut(backup.workouts);
    }

    if (backup.exercises.length > 0) {
      await db.exercises.bulkPut(backup.exercises);
    }
  });

  return {
    workoutCount: backup.workouts.length,
    exerciseCount: backup.exercises.length,
  };
}
