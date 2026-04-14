import type { SetGoal } from "@/types/models";
import { SetRow } from "./SetRow";

export interface EditableSetGoal {
  id: string;
  setNumber: number;
  goal: SetGoal;
}

interface GoalSetEditorProps {
  sets: EditableSetGoal[];
  onRepsChange: (index: number, reps: number) => void;
  onWeightChange: (index: number, weight: number) => void;
  onRemoveSet: (index: number) => void;
  onAddSet: () => void;
}

export function GoalSetEditor({
  sets,
  onRepsChange,
  onWeightChange,
  onRemoveSet,
  onAddSet,
}: GoalSetEditorProps) {
  return (
    <>
      <div className="flex flex-col gap-3">
        {sets.map((set, index) => (
          <SetRow
            key={set.id}
            goal={set.goal}
            setNumber={set.setNumber}
            onRepsChange={(reps) => onRepsChange(index, reps)}
            onWeightChange={(weight) => onWeightChange(index, weight)}
            onRemove={() => onRemoveSet(index)}
            canRemove={sets.length > 1}
          />
        ))}
      </div>

      <button
        onClick={onAddSet}
        aria-label="Add Set"
        className="text-accent text-sm font-medium py-2 active:opacity-70"
      >
        + Add Set
      </button>
    </>
  );
}
