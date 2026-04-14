// @vitest-environment happy-dom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BlockListView } from "./BlockListView";
import { BlockInProgressView } from "./BlockInProgressView";
import { WorkoutDetail } from "@/components/log/WorkoutDetail";
import { repository } from "@/db/repository";
import { useWorkoutStore } from "@/stores/workoutStore";
import type { Exercise, Workout } from "@/types/models";

function createWorkout(overrides: Partial<Workout> = {}): Workout {
  return {
    id: "workout-1",
    status: "active",
    startedAt: 1_700_000_000_000,
    completedAt: null,
    notes: "Legacy workout note that should stay hidden",
    blocks: [
      {
        id: "block-1",
        order: 1,
        status: "in-progress",
        restTimerSeconds: 90,
        notes: "Legacy block note that should stay hidden",
        exercises: [
          {
            id: "block-exercise-1",
            exerciseId: "exercise-1",
            exerciseName: "Bench Press",
            notes: "Session-specific working note",
            sets: [
              {
                id: "set-1",
                setNumber: 1,
                goal: {
                  reps: 8,
                  weight: 185,
                  amount: 1,
                  isProposed: false,
                },
                actual: {
                  reps: null,
                  weight: null,
                },
              },
            ],
          },
        ],
      },
    ],
    ...overrides,
  };
}

function setWorkoutState(workout: Workout) {
  useWorkoutStore.setState({
    workout,
    currentView: "block-list",
    activeBlockIndex: 0,
    activeExerciseTabIndex: 0,
    activeSetExerciseIndex: 0,
    activeSetIndex: 0,
    pendingExerciseId: null,
    pendingExerciseName: null,
  });
}

describe("note surfaces", () => {
  beforeEach(() => {
    vi.spyOn(repository, "saveWorkout").mockResolvedValue();
    useWorkoutStore.getState().reset();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    useWorkoutStore.getState().reset();
  });

  it("does not render a workout-level notes panel on the block list", () => {
    setWorkoutState(createWorkout());

    render(<BlockListView />);

    expect(screen.queryByText("Workout Notes")).toBeNull();
    expect(screen.getByText("Bench Press")).toBeTruthy();
  });

  it("edits exercise guidance separately from working notes during a block", async () => {
    setWorkoutState(createWorkout());

    vi.spyOn(repository, "getRecentExerciseNotes").mockResolvedValue([]);
    const exerciseRecord = {
      id: "exercise-1",
      name: "Bench Press",
      isCustom: false,
      formNotes: "Brace hard and keep the wrists stacked.",
    } satisfies Exercise;
    vi.spyOn(repository, "getExercise").mockResolvedValue(exerciseRecord);
    const updateExercise = vi.spyOn(repository, "updateExercise").mockResolvedValue();

    render(<BlockInProgressView />);

    expect(screen.queryByText("Block Notes")).toBeNull();
    expect(screen.getByText("Working Notes")).toBeTruthy();
    expect(screen.getByDisplayValue("Session-specific working note")).toBeTruthy();
    const notesButton = screen.getByRole("button", { name: /^Notes$/i });

    expect(notesButton.getAttribute("aria-expanded")).toBe("false");

    fireEvent.click(notesButton);

    const guidanceTextarea = await screen.findByRole("textbox", {
      name: /Bench Press exercise note/i,
    });

    expect(
      screen.getByDisplayValue("Brace hard and keep the wrists stacked."),
    ).toBeTruthy();
    expect(notesButton.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByDisplayValue("Session-specific working note")).toBeTruthy();

    fireEvent.change(guidanceTextarea, {
      target: { value: " Brace hard and drive back into the pad. " },
    });
    fireEvent.blur(guidanceTextarea);

    await waitFor(() => {
      expect(updateExercise).toHaveBeenCalledWith({
        ...exerciseRecord,
        formNotes: "Brace hard and drive back into the pad.",
      });
    });

    fireEvent.click(notesButton);

    expect(notesButton.getAttribute("aria-expanded")).toBe("false");
  });

  it("focuses the working-note editor when adding a blank note", async () => {
    const workout = createWorkout();
    const firstExercise = workout.blocks[0]?.exercises[0];
    if (!firstExercise) {
      throw new Error("Expected the fixture workout to include an exercise");
    }
    firstExercise.notes = "";
    setWorkoutState(workout);

    vi.spyOn(repository, "getRecentExerciseNotes").mockResolvedValue([]);
    vi.spyOn(repository, "getExercise").mockResolvedValue({
      id: "exercise-1",
      name: "Bench Press",
      isCustom: false,
      formNotes: "",
    } satisfies Exercise);

    render(<BlockInProgressView />);

    fireEvent.click(screen.getByRole("button", { name: /\+ Add Note/i }));

    const textarea = await screen.findByRole("textbox", {
      name: /Bench Press working note/i,
    });

    expect(document.activeElement).toBe(textarea);

    fireEvent.change(textarea, {
      target: { value: "Needed a slower setup before unracking." },
    });

    expect(
      screen.getByDisplayValue("Needed a slower setup before unracking."),
    ).toBeTruthy();
  });

  it("omits workout and block notes from workout detail while keeping working notes", () => {
    const workout = createWorkout({
      status: "completed",
      completedAt: 1_700_000_100_000,
    });

    render(
      <WorkoutDetail
        workout={workout}
        onDelete={() => {}}
        onClose={() => {}}
      />,
    );

    expect(screen.queryByText("Workout Notes")).toBeNull();
    expect(screen.queryByText("Legacy workout note that should stay hidden")).toBeNull();
    expect(screen.queryByText("Legacy block note that should stay hidden")).toBeNull();
    expect(screen.getByText("Session-specific working note")).toBeTruthy();
  });
});
