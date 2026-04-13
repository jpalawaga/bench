// @vitest-environment happy-dom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RestTimer } from "./RestTimer";

class MockAudioContext {
  static createdCount = 0;

  state: AudioContextState = "running";
  sampleRate = 44_100;
  currentTime = 0;
  destination = {};

  constructor() {
    MockAudioContext.createdCount += 1;
  }

  createBuffer() {
    return {};
  }

  createBufferSource() {
    return {
      buffer: null,
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };
  }

  createGain() {
    return {
      connect: vi.fn(),
      gain: {
        value: 0,
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
    };
  }

  createOscillator() {
    return {
      type: "sine",
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      frequency: {
        setValueAtTime: vi.fn(),
      },
    };
  }

  resume = vi.fn(async () => undefined);
  close = vi.fn(async () => undefined);
}

describe("RestTimer", () => {
  beforeEach(() => {
    MockAudioContext.createdCount = 0;
    Object.defineProperty(window, "AudioContext", {
      configurable: true,
      writable: true,
      value: MockAudioContext,
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("does not initialize audio when the timer is off", () => {
    const onConfigureRequested = vi.fn();

    render(
      <RestTimer
        durationSeconds={0}
        onConfigureRequested={onConfigureRequested}
      />,
    );

    window.dispatchEvent(new Event("pointerdown"));
    const button = screen.getByRole("button");
    fireEvent.pointerDown(button);
    fireEvent.click(button);

    expect(onConfigureRequested).toHaveBeenCalledOnce();
    expect(MockAudioContext.createdCount).toBe(0);
  });

  it("initializes audio only after explicit interaction with an enabled timer", () => {
    render(<RestTimer durationSeconds={90} />);

    expect(MockAudioContext.createdCount).toBe(0);

    fireEvent.pointerDown(screen.getByRole("button"));

    expect(MockAudioContext.createdCount).toBe(1);
  });
});
