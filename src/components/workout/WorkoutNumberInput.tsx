import { useEffect, useRef } from "react";
import { selectInputValue } from "@/lib/utils";

const HOLD_DELAY_MS = 250;
const PIXELS_PER_STEP = 18;
const MOVE_CANCEL_THRESHOLD_PX = 8;

interface WorkoutNumberInputProps {
  value: number | null;
  onChange: (value: number | null) => void;
  onActivate?: () => void;
  placeholder?: string;
  className: string;
  fallbackValue?: number | null;
  min?: number;
  max?: number;
  step?: number;
}

interface ScrubState {
  active: boolean;
  startY: number;
  pointerId: number;
  initialValue: number;
  lastStepOffset: number;
}

function clampValue(value: number, min?: number, max?: number): number {
  if (min != null && value < min) return min;
  if (max != null && value > max) return max;
  return value;
}

export function WorkoutNumberInput({
  value,
  onChange,
  onActivate,
  placeholder,
  className,
  fallbackValue,
  min,
  max,
  step = 1,
}: WorkoutNumberInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const holdTimeoutRef = useRef<number | null>(null);
  const scrubStateRef = useRef<ScrubState | null>(null);
  const currentValueRef = useRef(value);
  const fallbackValueRef = useRef(fallbackValue);
  const suppressClickRef = useRef(false);

  currentValueRef.current = value;
  fallbackValueRef.current = fallbackValue;

  const clearHoldTimeout = () => {
    if (holdTimeoutRef.current != null) {
      window.clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }
  };

  const finishScrub = (pointerId?: number) => {
    const state = scrubStateRef.current;
    if (!state) return;

    clearHoldTimeout();

    if (state.active) {
      inputRef.current?.releasePointerCapture?.(state.pointerId);
      inputRef.current?.blur();
      suppressClickRef.current = true;
    }

    if (pointerId == null || state.pointerId === pointerId) {
      scrubStateRef.current = null;
    }
  };

  const startScrub = () => {
    const state = scrubStateRef.current;
    if (!state || state.active) return;

    const baseValue =
      currentValueRef.current ?? fallbackValueRef.current ?? min ?? 0;
    const normalizedValue = clampValue(baseValue, min, max);

    if (currentValueRef.current == null) {
      onChange(normalizedValue);
    }

    state.active = true;
    state.initialValue = normalizedValue;
    state.lastStepOffset = 0;

    inputRef.current?.blur();
    inputRef.current?.setPointerCapture?.(state.pointerId);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLInputElement>) => {
    if (event.button !== 0) return;

    onActivate?.();
    clearHoldTimeout();
    scrubStateRef.current = {
      active: false,
      startY: event.clientY,
      pointerId: event.pointerId,
      initialValue: 0,
      lastStepOffset: 0,
    };

    holdTimeoutRef.current = window.setTimeout(() => {
      startScrub();
    }, HOLD_DELAY_MS);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLInputElement>) => {
    const state = scrubStateRef.current;
    if (!state || state.pointerId !== event.pointerId) return;

    const distance = state.startY - event.clientY;

    if (!state.active) {
      if (Math.abs(distance) > MOVE_CANCEL_THRESHOLD_PX) {
        finishScrub(event.pointerId);
      }
      return;
    }

    event.preventDefault();

    const nextStepOffset = Math.trunc(distance / PIXELS_PER_STEP);
    if (nextStepOffset === state.lastStepOffset) return;

    state.lastStepOffset = nextStepOffset;
    const nextValue = clampValue(
      state.initialValue + nextStepOffset * step,
      min,
      max,
    );
    onChange(nextValue);
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLInputElement>) => {
    finishScrub(event.pointerId);
  };

  const handlePointerCancel = (event: React.PointerEvent<HTMLInputElement>) => {
    finishScrub(event.pointerId);
  };

  useEffect(() => {
    return () => {
      clearHoldTimeout();
    };
  }, []);

  return (
    <input
      ref={inputRef}
      type="number"
      inputMode="numeric"
      pattern="-?[0-9]*"
      value={value ?? ""}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onFocus={(event) => {
        onActivate?.();
        if (!scrubStateRef.current?.active) {
          selectInputValue(event.currentTarget);
        }
      }}
      onClick={(event) => {
        if (suppressClickRef.current) {
          event.preventDefault();
          suppressClickRef.current = false;
          return;
        }

        selectInputValue(event.currentTarget);
      }}
      onChange={(event) => {
        const nextValue = event.target.value;
        onChange(nextValue === "" ? null : Number(nextValue));
      }}
      onContextMenu={(event) => event.preventDefault()}
      placeholder={placeholder}
      className={`${className} touch-none [webkit-touch-callout:none]`}
    />
  );
}
