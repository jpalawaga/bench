import { useEffect, useState } from "react";
import { HashRouter, Routes, Route, useNavigate } from "react-router";
import { LogPage } from "@/pages/LogPage";
import { WorkoutPage } from "@/pages/WorkoutPage";
import { ExerciseLibraryPage } from "@/pages/ExerciseLibraryPage";
import { ExerciseDetailPage } from "@/pages/ExerciseDetailPage";
import { repository } from "@/db/repository";
import { useWorkoutStore } from "@/stores/workoutStore";

function CrashRecovery() {
  const navigate = useNavigate();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // Only run recovery check on the home page
    if (window.location.hash !== "" && window.location.hash !== "#/") {
      setChecked(true);
      return;
    }

    repository.getActiveWorkout().then((active) => {
      if (active) {
        navigate(`/workout/${active.id}`, { replace: true });
      }
      setChecked(true);
    });
  }, [navigate]);

  // Auto-save on visibility change (iOS doesn't fire beforeunload)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        const { workout } = useWorkoutStore.getState();
        if (workout) {
          repository.saveWorkout(workout);
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  if (!checked) return null;
  return null;
}

export function App() {
  return (
    <HashRouter>
      <CrashRecovery />
      <Routes>
        <Route path="/" element={<LogPage />} />
        <Route path="/workout/:workoutId" element={<WorkoutPage />} />
        <Route path="/exercises" element={<ExerciseLibraryPage />} />
        <Route path="/exercises/:exerciseId" element={<ExerciseDetailPage />} />
      </Routes>
    </HashRouter>
  );
}
