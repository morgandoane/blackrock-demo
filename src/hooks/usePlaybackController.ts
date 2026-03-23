import { useState, useEffect, useCallback, useRef } from "react";

export type PlaybackMode = "auto" | "manual";

export interface UsePlaybackControllerOpts {
  totalSteps: number;
  /** Bumped when the scenario changes, so manual mode resets to step 0. */
  resetKey: number;
  /** Called when a step should be applied. `direction` is 1 (forward) or -1 (backward). */
  onStep: (index: number, direction: 1 | -1 | 0) => void;
  /** Called when switching to auto so the page can restart its runSequence. */
  onAutoResume: () => void;
}

export interface PlaybackController {
  mode: PlaybackMode;
  stepIndex: number;
  totalSteps: number;
  toggleMode: () => void;
  goForward: () => void;
  goBackward: () => void;
}

export default function usePlaybackController({
  totalSteps,
  resetKey,
  onStep,
  onAutoResume,
}: UsePlaybackControllerOpts): PlaybackController {
  const [mode, setMode] = useState<PlaybackMode>("manual");
  const [stepIndex, setStepIndex] = useState(0);

  const onStepRef = useRef(onStep);
  const onAutoResumeRef = useRef(onAutoResume);
  const totalStepsRef = useRef(totalSteps);
  useEffect(() => {
    onStepRef.current = onStep;
    onAutoResumeRef.current = onAutoResume;
    totalStepsRef.current = totalSteps;
  });

  // Apply step 0 on mount when starting in manual mode
  const mountedRef = useRef(false);
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      if (mode === "manual") {
        onStepRef.current(0, 0);
      }
    }
  }, [mode]);

  // Reset to step 0 when the scenario changes in manual mode
  const prevResetKeyRef = useRef(resetKey);
  useEffect(() => {
    if (prevResetKeyRef.current !== resetKey) {
      prevResetKeyRef.current = resetKey;
      if (mode === "manual") {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- must sync step index to new scenario
        setStepIndex(0);
        onStepRef.current(0, 0);
      }
    }
  }, [resetKey, mode]);

  const goForward = useCallback(() => {
    setStepIndex((prev) => {
      const total = totalStepsRef.current;
      const next = prev < total - 1 ? prev + 1 : 0;
      onStepRef.current(next, 1);
      return next;
    });
  }, []);

  const goBackward = useCallback(() => {
    setStepIndex((prev) => {
      if (prev <= 0) return prev;
      const next = prev - 1;
      onStepRef.current(next, -1);
      return next;
    });
  }, []);

  const toggleMode = useCallback(() => {
    setMode((prev) => {
      const next = prev === "auto" ? "manual" : "auto";
      if (next === "manual") {
        setStepIndex(0);
        onStepRef.current(0, 0);
      } else {
        onAutoResumeRef.current();
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (mode !== "manual") return;

    const handler = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;

      if (e.key === "ArrowRight") {
        e.preventDefault();
        goForward();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goBackward();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [mode, goForward, goBackward]);

  // Space toggles mode regardless of current mode
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;
      if (e.key === " ") {
        e.preventDefault();
        toggleMode();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [toggleMode]);

  return { mode, stepIndex, totalSteps, toggleMode, goForward, goBackward };
}
