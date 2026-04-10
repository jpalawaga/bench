/** Unique identifier (nanoid) */
export type ID = string;

/** Unix timestamp in milliseconds */
export type Timestamp = number;

// ─── Exercise Library ───────────────────────────────────

export interface Exercise {
  id: ID;
  name: string;
  isCustom: boolean;
  muscleGroup?: string;
  formNotes?: string;
}

// ─── Set-level data ─────────────────────────────────────

export interface SetGoal {
  reps: number;
  weight: number; // lbs
  amount?: number;
  isProposed: boolean;
  proposalSource?: "planned" | "previous";
}

export interface SetActual {
  reps: number | null;
  weight: number | null;
}

export interface ExerciseSet {
  id: ID;
  setNumber: number;
  goal: SetGoal;
  actual: SetActual;
}

// ─── Exercise within a Block ────────────────────────────

export interface BlockExercise {
  id: ID;
  exerciseId: ID;
  exerciseName: string; // denormalized for display
  sets: ExerciseSet[];
  notes: string;
  nextSessionTargets?: SetGoal[];
}

// ─── Block ──────────────────────────────────────────────

export type BlockStatus = "planning" | "in-progress" | "finished";

export interface Block {
  id: ID;
  order: number;
  status: BlockStatus;
  restTimerSeconds: number | null;
  notes?: string;
  exercises: BlockExercise[];
}

// ─── Workout ────────────────────────────────────────────

export type WorkoutStatus = "active" | "completed";

export interface Workout {
  id: ID;
  status: WorkoutStatus;
  startedAt: Timestamp;
  completedAt: Timestamp | null;
  notes?: string;
  blocks: Block[];
}
