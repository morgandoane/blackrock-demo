import { useState, useEffect, useCallback, useRef } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  animate,
} from "framer-motion";
import CommitmentBar from "../components/CommitmentBar";

// ─── Scenario config ───────────────────────────────────────────────────────────
type ScenarioId = "simple" | "adjust" | "abandon";

const LOOP_GAP_MS = 2500;

const SCENARIO_OPTIONS: { id: ScenarioId; label: string }[] = [
  { id: "simple", label: "Send" },
  { id: "adjust", label: "Adjust" },
  { id: "abandon", label: "Abort" },
];

/**
 * Photo-real watch hardware from /public (PNG/WebP with transparent screen window).
 * Scale/position are persisted. Toggle adjust mode with Alt+T (reliable) or Ctrl+T (may be blocked by the browser).
 */
const WATCH_OVERLAY = {
  enabled: true,
  src: "/watch-overlay.png",
};

/** Overall scale of the 198×242 watch + overlay (bigger = larger hardware on screen) */
const WATCH_SCALE = 2;
/** 0–1: shrink only the in-screen UI (text, bars) vs. the screen window — avoids clipping at bezel */
const SCREEN_CONTENT_SCALE = 0.82;

const OVERLAY_STORAGE_KEY = "blackrockdemo.watchOverlay.v1";
const OVERLAY_SCALE_MIN = 0.35;
const OVERLAY_SCALE_MAX = 3.2;

type OverlayPersist = { scale: number; offsetXPx: number; offsetYPx: number };

const DEFAULT_OVERLAY: OverlayPersist = {
  scale: 1,
  offsetXPx: 0,
  offsetYPx: 0,
};

function clampOverlay(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function loadOverlayState(): OverlayPersist {
  try {
    const raw = localStorage.getItem(OVERLAY_STORAGE_KEY);
    if (!raw) return DEFAULT_OVERLAY;
    const p = JSON.parse(raw) as Partial<OverlayPersist>;
    return {
      scale: clampOverlay(
        typeof p.scale === "number" ? p.scale : 1,
        OVERLAY_SCALE_MIN,
        OVERLAY_SCALE_MAX
      ),
      offsetXPx: typeof p.offsetXPx === "number" ? p.offsetXPx : 0,
      offsetYPx: typeof p.offsetYPx === "number" ? p.offsetYPx : 0,
    };
  } catch {
    return DEFAULT_OVERLAY;
  }
}

// ─── Watch hardware overlay (persisted scale/offset, Ctrl+T adjust mode) ───────
const RESIZE_SENS = 0.004;

function WatchOverlayLayer({
  src,
  enabled,
}: {
  src: string;
  enabled: boolean;
}) {
  const [state, setState] = useState<OverlayPersist>(() => loadOverlayState());
  const [adjustMode, setAdjustMode] = useState(false);
  const stateRef = useRef(state);
  // Keep latest overlay state for key handlers; sync each render (same pattern as prior App).
  // eslint-disable-next-line react-hooks/refs -- intentional ref mirror for event callbacks
  stateRef.current = state;

  useEffect(() => {
    try {
      localStorage.setItem(OVERLAY_STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore quota */
    }
  }, [state]);

  // Alt+T: always interceptable. Ctrl+T: we try hard, but Chrome often opens a new tab anyway (reserved shortcut).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isT = e.code === "KeyT" || e.key === "t" || e.key === "T";
      if (!isT) return;

      // Prefer Alt+T — browsers don’t reserve it for chrome UI
      if (e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        setAdjustMode((a) => !a);
        return;
      }

      // Ctrl+T (Windows/Linux) / Ctrl+T attempt — preventDefault + stopImmediatePropagation in capture phase
      if (e.ctrlKey && !e.altKey && !e.metaKey && !e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        setAdjustMode((a) => !a);
        return;
      }

      // Cmd+T on macOS often opens tab; same handler path as ctrlKey for some browsers
      if (e.metaKey && !e.altKey && !e.ctrlKey && !e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        setAdjustMode((a) => !a);
      }
    };
    // Capture on document so we run before targets; true = capture phase
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, []);

  const onImgPointerDown = (e: React.PointerEvent) => {
    if (!adjustMode) return;
    if ((e.target as HTMLElement).closest("[data-overlay-handle]")) return;
    e.preventDefault();
    e.stopPropagation();
    const ox = stateRef.current.offsetXPx;
    const oy = stateRef.current.offsetYPx;
    const sx = e.clientX;
    const sy = e.clientY;
    const onMove = (ev: PointerEvent) => {
      setState((s) => ({
        ...s,
        offsetXPx: ox + (ev.clientX - sx),
        offsetYPx: oy + (ev.clientY - sy),
      }));
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  /** Corner: 1=TL, 2=TR, 3=BL, 4=BR — diagonal drag changes scale uniformly (aspect locked via CSS scale) */
  const onHandlePointerDown =
    (corner: 1 | 2 | 3 | 4) => (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const startScale = stateRef.current.scale;
      const sx = e.clientX;
      const sy = e.clientY;
      const onMove = (ev: PointerEvent) => {
        const dx = ev.clientX - sx;
        const dy = ev.clientY - sy;
        let delta = 0;
        if (corner === 4) delta = (dx + dy) * RESIZE_SENS;
        else if (corner === 1) delta = (-dx - dy) * RESIZE_SENS;
        else if (corner === 2) delta = (dx - dy) * RESIZE_SENS;
        else delta = (-dx + dy) * RESIZE_SENS;
        setState((s) => ({
          ...s,
          scale: clampOverlay(
            startScale + delta,
            OVERLAY_SCALE_MIN,
            OVERLAY_SCALE_MAX
          ),
        }));
      };
      const onUp = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    };

  if (!enabled) return null;

  const handleStyle: React.CSSProperties = {
    position: "absolute",
    width: 11,
    height: 11,
    background: "#fff",
    border: "1px solid rgba(0,0,0,0.45)",
    borderRadius: 2,
    zIndex: 12,
    pointerEvents: "auto",
    touchAction: "none",
  };

  return (
    <>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: "100%",
          height: "100%",
          transform: `translate(calc(-50% + ${state.offsetXPx}px), calc(-50% + ${state.offsetYPx}px)) scale(${state.scale})`,
          transformOrigin: "center center",
          zIndex: 10,
          pointerEvents: adjustMode ? "auto" : "none",
          outline: adjustMode ? "2px dashed rgba(255,255,255,0.55)" : "none",
          outlineOffset: 2,
        }}
      >
        <img
          src={src}
          alt=""
          draggable={false}
          onPointerDown={onImgPointerDown}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            display: "block",
            cursor: adjustMode ? "move" : "default",
            pointerEvents: adjustMode ? "auto" : "none",
            userSelect: "none",
          }}
        />

        {adjustMode && (
          <>
            <div
              data-overlay-handle
              style={{
                ...handleStyle,
                left: -6,
                top: -6,
                cursor: "nwse-resize",
              }}
              onPointerDown={onHandlePointerDown(1)}
            />
            <div
              data-overlay-handle
              style={{
                ...handleStyle,
                right: -6,
                top: -6,
                cursor: "nesw-resize",
              }}
              onPointerDown={onHandlePointerDown(2)}
            />
            <div
              data-overlay-handle
              style={{
                ...handleStyle,
                left: -6,
                bottom: -6,
                cursor: "nesw-resize",
              }}
              onPointerDown={onHandlePointerDown(3)}
            />
            <div
              data-overlay-handle
              style={{
                ...handleStyle,
                right: -6,
                bottom: -6,
                cursor: "nwse-resize",
              }}
              onPointerDown={onHandlePointerDown(4)}
            />
          </>
        )}
      </div>

      {adjustMode && (
        <div
          style={{
            position: "fixed",
            bottom: 16,
            left: 16,
            zIndex: 100,
            fontSize: 11,
            color: "rgba(255,255,255,0.65)",
            letterSpacing: 0.5,
            pointerEvents: "none",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          Overlay adjust · drag to move · corners resize · Alt+T or Ctrl+T to
          exit
        </div>
      )}
    </>
  );
}

// ─── Types ─────────────────────────────────────────────────────────────────────
type Phase = "ambient" | "context" | "composition" | "commitment" | "sent";

// ─── Clock ─────────────────────────────────────────────────────────────────────
function ClockFace({ visible }: { visible: boolean }) {
  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center gap-1"
      animate={{
        opacity: visible ? 1 : 0,
        y: visible ? 0 : -20,
        scale: visible ? 1 : 0.92,
      }}
      transition={{ duration: 0.9, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <div
        style={{
          fontSize: 52,
          fontWeight: 300,
          color: "#fff",
          letterSpacing: -2,
          lineHeight: 1,
        }}
      >
        12:36
      </div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 400,
          color: "#555",
          letterSpacing: 2,
        }}
      >
        PM
      </div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 400,
          color: "#444",
          marginTop: 6,
          letterSpacing: 0.5,
        }}
      >
        Sat, Mar 21
      </div>
    </motion.div>
  );
}

// ─── Context screen ────────────────────────────────────────────────────────────
function ContextScreen({ visible }: { visible: boolean }) {
  return (
    <motion.div
      className="absolute inset-0 flex flex-col justify-center px-5"
      initial={{ opacity: 0 }}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
    >
      <motion.div
        className="flex items-center gap-2 mb-4"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 6 }}
        transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
      >
        <div
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.15)",
          }}
        />
        <span
          style={{
            fontSize: 11,
            color: "#666",
            letterSpacing: 0.8,
            fontWeight: 400,
          }}
        >
          message
        </span>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 8 }}
        transition={{ delay: 0.35, duration: 0.9, ease: "easeOut" }}
        style={{
          fontSize: 22,
          fontWeight: 600,
          color: "#fff",
          letterSpacing: -0.5,
          marginBottom: 6,
        }}
      >
        Sarah
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 6 }}
        transition={{ delay: 0.55, duration: 0.9, ease: "easeOut" }}
        style={{
          fontSize: 11,
          color: "#444",
          letterSpacing: 0.2,
          lineHeight: 1.8,
        }}
      >
        You: leaving in 10
        <br />
        18 min ago
      </motion.div>
      <motion.div
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: visible ? 1 : 0, opacity: visible ? 1 : 0 }}
        transition={{ delay: 0.7, duration: 1.0, ease: "easeOut" }}
        style={{
          height: 1,
          background: "rgba(255,255,255,0.05)",
          marginTop: 14,
          transformOrigin: "left",
        }}
      />
    </motion.div>
  );
}

// ─── Composition screen ────────────────────────────────────────────────────────
interface CompositionProps {
  visible: boolean;
  token1: string;
  token2: string;
  correctionText: string;
  showToken1: boolean;
  showToken2: boolean;
  showCorrection: boolean;
  draftingDots: boolean;
}

function CompositionScreen({
  visible,
  token1,
  token2,
  correctionText,
  showToken1,
  showToken2,
  showCorrection,
  draftingDots,
}: CompositionProps) {
  return (
    <motion.div
      className="absolute inset-0 flex flex-col justify-center px-5"
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: visible ? 0.35 : 0 }}
        transition={{ duration: 0.8, delay: 0.1 }}
        style={{
          fontSize: 10,
          color: "#888",
          letterSpacing: 0.8,
          marginBottom: 10,
          fontWeight: 400,
        }}
      >
        to Sarah
      </motion.div>

      <div
        style={{
          fontSize: 18,
          fontWeight: 400,
          color: "#fff",
          lineHeight: 1.55,
          letterSpacing: -0.2,
          minHeight: 60,
        }}
      >
        <AnimatePresence>
          {showToken1 && (
            <motion.span
              key="t1"
              initial={{ opacity: 0, y: 5, scale: 0.96 }}
              animate={{
                opacity: showToken1 && !showToken2 ? [1, 0.75, 1] : 1,
                y: 0,
                scale: 1,
              }}
              exit={{ opacity: 0, transition: { duration: 0.3 } }}
              transition={{
                duration: 0.75,
                ease: [0.25, 0.1, 0.25, 1],
                opacity:
                  showToken1 && !showToken2
                    ? {
                        duration: 2.4,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 0.75,
                      }
                    : { duration: 0.75 },
              }}
            >
              {token1}
            </motion.span>
          )}
        </AnimatePresence>
        {showToken1 && <span> </span>}
        {/* popLayout lets exit + enter run simultaneously so they overlap inline */}
        <AnimatePresence mode="popLayout">
          {showToken2 && !showCorrection && (
            <motion.span
              key="t2"
              style={{ display: "inline-block" }}
              initial={{ opacity: 0, y: 7, scale: 0.95 }}
              animate={{ opacity: [1, 0.78, 1], y: 0, scale: 1 }}
              exit={{
                opacity: 0,
                y: -10,
                scale: 0.93,
                filter: "blur(4px)",
                transition: { duration: 0.45, ease: [0.4, 0, 1, 1] },
              }}
              transition={{
                duration: 0.65,
                ease: [0.25, 0.1, 0.25, 1],
                opacity: {
                  duration: 2.2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.65,
                },
              }}
            >
              {token2}
            </motion.span>
          )}
          {showCorrection && (
            <motion.span
              key="correction"
              style={{ display: "inline-block" }}
              initial={{ opacity: 0, y: 12, scale: 0.93, filter: "blur(3px)" }}
              animate={{
                opacity: [1, 0.8, 1],
                y: 0,
                scale: 1,
                filter: "blur(0px)",
              }}
              transition={{
                duration: 0.7,
                ease: [0.16, 1, 0.3, 1],
                filter: { duration: 0.5, ease: "easeOut" },
                opacity: {
                  duration: 2.4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.7,
                },
              }}
            >
              {correctionText}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {draftingDots && (
          <motion.div
            className="flex gap-1 mt-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.4 } }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: "50%",
                  background: "#333",
                }}
                animate={{ opacity: [0.3, 0.7, 0.3], scale: [0.8, 1, 0.8] }}
                transition={{
                  duration: 1.4,
                  repeat: Infinity,
                  delay: i * 0.22,
                  ease: "easeInOut",
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Sent confirmation ─────────────────────────────────────────────────────────
function SentConfirmation({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div
            style={{
              position: "relative",
              width: 56,
              height: 56,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {[0, 1].map((i) => (
              <motion.div
                key={i}
                style={{
                  position: "absolute",
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  border: "1.5px solid #30D158",
                }}
                initial={{ scale: 0.6, opacity: 0.8 }}
                animate={{ scale: 2.2, opacity: 0 }}
                transition={{
                  duration: 1.1,
                  delay: i * 0.3,
                  ease: "easeOut",
                  repeat: 1,
                }}
              />
            ))}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: "#30D158",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="18" height="13" viewBox="0 0 18 13" fill="none">
                <motion.path
                  d="M1.5 6.5L6.5 11.5L16.5 1.5"
                  stroke="white"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 0.2, duration: 0.4, ease: "easeOut" }}
                />
              </svg>
            </motion.div>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5, ease: "easeOut" }}
            style={{
              fontSize: 13,
              color: "#30D158",
              fontWeight: 500,
              letterSpacing: 0.3,
            }}
          >
            Sent
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Watch frame ───────────────────────────────────────────────────────────────
function ScreenContent({
  children,
  contentScale,
}: {
  children: React.ReactNode;
  contentScale: number;
}) {
  if (contentScale >= 0.999) {
    return <>{children}</>;
  }
  const inv = 1 / contentScale;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        borderRadius: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: `${inv * 100}%`,
          height: `${inv * 100}%`,
          transform: `scale(${contentScale})`,
          transformOrigin: "center center",
          position: "relative",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function WatchFrame({
  children,
  hideBezel,
  contentScale = 1,
}: {
  children: React.ReactNode;
  hideBezel?: boolean;
  /** Scale down in-screen UI only (typography, commitment bar) */
  contentScale?: number;
}) {
  const screen = (
    <div
      style={{
        position: "absolute",
        inset: 4,
        borderRadius: 50,
        background: "#000",
        overflow: "hidden",
      }}
    >
      <ScreenContent contentScale={contentScale}>{children}</ScreenContent>
    </div>
  );
  if (hideBezel) {
    return (
      <div
        style={{
          width: 198,
          height: 242,
          position: "relative",
          flexShrink: 0,
          overflow: "visible",
        }}
      >
        {screen}
        <div
          style={{
            position: "absolute",
            inset: 4,
            borderRadius: 50,
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 50%)",
            pointerEvents: "none",
          }}
        />
      </div>
    );
  }
  return (
    <div
      style={{
        width: 198,
        height: 242,
        borderRadius: 54,
        background: "linear-gradient(145deg, #1C1C1E 0%, #111111 100%)",
        boxShadow: "none",
        position: "relative",
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      {screen}
      <div
        style={{
          position: "absolute",
          inset: 4,
          borderRadius: 50,
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 50%)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}

// ─── Phase labels + animated line ─────────────────────────────────────────────
const PHASE_ROWS = [
  { key: "context" as Phase, num: "01", label: "Context" },
  { key: "composition" as Phase, num: "02", label: "Composition" },
  { key: "commitment" as Phase, num: "03", label: "Commitment" },
];

// Row pitch: 96px font * 1.1 lineHeight ≈ 106px per row + 32px gap = 138px
const ROW_PITCH = 138;
// Line height = ~80px, so top offset to vertically center line within row
const LINE_H = 84;
const LINE_TOP_OFFSET = (106 - LINE_H) / 2; // ≈ 11px

function PhaseLabels({ phase }: { phase: Phase }) {
  const activeIdx = PHASE_ROWS.findIndex((r) => r.key === phase);
  const lineActive = activeIdx >= 0;
  const lineY = LINE_TOP_OFFSET + activeIdx * ROW_PITCH;

  return (
    <div style={{ position: "relative", paddingLeft: 36 }}>
      {/* Animated white line */}
      <motion.div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 4,
          height: LINE_H,
          borderRadius: 2,
          background: "#FFFFFF",
        }}
        animate={{
          opacity: lineActive ? 1 : 0,
          y: lineActive ? lineY : lineY,
        }}
        transition={{ duration: 0.55, ease: [0.25, 0.1, 0.25, 1] }}
      />

      {/* Label rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
        {PHASE_ROWS.map((row, i) => {
          const isActive = row.key === phase;
          const isPast = activeIdx > i;
          return (
            <motion.div
              key={row.key}
              style={{ display: "flex", alignItems: "baseline", gap: 40 }}
              animate={{ opacity: isActive ? 1 : isPast ? 0.45 : 0.25 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <span
                style={{
                  fontFamily: "'Satoshi', system-ui, sans-serif",
                  fontSize: 96,
                  fontWeight: 700,
                  lineHeight: 1.1,
                  color: "#198F51",
                  fontVariantNumeric: "tabular-nums",
                  letterSpacing: -2,
                }}
              >
                {row.num}
              </span>
              <span
                style={{
                  fontFamily: "'Satoshi', system-ui, sans-serif",
                  fontSize: 96,
                  fontWeight: 700,
                  lineHeight: 1.1,
                  color: "#198F51",
                  letterSpacing: -2,
                }}
              >
                {row.label}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Scenario selector ─────────────────────────────────────────────────────────
function ScenarioSelector({
  active,
  onChange,
}: {
  active: ScenarioId;
  onChange: (id: ScenarioId) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 8,
        alignItems: "center",
      }}
    >
      {SCENARIO_OPTIONS.map((s) => {
        const isActive = s.id === active;
        return (
          <motion.button
            key={s.id}
            type="button"
            onClick={() => onChange(s.id)}
            style={{
              background: isActive ? "rgba(255,255,255,0.1)" : "transparent",
              border: `1px solid ${
                isActive ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.12)"
              }`,
              borderRadius: 20,
              padding: "8px 18px",
              color: isActive
                ? "rgba(255,255,255,0.85)"
                : "rgba(255,255,255,0.4)",
              fontSize: 12,
              letterSpacing: 0.8,
              textTransform: "uppercase" as const,
              cursor: "pointer",
              fontFamily: "inherit",
              fontWeight: 600,
            }}
            whileHover={{
              borderColor: "rgba(255,255,255,0.28)",
              color: "rgba(255,255,255,0.75)",
            }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.15 }}
          >
            {s.label}
          </motion.button>
        );
      })}
    </div>
  );
}

// ─── Main App ──────────────────────────────────────────────────────────────────
export default function MessagingPage({ embedded = false }: { embedded?: boolean } = {}) {
  const [phase, setPhase] = useState<Phase>("ambient");
  const [seqKey, setSeqKey] = useState(0);
  const [selectedScenario, setSelectedScenario] =
    useState<ScenarioId>("simple");
  const activeScenario = selectedScenario;

  // Composition visibility
  const [showToken1, setShowToken1] = useState(false);
  const [showToken2, setShowToken2] = useState(false);
  const [showCorrection, setShowCorrection] = useState(false);

  // Commitment bar state
  const [showCommitBar, setShowCommitBar] = useState(false);
  const [isRetracting, setIsRetracting] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const commitmentProgress = useMotionValue(0);

  // Per-scenario message text
  const token1Text =
    activeScenario === "abandon" ? "Running a bit" : "Almost there,";
  const token2Text =
    activeScenario === "abandon" ? "late, sorry" : "5 min away";
  const correctionText =
    activeScenario === "simple" ? "see you soon 😊" : "on my way! 🏃";

  // Drafting dots: show while composing but no correction and bar isn't up
  const draftingDots =
    phase === "composition" && !showCorrection && !showCommitBar;

  const runSequence = useCallback(
    (scenario: ScenarioId) => {
      // Reset all state
      setPhase("ambient");
      setShowToken1(false);
      setShowToken2(false);
      setShowCorrection(false);
      setShowCommitBar(false);
      setIsRetracting(false);
      setIsSent(false);
      commitmentProgress.set(0);

      const ids: ReturnType<typeof setTimeout>[] = [];
      const animControls: { stop: () => void }[] = [];
      const defer = (fn: () => void, ms: number) => {
        ids.push(setTimeout(fn, ms));
      };
      const cleanup = () => {
        ids.forEach(clearTimeout);
        animControls.forEach((c) => c.stop());
      };

      // ── Shared opening: ambient → context → composition ──────────────────────
      defer(() => setPhase("context"), 2000);
      defer(() => {
        setPhase("composition");
      }, 4500);
      defer(() => setShowToken1(true), 4600);
      defer(() => setShowToken2(true), 5700);

      if (scenario === "simple") {
        // correction, then full commit → send
        defer(() => setShowCorrection(true), 7000);

        defer(() => {
          setShowCommitBar(true);
          setPhase("commitment");
          const c = animate(commitmentProgress, 1, {
            duration: 2.6,
            ease: [0.4, 0, 0.6, 1],
            onComplete: () => {
              setTimeout(() => {
                setIsSent(true);
                setPhase("sent");
                setTimeout(() => {
                  setPhase("ambient");
                  setShowToken1(false);
                  setShowToken2(false);
                  setShowCorrection(false);
                  setShowCommitBar(false);
                  setIsSent(false);
                  commitmentProgress.set(0);
                  defer(() => setSeqKey((k) => k + 1), LOOP_GAP_MS);
                }, 2800);
              }, 300);
            },
          });
          animControls.push(c);
        }, 9200);
      }

      if (scenario === "adjust") {
        // partial commit (~40%) → retract → correction → full commit → send
        defer(() => {
          setShowCommitBar(true);
          setPhase("commitment");
          const c1 = animate(commitmentProgress, 0.4, {
            duration: 1.3,
            ease: [0.4, 0, 0.6, 1],
            onComplete: () => {
              setIsRetracting(true);
              const c2 = animate(commitmentProgress, 0, {
                duration: 0.75,
                ease: [0.55, 0, 1, 1],
                onComplete: () => {
                  setIsRetracting(false);
                  setPhase("composition");
                  setShowCorrection(true);
                  setTimeout(() => {
                    setPhase("commitment");
                    const c3 = animate(commitmentProgress, 1, {
                      duration: 2.6,
                      ease: [0.4, 0, 0.6, 1],
                      onComplete: () => {
                        setTimeout(() => {
                          setIsSent(true);
                          setPhase("sent");
                          setTimeout(() => {
                            setPhase("ambient");
                            setShowToken1(false);
                            setShowToken2(false);
                            setShowCorrection(false);
                            setShowCommitBar(false);
                            setIsSent(false);
                            commitmentProgress.set(0);
                            defer(() => setSeqKey((k) => k + 1), LOOP_GAP_MS);
                          }, 2800);
                        }, 300);
                      },
                    });
                    animControls.push(c3);
                  }, 900);
                },
              });
              animControls.push(c2);
            },
          });
          animControls.push(c1);
        }, 7600);
      }

      if (scenario === "abandon") {
        // partial commit (~58%) → retract → fade to ambient (no send)
        defer(() => {
          setShowCommitBar(true);
          setPhase("commitment");
          const c1 = animate(commitmentProgress, 0.58, {
            duration: 1.9,
            ease: [0.4, 0, 0.6, 1],
            onComplete: () => {
              setIsRetracting(true);
              const c2 = animate(commitmentProgress, 0, {
                duration: 0.85,
                ease: [0.55, 0, 1, 1],
                onComplete: () => {
                  setIsRetracting(false);
                  setTimeout(() => {
                    setShowCommitBar(false);
                    setPhase("composition");
                    setTimeout(() => {
                      // fade composition, return to ambient
                      setPhase("ambient");
                      setShowToken1(false);
                      setShowToken2(false);
                      setShowCommitBar(false);
                      commitmentProgress.set(0);
                      defer(() => setSeqKey((k) => k + 1), LOOP_GAP_MS);
                    }, 1400);
                  }, 600);
                },
              });
              animControls.push(c2);
            },
          });
          animControls.push(c1);
        }, 7600);
      }

      return cleanup;
    },
    [commitmentProgress, setSeqKey]
  );

  const handleScenarioChange = (id: ScenarioId) => {
    setSelectedScenario(id);
    setSeqKey((k) => k + 1);
  };

  // Run on mount, when scenario changes, and each loop iteration
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- drives timed scenario animation
    const cleanup = runSequence(activeScenario);
    return cleanup;
  }, [seqKey, activeScenario, runSequence]);

  const showAmbient = phase === "ambient";
  const showContext = phase === "context";
  const showComposition = ["composition", "commitment", "sent"].includes(phase);
  const showCommitment =
    (phase === "commitment" || phase === "sent") && showCommitBar;
  const showSent = phase === "sent";

  const WS = WATCH_SCALE;

  /** Taller on interaction detail so metadata sits below the fold; page scrolls. */
  const embeddedSize = "clamp(720px, 95vh, 1400px)";

  return (
    <div
      style={{
        width: "100%",
        height: embedded ? embeddedSize : "100vh",
        minHeight: embedded ? embeddedSize : undefined,
        background: "#0C4C2B",
        display: "flex",
        overflow: "hidden",
      }}
    >
      {/* ── Left column: phase labels + scenario selector ── */}
      <div
        style={{
          flex: "0 0 55%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          paddingLeft: embedded ? "4%" : "8%",
        }}
      >
        <PhaseLabels phase={phase === "sent" ? "commitment" : phase} />
        {/* paddingLeft matches PhaseLabels so pills align with "01" text, not the white line */}
        <div style={{ marginTop: 80, paddingLeft: 36 }}>
          <ScenarioSelector
            active={selectedScenario}
            onChange={handleScenarioChange}
          />
        </div>
      </div>

      {/* ── Right column: watch ── */}
      <div
        style={{
          flex: "0 0 45%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            position: "relative",
            width: 198 * WS,
            height: 242 * WS,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: WATCH_OVERLAY.enabled ? "visible" : "hidden",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              transform: `scale(${WS})`,
              flexShrink: 0,
              lineHeight: 0,
              transformOrigin: "center center",
            }}
          >
            <WatchFrame
              hideBezel={WATCH_OVERLAY.enabled}
              contentScale={SCREEN_CONTENT_SCALE}
            >
              <ClockFace visible={showAmbient} />

              <AnimatePresence>
                {showContext && (
                  <motion.div
                    key="ctx"
                    style={{ position: "absolute", inset: 0 }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6 }}
                  >
                    <ContextScreen visible />
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {showComposition && (
                  <motion.div
                    key="comp"
                    style={{ position: "absolute", inset: 0 }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: showSent ? 0 : 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.7 }}
                  >
                    <CompositionScreen
                      visible={showComposition && !showSent}
                      token1={token1Text}
                      token2={token2Text}
                      correctionText={correctionText}
                      showToken1={showToken1}
                      showToken2={showToken2}
                      showCorrection={showCorrection}
                      draftingDots={draftingDots}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <CommitmentBar
                progress={commitmentProgress}
                visible={showCommitment}
                isSent={isSent}
                isRetracting={isRetracting}
              />
              <SentConfirmation visible={showSent} />
            </WatchFrame>
          </div>

          <WatchOverlayLayer
            src={WATCH_OVERLAY.src}
            enabled={WATCH_OVERLAY.enabled}
          />
        </div>
      </div>
    </div>
  );
}
