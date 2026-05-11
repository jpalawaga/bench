// @vitest-environment happy-dom

import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LongHoldButton } from "./Button";

describe("LongHoldButton", () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("cancels without completing when released before the hold duration", () => {
    vi.useFakeTimers();
    const onComplete = vi.fn();

    render(
      <LongHoldButton durationMs={1500} onComplete={onComplete}>
        Finish Workout
      </LongHoldButton>,
    );

    const button = screen.getByRole("button", { name: /Finish Workout/i });
    fireEvent.pointerDown(button, { pointerId: 1 });

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    fireEvent.pointerUp(button, { pointerId: 1 });

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(onComplete).not.toHaveBeenCalled();
    expect(button.getAttribute("data-holding")).toBe("false");
    expect(button.getAttribute("data-bursting")).toBe("false");
  });

  it("shows the burst state before completing after a full hold", () => {
    vi.useFakeTimers();
    const onComplete = vi.fn();

    render(
      <LongHoldButton durationMs={1500} onComplete={onComplete}>
        Finish Workout
      </LongHoldButton>,
    );

    const button = screen.getByRole("button", { name: /Finish Workout/i });
    fireEvent.pointerDown(button, { pointerId: 1 });

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(button.getAttribute("data-holding")).toBe("false");
    expect(button.getAttribute("data-bursting")).toBe("true");
    expect(onComplete).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(260);
    });

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(button.getAttribute("data-bursting")).toBe("false");
  });
});
