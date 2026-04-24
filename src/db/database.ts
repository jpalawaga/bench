import Dexie, { type Table } from "dexie";
import type { Workout, Exercise } from "@/types/models";
import {
  inferLegacyTrackingMode,
  normalizeBlockExercise,
} from "./migrations";

class BenchpressDB extends Dexie {
  workouts!: Table<Workout, string>;
  exercises!: Table<Exercise, string>;

  constructor() {
    super("benchpress");

    this.version(1).stores({
      workouts: "id, status, startedAt",
      exercises: "id, name, isCustom",
    });

    this.version(2)
      .stores({
        workouts: "id, status, startedAt",
        exercises: "id, name, isCustom",
      })
      .upgrade(async (tx) => {
        await tx
          .table("exercises")
          .toCollection()
          .modify((exercise: Record<string, unknown>) => {
            if (exercise.trackingMode === "strength" ||
                exercise.trackingMode === "cardio") {
              return;
            }
            const name = typeof exercise.name === "string" ? exercise.name : "";
            exercise.trackingMode = inferLegacyTrackingMode(name);
          });

        await tx
          .table("workouts")
          .toCollection()
          .modify((workout: Record<string, unknown>) => {
            if (!Array.isArray(workout.blocks)) return;
            for (const block of workout.blocks) {
              if (!block || typeof block !== "object") continue;
              const blockRecord = block as Record<string, unknown>;
              if (!Array.isArray(blockRecord.exercises)) continue;
              blockRecord.exercises = blockRecord.exercises
                .map((ex: unknown) => normalizeBlockExercise(ex))
                .filter((ex): ex is NonNullable<typeof ex> => ex !== null);
            }
          });
      });
  }
}

export const db = new BenchpressDB();
