import { describe, expect, it } from "vitest";
import {
  exerciseMatchesQuery,
  getExerciseSearchVariants,
} from "./exerciseSearch";

describe("exercise search abbreviations", () => {
  it("matches common abbreviation codes like OHP and RDL", () => {
    expect(exerciseMatchesQuery({ name: "Overhead Press" }, "OHP")).toBe(true);
    expect(exerciseMatchesQuery({ name: "Romanian Deadlift" }, "RDL")).toBe(
      true,
    );
  });

  it("matches common multi-word shorthand like db row and bb curl", () => {
    expect(exerciseMatchesQuery({ name: "Dumbbell Row" }, "db row")).toBe(
      true,
    );
    expect(exerciseMatchesQuery({ name: "Barbell Curl" }, "bb curl")).toBe(
      true,
    );
  });

  it("supports abbreviation patterns for seeded multi-word lifts", () => {
    expect(
      exerciseMatchesQuery({ name: "Bulgarian Split Squat" }, "BSS"),
    ).toBe(true);
    expect(
      exerciseMatchesQuery({ name: "Close-Grip Bench Press" }, "CGBP"),
    ).toBe(true);
  });

  it("still supports normal substring matching", () => {
    expect(
      exerciseMatchesQuery({ name: "Incline Dumbbell Press" }, "incline"),
    ).toBe(true);
    expect(exerciseMatchesQuery({ name: "Trap Bar Deadlift" }, "deadlift")).toBe(
      true,
    );
  });

  it("does not match unrelated abbreviations", () => {
    expect(exerciseMatchesQuery({ name: "Romanian Deadlift" }, "OHP")).toBe(
      false,
    );
  });

  it("builds stable compact search variants", () => {
    expect(getExerciseSearchVariants({ name: "Overhead Press" })).toEqual([
      "overheadpress",
      "op",
      "ohp",
      "ohpress",
    ]);
  });
});
