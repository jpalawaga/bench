import { useEffect, useRef, useState } from "react";
import type { ButtonHTMLAttributes, KeyboardEvent, PointerEvent } from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "success";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border border-[var(--color-button-primary-border)] bg-[var(--color-button-primary-bg)] text-[var(--color-button-primary-text)] shadow-[0_10px_30px_rgba(0,0,0,0.28)] active:bg-[var(--color-button-primary-bg-active)] active:text-[var(--color-button-primary-text-active)]",
  secondary:
    "bg-surface-raised text-text-primary border border-border active:bg-surface-overlay",
  danger: "bg-danger text-white active:bg-danger-hover",
  success:
    "border border-[var(--color-button-success-border)] bg-[var(--color-button-success-bg)] text-[var(--color-button-success-text)] shadow-[0_10px_30px_rgba(0,0,0,0.28)] active:bg-[var(--color-button-success-bg-active)] active:text-[var(--color-button-success-text-active)]",
};

const HOLD_COMPLETE_DELAY_MS = 420;
const TAP_FEEDBACK_DELAY_MS = 220;
const MIN_TAP_FEEDBACK_PROGRESS = 0.22;

interface LongHoldButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick"> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
  durationMs?: number;
  onComplete: () => void | Promise<void>;
}

export function Button({
  variant = "primary",
  fullWidth = false,
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`
        rounded-xl px-6 py-3 text-base font-semibold
        transition-colors duration-100
        disabled:opacity-40 disabled:pointer-events-none
        ${variantClasses[variant]}
        ${fullWidth ? "w-full" : ""}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}

export function LongHoldButton({
  variant = "primary",
  fullWidth = false,
  durationMs = 1500,
  onComplete,
  className = "",
  children,
  disabled,
  onPointerDown,
  onPointerUp,
  onPointerLeave,
  onPointerCancel,
  onKeyDown,
  onKeyUp,
  ...props
}: LongHoldButtonProps) {
  const [isHolding, setIsHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [bursting, setBursting] = useState(false);
  const [tapFeedback, setTapFeedback] = useState(false);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const completeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdStartTimeRef = useRef<number | null>(null);
  const holdingRef = useRef(false);
  const completedRef = useRef(false);

  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, []);

  const clearTimers = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (completeTimerRef.current) {
      clearTimeout(completeTimerRef.current);
      completeTimerRef.current = null;
    }
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
      feedbackTimerRef.current = null;
    }
  };

  const finishHold = () => {
    holdTimerRef.current = null;
    holdStartTimeRef.current = null;
    holdingRef.current = false;
    completedRef.current = true;
    setIsHolding(false);
    setTapFeedback(false);
    setProgress(1);
    setBursting(true);

    completeTimerRef.current = setTimeout(() => {
      completeTimerRef.current = null;
      setBursting(false);
      setProgress(0);
      completedRef.current = false;
      void onComplete();
    }, HOLD_COMPLETE_DELAY_MS);
  };

  const startHold = () => {
    if (disabled || isHolding || completedRef.current) return;
    clearTimers();
    completedRef.current = false;
    holdingRef.current = true;
    setBursting(false);
    setTapFeedback(false);
    setIsHolding(true);
    setProgress(0);
    holdStartTimeRef.current = performance.now();
    holdTimerRef.current = setTimeout(finishHold, durationMs);
  };

  const cancelHold = () => {
    if (completedRef.current) return;
    const holdStartTime = holdStartTimeRef.current;
    holdStartTimeRef.current = null;
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (!holdingRef.current) return;
    holdingRef.current = false;

    const elapsedMs =
      holdStartTime == null ? 0 : performance.now() - holdStartTime;
    const visibleProgress = Math.max(
      MIN_TAP_FEEDBACK_PROGRESS,
      Math.min(1, elapsedMs / durationMs),
    );

    setIsHolding(false);
    setTapFeedback(true);
    setProgress(visibleProgress);
    feedbackTimerRef.current = setTimeout(() => {
      feedbackTimerRef.current = null;
      setTapFeedback(false);
      setProgress(0);
    }, TAP_FEEDBACK_DELAY_MS);
  };

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    onPointerDown?.(event);
    if (event.defaultPrevented) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    startHold();
  };

  const handlePointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    onPointerUp?.(event);
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture?.(event.pointerId);
    }
    cancelHold();
  };

  const handlePointerLeave = (event: PointerEvent<HTMLButtonElement>) => {
    onPointerLeave?.(event);
  };

  const handlePointerCancel = (event: PointerEvent<HTMLButtonElement>) => {
    onPointerCancel?.(event);
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture?.(event.pointerId);
    }
    cancelHold();
  };

  const isHoldKey = (event: KeyboardEvent<HTMLButtonElement>) =>
    event.key === " " || event.key === "Enter";

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented || !isHoldKey(event) || event.repeat) return;
    event.preventDefault();
    startHold();
  };

  const handleKeyUp = (event: KeyboardEvent<HTMLButtonElement>) => {
    onKeyUp?.(event);
    if (!isHoldKey(event)) return;
    event.preventDefault();
    cancelHold();
  };

  return (
    <button
      className={`
        relative isolate overflow-visible rounded-xl px-6 py-3 text-base font-semibold
        transition-colors duration-100 touch-none select-none
        disabled:opacity-40 disabled:pointer-events-none
        ${variantClasses[variant]}
        ${
          isHolding || bursting || tapFeedback
            ? "border-green-400/70 shadow-[0_0_24px_rgba(74,222,128,0.22)]"
            : ""
        }
        ${fullWidth ? "w-full" : ""}
        ${className}
      `}
      disabled={disabled}
      data-holding={isHolding ? "true" : "false"}
      data-bursting={bursting ? "true" : "false"}
      data-tap-feedback={tapFeedback ? "true" : "false"}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      onPointerCancel={handlePointerCancel}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      {...props}
    >
      <span className="absolute inset-0 z-0 overflow-hidden rounded-xl">
        <span
          className={`
            absolute inset-y-0 left-0 w-full origin-left
            bg-green-400/45 shadow-[0_0_22px_rgba(74,222,128,0.35)]
            ${isHolding ? "animate-hold-button-fill" : ""}
          `}
          style={{
            transform: `scaleX(${progress})`,
            animationDuration: isHolding ? `${durationMs}ms` : undefined,
            transition: isHolding ? "none" : "transform 180ms ease-out",
          }}
        />
      </span>
      {bursting ? (
        <>
          <span
            aria-hidden="true"
            className="animate-hold-button-burst pointer-events-none absolute inset-0 z-0 rounded-xl border-2 border-green-300/90 bg-green-400/20 shadow-[0_0_34px_rgba(74,222,128,0.55)]"
          />
          <span
            aria-hidden="true"
            className="animate-hold-button-burst-outer pointer-events-none absolute inset-0 z-0 rounded-xl border border-green-200/70 shadow-[0_0_46px_rgba(74,222,128,0.42)]"
          />
        </>
      ) : null}
      {tapFeedback ? (
        <span
          aria-hidden="true"
          className="animate-hold-button-tap-feedback pointer-events-none absolute inset-0 z-0 rounded-xl border border-green-300/70 bg-green-400/10 shadow-[0_0_22px_rgba(74,222,128,0.28)]"
        />
      ) : null}
      <span className="relative z-10">{children}</span>
    </button>
  );
}
