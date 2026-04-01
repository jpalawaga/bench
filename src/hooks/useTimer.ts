import { useCallback, useEffect, useRef, useState } from "react";

interface UseTimerReturn {
  timeRemaining: number;
  isRunning: boolean;
  isExpired: boolean;
  start: () => void;
  reset: () => void;
}

export function useTimer(durationSeconds: number): UseTimerReturn {
  const [timeRemaining, setTimeRemaining] = useState(durationSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const endTimeRef = useRef<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = undefined;
    }
    setIsRunning(false);
  }, []);

  const start = useCallback(() => {
    setIsExpired(false);
    setIsRunning(true);
    endTimeRef.current = Date.now() + durationSeconds * 1000;
    setTimeRemaining(durationSeconds);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      const remaining = Math.ceil((endTimeRef.current - Date.now()) / 1000);
      if (remaining <= 0) {
        setTimeRemaining(0);
        setIsExpired(true);
        stop();
      } else {
        setTimeRemaining(remaining);
      }
    }, 250); // Check 4x/sec for accuracy
  }, [durationSeconds, stop]);

  const reset = useCallback(() => {
    stop();
    setTimeRemaining(durationSeconds);
    setIsExpired(false);
  }, [durationSeconds, stop]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Sync duration changes
  useEffect(() => {
    if (!isRunning) {
      setTimeRemaining(durationSeconds);
    }
  }, [durationSeconds, isRunning]);

  return { timeRemaining, isRunning, isExpired, start, reset };
}
