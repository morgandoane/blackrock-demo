import { useState, useEffect, useCallback } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  animate,
} from "framer-motion";
import CommitmentBar from "../components/CommitmentBar";
import NeuralSignature from "../components/NeuralSignature";
import WatchFrame from "../components/WatchFrame";
import WatchOverlayLayer from "../components/WatchOverlayLayer";
import ClockFace from "../components/ClockFace";
import PhaseLabels, { type DisplayPhase } from "../components/PhaseLabels";
import ScenarioSelector from "../components/ScenarioSelector";

// ─── Scenario config ───────────────────────────────────────────────────────────
type ScenarioId = "complete" | "abort";

const LOOP_GAP_MS = 2500;

const SCENARIO_OPTIONS: { id: ScenarioId; label: string }[] = [
  { id: "complete", label: "Authorize" },
  { id: "abort", label: "Abort" },
];

const WATCH_OVERLAY = { enabled: true, src: "/watch-overlay.png" };
const WATCH_SCALE = 2;
const SCREEN_CONTENT_SCALE = 0.82;

// ─── Phase types ────────────────────────────────────────────────────────────────
type Phase =
  | "ambient"
  | "context"
  | "composition"
  | "commitment"
  | "neural_signature"
  | "confirmed";

function toDisplayPhase(p: Phase): DisplayPhase {
  switch (p) {
    case "ambient":
      return "ambient";
    case "context":
      return "context";
    case "composition":
      return "composition";
    case "commitment":
    case "neural_signature":
    case "confirmed":
      return "commitment";
  }
}

// ─── Context: Transfer Notification ─────────────────────────────────────────────
function TransferContextScreen({ visible }: { visible: boolean }) {
  return (
    <motion.div
      className="absolute inset-0 flex flex-col justify-center px-5"
      initial={{ opacity: 0 }}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
    >
      <motion.div
        className="flex items-center gap-2"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 6 }}
        transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
        style={{ marginBottom: 10 }}
      >
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: 3,
            background: "rgba(192,160,96,0.45)",
          }}
        />
        <span
          style={{
            fontSize: 10,
            color: "#888",
            letterSpacing: 0.8,
            fontWeight: 400,
          }}
        >
          transfer
        </span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 8 }}
        transition={{ delay: 0.35, duration: 0.9, ease: "easeOut" }}
        style={{
          fontSize: 18,
          fontWeight: 600,
          color: "#fff",
          letterSpacing: -0.5,
          lineHeight: 1.2,
          marginBottom: 10,
        }}
      >
        Sarah Chen
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 6 }}
        transition={{ delay: 0.5, duration: 0.9, ease: "easeOut" }}
        style={{
          fontSize: 11,
          fontWeight: 500,
          color: "#30D158",
          letterSpacing: 0.2,
          marginBottom: 10,
        }}
      >
        Requesting $250.00
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 6 }}
        transition={{ delay: 0.65, duration: 0.9, ease: "easeOut" }}
        style={{
          fontSize: 10,
          color: "#777",
          letterSpacing: 0.2,
          lineHeight: 1.6,
        }}
      >
        Last transfer 12 days ago
      </motion.div>

      <motion.div
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: visible ? 1 : 0, opacity: visible ? 1 : 0 }}
        transition={{ delay: 0.8, duration: 1.0, ease: "easeOut" }}
        style={{
          height: 1,
          background: "rgba(255,255,255,0.06)",
          marginTop: 10,
          transformOrigin: "left",
        }}
      />
    </motion.div>
  );
}

// ─── Composition: Transfer Summary ──────────────────────────────────────────────
interface TransferField {
  label: string;
  value: string;
  checked: boolean;
}

function TransferSummaryScreen({
  visible,
  fields,
}: {
  visible: boolean;
  fields: TransferField[];
}) {
  return (
    <motion.div
      className="absolute inset-0 flex flex-col justify-center px-5"
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: visible ? 0.7 : 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        style={{
          fontSize: 10,
          color: "#aaa",
          letterSpacing: 0.8,
          marginBottom: 14,
          fontWeight: 400,
        }}
      >
        transfer
      </motion.div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {fields.map((f, i) => (
          <motion.div
            key={f.label}
            initial={{ opacity: 0, x: -6 }}
            animate={{
              opacity: visible ? 1 : 0,
              x: visible ? 0 : -6,
            }}
            transition={{
              delay: 0.15 + i * 0.12,
              duration: 0.6,
              ease: "easeOut",
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: f.checked
                  ? "#30D158"
                  : "rgba(255,255,255,0.2)",
                flexShrink: 0,
              }}
            />
            <div
              style={{
                fontSize: 15,
                fontWeight: 500,
                letterSpacing: -0.2,
                color: "#fff",
              }}
            >
              {f.value}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Confirmed ──────────────────────────────────────────────────────────────────
function TransferConfirmed({ visible }: { visible: boolean }) {
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
              transition={{
                duration: 0.4,
                ease: [0.34, 1.56, 0.64, 1],
              }}
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
                  transition={{
                    delay: 0.2,
                    duration: 0.4,
                    ease: "easeOut",
                  }}
                />
              </svg>
            </motion.div>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5, ease: "easeOut" }}
            style={{
              fontSize: 12,
              color: "#30D158",
              fontWeight: 500,
              letterSpacing: 0.3,
            }}
          >
            Transfer authorized
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────────
export default function TransferPage({
  embedded = false,
}: { embedded?: boolean } = {}) {
  const [phase, setPhase] = useState<Phase>("ambient");
  const [seqKey, setSeqKey] = useState(0);
  const [selectedScenario, setSelectedScenario] =
    useState<ScenarioId>("complete");
  const activeScenario = selectedScenario;

  const [fieldsChecked, setFieldsChecked] = useState(0);

  // Commitment bar state (first stage)
  const [showCommitBar, setShowCommitBar] = useState(false);
  const [commitBarSent, setCommitBarSent] = useState(false);
  const commitProgress = useMotionValue(0);

  const neuralSaturation = useMotionValue(0);

  const transferFields: TransferField[] = [
    { label: "Amount", value: "$250.00", checked: fieldsChecked >= 1 },
    { label: "To", value: "Sarah Chen", checked: fieldsChecked >= 2 },
    {
      label: "From",
      value: "Checking ····4821",
      checked: fieldsChecked >= 3,
    },
  ];

  const showAmbient = phase === "ambient";
  const showContext = phase === "context";
  const showSummary = phase === "composition" || phase === "commitment";
  const showCommitment = phase === "commitment" && showCommitBar;
  const showSignature = phase === "neural_signature";
  const showConfirmed = phase === "confirmed";

  const runSequence = useCallback(
    (scenario: ScenarioId) => {
      setPhase("ambient");
      setFieldsChecked(0);
      setShowCommitBar(false);
      setCommitBarSent(false);
      commitProgress.set(0);
      neuralSaturation.set(0);

      let aborted = false;
      const ids: ReturnType<typeof setTimeout>[] = [];
      const animControls: { stop: () => void }[] = [];
      const defer = (fn: () => void, ms: number) => {
        ids.push(
          setTimeout(() => {
            if (!aborted) fn();
          }, ms),
        );
      };
      const safeLater = (fn: () => void, ms: number) => {
        ids.push(
          setTimeout(() => {
            if (!aborted) fn();
          }, ms),
        );
      };
      const cleanup = () => {
        aborted = true;
        ids.forEach(clearTimeout);
        animControls.forEach((c) => c.stop());
      };

      // Shared opening: ambient → context → composition
      defer(() => setPhase("context"), 2000);
      defer(() => {
        setPhase("composition");
        setFieldsChecked(0);
      }, 4800);

      // Fields check in sequentially
      defer(() => setFieldsChecked(1), 5400);
      defer(() => setFieldsChecked(2), 6000);
      defer(() => setFieldsChecked(3), 6600);

      if (scenario === "complete") {
        // Stage 1: Focus bar to confirm
        defer(() => {
          setPhase("commitment");
          setShowCommitBar(true);
          const c1 = animate(commitProgress, 1, {
            duration: 2.2,
            ease: [0.4, 0, 0.6, 1],
            onComplete: () => {
              safeLater(() => {
                setCommitBarSent(true);
                safeLater(() => {
                  setShowCommitBar(false);
                  setCommitBarSent(false);
                  commitProgress.set(0);

                  // Stage 2: Neural signature
                  setPhase("neural_signature");
                  const c2 = animate(neuralSaturation, 1, {
                    duration: 8,
                    ease: [0.05, 0, 0.95, 1],
                    onComplete: () => {
                      safeLater(() => {
                        setPhase("confirmed");
                        safeLater(() => {
                          setPhase("ambient");
                          neuralSaturation.set(0);
                          setFieldsChecked(0);
                          defer(
                            () => setSeqKey((k) => k + 1),
                            LOOP_GAP_MS,
                          );
                        }, 3000);
                      }, 400);
                    },
                  });
                  animControls.push(c2);
                }, 400);
              }, 250);
            },
          });
          animControls.push(c1);
        }, 8200);
      }

      if (scenario === "abort") {
        // Stage 1: Focus bar to confirm
        defer(() => {
          setPhase("commitment");
          setShowCommitBar(true);
          const c1 = animate(commitProgress, 1, {
            duration: 2.2,
            ease: [0.4, 0, 0.6, 1],
            onComplete: () => {
              safeLater(() => {
                setCommitBarSent(true);
                safeLater(() => {
                  setShowCommitBar(false);
                  setCommitBarSent(false);
                  commitProgress.set(0);

                  // Stage 2: Neural signature — but focus drops
                  setPhase("neural_signature");
                  const c2 = animate(neuralSaturation, 0.45, {
                    duration: 4,
                    ease: [0.3, 0, 0.6, 1],
                    onComplete: () => {
                      if (aborted) return;
                      const c3 = animate(neuralSaturation, 0, {
                        duration: 1.8,
                        ease: [0.6, 0, 1, 1],
                        onComplete: () => {
                          if (aborted) return;
                          safeLater(() => {
                            setPhase("composition");
                            safeLater(() => {
                              setPhase("ambient");
                              setFieldsChecked(0);
                              neuralSaturation.set(0);
                              defer(
                                () => setSeqKey((k) => k + 1),
                                LOOP_GAP_MS,
                              );
                            }, 1400);
                          }, 600);
                        },
                      });
                      animControls.push(c3);
                    },
                  });
                  animControls.push(c2);
                }, 400);
              }, 250);
            },
          });
          animControls.push(c1);
        }, 8200);
      }

      return cleanup;
    },
    [neuralSaturation],
  );

  const handleScenarioChange = (id: ScenarioId) => {
    setSelectedScenario(id);
    setSeqKey((k) => k + 1);
  };

  useEffect(() => {
    const cleanup = runSequence(activeScenario);
    return cleanup;
  }, [seqKey, activeScenario, runSequence]);

  const WS = WATCH_SCALE;
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
      {/* Left column: phase labels + scenario selector */}
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
        <PhaseLabels phase={toDisplayPhase(phase)} />
        <div style={{ marginTop: 80, paddingLeft: 36 }}>
          <ScenarioSelector
            options={SCENARIO_OPTIONS}
            active={selectedScenario}
            onChange={handleScenarioChange}
          />
        </div>
      </div>

      {/* Right column: watch */}
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

              <AnimatePresence mode="wait">
                {showContext && (
                  <motion.div
                    key="tx-ctx"
                    style={{ position: "absolute", inset: 0 }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.45 }}
                  >
                    <TransferContextScreen visible />
                  </motion.div>
                )}
                {showSummary && (
                  <motion.div
                    key="tx-summary"
                    style={{ position: "absolute", inset: 0 }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.45 }}
                  >
                    <TransferSummaryScreen
                      visible
                      fields={transferFields}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <CommitmentBar
                progress={commitProgress}
                visible={showCommitment}
                isSent={commitBarSent}
                isRetracting={false}
                label="focus to confirm"
              />

              <NeuralSignature
                saturation={neuralSaturation}
                visible={showSignature}
              />

              <TransferConfirmed visible={showConfirmed} />
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
