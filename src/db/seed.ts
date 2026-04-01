import type { Exercise } from "@/types/models";
import { generateId } from "@/lib/utils";

function ex(name: string, muscleGroup: string): Exercise {
  return { id: generateId(), name, isCustom: false, muscleGroup };
}

export const SEED_EXERCISES: Exercise[] = [
  // Chest
  ex("Bench Press", "Chest"),
  ex("Incline Bench Press", "Chest"),
  ex("Dumbbell Bench Press", "Chest"),
  ex("Incline Dumbbell Press", "Chest"),
  ex("Cable Fly", "Chest"),
  ex("Dips (Chest)", "Chest"),
  ex("Push-Up", "Chest"),

  // Back
  ex("Barbell Row", "Back"),
  ex("Dumbbell Row", "Back"),
  ex("Pull-Up", "Back"),
  ex("Chin-Up", "Back"),
  ex("Lat Pulldown", "Back"),
  ex("Seated Cable Row", "Back"),
  ex("T-Bar Row", "Back"),
  ex("Face Pull", "Back"),

  // Shoulders
  ex("Overhead Press", "Shoulders"),
  ex("Dumbbell Shoulder Press", "Shoulders"),
  ex("Lateral Raise", "Shoulders"),
  ex("Front Raise", "Shoulders"),
  ex("Rear Delt Fly", "Shoulders"),
  ex("Arnold Press", "Shoulders"),

  // Legs
  ex("Squat", "Legs"),
  ex("Front Squat", "Legs"),
  ex("Leg Press", "Legs"),
  ex("Romanian Deadlift", "Legs"),
  ex("Leg Curl", "Legs"),
  ex("Leg Extension", "Legs"),
  ex("Bulgarian Split Squat", "Legs"),
  ex("Calf Raise", "Legs"),
  ex("Hip Thrust", "Legs"),
  ex("Goblet Squat", "Legs"),
  ex("Hack Squat", "Legs"),
  ex("Walking Lunge", "Legs"),

  // Arms
  ex("Barbell Curl", "Arms"),
  ex("Dumbbell Curl", "Arms"),
  ex("Hammer Curl", "Arms"),
  ex("Preacher Curl", "Arms"),
  ex("Tricep Pushdown", "Arms"),
  ex("Skull Crusher", "Arms"),
  ex("Overhead Tricep Extension", "Arms"),
  ex("Close-Grip Bench Press", "Arms"),

  // Compound
  ex("Deadlift", "Compound"),
  ex("Power Clean", "Compound"),
  ex("Clean and Press", "Compound"),
  ex("Trap Bar Deadlift", "Compound"),

  // Core
  ex("Plank", "Core"),
  ex("Hanging Leg Raise", "Core"),
  ex("Cable Crunch", "Core"),
  ex("Ab Wheel", "Core"),

  // Cardio / Conditioning
  ex("Treadmill", "Cardio"),
  ex("Rowing Machine", "Cardio"),
  ex("Assault Bike", "Cardio"),
];
