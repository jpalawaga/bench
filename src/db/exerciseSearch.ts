import type { Exercise } from "@/types/models";

const TOKEN_ABBREVIATIONS: Record<string, string> = {
  overhead: "oh",
  deadlift: "dl",
  dumbbell: "db",
  barbell: "bb",
  pulldown: "pd",
  romanian: "r",
  incline: "i",
  shoulder: "s",
  tricep: "t",
  triceps: "t",
  extension: "e",
  bench: "b",
  press: "p",
  row: "r",
  squat: "s",
  split: "s",
  curl: "c",
  raise: "r",
  grip: "g",
  close: "c",
  lat: "l",
  leg: "l",
  rear: "r",
  front: "f",
  delt: "d",
  seated: "s",
  cable: "c",
  face: "f",
  arnold: "a",
  skull: "s",
  crusher: "c",
  hip: "h",
  calf: "c",
  hanging: "h",
  walking: "w",
  lunge: "l",
  trap: "t",
  power: "p",
  clean: "c",
  assault: "a",
  bike: "b",
  machine: "m",
  pull: "p",
  push: "p",
  chin: "c",
  up: "u",
  ab: "ab",
  wheel: "w",
};

const PHRASE_TOKEN_ABBREVIATIONS: Record<string, string> = {
  overhead: "oh",
  dumbbell: "db",
  barbell: "bb",
};

function normalizeSearchTokens(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function compactSearchValue(value: string): string {
  return normalizeSearchTokens(value).join("");
}

function getTokenCode(token: string): string {
  return TOKEN_ABBREVIATIONS[token] ?? token[0] ?? "";
}

export function getExerciseSearchVariants(exercise: Pick<Exercise, "name">): string[] {
  const tokens = normalizeSearchTokens(exercise.name);
  if (tokens.length === 0) return [];

  const variants = new Set<string>([
    tokens.join(""),
    tokens.map((token) => token[0]).join(""),
    tokens.map((token) => getTokenCode(token)).join(""),
    tokens.map((token) => PHRASE_TOKEN_ABBREVIATIONS[token] ?? token).join(""),
  ]);

  return [...variants].filter(Boolean);
}

export function exerciseMatchesQuery(
  exercise: Pick<Exercise, "name">,
  query: string,
): boolean {
  const compactQuery = compactSearchValue(query);
  if (!compactQuery) return true;

  return getExerciseSearchVariants(exercise).some((variant) =>
    variant.includes(compactQuery),
  );
}
