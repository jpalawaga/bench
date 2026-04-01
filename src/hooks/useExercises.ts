import { useEffect, useState, useRef } from "react";
import type { Exercise } from "@/types/models";
import { repository } from "@/db/repository";

export function useExercises(query: string) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(async () => {
      setLoading(true);
      const results = await repository.searchExercises(query);
      setExercises(results);
      setLoading(false);
    }, 150);
    return () => clearTimeout(timeoutRef.current);
  }, [query]);

  return { exercises, loading };
}
