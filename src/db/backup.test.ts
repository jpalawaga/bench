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
  trackingMode: "strength",
};

const sampleCardioExercise: Exercise = {
  id: "exercise-2",
  name: "Stairmaster",
  isCustom: false,
  muscleGroup: "Cardio",
  trackingMode: "cardio",
};

const sampleWorkout: Workout = {
  id: "workout-1",
  status: "completed",
  startedAt: 1_700_000_000_000,
  completedAt: 1_700_000_100_000,
  notes: "",
  blocks: [
    {
      id: "block-1",
      order: 1,
      status: "finished",
      restTimerSeconds: 120,
      notes: "",
      exercises: [
        {
          id: "block-exercise-1",
          exerciseId: "exercise-1",
          exerciseName: "Bench Press",
          notes: "Felt good",
          nextSessionTargets: [
            {
              mode: "strength",
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
                mode: "strength",
                reps: 8,
                weight: 185,
                amount: 1,
                isProposed: false,
              },
              actual: {
                mode: "strength",
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

  it("round-trips cardio exercises with seconds/level metrics", async () => {
    await db.exercises.put(sampleCardioExercise);

    const cardioWorkout: Workout = {
      id: "workout-cardio",
      status: "completed",
      startedAt: 1_700_000_000_000,
      completedAt: 1_700_000_200_000,
      notes: "",
      blocks: [
        {
          id: "block-c",
          order: 1,
          status: "finished",
          restTimerSeconds: null,
          notes: "",
          exercises: [
            {
              id: "be-c",
              exerciseId: "exercise-2",
              exerciseName: "Stairmaster",
              notes: "",
              sets: [
                {
                  id: "set-c-1",
                  setNumber: 1,
                  goal: {
                    mode: "cardio",
                    seconds: 600,
                    level: 7,
                    amount: 1,
                    isProposed: false,
                  },
                  actual: {
                    mode: "cardio",
                    seconds: 615,
                    level: 7,
                  },
                },
              ],
            },
          ],
        },
      ],
    };
    await db.workouts.put(cardioWorkout);

    const serialized = JSON.stringify(await createDatabaseBackup());
    await clearDatabase();
    await importDatabaseBackup(serialized);

    const [workouts, exercises] = await Promise.all([
      db.workouts.toArray(),
      db.exercises.toArray(),
    ]);
    expect(workouts).toEqual([cardioWorkout]);
    expect(exercises).toEqual([sampleCardioExercise]);
  });

  it("accepts v1 backups without trackingMode or set mode fields", async () => {
    const legacyBackup = {
      format: "benchpress-backup",
      version: 1,
      exportedAt: 1_700_000_000_000,
      exercises: [
        {
          id: "legacy-ex-1",
          name: "Assault Bike",
          isCustom: false,
          muscleGroup: "Cardio",
        },
        {
          id: "legacy-ex-2",
          name: "Bench Press",
          isCustom: false,
          muscleGroup: "Chest",
        },
      ],
      workouts: [
        {
          id: "legacy-workout",
          status: "completed",
          startedAt: 1_700_000_000_000,
          completedAt: 1_700_000_100_000,
          blocks: [
            {
              id: "legacy-block",
              order: 1,
              status: "finished",
              restTimerSeconds: 90,
              exercises: [
                {
                  id: "legacy-be",
                  exerciseId: "legacy-ex-2",
                  exerciseName: "Bench Press",
                  notes: "",
                  sets: [
                    {
                      id: "legacy-set",
                      setNumber: 1,
                      goal: {
                        reps: 8,
                        weight: 135,
                        amount: 1,
                        isProposed: false,
                      },
                      actual: { reps: 8, weight: 135 },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };

    const summary = await importDatabaseBackup(JSON.stringify(legacyBackup));
    expect(summary).toEqual({ workoutCount: 1, exerciseCount: 2 });

    const exercises = await db.exercises.orderBy("id").toArray();
    const cardioExercise = exercises.find((e) => e.name === "Assault Bike");
    const strengthExercise = exercises.find((e) => e.name === "Bench Press");
    expect(cardioExercise?.trackingMode).toBe("cardio");
    expect(strengthExercise?.trackingMode).toBe("strength");

    const workout = await db.workouts.get("legacy-workout");
    const set = workout?.blocks[0]?.exercises[0]?.sets[0];
    expect(set?.goal.mode).toBe("strength");
    expect(set?.actual.mode).toBe("strength");
  });
});
