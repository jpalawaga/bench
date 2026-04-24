// @vitest-environment happy-dom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { GoalSetEditor, type EditableSetGoal } from "./GoalSetEditor";

afterEach(() => {
  cleanup();
});

function createSet(setNumber: number): EditableSetGoal {
  return {
    id: `set-${setNumber}`,
    setNumber,
    goal: {
      mode: "strength",
      reps: 8,
      weight: 135,
      amount: 1,
      isProposed: false,
    },
  };
}

function renumber(sets: EditableSetGoal[]): EditableSetGoal[] {
  let nextSetNumber = 1;

  return sets.map((set) => {
    const renumberedSet = {
      ...set,
      setNumber: nextSetNumber,
    };

    nextSetNumber += Math.max(1, set.goal.amount ?? 1);
    return renumberedSet;
  });
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
      onAmountChange={(index, amount) =>
        setSets((prev) =>
          renumber(
            prev.map((set, i) =>
              i === index
                ? { ...set, goal: { ...set.goal, amount } }
                : set,
            ),
          ),
        )
      }
      onRemoveSet={(index) =>
        setSets((prev) => renumber(prev.filter((_, i) => i !== index)))
      }
      onAddSet={() =>
        setSets((prev) =>
          renumber([...prev, createSet(prev.length + 1)])
        )
      }
    />
  );
}

describe("GoalSetEditor", () => {
  it("supports grouped set counts alongside explicit add and remove controls", () => {
    render(<GoalSetEditorHarness />);

    const amountSelect = screen.getByRole("combobox", {
      name: /Set count for S1/i,
    });

    expect(amountSelect).toBeTruthy();
    expect(screen.getByLabelText("Add Set")).toBeTruthy();
    expect(screen.getByText("S1")).toBeTruthy();
    expect(screen.queryByLabelText("Remove set 1")).toBeNull();

    fireEvent.change(amountSelect, { target: { value: "3" } });

    expect(screen.getByText("S1-3")).toBeTruthy();
    expect(screen.queryByLabelText("Remove set 1")).toBeNull();

    fireEvent.click(screen.getByLabelText("Add Set"));

    expect(screen.getByText("S4")).toBeTruthy();
    expect(screen.getByLabelText("Remove set 1")).toBeTruthy();
    expect(screen.getByLabelText("Remove set 4")).toBeTruthy();

    fireEvent.click(screen.getByLabelText("Remove set 4"));

    expect(screen.queryByText("S4")).toBeNull();
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
              mode: "strength",
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
              mode: "strength",
              reps: 8,
              weight: 135,
              amount: 1,
              isProposed: false,
            },
          },
        ]}
        onRepsChange={() => {}}
        onWeightChange={() => {}}
        onAmountChange={() => {}}
        onRemoveSet={() => {}}
        onAddSet={() => {}}
      />,
    );

    expect(screen.getByText("PLANNED")).toBeTruthy();
    expect(screen.getByLabelText("Remove set 1")).toBeTruthy();
    expect(screen.getByLabelText("Remove set 2")).toBeTruthy();
    expect(screen.getByTestId("set-row-1").className).toContain(
      "grid-cols-[2.5rem_minmax(0,1fr)_auto_auto]",
    );
    expect(screen.getByTestId("set-row-inputs-1").className).not.toContain(
      "flex-wrap",
    );
    expect(screen.getByTestId("set-row-badge-slot-1").className).toContain(
      "justify-center",
    );
  });
});
