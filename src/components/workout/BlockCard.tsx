import { useEffect, useRef } from "react";
import type { Block } from "@/types/models";

interface BlockCardProps {
  block: Block;
  onClick: () => void;
  onLongPress?: () => void;
}

const LONG_PRESS_MS = 450;

export function BlockCard({ block, onClick, onLongPress }: BlockCardProps) {
  const exerciseNames = block.exercises.map((e) => e.exerciseName).join(", ");
  const totalSets = block.exercises.reduce(
    (sum, e) => sum + e.sets.length,
    0,
  );
  const isFinished = block.status === "finished";
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggeredRef = useRef(false);

  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  const clearLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handlePointerDown = () => {
    if (!onLongPress) return;
    longPressTriggeredRef.current = false;
    clearLongPress();
    longPressTimerRef.current = setTimeout(() => {
      longPressTriggeredRef.current = true;
      onLongPress();
    }, LONG_PRESS_MS);
  };

  const handlePointerUp = () => {
    clearLongPress();
  };

  const handleClick = () => {
    if (longPressTriggeredRef.current) {
      longPressTriggeredRef.current = false;
      return;
    }
    onClick();
  };

  return (
    <button
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onContextMenu={(e) => {
        if (!onLongPress) return;
        e.preventDefault();
        onLongPress();
      }}
      className="w-full text-left rounded-xl bg-surface-raised p-4 active:bg-surface-overlay transition-colors"
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-text-primary font-semibold">
          Block {block.order}
        </span>
        <span className="text-sm">
          {isFinished ? (
            <span className="text-green-400">Done</span>
          ) : block.status === "in-progress" ? (
            <span className="text-accent">In Progress</span>
          ) : (
            <span className="text-text-muted">Planning</span>
          )}
        </span>
      </div>
      {block.exercises.length > 0 ? (
        <>
          <p className="text-text-secondary text-sm">{exerciseNames}</p>
          <p className="text-text-muted text-xs mt-1">
            {totalSets} set{totalSets !== 1 ? "s" : ""}
          </p>
        </>
      ) : (
        <p className="text-text-muted text-sm">No exercises yet</p>
      )}
    </button>
  );
}
