import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Exercise, ExerciseSet, Workout } from "@/types/models";
import { db } from "./database";
import { repository } from "./repository";

function strengthSet(id: string): ExerciseSet {
  return {
    id,
    setNumber: 1,
    goal: {
      mode: "strength",
      reps: 8,
      weight: 100,
      amount: 1,
      isProposed: false,
    },
    actual: { mode: "strength", reps: 8, weight: 100 },
  };
}

function exercise(id: string, name: string): Exercise {
  return {
    id,
    name,
    isCustom: false,
    trackingMode: "strength",
  };
}

function completedWorkout(
  id: string,
  pairs: Array<[string, string]>,
  startedAt = 1_700_000_000_000,
): Workout {
  return {
    id,
    status: "completed",
    startedAt,
    completedAt: startedAt + 1,
    notes: "",
    blocks: pairs.map(([a, b], index) => ({
      id: `${id}-b${index}`,
      order: index + 1,
      status: "finished",
      restTimerSeconds: null,
      notes: "",
      exercises: [
        {
          id: `${id}-b${index}-${a}`,
          exerciseId: a,
          exerciseName: a,
          notes: "",
          sets: [strengthSet(`${id}-b${index}-${a}-s`)],
        },
        {
          id: `${id}-b${index}-${b}`,
          exerciseId: b,
          exerciseName: b,
          notes: "",
          sets: [strengthSet(`${id}-b${index}-${b}-s`)],
        },
      ],
    })),
  };
}

async function clearDatabase() {
  await db.transaction("rw", db.workouts, db.exercises, async () => {
    await db.workouts.clear();
    await db.exercises.clear();
  });
}

describe("getSupersetSuggestions", () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  afterEach(async () => {
    await clearDatabase();
  });

  it("returns empty when no current exercises are provided", async () => {
    expect(await repository.getSupersetSuggestions([], 2)).toEqual([]);
  });

  it("ranks suggestions by co-occurrence across completed finished blocks", async () => {
    await db.exercises.bulkPut([
      exercise("facepull", "Face Pull"),
      exercise("tricep-pushdown", "Tricep Pushdown"),
      exercise("lateral-raise", "Lateral Raise"),
      exercise("bench", "Bench Press"),
    ]);

    // facepull + tricep-pushdown appears 3 times
    await db.workouts.bulkPut([
      completedWorkout("w1", [["facepull", "tricep-pushdown"]], 1),
      completedWorkout("w2", [["facepull", "tricep-pushdown"]], 2),
      completedWorkout("w3", [["facepull", "tricep-pushdown"]], 3),
      // facepull + lateral-raise appears once
      completedWorkout("w4", [["facepull", "lateral-raise"]], 4),
      // bench + lateral-raise does not share facepull so should not count
      completedWorkout("w5", [["bench", "lateral-raise"]], 5),
    ]);

    const suggestions = await repository.getSupersetSuggestions(
      ["facepull"],
      2,
    );

    expect(suggestions.map((e) => e.id)).toEqual([
      "tricep-pushdown",
      "lateral-raise",
    ]);
  });

  it("never suggests an exercise already in the block", async () => {
    await db.exercises.bulkPut([
      exercise("facepull", "Face Pull"),
      exercise("tricep-pushdown", "Tricep Pushdown"),
    ]);
    await db.workouts.bulkPut([
      completedWorkout("w1", [["facepull", "tricep-pushdown"]]),
      completedWorkout("w2", [["facepull", "tricep-pushdown"]]),
    ]);

    const suggestions = await repository.getSupersetSuggestions(
      ["facepull", "tricep-pushdown"],
      2,
    );

    expect(suggestions).toEqual([]);
  });

  it("caps results at the requested limit", async () => {
    await db.exercises.bulkPut([
      exercise("core", "Core"),
      exercise("a", "A"),
      exercise("b", "B"),
      exercise("c", "C"),
    ]);
    await db.workouts.bulkPut([
      completedWorkout("w1", [["core", "a"]]),
      completedWorkout("w2", [["core", "b"]]),
      completedWorkout("w3", [["core", "c"]]),
    ]);

    const suggestions = await repository.getSupersetSuggestions(["core"], 2);
    expect(suggestions).toHaveLength(2);
  });

  it("drops candidates listed in excludeExerciseIds even when they have history", async () => {
    await db.exercises.bulkPut([
      exercise("facepull", "Face Pull"),
      exercise("tricep-pushdown", "Tricep Pushdown"),
      exercise("bench", "Bench Press"),
    ]);
    // tricep-pushdown has supersetted with bench historically
    await db.workouts.bulkPut([
      completedWorkout("w1", [["facepull", "tricep-pushdown"]]),
      completedWorkout("w2", [["tricep-pushdown", "bench"]]),
    ]);

    // Planning block anchored on facepull + tricep-pushdown, with bench
    // already scheduled somewhere else in the workout.
    const suggestions = await repository.getSupersetSuggestions(
      ["facepull", "tricep-pushdown"],
      2,
      ["bench"],
    );

    expect(suggestions.map((e) => e.id)).not.toContain("bench");
  });

  it("does not credit same-workout pairings that never shared a block", async () => {
    await db.exercises.bulkPut([
      exercise("facepull", "Face Pull"),
      exercise("tricep-pushdown", "Tricep Pushdown"),
      exercise("bench", "Bench Press"),
      exercise("row", "Dumbbell Row"),
    ]);

    // One workout, two distinct blocks: facepull+tricep-pushdown as a
    // superset, and bench+row as a separate superset. Bench never shared a
    // block with facepull or tricep-pushdown.
    const sessionWorkout: Workout = {
      id: "session",
      status: "completed",
      startedAt: 1,
      completedAt: 2,
      notes: "",
      blocks: [
        {
          id: "b1",
          order: 1,
          status: "finished",
          restTimerSeconds: null,
          notes: "",
          exercises: [
            {
              id: "b1-fp",
              exerciseId: "facepull",
              exerciseName: "Face Pull",
              notes: "",
              sets: [strengthSet("b1-fp-s")],
            },
            {
              id: "b1-tp",
              exerciseId: "tricep-pushdown",
              exerciseName: "Tricep Pushdown",
              notes: "",
              sets: [strengthSet("b1-tp-s")],
            },
          ],
        },
        {
          id: "b2",
          order: 2,
          status: "finished",
          restTimerSeconds: null,
          notes: "",
          exercises: [
            {
              id: "b2-bench",
              exerciseId: "bench",
              exerciseName: "Bench Press",
              notes: "",
              sets: [strengthSet("b2-bench-s")],
            },
            {
              id: "b2-row",
              exerciseId: "row",
              exerciseName: "Dumbbell Row",
              notes: "",
              sets: [strengthSet("b2-row-s")],
            },
          ],
        },
      ],
    };
    await db.workouts.put(sessionWorkout);

    const suggestions = await repository.getSupersetSuggestions(
      ["facepull", "tricep-pushdown"],
      2,
    );

    expect(suggestions.map((e) => e.id)).not.toContain("bench");
    expect(suggestions.map((e) => e.id)).not.toContain("row");
  });
});
