import { describe, expect, it } from "vitest";
import { getFirstIncompleteSetIndex, getNextExerciseWithUnfinishedSet } from "./workoutStore";
import type { Block, BlockExercise } from "@/types/models";

function createExercise(
  id: string,
  actuals: Array<{ reps: number | null; weight: number | null }>,
): BlockExercise {
  return {
    id,
    exerciseId: id,
    exerciseName: id,
    notes: "",
    sets: actuals.map((actual, index) => ({
      id: `${id}-set-${index + 1}`,
      setNumber: index + 1,
      goal: {
        reps: 8,
        weight: 100,
        amount: 1,
        isProposed: false,
      },
      actual,
    })),
  };
}

describe("workoutStore helpers", () => {
  it("finds the first incomplete set in an exercise", () => {
    const exercise = createExercise("bench", [
      { reps: 8, weight: 100 },
      { reps: 8, weight: null },
      { reps: null, weight: null },
    ]);

    expect(getFirstIncompleteSetIndex(exercise)).toBe(1);
  });

  it("advances a superset to the next exercise's first incomplete set", () => {
    const block: Block = {
      id: "block-1",
      order: 1,
      status: "in-progress",
      restTimerSeconds: 90,
      notes: "",
      exercises: [
        createExercise("bench", [
          { reps: 8, weight: 100 },
          { reps: null, weight: null },
        ]),
        createExercise("row", [
          { reps: null, weight: null },
          { reps: null, weight: null },
        ]),
      ],
    };

    expect(getNextExerciseWithUnfinishedSet(block, 0)).toEqual({
      exerciseIndex: 1,
      setIndex: 0,
    });
  });

  it("falls back to the current exercise when no other exercise has unfinished sets", () => {
    const block: Block = {
      id: "block-1",
      order: 1,
      status: "in-progress",
      restTimerSeconds: 90,
      notes: "",
      exercises: [
        createExercise("bench", [
          { reps: 8, weight: 100 },
          { reps: null, weight: null },
        ]),
        createExercise("row", [
          { reps: 8, weight: 100 },
          { reps: 8, weight: 100 },
        ]),
      ],
    };

    expect(getNextExerciseWithUnfinishedSet(block, 0)).toEqual({
      exerciseIndex: 0,
      setIndex: 1,
    });
  });
});
