import { useEffect, useRef } from "react";
import { useTimer } from "@/hooks/useTimer";
import { formatTimerDisplay } from "@/lib/utils";

interface RestTimerProps {
  durationSeconds: number;
}

export function RestTimer({ durationSeconds }: RestTimerProps) {
  const { timeRemaining, isRunning, isExpired, start, reset } =
    useTimer(durationSeconds);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Play alert on expiry
  useEffect(() => {
    if (isExpired) {
      audioRef.current?.play().catch(() => {
        // Audio play may fail if no user gesture context — ignore
      });
    }
  }, [isExpired]);

  const handleTap = () => {
    if (isExpired) {
      reset();
    } else if (!isRunning) {
      start();
    }
  };

  return (
    <button
      onClick={handleTap}
      className={`
        w-full rounded-2xl py-8 flex flex-col items-center justify-center
        transition-colors select-none
        ${
          isExpired
            ? "bg-danger/20 animate-pulse"
            : isRunning
              ? "bg-surface-raised"
              : "bg-surface-raised active:bg-surface-overlay"
        }
      `}
    >
      <span
        className={`text-5xl font-mono font-bold tabular-nums ${isExpired ? "text-danger" : "text-text-primary"}`}
      >
        {formatTimerDisplay(timeRemaining)}
      </span>
      <span className="text-text-muted text-sm mt-2">
        {isExpired
          ? "Time's up! Tap to reset"
          : isRunning
            ? "Resting..."
            : "Tap to start rest timer"}
      </span>
      <audio ref={audioRef} preload="auto">
        <source src="/sounds/timer-alert.mp3" type="audio/mpeg" />
      </audio>
    </button>
  );
}
