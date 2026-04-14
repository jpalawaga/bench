// @vitest-environment happy-dom

import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { GoalSetEditor, type EditableSetGoal } from "./GoalSetEditor";

function createSet(setNumber: number): EditableSetGoal {
  return {
    id: `set-${setNumber}`,
    setNumber,
    goal: {
      reps: 8,
      weight: 135,
      amount: 1,
      isProposed: false,
    },
  };
}

function renumber(sets: EditableSetGoal[]): EditableSetGoal[] {
  return sets.map((set, index) => ({
    ...set,
    setNumber: index + 1,
  }));
}

function GoalSetEditorHarness() {
  const [sets, setSets] = useState<EditableSetGoal[]>([createSet(1)]);

  return (
    <GoalSetEditor
      sets={sets}
      onRepsChange={(index, reps) =>
        setSets((prev) =>
          prev.map((set, i) =>
            i === index ? { ...set, goal: { ...set.goal, reps } } : set,
          ),
        )
      }
      onWeightChange={(index, weight) =>
        setSets((prev) =>
          prev.map((set, i) =>
            i === index ? { ...set, goal: { ...set.goal, weight } } : set,
          ),
        )
      }
      onRemoveSet={(index) =>
        setSets((prev) => renumber(prev.filter((_, i) => i !== index)))
      }
      onAddSet={() =>
        setSets((prev) => [...prev, createSet(prev.length + 1)])
      }
    />
  );
}

describe("GoalSetEditor", () => {
  it("uses explicit add and remove controls instead of a set-count selector", () => {
    render(<GoalSetEditorHarness />);

    expect(screen.queryByRole("combobox")).toBeNull();
    expect(screen.getByLabelText("Add Set")).toBeTruthy();
    expect(screen.getByText("S1")).toBeTruthy();
    expect(screen.queryByLabelText("Remove set 1")).toBeNull();

    fireEvent.click(screen.getByLabelText("Add Set"));

    expect(screen.getByText("S2")).toBeTruthy();
    expect(screen.getByLabelText("Remove set 1")).toBeTruthy();
    expect(screen.getByLabelText("Remove set 2")).toBeTruthy();

    fireEvent.click(screen.getByLabelText("Remove set 2"));

    expect(screen.queryByText("S2")).toBeNull();
    expect(screen.queryByLabelText("Remove set 1")).toBeNull();
  });

  it("keeps proposal badges and remove actions present together", () => {
    render(
      <GoalSetEditor
        sets={[
          {
            id: "set-1",
            setNumber: 1,
            goal: {
              reps: 8,
              weight: 135,
              amount: 1,
              isProposed: true,
              proposalSource: "planned",
            },
          },
          {
            id: "set-2",
            setNumber: 2,
            goal: {
              reps: 8,
              weight: 135,
              amount: 1,
              isProposed: false,
            },
          },
        ]}
        onRepsChange={() => {}}
        onWeightChange={() => {}}
        onRemoveSet={() => {}}
        onAddSet={() => {}}
      />,
    );

    expect(screen.getByText("PLANNED")).toBeTruthy();
    expect(screen.getByLabelText("Remove set 1")).toBeTruthy();
    expect(screen.getByLabelText("Remove set 2")).toBeTruthy();
  });
});
