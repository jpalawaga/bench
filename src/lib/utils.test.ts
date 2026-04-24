import { describe, expect, it } from "vitest";
import { exerciseSetsToGoals, expandSetGoals } from "./utils";

describe("set goal utilities", () => {
  it("expands grouped strength goals into one entry per set", () => {
    expect(
      expandSetGoals([
        {
          mode: "strength",
          reps: 8,
          weight: 185,
          amount: 3,
          isProposed: false,
        },
      ]),
    ).toEqual([
      {
        mode: "strength",
        reps: 8,
        weight: 185,
        amount: 1,
        isProposed: false,
      },
      {
        mode: "strength",
        reps: 8,
        weight: 185,
        amount: 1,
        isProposed: false,
      },
      {
        mode: "strength",
        reps: 8,
        weight: 185,
        amount: 1,
        isProposed: false,
      },
    ]);
  });

  it("expands grouped cardio goals into one entry per set", () => {
    expect(
      expandSetGoals([
        {
          mode: "cardio",
          seconds: 600,
          level: 7,
          amount: 2,
          isProposed: false,
        },
      ]),
    ).toEqual([
      {
        mode: "cardio",
        seconds: 600,
        level: 7,
        amount: 1,
        isProposed: false,
      },
      {
        mode: "cardio",
        seconds: 600,
        level: 7,
        amount: 1,
        isProposed: false,
      },
    ]);
  });

  it("maps strength exercise sets to one editable goal row per performed set", () => {
    expect(
      exerciseSetsToGoals([
        {
          id: "set-1",
          setNumber: 1,
          goal: {
            mode: "strength",
            reps: 8,
            weight: 185,
            amount: 1,
            isProposed: false,
          },
          actual: {
            mode: "strength",
            reps: 8,
            weight: 185,
          },
        },
        {
          id: "set-2",
          setNumber: 2,
          goal: {
            mode: "strength",
            reps: 8,
            weight: 185,
            amount: 1,
            isProposed: false,
          },
          actual: {
            mode: "strength",
            reps: 8,
            weight: 185,
          },
        },
      ]),
    ).toEqual([
      {
        mode: "strength",
        reps: 8,
        weight: 185,
        amount: 1,
        isProposed: false,
        proposalSource: undefined,
      },
      {
        mode: "strength",
        reps: 8,
        weight: 185,
        amount: 1,
        isProposed: false,
        proposalSource: undefined,
      },
    ]);
  });

  it("maps cardio exercise sets to goals using actuals", () => {
    expect(
      exerciseSetsToGoals([
        {
          id: "set-1",
          setNumber: 1,
          goal: {
            mode: "cardio",
            seconds: 600,
            level: 5,
            amount: 1,
            isProposed: false,
          },
          actual: {
            mode: "cardio",
            seconds: 720,
            level: 6,
          },
        },
      ]),
    ).toEqual([
      {
        mode: "cardio",
        seconds: 720,
        level: 6,
        amount: 1,
        isProposed: false,
        proposalSource: undefined,
      },
    ]);
  });
});
