import { db } from "./database";
import type { Exercise, Workout } from "@/types/models";
import { normalizeExercise, normalizeWorkout } from "./migrations";

const BACKUP_FORMAT = "benchpress-backup";
const CURRENT_BACKUP_VERSION = 2;
const SUPPORTED_BACKUP_VERSIONS = new Set([1, 2]);

export interface DatabaseBackup {
  format: typeof BACKUP_FORMAT;
  version: typeof CURRENT_BACKUP_VERSION;
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

interface BackupEnvelope {
  format: typeof BACKUP_FORMAT;
  version: number;
  exportedAt: number;
  workouts: unknown[];
  exercises: unknown[];
}

function hasBackupEnvelope(value: unknown): value is BackupEnvelope {
  return (
    isRecord(value) &&
    value.format === BACKUP_FORMAT &&
    typeof value.version === "number" &&
    SUPPORTED_BACKUP_VERSIONS.has(value.version) &&
    isFiniteNumber(value.exportedAt) &&
    Array.isArray(value.workouts) &&
    Array.isArray(value.exercises)
  );
}

export async function createDatabaseBackup(): Promise<DatabaseBackup> {
  const [rawWorkouts, rawExercises] = await Promise.all([
    db.workouts.toArray(),
    db.exercises.toArray(),
  ]);

  const workouts = rawWorkouts
    .map((w) => normalizeWorkout(w))
    .filter((w): w is Workout => w !== null);
  const exercises = rawExercises
    .map((ex) => normalizeExercise(ex))
    .filter((ex): ex is Exercise => ex !== null);

  return {
    format: BACKUP_FORMAT,
    version: CURRENT_BACKUP_VERSION,
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

  if (!hasBackupEnvelope(parsed)) {
    throw new Error("Backup JSON does not match the Benchpress backup format.");
  }

  const workouts = parsed.workouts
    .map((w) => normalizeWorkout(w))
    .filter((w): w is Workout => w !== null);
  const exercises = parsed.exercises
    .map((ex) => normalizeExercise(ex))
    .filter((ex): ex is Exercise => ex !== null);

  if (workouts.length !== parsed.workouts.length ||
      exercises.length !== parsed.exercises.length) {
    throw new Error("Backup JSON contains entries that could not be parsed.");
  }

  return {
    format: BACKUP_FORMAT,
    version: CURRENT_BACKUP_VERSION,
    exportedAt: parsed.exportedAt,
    workouts,
    exercises,
  };
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
