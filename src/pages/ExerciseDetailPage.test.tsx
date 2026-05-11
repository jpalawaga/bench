// @vitest-environment happy-dom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { repository } from "@/db/repository";
import type { Exercise } from "@/types/models";
import { ExerciseDetailPage } from "./ExerciseDetailPage";

function renderExerciseDetail() {
  render(
    <MemoryRouter initialEntries={["/exercises/exercise-1"]}>
      <Routes>
        <Route path="/exercises/:exerciseId" element={<ExerciseDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ExerciseDetailPage", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("shows and saves next-time targets for the exercise", async () => {
    const exercise: Exercise = {
      id: "exercise-1",
      name: "Bench Press",
      isCustom: false,
      trackingMode: "strength",
      nextSessionTargets: [
        {
          mode: "strength",
          reps: 6,
          weight: 100,
          amount: 2,
          isProposed: false,
        },
      ],
    };
    const updateExercise = vi
      .spyOn(repository, "updateExercise")
      .mockResolvedValue();
    vi.spyOn(repository, "getExercise").mockResolvedValue(exercise);
    vi.spyOn(repository, "getExerciseHistory").mockResolvedValue([]);
    vi.spyOn(repository, "getNextSessionTargets").mockResolvedValue(undefined);

    renderExerciseDetail();

    expect(await screen.findByText("S1-2")).toBeTruthy();
    expect(screen.getByText("6x100")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    fireEvent.change(screen.getByPlaceholderText("Reps"), {
      target: { value: "8" },
    });
    fireEvent.change(screen.getByPlaceholderText("lbs"), {
      target: { value: "135" },
    });
    fireEvent.change(
      screen.getByRole("combobox", { name: /Set count for S1-2/i }),
      {
        target: { value: "3" },
      },
    );
    fireEvent.click(screen.getByRole("button", { name: /Save Targets/i }));

    await waitFor(() => {
      expect(updateExercise).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "exercise-1",
          nextSessionTargets: [
            {
              mode: "strength",
              reps: 8,
              weight: 135,
              amount: 3,
              isProposed: false,
              proposalSource: undefined,
            },
          ],
        }),
      );
    });
  });

  it("falls back to historical next-time targets when the exercise has none", async () => {
    const exercise: Exercise = {
      id: "exercise-1",
      name: "Bench Press",
      isCustom: false,
      trackingMode: "strength",
    };
    vi.spyOn(repository, "getExercise").mockResolvedValue(exercise);
    vi.spyOn(repository, "getExerciseHistory").mockResolvedValue([]);
    vi.spyOn(repository, "getNextSessionTargets").mockResolvedValue([
      {
        mode: "strength",
        reps: 5,
        weight: 95,
        amount: 1,
        isProposed: false,
      },
    ]);

    renderExerciseDetail();

    expect(await screen.findByText("S1")).toBeTruthy();
    expect(screen.getByText("5x95")).toBeTruthy();
  });
});
