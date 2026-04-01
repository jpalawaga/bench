import Dexie, { type Table } from "dexie";
import type { Workout, Exercise } from "@/types/models";

class BenchpressDB extends Dexie {
  workouts!: Table<Workout, string>;
  exercises!: Table<Exercise, string>;

  constructor() {
    super("benchpress");
    this.version(1).stores({
      workouts: "id, status, startedAt",
      exercises: "id, name, isCustom",
    });
  }
}

export const db = new BenchpressDB();
