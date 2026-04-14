import { describe, expect, it } from "vitest";
import { exerciseSetsToGoals, expandSetGoals } from "./utils";

describe("set goal utilities", () => {
  it("expands grouped goals into one entry per set", () => {
    expect(
      expandSetGoals([
        {
          reps: 8,
          weight: 185,
          amount: 3,
          isProposed: false,
        },
      ]),
    ).toEqual([
      {
        reps: 8,
        weight: 185,
        amount: 1,
        isProposed: false,
      },
      {
        reps: 8,
        weight: 185,
        amount: 1,
        isProposed: false,
      },
      {
        reps: 8,
        weight: 185,
        amount: 1,
        isProposed: false,
      },
    ]);
  });

  it("maps exercise sets to one editable goal row per performed set", () => {
    expect(
      exerciseSetsToGoals([
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
            reps: 8,
            weight: 185,
          },
        },
        {
          id: "set-2",
          setNumber: 2,
          goal: {
            reps: 8,
            weight: 185,
            amount: 1,
            isProposed: false,
          },
          actual: {
            reps: 8,
            weight: 185,
          },
        },
      ]),
    ).toEqual([
      {
        reps: 8,
        weight: 185,
        amount: 1,
        isProposed: false,
        proposalSource: undefined,
      },
      {
        reps: 8,
        weight: 185,
        amount: 1,
        isProposed: false,
        proposalSource: undefined,
      },
    ]);
  });
});
