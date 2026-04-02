import { useEffect, useRef } from "react";
import { useTimer } from "@/hooks/useTimer";
import { formatTimerDisplay } from "@/lib/utils";

interface RestTimerProps {
  durationSeconds: number;
}

type AudioContextCtor = typeof AudioContext;

export function RestTimer({ durationSeconds }: RestTimerProps) {
  const { timeRemaining, isRunning, isExpired, start, reset } =
    useTimer(durationSeconds);
  const audioContextRef = useRef<AudioContext | null>(null);

  const getAudioContext = () => {
    if (typeof window === "undefined") return null;

    const AudioContextClass = (
      window.AudioContext ||
      (
        window as Window & {
          webkitAudioContext?: AudioContextCtor;
        }
      ).webkitAudioContext
    ) as AudioContextCtor | undefined;

    if (!AudioContextClass) return null;

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContextClass();
    }

    return audioContextRef.current;
  };

  const playAlert = () => {
    const audioContext = getAudioContext();
    if (!audioContext) return;

    const startAt = audioContext.currentTime + 0.02;
    const notes = [0, 0.24];

    for (const offset of notes) {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(880, startAt + offset);

      gain.gain.setValueAtTime(0.0001, startAt + offset);
      gain.gain.exponentialRampToValueAtTime(0.12, startAt + offset + 0.01);
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        startAt + offset + 0.14,
      );

      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start(startAt + offset);
      oscillator.stop(startAt + offset + 0.16);
    }
  };

  // Play alert on expiry
  useEffect(() => {
    if (isExpired) {
      playAlert();
    }
  }, [isExpired]);

  useEffect(() => {
    return () => {
      void audioContextRef.current?.close();
      audioContextRef.current = null;
    };
  }, []);

  const handleTap = () => {
    if (isExpired) {
      reset();
    } else if (!isRunning) {
      void getAudioContext()?.resume();
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
    </button>
  );
}
