// @vitest-environment happy-dom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BlockFinishedView } from "./BlockFinishedView";
import { GoalSettingView } from "./GoalSettingView";
import { repository } from "@/db/repository";
import { useWorkoutStore } from "@/stores/workoutStore";
import type { Workout } from "@/types/models";

function createWorkout(): Workout {
  return {
    id: "workout-1",
    status: "active",
    startedAt: 1_700_000_000_000,
    completedAt: null,
    notes: "",
    blocks: [
      {
        id: "block-1",
        order: 1,
        status: "planning",
        restTimerSeconds: null,
        notes: "",
        exercises: [],
      },
    ],
  };
}

describe("set planning flows", () => {
  beforeEach(() => {
    vi.spyOn(repository, "saveWorkout").mockResolvedValue();
    useWorkoutStore.getState().reset();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    useWorkoutStore.getState().reset();
  });

  it("expands grouped goal amounts into individual planned sets on lock in", async () => {
    vi.spyOn(repository, "getNextSessionTargets").mockResolvedValue([]);
    vi.spyOn(repository, "getLastActuals").mockResolvedValue([]);

    useWorkoutStore.setState({
      workout: createWorkout(),
      currentView: "goal-setting",
      activeBlockIndex: 0,
      activeExerciseTabIndex: 0,
      activeSetExerciseIndex: null,
      activeSetIndex: null,
      pendingExerciseId: "exercise-1",
      pendingExerciseName: "Bench Press",
      pendingExerciseMode: "strength",
    });

    render(<GoalSettingView />);

    const repsInput = await screen.findByPlaceholderText("Reps");
    fireEvent.change(repsInput, { target: { value: "8" } });
    fireEvent.change(screen.getByPlaceholderText("lbs"), {
      target: { value: "45" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: /Set count for S1/i }), {
      target: { value: "3" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Lock In/i }));

    await waitFor(() => {
      const exercise =
        useWorkoutStore.getState().workout?.blocks[0]?.exercises[0];

      expect(exercise).toBeTruthy();
      expect(exercise?.sets).toHaveLength(3);
      expect(
        exercise?.sets.map((set) =>
          set.goal.mode === "strength" ? set.goal.reps : null,
        ),
      ).toEqual([8, 8, 8]);
      expect(
        exercise?.sets.map((set) =>
          set.goal.mode === "strength" ? set.goal.weight : null,
        ),
      ).toEqual([45, 45, 45]);
      expect(exercise?.sets.map((set) => set.goal.amount)).toEqual([1, 1, 1]);
    });
  });

  it("edits an existing planned exercise by replacing its sets in place", async () => {
    const workout = createWorkout();
    const block = workout.blocks[0];
    if (!block) throw new Error("fixture block missing");
    workout.blocks[0] = {
      ...block,
      exercises: [
        {
          id: "be-edit",
          exerciseId: "exercise-1",
          exerciseName: "Bench Press",
          notes: "keep this note",
          sets: [
            {
              id: "set-a",
              setNumber: 1,
              goal: {
                mode: "strength",
                reps: 5,
                weight: 95,
                amount: 1,
                isProposed: false,
              },
              actual: { mode: "strength", reps: null, weight: null },
            },
            {
              id: "set-b",
              setNumber: 2,
              goal: {
                mode: "strength",
                reps: 5,
                weight: 95,
                amount: 1,
                isProposed: false,
              },
              actual: { mode: "strength", reps: null, weight: null },
            },
          ],
          nextSessionTargets: [
            {
              mode: "strength",
              reps: 6,
              weight: 100,
              amount: 1,
              isProposed: false,
            },
          ],
        },
      ],
    };

    useWorkoutStore.setState({
      workout,
      currentView: "goal-setting",
      activeBlockIndex: 0,
      activeExerciseTabIndex: 0,
      activeSetExerciseIndex: null,
      activeSetIndex: null,
      pendingExerciseId: "exercise-1",
      pendingExerciseName: "Bench Press",
      pendingExerciseMode: "strength",
      editingExerciseIndex: 0,
    });

    render(<GoalSettingView />);

    // Seeded from existing sets: single grouped row with amount=2
    const amountSelect = await screen.findByRole("combobox", {
      name: /Set count for S1-2/i,
    });
    expect(amountSelect).toBeTruthy();

    fireEvent.change(screen.getByPlaceholderText("Reps"), {
      target: { value: "8" },
    });
    fireEvent.change(screen.getByPlaceholderText("lbs"), {
      target: { value: "135" },
    });
    fireEvent.change(amountSelect, { target: { value: "3" } });

    fireEvent.click(screen.getByRole("button", { name: /Save/i }));

    await waitFor(() => {
      const state = useWorkoutStore.getState();
      const exercise = state.workout?.blocks[0]?.exercises[0];

      expect(state.workout?.blocks[0]?.exercises).toHaveLength(1);
      expect(exercise?.id).toBe("be-edit");
      expect(exercise?.notes).toBe("keep this note");
      expect(exercise?.nextSessionTargets).toEqual([
        {
          mode: "strength",
          reps: 6,
          weight: 100,
          amount: 1,
          isProposed: false,
        },
      ]);
      expect(exercise?.sets).toHaveLength(3);
      expect(
        exercise?.sets.map((set) =>
          set.goal.mode === "strength" ? set.goal.reps : null,
        ),
      ).toEqual([8, 8, 8]);
      expect(
        exercise?.sets.map((set) =>
          set.goal.mode === "strength" ? set.goal.weight : null,
        ),
      ).toEqual([135, 135, 135]);
      expect(state.currentView).toBe("new-block");
      expect(state.editingExerciseIndex).toBeNull();
      expect(state.pendingExerciseId).toBeNull();
    });
  });

  it("saves grouped next-time targets with their amount", async () => {
    const workout = createWorkout();
    const firstBlock = workout.blocks[0];
    if (!firstBlock) {
      throw new Error("Expected the fixture workout to include a block");
    }
    workout.blocks[0] = {
      ...firstBlock,
      status: "finished",
      exercises: [
        {
          id: "block-exercise-1",
          exerciseId: "exercise-1",
          exerciseName: "Bench Press",
          notes: "",
          sets: [
            {
              id: "set-1",
              setNumber: 1,
              goal: {
                mode: "strength",
                reps: 8,
                weight: 45,
                amount: 1,
                isProposed: false,
              },
              actual: {
                mode: "strength",
                reps: 8,
                weight: 45,
              },
            },
            {
              id: "set-2",
              setNumber: 2,
              goal: {
                mode: "strength",
                reps: 8,
                weight: 45,
                amount: 1,
                isProposed: false,
              },
              actual: {
                mode: "strength",
                reps: 8,
                weight: 45,
              },
            },
          ],
        },
      ],
    };

    useWorkoutStore.setState({
      workout,
      currentView: "block-finished",
      activeBlockIndex: 0,
      activeExerciseTabIndex: 0,
      activeSetExerciseIndex: null,
      activeSetIndex: null,
      pendingExerciseId: null,
      pendingExerciseName: null,
    });

    render(<BlockFinishedView />);

    fireEvent.click(screen.getByRole("button", { name: /Bench Press/i }));

    const amountSelect = await screen.findByRole("combobox", {
      name: /Set count for S1-2/i,
    });
    fireEvent.change(amountSelect, { target: { value: "3" } });

    fireEvent.click(screen.getByRole("button", { name: /Save Targets/i }));

    await waitFor(() => {
      expect(
        useWorkoutStore.getState().workout?.blocks[0]?.exercises[0]
          ?.nextSessionTargets,
      ).toEqual([
        {
          mode: "strength",
          reps: 8,
          weight: 45,
          amount: 3,
          isProposed: false,
          proposalSource: undefined,
        },
      ]);
    });
  });
});
