import { useEffect, useLayoutEffect, useRef } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  useMotionTemplate,
  type MotionValue,
} from "framer-motion";

// ─── Variant definitions ────────────────────────────────────────────────────────

export type CommitmentVariant =
  | "focus_bar"
  | "focus_bar_extended"
  | "focus_bar_extended_plus"
  | "focus_bar_proximity";

export interface CommitmentBarProps {
  variant?: CommitmentVariant;
  progress: MotionValue<number>;
  visible: boolean;
  isSent: boolean;
  isRetracting: boolean;
  /** Override the default label shown above the bar while filling. */
  label?: string;
  /** Override the default label shown when focus is lost / retracting. */
  retractLabel?: string;
}

interface VariantConfig {
  label: string;
  retractLabel: string;
  trackHeight: number;
  colorRamp: { input: number[]; circle: string[]; fill: string[] };
  retractColors: { circle: string[]; fill: string[] };
  showPlusBadge: boolean;
}

const BASE_GREEN_RAMP: VariantConfig["colorRamp"] = {
  input: [0, 0.35, 1],
  circle: ["#474747", "#1E8A3C", "#30D158"],
  fill: ["#1A1A1A", "#1A4C2C", "#30D158"],
};

const EXTENDED_TEAL_RAMP: VariantConfig["colorRamp"] = {
  input: [0, 0.35, 1],
  circle: ["#474747", "#1A7A6C", "#2ECDA8"],
  fill: ["#1A1A1A", "#1A4C44", "#2ECDA8"],
};

const PROXIMITY_BLUE_RAMP: VariantConfig["colorRamp"] = {
  input: [0, 0.35, 1],
  circle: ["#474747", "#1A5C8A", "#30A0D1"],
  fill: ["#1A1A1A", "#1A3C5C", "#30A0D1"],
};

const VARIANT_CONFIGS: Record<CommitmentVariant, VariantConfig> = {
  focus_bar: {
    label: "focus to send",
    retractLabel: "focus lost",
    trackHeight: 30,
    colorRamp: BASE_GREEN_RAMP,
    retractColors: { circle: ["#F09A37", "#F09A37"], fill: ["#5C3A10", "#5C3A10"] },
    showPlusBadge: false,
  },
  focus_bar_extended: {
    label: "hold focus to confirm",
    retractLabel: "focus lost",
    trackHeight: 34,
    colorRamp: EXTENDED_TEAL_RAMP,
    retractColors: { circle: ["#F09A37", "#F09A37"], fill: ["#5C3A10", "#5C3A10"] },
    showPlusBadge: false,
  },
  focus_bar_extended_plus: {
    label: "hold focus to confirm",
    retractLabel: "focus lost",
    trackHeight: 34,
    colorRamp: EXTENDED_TEAL_RAMP,
    retractColors: { circle: ["#F09A37", "#F09A37"], fill: ["#5C3A10", "#5C3A10"] },
    showPlusBadge: true,
  },
  focus_bar_proximity: {
    label: "focus to unlock",
    retractLabel: "too far",
    trackHeight: 30,
    colorRamp: PROXIMITY_BLUE_RAMP,
    retractColors: { circle: ["#F09A37", "#F09A37"], fill: ["#5C3A10", "#5C3A10"] },
    showPlusBadge: false,
  },
};

// ─── Animation math constants ───────────────────────────────────────────────────
/** Stage split: 0..K radial growth (center x = H/2), K..1 horizontal fill to track width */
const COMMIT_STAGE_K = 0.35;
const COMMIT_R_MIN = 2;

// ─── Component ──────────────────────────────────────────────────────────────────

export default function CommitmentBar({
  variant = "focus_bar",
  progress,
  visible,
  isSent,
  isRetracting,
  label: labelOverride,
  retractLabel: retractLabelOverride,
}: CommitmentBarProps) {
  const cfg = VARIANT_CONFIGS[variant];
  const activeLabel = labelOverride ?? cfg.label;
  const activeRetractLabel = retractLabelOverride ?? cfg.retractLabel;

  const trackRef = useRef<HTMLDivElement>(null);
  const trackWMv = useMotionValue(150);
  const trackHMv = useMotionValue(cfg.trackHeight);
  const retractMv = useMotionValue(isRetracting ? 1 : 0);

  useEffect(() => {
    retractMv.set(isRetracting ? 1 : 0);
  }, [isRetracting, retractMv]);

  useLayoutEffect(() => {
    if (!visible) return;
    const el = trackRef.current;
    if (!el) return;
    const update = () => {
      trackWMv.set(el.clientWidth);
      trackHMv.set(el.clientHeight);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [visible, trackWMv, trackHMv]);

  const { colorRamp, retractColors } = cfg;

  const circleColor = useTransform(
    progress,
    isRetracting ? [0, 1] : colorRamp.input,
    isRetracting ? retractColors.circle : colorRamp.circle,
  );
  const fillColor = useTransform(
    progress,
    isRetracting ? [0, 1] : colorRamp.input,
    isRetracting ? retractColors.fill : colorRamp.fill,
  );
  const glowOpacity = useTransform(progress, [0, 0.3, 1], [0, 0.15, 0.5]);

  const fillBackground = useMotionTemplate`linear-gradient(90deg, ${fillColor} 0%, ${circleColor} 100%)`;

  const glowColorBase = variant === "focus_bar_proximity"
    ? "48,160,209"
    : variant === "focus_bar_extended" || variant === "focus_bar_extended_plus"
      ? "46,205,168"
      : "48,209,88";

  const fillWidth = useTransform([progress, trackWMv, trackHMv], ([p, w, h]) => {
    const prog = p as number;
    const W = Math.max(w as number, 1);
    const H = h as number;
    const rMax = H / 2;
    if (prog <= COMMIT_STAGE_K) {
      const t = COMMIT_STAGE_K > 0 ? prog / COMMIT_STAGE_K : 0;
      const r0 = Math.min(COMMIT_R_MIN, rMax);
      const r = r0 + t * (rMax - r0);
      return 2 * r;
    }
    const t = (prog - COMMIT_STAGE_K) / (1 - COMMIT_STAGE_K);
    return H + t * (W - H);
  });

  const fillHeight = useTransform([progress, trackWMv, trackHMv], ([p, , h]) => {
    const prog = p as number;
    const H = h as number;
    const rMax = H / 2;
    if (prog <= COMMIT_STAGE_K) {
      const t = COMMIT_STAGE_K > 0 ? prog / COMMIT_STAGE_K : 0;
      const r0 = Math.min(COMMIT_R_MIN, rMax);
      const r = r0 + t * (rMax - r0);
      return 2 * r;
    }
    return H;
  });

  const fillLeft = useTransform([progress, trackWMv, trackHMv], ([p, , h]) => {
    const prog = p as number;
    const H = h as number;
    const rMax = H / 2;
    if (prog <= COMMIT_STAGE_K) {
      const t = COMMIT_STAGE_K > 0 ? prog / COMMIT_STAGE_K : 0;
      const r0 = Math.min(COMMIT_R_MIN, rMax);
      const r = r0 + t * (rMax - r0);
      return H / 2 - r;
    }
    return 0;
  });

  const fillTop = useTransform([progress, trackWMv, trackHMv], ([p, , h]) => {
    const prog = p as number;
    const H = h as number;
    const rMax = H / 2;
    if (prog <= COMMIT_STAGE_K) {
      const t = COMMIT_STAGE_K > 0 ? prog / COMMIT_STAGE_K : 0;
      const r0 = Math.min(COMMIT_R_MIN, rMax);
      const r = r0 + t * (rMax - r0);
      const fh = 2 * r;
      return (H - fh) / 2;
    }
    return 0;
  });

  const fillRadius = useTransform([progress, trackWMv, trackHMv], ([p, , h]) => {
    const prog = p as number;
    const H = h as number;
    const rMax = H / 2;
    if (prog <= COMMIT_STAGE_K) {
      const t = COMMIT_STAGE_K > 0 ? prog / COMMIT_STAGE_K : 0;
      const r0 = Math.min(COMMIT_R_MIN, rMax);
      return r0 + t * (rMax - r0);
    }
    return H / 2;
  });

  const fillBoxShadow = useTransform([glowOpacity, retractMv], ([o, r]) => {
    const v = o as number;
    if ((r as number) >= 0.5) {
      return `0 0 ${12 + 8 * v}px rgba(240,154,55,${0.25 + 0.35 * v})`;
    }
    return `0 0 ${10 + 12 * v}px rgba(${glowColorBase},${0.35 * v})`;
  });

  const trackRadius = cfg.trackHeight / 2;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="commit-bar"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: isSent ? 0 : 1, y: isSent ? 4 : 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ duration: isSent ? 0.4 : 0.55, ease: "easeOut" }}
          style={{ position: "absolute", bottom: 28, left: 20, right: 20 }}
        >
          <motion.div
            animate={{ opacity: isSent ? 0 : isRetracting ? 0.25 : 0.38 }}
            transition={{ duration: 0.3 }}
            style={{
              fontSize: 9,
              color: isRetracting ? "#F09A37" : "#888",
              letterSpacing: 1.2,
              textTransform: "uppercase",
              marginBottom: 6,
              textAlign: "center",
              fontWeight: 500,
              transition: "color 0.4s ease",
            }}
          >
            {isRetracting ? activeRetractLabel : activeLabel}
          </motion.div>

          <div
            ref={trackRef}
            style={{
              height: cfg.trackHeight,
              borderRadius: trackRadius,
              background: "#111",
              border: "1px solid rgba(255,255,255,0.07)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <motion.div
              style={{
                position: "absolute",
                left: fillLeft,
                top: fillTop,
                width: fillWidth,
                height: fillHeight,
                borderRadius: fillRadius,
                background: fillBackground,
                boxShadow: fillBoxShadow,
                zIndex: 2,
              }}
            />

            {cfg.showPlusBadge && (
              <div
                style={{
                  position: "absolute",
                  right: 8,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 14,
                  height: 14,
                  borderRadius: 4,
                  border: "1px solid rgba(255,255,255,0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 10,
                  fontWeight: 700,
                  color: "rgba(255,255,255,0.25)",
                  zIndex: 3,
                  pointerEvents: "none",
                }}
              >
                +
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
