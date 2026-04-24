/** Unique identifier (nanoid) */
export type ID = string;

/** Unix timestamp in milliseconds */
export type Timestamp = number;

// ─── Tracking mode ──────────────────────────────────────

export type TrackingMode = "strength" | "cardio";

// ─── Exercise Library ───────────────────────────────────

export interface Exercise {
  id: ID;
  name: string;
  isCustom: boolean;
  muscleGroup?: string;
  formNotes?: string;
  trackingMode: TrackingMode;
}

// ─── Set-level data ─────────────────────────────────────

interface SetGoalBase {
  amount?: number;
  isProposed: boolean;
  proposalSource?: "planned" | "previous";
}

export interface StrengthSetGoal extends SetGoalBase {
  mode: "strength";
  reps: number;
  weight: number; // lbs
}

export interface CardioSetGoal extends SetGoalBase {
  mode: "cardio";
  seconds: number;
  level: number;
}

export type SetGoal = StrengthSetGoal | CardioSetGoal;

export interface StrengthSetActual {
  mode: "strength";
  reps: number | null;
  weight: number | null;
}

export interface CardioSetActual {
  mode: "cardio";
  seconds: number | null;
  level: number | null;
}

export type SetActual = StrengthSetActual | CardioSetActual;

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
