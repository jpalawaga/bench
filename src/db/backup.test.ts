import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Exercise, Workout } from "@/types/models";
import {
  createDatabaseBackup,
  importDatabaseBackup,
  parseDatabaseBackup,
} from "./backup";
import { db } from "./database";

const sampleExercise: Exercise = {
  id: "exercise-1",
  name: "Bench Press",
  isCustom: false,
  muscleGroup: "Chest",
};

const sampleWorkout: Workout = {
  id: "workout-1",
  status: "completed",
  startedAt: 1_700_000_000_000,
  completedAt: 1_700_000_100_000,
  blocks: [
    {
      id: "block-1",
      order: 1,
      status: "finished",
      restTimerSeconds: 120,
      exercises: [
        {
          id: "block-exercise-1",
          exerciseId: "exercise-1",
          exerciseName: "Bench Press",
          notes: "Felt good",
          nextSessionTargets: [
            {
              reps: 8,
              weight: 185,
              amount: 3,
              isProposed: false,
            },
          ],
          sets: [
            {
              id: "set-1",
              setNumber: 1,
              goal: {
                reps: 8,
                weight: 185,
                amount: 1,
                isProposed: false,
              },
              actual: {
                reps: 8,
                weight: 185,
              },
            },
          ],
        },
      ],
    },
  ],
};

async function clearDatabase() {
  await db.transaction("rw", db.workouts, db.exercises, async () => {
    await db.workouts.clear();
    await db.exercises.clear();
  });
}

describe("database backup", () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  afterEach(async () => {
    await clearDatabase();
  });

  it("exports and restores the full database snapshot", async () => {
    await db.exercises.put(sampleExercise);
    await db.workouts.put(sampleWorkout);

    const backup = await createDatabaseBackup();
    const serialized = JSON.stringify(backup);

    await clearDatabase();

    const summary = await importDatabaseBackup(serialized);
    const [workouts, exercises] = await Promise.all([
      db.workouts.toArray(),
      db.exercises.toArray(),
    ]);

    expect(summary).toEqual({
      workoutCount: 1,
      exerciseCount: 1,
    });
    expect(workouts).toEqual([sampleWorkout]);
    expect(exercises).toEqual([sampleExercise]);
  });

  it("rejects invalid backup payloads", () => {
    expect(() =>
      parseDatabaseBackup(JSON.stringify({ workouts: [], exercises: [] })),
    ).toThrow(/backup format/i);
  });
});
