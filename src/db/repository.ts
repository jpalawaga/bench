import type {
  Exercise,
  ExerciseSet,
  ID,
  SetGoal,
  TrackingMode,
  Workout,
} from "@/types/models";
import { db } from "./database";
import { exerciseMatchesQuery } from "./exerciseSearch";
import { SEED_EXERCISES } from "./seed";
import {
  normalizeBlockExercise,
  normalizeExercise,
  normalizeWorkout,
} from "./migrations";

export interface ExerciseNoteHistoryEntry {
  note: string;
  startedAt: number;
}

export interface ExerciseHistoryEntry {
  workoutId: ID;
  startedAt: number;
  completedAt: number | null;
  exerciseName: string;
  notes: string;
  performedSets: ExerciseSet[];
  isSuperset: boolean;
  supersetPartners: string[];
}

export interface WorkoutRepository {
  // Workouts
  saveWorkout(workout: Workout): Promise<void>;
  getWorkout(id: ID): Promise<Workout | undefined>;
  getAllWorkouts(): Promise<Workout[]>;
  deleteWorkout(id: ID): Promise<void>;
  getActiveWorkout(): Promise<Workout | undefined>;

  // Exercises
  getAllExercises(): Promise<Exercise[]>;
  getExercise(id: ID): Promise<Exercise | undefined>;
  searchExercises(query: string): Promise<Exercise[]>;
  addExercise(exercise: Exercise): Promise<void>;
  updateExercise(exercise: Exercise): Promise<void>;
  deleteExercise(id: ID): Promise<void>;

  // Frequency
  getFrequentExercises(limit: number): Promise<Exercise[]>;
  getLastPerformedDates(): Promise<Record<ID, number>>;

  // Goal lookup
  getLastActuals(
    exerciseId: ID,
    mode: TrackingMode,
  ): Promise<ExerciseSet[] | undefined>;
  getNextSessionTargets(
    exerciseId: ID,
    mode: TrackingMode,
  ): Promise<SetGoal[] | undefined>;
  getRecentExerciseNotes(
    exerciseId: ID,
    limit: number,
  ): Promise<ExerciseNoteHistoryEntry[]>;
  getExerciseHistory(exerciseId: ID): Promise<ExerciseHistoryEntry[]>;
}

function normalizeExerciseOrFallback(raw: unknown): Exercise | undefined {
  const normalized = normalizeExercise(raw);
  return normalized ?? undefined;
}

function normalizeWorkoutOrFallback(raw: unknown): Workout | undefined {
  const normalized = normalizeWorkout(raw);
  return normalized ?? undefined;
}

class DexieWorkoutRepository implements WorkoutRepository {
  private seeded = false;

  private async ensureSeeded(): Promise<void> {
    if (this.seeded) return;
    const count = await db.exercises.count();
    if (count === 0) {
      await db.exercises.bulkAdd(SEED_EXERCISES);
    }
    this.seeded = true;
  }

  async saveWorkout(workout: Workout): Promise<void> {
    const normalized = normalizeWorkout(workout);
    if (!normalized) return;
    await db.workouts.put(normalized);
  }

  async getWorkout(id: ID): Promise<Workout | undefined> {
    const workout = await db.workouts.get(id);
    return normalizeWorkoutOrFallback(workout);
  }

  async getAllWorkouts(): Promise<Workout[]> {
    const workouts = await db.workouts.orderBy("startedAt").reverse().toArray();
    return workouts
      .map((w) => normalizeWorkout(w))
      .filter((w): w is Workout => w !== null);
  }

  async deleteWorkout(id: ID): Promise<void> {
    await db.workouts.delete(id);
  }

  async getActiveWorkout(): Promise<Workout | undefined> {
    const workout = await db.workouts.where("status").equals("active").first();
    return normalizeWorkoutOrFallback(workout);
  }

  async getAllExercises(): Promise<Exercise[]> {
    await this.ensureSeeded();
    const raw = await db.exercises.orderBy("name").toArray();
    return raw
      .map((ex) => normalizeExercise(ex))
      .filter((ex): ex is Exercise => ex !== null);
  }

  async getExercise(id: ID): Promise<Exercise | undefined> {
    await this.ensureSeeded();
    const raw = await db.exercises.get(id);
    return normalizeExerciseOrFallback(raw);
  }

  async searchExercises(query: string): Promise<Exercise[]> {
    await this.ensureSeeded();
    if (!query.trim()) {
      return this.getAllExercises();
    }
    const raw = await db.exercises
      .filter((ex) => exerciseMatchesQuery(ex, query))
      .sortBy("name");
    return raw
      .map((ex) => normalizeExercise(ex))
      .filter((ex): ex is Exercise => ex !== null);
  }

  async addExercise(exercise: Exercise): Promise<void> {
    await db.exercises.add(exercise);
  }

  async updateExercise(exercise: Exercise): Promise<void> {
    await db.exercises.put(exercise);
  }

  async deleteExercise(id: ID): Promise<void> {
    await db.exercises.delete(id);
  }

  async getFrequentExercises(limit: number): Promise<Exercise[]> {
    await this.ensureSeeded();
    const workouts = await db.workouts
      .where("status")
      .equals("completed")
      .toArray();

    // Count how many workouts each exercise appears in
    const counts = new Map<ID, number>();
    for (const workout of workouts) {
      const seen = new Set<ID>();
      for (const block of workout.blocks) {
        for (const ex of block.exercises) {
          if (!seen.has(ex.exerciseId)) {
            seen.add(ex.exerciseId);
            counts.set(ex.exerciseId, (counts.get(ex.exerciseId) ?? 0) + 1);
          }
        }
      }
    }

    if (counts.size === 0) return [];

    // Sort by frequency descending, take top N
    const topIds = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([id]) => id);

    const raw = await db.exercises.bulkGet(topIds);
    return raw
      .map((ex) => (ex ? normalizeExercise(ex) : null))
      .filter((ex): ex is Exercise => ex !== null);
  }

  async getLastPerformedDates(): Promise<Record<ID, number>> {
    const workouts = await db.workouts
      .where("status")
      .equals("completed")
      .reverse()
      .sortBy("startedAt");

    const dates: Record<ID, number> = {};

    for (const workout of workouts) {
      for (const block of workout.blocks) {
        if (block.status !== "finished") continue;

        for (const exercise of block.exercises) {
          if (dates[exercise.exerciseId] != null) continue;
          dates[exercise.exerciseId] = workout.startedAt;
        }
      }
    }

    return dates;
  }

  async getLastActuals(
    exerciseId: ID,
    mode: TrackingMode,
  ): Promise<ExerciseSet[] | undefined> {
    const workouts = await db.workouts
      .where("status")
      .equals("completed")
      .reverse()
      .sortBy("startedAt");

    for (const workout of workouts) {
      for (const block of workout.blocks) {
        if (block.status !== "finished") continue;
        const rawMatch = block.exercises.find(
          (ex) => ex.exerciseId === exerciseId,
        );
        if (!rawMatch) continue;

        const match = normalizeBlockExercise(rawMatch);
        if (!match) continue;
        if (match.sets.length === 0) continue;
        if (match.sets[0]?.goal.mode !== mode) continue;
        return match.sets;
      }
    }
    return undefined;
  }

  async getNextSessionTargets(
    exerciseId: ID,
    mode: TrackingMode,
  ): Promise<SetGoal[] | undefined> {
    const workouts = await db.workouts
      .where("status")
      .equals("completed")
      .reverse()
      .sortBy("startedAt");

    for (const workout of workouts) {
      for (const block of workout.blocks) {
        if (block.status !== "finished") continue;
        const rawMatch = block.exercises.find(
          (ex) => ex.exerciseId === exerciseId,
        );
        if (!rawMatch) continue;

        const match = normalizeBlockExercise(rawMatch);
        if (!match?.nextSessionTargets?.length) continue;
        if (match.nextSessionTargets[0]?.mode !== mode) continue;
        return match.nextSessionTargets;
      }
    }
    return undefined;
  }

  async getRecentExerciseNotes(
    exerciseId: ID,
    limit: number,
  ): Promise<ExerciseNoteHistoryEntry[]> {
    const rawWorkouts = await db.workouts
      .where("status")
      .equals("completed")
      .reverse()
      .sortBy("startedAt");
    const workouts = rawWorkouts
      .map((w) => normalizeWorkout(w))
      .filter((w): w is Workout => w !== null);

    const entries: ExerciseNoteHistoryEntry[] = [];

    for (const workout of workouts) {
      for (const block of workout.blocks) {
        if (block.status !== "finished") continue;

        for (const exercise of block.exercises) {
          if (exercise.exerciseId !== exerciseId) continue;
          if (!exercise.notes.trim()) continue;

          entries.push({
            note: exercise.notes.trim(),
            startedAt: workout.startedAt,
          });

          if (entries.length >= limit) {
            return entries;
          }
        }
      }
    }

    return entries;
  }

  async getExerciseHistory(exerciseId: ID): Promise<ExerciseHistoryEntry[]> {
    const rawWorkouts = await db.workouts
      .where("status")
      .equals("completed")
      .reverse()
      .sortBy("startedAt");
    const workouts = rawWorkouts
      .map((w) => normalizeWorkout(w))
      .filter((w): w is Workout => w !== null);

    const entries: ExerciseHistoryEntry[] = [];

    for (const workout of workouts) {
      for (const block of workout.blocks) {
        if (block.status !== "finished") continue;

        for (const exercise of block.exercises) {
          if (exercise.exerciseId !== exerciseId) continue;

          entries.push({
            workoutId: workout.id,
            startedAt: workout.startedAt,
            completedAt: workout.completedAt,
            exerciseName: exercise.exerciseName,
            notes: exercise.notes.trim(),
            performedSets: exercise.sets,
            isSuperset: block.exercises.length > 1,
            supersetPartners: block.exercises
              .filter((blockExercise) => blockExercise.exerciseId !== exerciseId)
              .map((blockExercise) => blockExercise.exerciseName),
          });
        }
      }
    }

    return entries;
  }
}

export const repository: WorkoutRepository = new DexieWorkoutRepository();
