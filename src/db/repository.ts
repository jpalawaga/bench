import type {
  Exercise,
  ExerciseSet,
  ID,
  SetGoal,
  Workout,
} from "@/types/models";
import { db } from "./database";
import { SEED_EXERCISES } from "./seed";

export interface ExerciseNoteHistoryEntry {
  note: string;
  startedAt: number;
}

export interface WorkoutNoteHistoryEntry {
  note: string;
  startedAt: number;
}

export interface BlockNoteHistoryEntry {
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
  getLastActuals(exerciseId: ID): Promise<ExerciseSet[] | undefined>;
  getNextSessionTargets(exerciseId: ID): Promise<SetGoal[] | undefined>;
  getRecentExerciseNotes(
    exerciseId: ID,
    limit: number,
  ): Promise<ExerciseNoteHistoryEntry[]>;
  getRecentWorkoutNotes(limit: number): Promise<WorkoutNoteHistoryEntry[]>;
  getRecentBlockNotes(
    exerciseIds: ID[],
    limit: number,
  ): Promise<BlockNoteHistoryEntry[]>;
  getExerciseHistory(exerciseId: ID): Promise<ExerciseHistoryEntry[]>;
}

class DexieWorkoutRepository implements WorkoutRepository {
  private seeded = false;

  private normalizeWorkout(workout: Workout): Workout {
    return {
      ...workout,
      notes: workout.notes ?? "",
      blocks: workout.blocks.map((block) => ({
        ...block,
        notes: block.notes ?? "",
      })),
    };
  }

  private async ensureSeeded(): Promise<void> {
    if (this.seeded) return;
    const count = await db.exercises.count();
    if (count === 0) {
      await db.exercises.bulkAdd(SEED_EXERCISES);
    }
    this.seeded = true;
  }

  async saveWorkout(workout: Workout): Promise<void> {
    await db.workouts.put(this.normalizeWorkout(workout));
  }

  async getWorkout(id: ID): Promise<Workout | undefined> {
    const workout = await db.workouts.get(id);
    return workout ? this.normalizeWorkout(workout) : undefined;
  }

  async getAllWorkouts(): Promise<Workout[]> {
    const workouts = await db.workouts.orderBy("startedAt").reverse().toArray();
    return workouts.map((workout) => this.normalizeWorkout(workout));
  }

  async deleteWorkout(id: ID): Promise<void> {
    await db.workouts.delete(id);
  }

  async getActiveWorkout(): Promise<Workout | undefined> {
    const workout = await db.workouts.where("status").equals("active").first();
    return workout ? this.normalizeWorkout(workout) : undefined;
  }

  async getAllExercises(): Promise<Exercise[]> {
    await this.ensureSeeded();
    return db.exercises.orderBy("name").toArray();
  }

  async getExercise(id: ID): Promise<Exercise | undefined> {
    await this.ensureSeeded();
    return db.exercises.get(id);
  }

  async searchExercises(query: string): Promise<Exercise[]> {
    await this.ensureSeeded();
    if (!query.trim()) {
      return this.getAllExercises();
    }
    const lower = query.toLowerCase();
    return db.exercises
      .filter((ex) => ex.name.toLowerCase().includes(lower))
      .sortBy("name");
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

    // Fetch the Exercise objects and preserve frequency order
    const exercises = await db.exercises.bulkGet(topIds);
    return exercises.filter((e): e is Exercise => e !== undefined);
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

  async getLastActuals(exerciseId: ID): Promise<ExerciseSet[] | undefined> {
    const workouts = await db.workouts
      .where("status")
      .equals("completed")
      .reverse()
      .sortBy("startedAt");

    for (const workout of workouts) {
      for (const block of workout.blocks) {
        if (block.status !== "finished") continue;
        const match = block.exercises.find(
          (ex) => ex.exerciseId === exerciseId,
        );
        if (match) return match.sets;
      }
    }
    return undefined;
  }

  async getNextSessionTargets(
    exerciseId: ID,
  ): Promise<SetGoal[] | undefined> {
    const workouts = await db.workouts
      .where("status")
      .equals("completed")
      .reverse()
      .sortBy("startedAt");

    for (const workout of workouts) {
      for (const block of workout.blocks) {
        if (block.status !== "finished") continue;
        const match = block.exercises.find(
          (ex) => ex.exerciseId === exerciseId,
        );
        if (match?.nextSessionTargets) return match.nextSessionTargets;
      }
    }
    return undefined;
  }

  async getRecentExerciseNotes(
    exerciseId: ID,
    limit: number,
  ): Promise<ExerciseNoteHistoryEntry[]> {
    const workouts = (await db.workouts
      .where("status")
      .equals("completed")
      .reverse()
      .sortBy("startedAt")).map((workout) => this.normalizeWorkout(workout));

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

  async getRecentWorkoutNotes(limit: number): Promise<WorkoutNoteHistoryEntry[]> {
    const workouts = (await db.workouts
      .where("status")
      .equals("completed")
      .reverse()
      .sortBy("startedAt")).map((workout) => this.normalizeWorkout(workout));

    const entries: WorkoutNoteHistoryEntry[] = [];

    for (const workout of workouts) {
      if (!workout.notes?.trim()) continue;

      entries.push({
        note: workout.notes.trim(),
        startedAt: workout.startedAt,
      });

      if (entries.length >= limit) {
        return entries;
      }
    }

    return entries;
  }

  async getRecentBlockNotes(
    exerciseIds: ID[],
    limit: number,
  ): Promise<BlockNoteHistoryEntry[]> {
    const workouts = (await db.workouts
      .where("status")
      .equals("completed")
      .reverse()
      .sortBy("startedAt")).map((workout) => this.normalizeWorkout(workout));

    const targetSignature = [...exerciseIds].sort().join("|");
    const entries: BlockNoteHistoryEntry[] = [];

    for (const workout of workouts) {
      for (const block of workout.blocks) {
        if (block.status !== "finished") continue;
        if (!block.notes?.trim()) continue;

        const blockSignature = block.exercises
          .map((exercise) => exercise.exerciseId)
          .sort()
          .join("|");
        if (blockSignature !== targetSignature) continue;

        entries.push({
          note: block.notes.trim(),
          startedAt: workout.startedAt,
        });

        if (entries.length >= limit) {
          return entries;
        }
      }
    }

    return entries;
  }

  async getExerciseHistory(exerciseId: ID): Promise<ExerciseHistoryEntry[]> {
    const workouts = (await db.workouts
      .where("status")
      .equals("completed")
      .reverse()
      .sortBy("startedAt")).map((workout) => this.normalizeWorkout(workout));

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
