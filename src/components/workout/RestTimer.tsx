import { useEffect, useRef } from "react";
import { useTimer } from "@/hooks/useTimer";
import { formatTimerDisplay } from "@/lib/utils";

interface RestTimerProps {
  durationSeconds: number;
  autoStartSignal?: number;
}

type AudioContextCtor = typeof AudioContext;

export function RestTimer({
  durationSeconds,
  autoStartSignal = 0,
}: RestTimerProps) {
  const { timeRemaining, isRunning, isExpired, start, reset } =
    useTimer(durationSeconds);
  const audioContextRef = useRef<AudioContext | null>(null);
  const hasPrimedAudioRef = useRef(false);
  const lastAutoStartSignalRef = useRef(autoStartSignal);

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

  const primeAudio = async () => {
    const audioContext = getAudioContext();
    if (!audioContext) return;

    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }

    if (hasPrimedAudioRef.current) return;

    // iOS Safari often requires one user-gesture-driven playback to unlock
    // future Web Audio sounds. A near-silent buffer is enough.
    const buffer = audioContext.createBuffer(1, 1, audioContext.sampleRate);
    const source = audioContext.createBufferSource();
    const gain = audioContext.createGain();

    gain.gain.value = 0.0001;
    source.buffer = buffer;
    source.connect(gain);
    gain.connect(audioContext.destination);
    source.start();

    hasPrimedAudioRef.current = true;
  };

  const playAlertIfPossible = async () => {
    const audioContext = getAudioContext();
    if (!audioContext) return;

    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }

    playAlert();
  };

  // Play alert on expiry
  useEffect(() => {
    if (isExpired) {
      void playAlertIfPossible();
    }
  }, [isExpired]);

  useEffect(() => {
    if (autoStartSignal === lastAutoStartSignalRef.current) return;
    lastAutoStartSignalRef.current = autoStartSignal;

    if (isRunning || isExpired) return;

    void primeAudio();
    start();
  }, [autoStartSignal, isExpired, isRunning, start]);

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
      void primeAudio();
      start();
    }
  };

  return (
    <button
      onPointerDown={() => {
        if (!isRunning) {
          void primeAudio();
        }
      }}
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
