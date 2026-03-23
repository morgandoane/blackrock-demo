import { motion } from "framer-motion";
import type { PlaybackMode } from "../hooks/usePlaybackController";

interface PlaybackControlsProps {
  mode: PlaybackMode;
  stepIndex: number;
  totalSteps: number;
  onToggleMode: () => void;
  onForward: () => void;
  onBackward: () => void;
}

const pill = (active: boolean): React.CSSProperties => ({
  background: active ? "rgba(255,255,255,0.1)" : "transparent",
  border: `1px solid ${active ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.12)"}`,
  borderRadius: 20,
  padding: "8px 18px",
  color: active ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.4)",
  fontSize: 12,
  letterSpacing: 0.8,
  textTransform: "uppercase" as const,
  cursor: "pointer",
  fontFamily: "inherit",
  fontWeight: 600,
});

export default function PlaybackControls({
  mode,
  stepIndex,
  totalSteps,
  onToggleMode,
  onForward,
  onBackward,
}: PlaybackControlsProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Mode toggle */}
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <motion.button
          type="button"
          onClick={onToggleMode}
          style={pill(mode === "auto")}
          whileHover={{ borderColor: "rgba(255,255,255,0.28)", color: "rgba(255,255,255,0.75)" }}
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.15 }}
        >
          Auto
        </motion.button>
        <motion.button
          type="button"
          onClick={onToggleMode}
          style={pill(mode === "manual")}
          whileHover={{ borderColor: "rgba(255,255,255,0.28)", color: "rgba(255,255,255,0.75)" }}
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.15 }}
        >
          Manual
        </motion.button>
      </div>

      {/* Step counter + arrow buttons (manual only) */}
      {mode === "manual" && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          style={{ display: "flex", flexDirection: "column", gap: 8 }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <motion.button
              type="button"
              onClick={onBackward}
              style={{
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 14,
                width: 28,
                height: 28,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: stepIndex > 0 ? "pointer" : "default",
                opacity: stepIndex > 0 ? 1 : 0.3,
                color: "rgba(255,255,255,0.6)",
                fontSize: 14,
                fontFamily: "inherit",
                padding: 0,
              }}
              whileHover={stepIndex > 0 ? { borderColor: "rgba(255,255,255,0.3)" } : {}}
              whileTap={stepIndex > 0 ? { scale: 0.93 } : {}}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M7.5 2.5L4 6L7.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.button>

            <span
              style={{
                fontSize: 13,
                color: "rgba(255,255,255,0.55)",
                letterSpacing: 1,
                fontWeight: 500,
                fontVariantNumeric: "tabular-nums",
                minWidth: 40,
                textAlign: "center",
              }}
            >
              {stepIndex + 1} / {totalSteps}
            </span>

            <motion.button
              type="button"
              onClick={onForward}
              style={{
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 14,
                width: 28,
                height: 28,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "rgba(255,255,255,0.6)",
                fontSize: 14,
                fontFamily: "inherit",
                padding: 0,
              }}
              whileHover={{ borderColor: "rgba(255,255,255,0.3)" }}
              whileTap={{ scale: 0.93 }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M4.5 2.5L8 6L4.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.button>
          </div>

          <span
            style={{
              fontSize: 10,
              color: "rgba(255,255,255,0.2)",
              letterSpacing: 0.5,
            }}
          >
            arrows to step · space to toggle
          </span>
        </motion.div>
      )}
    </div>
  );
}
