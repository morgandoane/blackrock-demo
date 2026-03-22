import { useState, useEffect, useCallback } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  animate,
} from "framer-motion";
import CommitmentBar from "../components/CommitmentBar";
import WatchFrame from "../components/WatchFrame";
import WatchOverlayLayer from "../components/WatchOverlayLayer";
import ClockFace from "../components/ClockFace";
import PhaseLabels, { type DisplayPhase } from "../components/PhaseLabels";
import ScenarioSelector from "../components/ScenarioSelector";

// ─── Scenario config ───────────────────────────────────────────────────────────
type ScenarioId = "simple" | "adjust" | "abandon";

const LOOP_GAP_MS = 2500;

const SCENARIO_OPTIONS: { id: ScenarioId; label: string }[] = [
  { id: "simple", label: "Send" },
  { id: "adjust", label: "Adjust" },
  { id: "abandon", label: "Abort" },
];

const WATCH_OVERLAY = {
  enabled: true,
  src: "/watch-overlay.png",
};

const WATCH_SCALE = 2;
const SCREEN_CONTENT_SCALE = 0.82;

// ─── Types ─────────────────────────────────────────────────────────────────────
type Phase = "ambient" | "context" | "composition" | "commitment" | "sent";

function toDisplayPhase(p: Phase): DisplayPhase {
  if (p === "sent") return "commitment";
  return p;
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

// ─── Main Page ──────────────────────────────────────────────────────────────────
export default function MessagingPage({ embedded = false }: { embedded?: boolean } = {}) {
  const [phase, setPhase] = useState<Phase>("ambient");
  const [seqKey, setSeqKey] = useState(0);
  const [selectedScenario, setSelectedScenario] =
    useState<ScenarioId>("simple");
  const activeScenario = selectedScenario;

  const [showToken1, setShowToken1] = useState(false);
  const [showToken2, setShowToken2] = useState(false);
  const [showCorrection, setShowCorrection] = useState(false);

  const [showCommitBar, setShowCommitBar] = useState(false);
  const [isRetracting, setIsRetracting] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const commitmentProgress = useMotionValue(0);

  const token1Text =
    activeScenario === "abandon" ? "Running a bit" : "Almost there,";
  const token2Text =
    activeScenario === "abandon" ? "late, sorry" : "5 min away";
  const correctionText =
    activeScenario === "simple" ? "see you soon 😊" : "on my way! 🏃";

  const draftingDots =
    phase === "composition" && !showCorrection && !showCommitBar;

  const runSequence = useCallback(
    (scenario: ScenarioId) => {
      setPhase("ambient");
      setShowToken1(false);
      setShowToken2(false);
      setShowCorrection(false);
      setShowCommitBar(false);
      setIsRetracting(false);
      setIsSent(false);
      commitmentProgress.set(0);

      let aborted = false;
      const ids: ReturnType<typeof setTimeout>[] = [];
      const animControls: { stop: () => void }[] = [];
      const defer = (fn: () => void, ms: number) => {
        ids.push(setTimeout(() => { if (!aborted) fn(); }, ms));
      };
      const safeLater = (fn: () => void, ms: number) => {
        ids.push(setTimeout(() => { if (!aborted) fn(); }, ms));
      };
      const cleanup = () => {
        aborted = true;
        ids.forEach(clearTimeout);
        animControls.forEach((c) => c.stop());
      };

      defer(() => setPhase("context"), 2000);
      defer(() => {
        setPhase("composition");
      }, 4500);
      defer(() => setShowToken1(true), 4600);
      defer(() => setShowToken2(true), 5700);

      if (scenario === "simple") {
        defer(() => setShowCorrection(true), 7000);

        defer(() => {
          setShowCommitBar(true);
          setPhase("commitment");
          const c = animate(commitmentProgress, 1, {
            duration: 2.6,
            ease: [0.4, 0, 0.6, 1],
            onComplete: () => {
              safeLater(() => {
                setIsSent(true);
                setPhase("sent");
                safeLater(() => {
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
        defer(() => {
          setShowCommitBar(true);
          setPhase("commitment");
          const c1 = animate(commitmentProgress, 0.4, {
            duration: 1.3,
            ease: [0.4, 0, 0.6, 1],
            onComplete: () => {
              if (aborted) return;
              setIsRetracting(true);
              const c2 = animate(commitmentProgress, 0, {
                duration: 0.75,
                ease: [0.55, 0, 1, 1],
                onComplete: () => {
                  if (aborted) return;
                  setIsRetracting(false);
                  setPhase("composition");
                  setShowCorrection(true);
                  safeLater(() => {
                    setPhase("commitment");
                    const c3 = animate(commitmentProgress, 1, {
                      duration: 2.6,
                      ease: [0.4, 0, 0.6, 1],
                      onComplete: () => {
                        safeLater(() => {
                          setIsSent(true);
                          setPhase("sent");
                          safeLater(() => {
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
        defer(() => {
          setShowCommitBar(true);
          setPhase("commitment");
          const c1 = animate(commitmentProgress, 0.58, {
            duration: 1.9,
            ease: [0.4, 0, 0.6, 1],
            onComplete: () => {
              if (aborted) return;
              setIsRetracting(true);
              const c2 = animate(commitmentProgress, 0, {
                duration: 0.85,
                ease: [0.55, 0, 1, 1],
                onComplete: () => {
                  if (aborted) return;
                  setIsRetracting(false);
                  safeLater(() => {
                    setShowCommitBar(false);
                    setPhase("composition");
                    safeLater(() => {
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
