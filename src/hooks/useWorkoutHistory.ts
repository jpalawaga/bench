import { useEffect, useState } from "react";
import type { Workout } from "@/types/models";
import { repository } from "@/db/repository";

export function useWorkoutHistory() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    const all = await repository.getAllWorkouts();
    setWorkouts(all);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  return { workouts, loading, refresh };
}
