import { create } from "zustand";
import type { Block, BlockExercise, Workout } from "@/types/models";
import { generateId } from "@/lib/utils";
import { repository } from "@/db/repository";

export type WorkoutView =
  | "block-list"
  | "new-block"
  | "exercise-select"
  | "goal-setting"
  | "block-in-progress"
  | "block-finished";

interface WorkoutState {
  workout: Workout | null;
  currentView: WorkoutView;
  activeBlockIndex: number;
  activeExerciseTabIndex: number;
  activeSetExerciseIndex: number | null;
  activeSetIndex: number | null;
  pendingExerciseId: string | null;
  pendingExerciseName: string | null;

  // Actions
  loadWorkout: (workout: Workout) => void;
  setView: (view: WorkoutView) => void;
  addBlock: () => void;
  removeBlock: (index: number) => void;
  setActiveBlock: (index: number) => void;
  addExerciseToBlock: (exercise: BlockExercise) => void;
  removeExerciseFromBlock: (exerciseId: string) => void;
  setRestTimer: (seconds: number | null) => void;
  setPendingExercise: (id: string, name: string) => void;
  setActiveSet: (exerciseIndex: number | null, setIndex: number | null) => void;
  advanceActiveSet: (
    exerciseIndex: number,
    setIndex: number,
  ) => void;
  startBlock: () => void;
  recordActual: (
    exerciseIndex: number,
    setIndex: number,
    reps: number | null,
    weight: number | null,
  ) => void;
  addSetToExercise: (exerciseIndex: number) => void;
  removeSetFromExercise: (exerciseIndex: number, setIndex: number) => void;
  finishBlock: () => void;
  setNextSessionTargets: (
    exerciseIndex: number,
    targets: BlockExercise["nextSessionTargets"],
  ) => void;
  finishWorkout: () => Promise<void>;
  updateWorkoutNotes: (notes: string) => void;
  updateBlockNotes: (notes: string) => void;
  updateExerciseNotes: (exerciseIndex: number, notes: string) => void;
  persist: () => Promise<void>;
  reset: () => void;
}

function normalizeWorkout(workout: Workout): Workout {
  return {
    ...workout,
    notes: workout.notes ?? "",
    blocks: workout.blocks.map((block) => ({
      ...block,
      notes: block.notes ?? "",
    })),
  };
}

function isSetIncomplete(exercise: BlockExercise, setIndex: number): boolean {
  const set = exercise.sets[setIndex];
  return Boolean(set && (set.actual.reps == null || set.actual.weight == null));
}

export function getFirstIncompleteSetIndex(
  exercise: BlockExercise | undefined,
): number | null {
  if (!exercise) return null;

  const firstIncompleteIndex = exercise.sets.findIndex(
    (set) => set.actual.reps == null || set.actual.weight == null,
  );

  return firstIncompleteIndex >= 0 ? firstIncompleteIndex : null;
}

export function getNextExerciseWithUnfinishedSet(
  block: Block,
  currentExerciseIndex: number,
): { exerciseIndex: number; setIndex: number } | null {
  const exerciseCount = block.exercises.length;
  if (exerciseCount === 0) return null;

  if (exerciseCount > 1) {
    for (let offset = 1; offset < exerciseCount; offset += 1) {
      const exerciseIndex = (currentExerciseIndex + offset) % exerciseCount;
      const setIndex = getFirstIncompleteSetIndex(block.exercises[exerciseIndex]);
      if (setIndex != null) {
        return { exerciseIndex, setIndex };
      }
    }
  }

  const currentSetIndex = getFirstIncompleteSetIndex(
    block.exercises[currentExerciseIndex],
  );
  return currentSetIndex != null
    ? { exerciseIndex: currentExerciseIndex, setIndex: currentSetIndex }
    : null;
}

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  workout: null,
  currentView: "block-list",
  activeBlockIndex: 0,
  activeExerciseTabIndex: 0,
  activeSetExerciseIndex: null,
  activeSetIndex: null,
  pendingExerciseId: null,
  pendingExerciseName: null,

  loadWorkout: (workout) =>
    set({
      workout: normalizeWorkout(workout),
      currentView: "block-list",
      activeSetExerciseIndex: null,
      activeSetIndex: null,
    }),

  setView: (view) => set({ currentView: view }),

  addBlock: () => {
    const { workout } = get();
    if (!workout) return;
    // Carry forward rest timer from the last block
    const lastBlock = workout.blocks[workout.blocks.length - 1];
    const block: Block = {
      id: generateId(),
      order: workout.blocks.length + 1,
      status: "planning",
      restTimerSeconds: lastBlock?.restTimerSeconds ?? null,
      notes: "",
      exercises: [],
    };
    const updated = {
      ...workout,
      blocks: [...workout.blocks, block],
    };
    set({
      workout: updated,
      activeBlockIndex: updated.blocks.length - 1,
      activeSetExerciseIndex: null,
      activeSetIndex: null,
      currentView: "new-block",
    });
    get().persist();
  },

  removeBlock: (index) => {
    const { workout, activeBlockIndex } = get();
    if (!workout) return;

    const blocks = workout.blocks
      .filter((_, i) => i !== index)
      .map((block, i) => ({
        ...block,
        order: i + 1,
      }));

    const nextActiveBlockIndex =
      blocks.length === 0
        ? 0
        : index < activeBlockIndex
          ? activeBlockIndex - 1
          : Math.min(activeBlockIndex, blocks.length - 1);

    set({
      workout: { ...workout, blocks },
      activeBlockIndex: nextActiveBlockIndex,
      activeSetExerciseIndex: null,
      activeSetIndex: null,
      currentView: "block-list",
    });
    get().persist();
  },

  setActiveBlock: (index) => set({ activeBlockIndex: index }),

  addExerciseToBlock: (exercise) => {
    const { workout, activeBlockIndex } = get();
    if (!workout) return;
    const blocks = workout.blocks.map((b, i) =>
      i === activeBlockIndex
        ? { ...b, exercises: [...b.exercises, exercise] }
        : b,
    );
    set({
      workout: { ...workout, blocks },
      currentView: "new-block",
      pendingExerciseId: null,
      pendingExerciseName: null,
    });
    get().persist();
  },

  removeExerciseFromBlock: (exerciseId) => {
    const { workout, activeBlockIndex } = get();
    if (!workout) return;

    const blocks = workout.blocks.map((block, index) => {
      if (index !== activeBlockIndex) return block;

      return {
        ...block,
        exercises: block.exercises.filter(
          (exercise) => exercise.id !== exerciseId,
        ),
      };
    });

    set({ workout: { ...workout, blocks } });
    get().persist();
  },

  setRestTimer: (seconds) => {
    const { workout, activeBlockIndex } = get();
    if (!workout) return;
    const blocks = workout.blocks.map((b, i) =>
      i === activeBlockIndex ? { ...b, restTimerSeconds: seconds } : b,
    );
    set({ workout: { ...workout, blocks } });
    get().persist();
  },

  setPendingExercise: (id, name) =>
    set({
      pendingExerciseId: id,
      pendingExerciseName: name,
      currentView: "goal-setting",
    }),

  setActiveSet: (exerciseIndex, setIndex) =>
    set({
      activeSetExerciseIndex: exerciseIndex,
      activeSetIndex: setIndex,
      ...(exerciseIndex != null ? { activeExerciseTabIndex: exerciseIndex } : {}),
    }),

  advanceActiveSet: (exerciseIndex, setIndex) => {
    const { workout, activeBlockIndex } = get();
    const block = workout?.blocks[activeBlockIndex];

    if (!block) {
      set({ activeSetExerciseIndex: null, activeSetIndex: null });
      return;
    }

    const currentExercise = block.exercises[exerciseIndex];
    if (!currentExercise) {
      set({ activeSetExerciseIndex: null, activeSetIndex: null });
      return;
    }
    const shouldAdvanceWithinCurrentExercise = isSetIncomplete(
      currentExercise,
      setIndex,
    );
    const nextPosition = shouldAdvanceWithinCurrentExercise
      ? {
          exerciseIndex,
          setIndex,
        }
      : getNextExerciseWithUnfinishedSet(block, exerciseIndex);

    set({
      activeSetExerciseIndex: nextPosition?.exerciseIndex ?? null,
      activeSetIndex: nextPosition?.setIndex ?? null,
      activeExerciseTabIndex:
        nextPosition?.exerciseIndex ?? get().activeExerciseTabIndex,
    });
  },

  startBlock: () => {
    const { workout, activeBlockIndex } = get();
    if (!workout) return;
    const blocks = workout.blocks.map((b, i) =>
      i === activeBlockIndex ? { ...b, status: "in-progress" as const } : b,
    );
    const initialSetIndex = getFirstIncompleteSetIndex(blocks[activeBlockIndex]?.exercises[0]);
    set({
      workout: { ...workout, blocks },
      currentView: "block-in-progress",
      activeExerciseTabIndex: 0,
      activeSetExerciseIndex: initialSetIndex != null ? 0 : null,
      activeSetIndex: initialSetIndex,
    });
    get().persist();
  },

  recordActual: (exerciseIndex, setIndex, reps, weight) => {
    const { workout, activeBlockIndex } = get();
    if (!workout) return;
    const blocks = workout.blocks.map((b, i) => {
      if (i !== activeBlockIndex) return b;
      const exercises = b.exercises.map((ex, ei) => {
        if (ei !== exerciseIndex) return ex;
        const sets = ex.sets.map((s, si) =>
          si === setIndex ? { ...s, actual: { reps, weight } } : s,
        );
        return { ...ex, sets };
      });
      return { ...b, exercises };
    });
    const {
      activeSetExerciseIndex,
      activeSetIndex,
      activeExerciseTabIndex,
    } = get();

    set({
      workout: { ...workout, blocks },
      activeSetExerciseIndex,
      activeSetIndex,
      activeExerciseTabIndex,
    });
    get().persist();
  },

  addSetToExercise: (exerciseIndex) => {
    const { workout, activeBlockIndex } = get();
    if (!workout) return;
    const blocks = workout.blocks.map((b, i) => {
      if (i !== activeBlockIndex) return b;
      const exercises = b.exercises.map((ex, ei) => {
        if (ei !== exerciseIndex) return ex;
        const lastSet = ex.sets[ex.sets.length - 1];
        const newSet = {
          id: generateId(),
          setNumber: ex.sets.length + 1,
          goal: lastSet
            ? { ...lastSet.goal, amount: 1, isProposed: false }
            : { reps: 0, weight: 0, amount: 1, isProposed: false },
          actual: { reps: null, weight: null },
        };
        return { ...ex, sets: [...ex.sets, newSet] };
      });
      return { ...b, exercises };
    });
    set({ workout: { ...workout, blocks } });
    get().persist();
  },

  removeSetFromExercise: (exerciseIndex, setIndex) => {
    const {
      workout,
      activeBlockIndex,
      activeSetExerciseIndex,
      activeSetIndex,
    } = get();
    if (!workout) return;
    const blocks = workout.blocks.map((b, i) => {
      if (i !== activeBlockIndex) return b;
      const exercises = b.exercises.map((ex, ei) => {
        if (ei !== exerciseIndex) return ex;
        const sets = ex.sets
          .filter((_, si) => si !== setIndex)
          .map((s, si) => ({ ...s, setNumber: si + 1 }));
        return { ...ex, sets };
      });
      return { ...b, exercises };
    });
    const nextActiveSetIndex =
      activeSetExerciseIndex !== exerciseIndex || activeSetIndex == null
        ? activeSetIndex
        : activeSetIndex === setIndex
          ? null
          : activeSetIndex > setIndex
            ? activeSetIndex - 1
            : activeSetIndex;

    set({
      workout: { ...workout, blocks },
      activeSetExerciseIndex:
        nextActiveSetIndex == null && activeSetExerciseIndex === exerciseIndex
          ? null
          : activeSetExerciseIndex,
      activeSetIndex: nextActiveSetIndex,
    });
    get().persist();
  },

  finishBlock: () => {
    const { workout, activeBlockIndex } = get();
    if (!workout) return;
    const blocks = workout.blocks.map((b, i) =>
      i === activeBlockIndex ? { ...b, status: "finished" as const } : b,
    );
    set({
      workout: { ...workout, blocks },
      activeSetExerciseIndex: null,
      activeSetIndex: null,
      currentView: "block-finished",
    });
    get().persist();
  },

  setNextSessionTargets: (exerciseIndex, targets) => {
    const { workout, activeBlockIndex } = get();
    if (!workout) return;
    const blocks = workout.blocks.map((b, i) => {
      if (i !== activeBlockIndex) return b;
      const exercises = b.exercises.map((ex, ei) =>
        ei === exerciseIndex ? { ...ex, nextSessionTargets: targets } : ex,
      );
      return { ...b, exercises };
    });
    set({ workout: { ...workout, blocks } });
    get().persist();
  },

  updateWorkoutNotes: (notes) => {
    const { workout } = get();
    if (!workout) return;
    set({ workout: { ...workout, notes } });
    get().persist();
  },

  updateBlockNotes: (notes) => {
    const { workout, activeBlockIndex } = get();
    if (!workout) return;
    const blocks = workout.blocks.map((block, index) =>
      index === activeBlockIndex ? { ...block, notes } : block,
    );
    set({ workout: { ...workout, blocks } });
    get().persist();
  },

  updateExerciseNotes: (exerciseIndex, notes) => {
    const { workout, activeBlockIndex } = get();
    if (!workout) return;
    const blocks = workout.blocks.map((b, i) => {
      if (i !== activeBlockIndex) return b;
      const exercises = b.exercises.map((ex, ei) =>
        ei === exerciseIndex ? { ...ex, notes } : ex,
      );
      return { ...b, exercises };
    });
    set({ workout: { ...workout, blocks } });
    get().persist();
  },

  finishWorkout: async () => {
    const { workout } = get();
    if (!workout) return;
    const completed: Workout = {
      ...workout,
      status: "completed",
      completedAt: Date.now(),
    };
    await repository.saveWorkout(completed);
    set({
      workout: null,
      currentView: "block-list",
      activeBlockIndex: 0,
      activeExerciseTabIndex: 0,
      activeSetExerciseIndex: null,
      activeSetIndex: null,
      pendingExerciseId: null,
      pendingExerciseName: null,
    });
  },

  persist: async () => {
    const { workout } = get();
    if (workout) {
      await repository.saveWorkout(workout);
    }
  },

  reset: () =>
    set({
      workout: null,
      currentView: "block-list",
      activeBlockIndex: 0,
      activeExerciseTabIndex: 0,
      activeSetExerciseIndex: null,
      activeSetIndex: null,
      pendingExerciseId: null,
      pendingExerciseName: null,
    }),
}));
