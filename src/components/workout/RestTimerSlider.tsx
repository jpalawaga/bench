import { useCallback, useEffect, useRef, useState } from "react";

// Snap points the slider sticks to (seconds)
const SNAP_POINTS = [0, 10, 30, 45, 60, 90, 120, 150, 180, 240, 300];
const SNAP_THRESHOLD = 8; // pixels — how close to a snap point before it grabs
const MIN = 0;
const MAX = 300;

function formatRestLabel(seconds: number | null): string {
  if (seconds == null || seconds === 0) return "Off";
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

function valueToPercent(value: number): number {
  return ((value - MIN) / (MAX - MIN)) * 100;
}

function percentToValue(pct: number): number {
  return Math.round(MIN + (pct / 100) * (MAX - MIN));
}

function snapValue(rawSeconds: number, trackWidth: number): number {
  // Convert snap threshold from pixels to seconds
  const secondsPerPixel = (MAX - MIN) / trackWidth;
  const thresholdSeconds = SNAP_THRESHOLD * secondsPerPixel;

  for (const snap of SNAP_POINTS) {
    if (Math.abs(rawSeconds - snap) <= thresholdSeconds) {
      return snap;
    }
  }
  // Round to nearest 5s between snap points for clean values
  return Math.round(rawSeconds / 5) * 5;
}

interface RestTimerSliderProps {
  value: number | null;
  onChange: (seconds: number | null) => void;
}

export function RestTimerSlider({ value, onChange }: RestTimerSliderProps) {
  const seconds = value ?? 0;
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  const getSecondsFromClientX = useCallback((clientX: number): number => {
    const track = trackRef.current;
    if (!track) return 0;
    const rect = track.getBoundingClientRect();
    const pct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const raw = percentToValue(pct);
    return snapValue(raw, rect.width);
  }, []);

  const commit = useCallback(
    (s: number) => {
      onChange(s === 0 ? null : s);
    },
    [onChange],
  );

  // Pointer events for unified mouse + touch handling
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      setDragging(true);
      const s = getSecondsFromClientX(e.clientX);
      commit(s);
    },
    [getSecondsFromClientX, commit],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging) return;
      const s = getSecondsFromClientX(e.clientX);
      commit(s);
    },
    [dragging, getSecondsFromClientX, commit],
  );

  const handlePointerUp = useCallback(() => {
    setDragging(false);
  }, []);

  // Prevent page scroll while dragging on touch devices
  useEffect(() => {
    if (!dragging) return;
    const prevent = (e: TouchEvent) => e.preventDefault();
    document.addEventListener("touchmove", prevent, { passive: false });
    return () => document.removeEventListener("touchmove", prevent);
  }, [dragging]);

  const pct = valueToPercent(seconds);

  return (
    <div className="flex flex-col gap-2">
      {/* Label row */}
      <div className="flex items-center justify-between">
        <span className="text-text-secondary text-sm">Rest Timer</span>
        <span className="text-text-primary text-sm font-medium tabular-nums">
          {formatRestLabel(value)}
        </span>
      </div>

      {/* Slider track */}
      <div
        ref={trackRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="relative h-10 flex items-center cursor-pointer touch-none select-none"
      >
        {/* Track background */}
        <div className="absolute inset-x-0 h-1 rounded-full bg-surface-overlay" />

        {/* Active fill */}
        <div
          className="absolute left-0 h-1 rounded-full bg-accent transition-[width] duration-75"
          style={{ width: `${pct}%` }}
        />

        {/* Snap point tick marks */}
        {SNAP_POINTS.map((sp) => {
          if (sp === MIN) return null;
          const spPct = valueToPercent(sp);
          return (
            <div
              key={sp}
              className="absolute top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-text-muted/40"
              style={{ left: `${spPct}%` }}
            />
          );
        })}

        {/* Thumb */}
        <div
          className={`
            absolute top-1/2 -translate-y-1/2 -translate-x-1/2
            w-5 h-5 rounded-full bg-accent border-2 border-surface
            shadow-lg transition-[left] duration-75
            ${dragging ? "scale-125" : ""}
          `}
          style={{ left: `${pct}%` }}
        />
      </div>
    </div>
  );
}
