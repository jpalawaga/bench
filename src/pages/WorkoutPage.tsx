import { useParams, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { repository } from "@/db/repository";
import { useWorkoutStore } from "@/stores/workoutStore";
import { BlockListView } from "./BlockListView";
import { NewBlockView } from "./NewBlockView";
import { ExerciseSelectView } from "./ExerciseSelectView";
import { GoalSettingView } from "./GoalSettingView";
import { BlockInProgressView } from "./BlockInProgressView";
import { BlockFinishedView } from "./BlockFinishedView";

const VIEW_TITLES: Record<string, string> = {
  "block-list": "Workout",
  "new-block": "New Block",
  "exercise-select": "Select Exercise",
  "goal-setting": "Set Goals",
  "block-in-progress": "In Progress",
  "block-finished": "Block Done",
};

export function WorkoutPage() {
  const { workoutId } = useParams<{ workoutId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const currentView = useWorkoutStore((s) => s.currentView);
  const activeBlockIndex = useWorkoutStore((s) => s.activeBlockIndex);
  const loadWorkout = useWorkoutStore((s) => s.loadWorkout);
  const setView = useWorkoutStore((s) => s.setView);
  const workout = useWorkoutStore((s) => s.workout);
  const reset = useWorkoutStore((s) => s.reset);
  const activeBlock = workout?.blocks[activeBlockIndex];

  useEffect(() => {
    if (!workoutId) {
      navigate("/");
      return;
    }
    repository.getWorkout(workoutId).then((w) => {
      if (!w) {
        navigate("/");
        return;
      }
      loadWorkout(w);
      setLoading(false);
    });
  }, [workoutId, navigate, loadWorkout]);

  // Navigate home after finishing workout (workout becomes null)
  useEffect(() => {
    if (!loading && !workout) {
      navigate("/");
    }
  }, [workout, loading, navigate]);

  const handleBack = () => {
    switch (currentView) {
      case "block-list":
        reset();
        navigate("/");
        break;
      case "new-block":
        setView("block-list");
        break;
      case "exercise-select":
        setView("new-block");
        break;
      case "goal-setting":
        setView("exercise-select");
        break;
      case "block-in-progress":
        if (activeBlock?.status === "finished") {
          setView("block-list");
        }
        break;
      case "block-finished":
        setView("block-list");
        break;
    }
  };

  const canGoBack =
    currentView !== "block-list" &&
    (currentView !== "block-in-progress" || activeBlock?.status === "finished");

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <p className="text-text-muted">Loading workout...</p>
      </div>
    );
  }

  const renderView = () => {
    switch (currentView) {
      case "block-list":
        return <BlockListView />;
      case "new-block":
        return <NewBlockView />;
      case "exercise-select":
        return <ExerciseSelectView />;
      case "goal-setting":
        return <GoalSettingView />;
      case "block-in-progress":
        return <BlockInProgressView />;
      case "block-finished":
        return <BlockFinishedView />;
    }
  };

  return (
    <div className="min-h-dvh flex flex-col px-4 pb-safe-bottom">
      <header className="py-4 flex items-center gap-3">
        {canGoBack && (
          <button
            onClick={handleBack}
            className="text-text-secondary active:text-text-primary p-1 -ml-1 min-h-0"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        )}
        <h1 className="text-xl font-bold text-text-primary">
          {VIEW_TITLES[currentView] ?? "Workout"}
        </h1>
      </header>

      {renderView()}
    </div>
  );
}
