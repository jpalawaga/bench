import { useEffect, useRef } from "react";
import { useTimer } from "@/hooks/useTimer";
import { formatTimerDisplay } from "@/lib/utils";

interface RestTimerProps {
  durationSeconds: number;
  autoStartSignal?: number;
  onConfigureRequested?: () => void;
}

type AudioContextCtor = typeof AudioContext;
type AudioSessionType =
  | "auto"
  | "playback"
  | "transient"
  | "transient-solo"
  | "ambient"
  | "play-and-record";

interface AudioSessionLike {
  type: AudioSessionType;
}

interface NavigatorWithAudioSession extends Navigator {
  audioSession?: AudioSessionLike;
}

export function RestTimer({
  durationSeconds,
  autoStartSignal = 0,
  onConfigureRequested,
}: RestTimerProps) {
  const { timeRemaining, isRunning, isExpired, start, reset } =
    useTimer(durationSeconds);
  const audioContextRef = useRef<AudioContext | null>(null);
  const hasPrimedAudioRef = useRef(false);
  const lastAutoStartSignalRef = useRef(autoStartSignal);
  const originalAudioSessionTypeRef = useRef<AudioSessionType | null>(null);
  const hasAdjustedAudioSessionRef = useRef(false);

  const configureAudioSession = () => {
    if (typeof navigator === "undefined") return;

    const audioSession = (navigator as NavigatorWithAudioSession).audioSession;
    if (!audioSession) return;

    if (!hasAdjustedAudioSessionRef.current) {
      originalAudioSessionTypeRef.current = audioSession.type;
      hasAdjustedAudioSessionRef.current = true;
    }

    for (const sessionType of ["playback", "transient", "ambient"] as const) {
      try {
        if (audioSession.type !== sessionType) {
          audioSession.type = sessionType;
        }
        return;
      } catch {
        // Best-effort only. Fall through to the next compatible mode.
      }
    }
  };

  const getAudioContext = () => {
    if (typeof window === "undefined") return null;

    configureAudioSession();

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

    if (durationSeconds <= 0) return;

    void primeAudio();
    start();
  }, [autoStartSignal, durationSeconds, start]);

  useEffect(() => {
    const unlockAudio = () => {
      void primeAudio();
    };

    window.addEventListener("pointerdown", unlockAudio, {
      passive: true,
      capture: true,
    });
    window.addEventListener("keydown", unlockAudio, {
      capture: true,
    });

    return () => {
      window.removeEventListener("pointerdown", unlockAudio, {
        capture: true,
      });
      window.removeEventListener("keydown", unlockAudio, {
        capture: true,
      });
    };
  }, []);

  useEffect(() => {
    return () => {
      const audioSession = (
        typeof navigator !== "undefined"
          ? (navigator as NavigatorWithAudioSession).audioSession
          : undefined
      );

      if (
        audioSession &&
        hasAdjustedAudioSessionRef.current &&
        originalAudioSessionTypeRef.current
      ) {
        try {
          audioSession.type = originalAudioSessionTypeRef.current;
        } catch {
          // Ignore restore failures on unsupported platforms.
        }
      }

      void audioContextRef.current?.close();
      audioContextRef.current = null;
    };
  }, []);

  const handleTap = () => {
    if (durationSeconds <= 0) {
      onConfigureRequested?.();
    } else if (isExpired) {
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
        {durationSeconds <= 0
          ? "Tap to set rest timer"
          : isExpired
          ? "Time's up! Tap to reset"
          : isRunning
            ? "Resting..."
            : "Tap to start rest timer"}
      </span>
    </button>
  );
}
