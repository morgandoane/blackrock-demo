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
type ScenarioId = "change_pharmacy" | "quick_refill" | "cancel";

const LOOP_GAP_MS = 2500;

const SCENARIO_OPTIONS: { id: ScenarioId; label: string }[] = [
  { id: "change_pharmacy", label: "Change Pharmacy" },
  { id: "quick_refill", label: "Quick Refill" },
  { id: "cancel", label: "Cancel" },
];

const WATCH_OVERLAY = { enabled: true, src: "/watch-overlay.png" };
const WATCH_SCALE = 2;
const SCREEN_CONTENT_SCALE = 0.82;

// ─── Phase types ────────────────────────────────────────────────────────────────
type Phase =
  | "ambient"
  | "context"
  | "composition"
  | "pharmacy_context"
  | "pharmacy_select"
  | "pharmacy_commit"
  | "composition_return"
  | "commitment"
  | "confirmed";

function toDisplayPhase(p: Phase): DisplayPhase {
  switch (p) {
    case "ambient":
      return "ambient";
    case "context":
    case "pharmacy_context":
      return "context";
    case "composition":
    case "pharmacy_select":
    case "composition_return":
      return "composition";
    case "pharmacy_commit":
    case "commitment":
    case "confirmed":
      return "commitment";
  }
}

// ─── Pharmacy data ──────────────────────────────────────────────────────────────
interface PharmacyPin {
  id: string;
  name: string;
  distance: string;
  x: number;
  y: number;
}

const PHARMACIES: PharmacyPin[] = [
  { id: "cvs_main", name: "CVS Main St", distance: "1.2 mi", x: 0.65, y: 0.35 },
  { id: "walgreens", name: "Walgreens Oak", distance: "0.8 mi", x: 0.35, y: 0.55 },
  { id: "cvs_downtown", name: "CVS Downtown", distance: "2.1 mi", x: 0.55, y: 0.75 },
];

const SELECTED_PHARMACY = PHARMACIES[1]; // Walgreens Oak — closest

// ─── Context: Prescription Reminder ─────────────────────────────────────────────
function ReminderScreen({ visible }: { visible: boolean }) {
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
            background: "rgba(46,205,168,0.4)",
          }}
        />
        <span style={{ fontSize: 10, color: "#888", letterSpacing: 0.8, fontWeight: 400 }}>
          prescription
        </span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 8 }}
        transition={{ delay: 0.35, duration: 0.9, ease: "easeOut" }}
        style={{ fontSize: 18, fontWeight: 600, color: "#fff", letterSpacing: -0.5, lineHeight: 1.2, marginBottom: 10 }}
      >
        Lisinopril 10mg
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 6 }}
        transition={{ delay: 0.5, duration: 0.9, ease: "easeOut" }}
        style={{ fontSize: 11, fontWeight: 500, color: "#2ECDA8", letterSpacing: 0.2, marginBottom: 10 }}
      >
        Due for refill
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 6 }}
        transition={{ delay: 0.65, duration: 0.9, ease: "easeOut" }}
        style={{ fontSize: 10, color: "#777", letterSpacing: 0.2, lineHeight: 1.6 }}
      >
        Last filled 28 days ago
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

// ─── Composition: Refill Summary ────────────────────────────────────────────────
interface RefillField {
  label: string;
  value: string;
  checked: boolean;
  highlight?: boolean;
}

function RefillSummaryScreen({
  visible,
  fields,
  pharmacyHighlight,
}: {
  visible: boolean;
  fields: RefillField[];
  pharmacyHighlight: boolean;
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
        style={{ fontSize: 10, color: "#aaa", letterSpacing: 0.8, marginBottom: 14, fontWeight: 400 }}
      >
        refill
      </motion.div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {fields.map((f, i) => {
          const isPharmacy = f.label === "Pharmacy";
          const glow = isPharmacy && pharmacyHighlight;
          return (
            <motion.div
              key={f.label}
              initial={{ opacity: 0, x: -6 }}
              animate={{
                opacity: visible ? 1 : 0,
                x: visible ? 0 : -6,
              }}
              transition={{ delay: 0.15 + i * 0.12, duration: 0.6, ease: "easeOut" }}
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
                  background: f.checked ? "#2ECDA8" : "rgba(255,255,255,0.2)",
                  flexShrink: 0,
                }}
              />
              <motion.div
                animate={
                  glow
                    ? { color: ["#fff", "#2ECDA8", "#fff"], opacity: [1, 0.8, 1] }
                    : { color: "#fff", opacity: 1 }
                }
                transition={
                  glow
                    ? { duration: 2, repeat: Infinity, ease: "easeInOut" }
                    : { duration: 0.3 }
                }
                style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.2 }}
              >
                {f.value}
              </motion.div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ─── Pharmacy Map ───────────────────────────────────────────────────────────────
function PharmacyMapScreen({
  visible,
  selectedId,
  showPins,
}: {
  visible: boolean;
  selectedId: string | null;
  showPins: boolean;
}) {
  return (
    <motion.div
      className="absolute inset-0"
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* Dark map background with street grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "#0A0A0A",
          overflow: "hidden",
          borderRadius: 50,
        }}
      >
        {/* Street grid lines */}
        <svg
          width="100%"
          height="100%"
          style={{ position: "absolute", inset: 0 }}
          viewBox="0 0 200 240"
          preserveAspectRatio="none"
        >
          {[40, 80, 120, 160].map((x) => (
            <line
              key={`v${x}`}
              x1={x}
              y1={0}
              x2={x}
              y2={240}
              stroke="rgba(255,255,255,0.04)"
              strokeWidth={1}
            />
          ))}
          {[50, 100, 150, 200].map((y) => (
            <line
              key={`h${y}`}
              x1={0}
              y1={y}
              x2={200}
              y2={y}
              stroke="rgba(255,255,255,0.04)"
              strokeWidth={1}
            />
          ))}
          {/* Diagonal road */}
          <line x1={20} y1={200} x2={180} y2={40} stroke="rgba(255,255,255,0.06)" strokeWidth={2} />
        </svg>

        {/* Header label */}
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: visible ? 0.4 : 0, y: visible ? 0 : -4 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          style={{
            position: "absolute",
            top: 22,
            left: 0,
            right: 0,
            textAlign: "center",
            fontSize: 9,
            color: "#888",
            letterSpacing: 1,
            textTransform: "uppercase",
          }}
        >
          nearby pharmacies
        </motion.div>

        {/* Pharmacy pins */}
        {showPins &&
          PHARMACIES.map((pin, i) => {
            const isSelected = selectedId === pin.id;
            const isDimmed = selectedId != null && !isSelected;
            return (
              <motion.div
                key={pin.id}
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: isDimmed ? 0.25 : 1,
                  scale: isSelected ? 1.15 : 1,
                }}
                transition={{
                  delay: selectedId ? 0 : 0.4 + i * 0.2,
                  duration: 0.5,
                  ease: [0.34, 1.56, 0.64, 1],
                }}
                style={{
                  position: "absolute",
                  left: `${pin.x * 100}%`,
                  top: `${pin.y * 100}%`,
                  transform: "translate(-50%, -50%)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 3,
                  zIndex: isSelected ? 5 : 1,
                }}
              >
                {/* Pin dot */}
                <div style={{ position: "relative" }}>
                  {isSelected && (
                    <motion.div
                      style={{
                        position: "absolute",
                        inset: -4,
                        borderRadius: "50%",
                        border: "1.5px solid #2ECDA8",
                      }}
                      animate={{ scale: [1, 1.6, 1], opacity: [0.6, 0, 0.6] }}
                      transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                    />
                  )}
                  <div
                    style={{
                      width: isSelected ? 10 : 7,
                      height: isSelected ? 10 : 7,
                      borderRadius: "50%",
                      background: isSelected ? "#2ECDA8" : "rgba(46,205,168,0.6)",
                      transition: "all 0.3s ease",
                    }}
                  />
                </div>
                {/* Label */}
                <div
                  style={{
                    fontSize: isSelected ? 9 : 7,
                    color: isSelected ? "#fff" : "rgba(255,255,255,0.5)",
                    whiteSpace: "nowrap",
                    textAlign: "center",
                    lineHeight: 1.3,
                    transition: "all 0.3s ease",
                  }}
                >
                  <div style={{ fontWeight: isSelected ? 600 : 400 }}>{pin.name}</div>
                  <div style={{ fontSize: 7, color: isSelected ? "#2ECDA8" : "rgba(255,255,255,0.3)" }}>
                    {pin.distance}
                  </div>
                </div>
              </motion.div>
            );
          })}
      </div>
    </motion.div>
  );
}

// ─── Confirmed ──────────────────────────────────────────────────────────────────
function RefillConfirmed({ visible }: { visible: boolean }) {
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
                  border: "1.5px solid #2ECDA8",
                }}
                initial={{ scale: 0.6, opacity: 0.8 }}
                animate={{ scale: 2.2, opacity: 0 }}
                transition={{ duration: 1.1, delay: i * 0.3, ease: "easeOut", repeat: 1 }}
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
                background: "#2ECDA8",
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
            style={{ fontSize: 12, color: "#2ECDA8", fontWeight: 500, letterSpacing: 0.3 }}
          >
            Refill submitted
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────────
export default function PrescriptionPage({ embedded = false }: { embedded?: boolean } = {}) {
  const [phase, setPhase] = useState<Phase>("ambient");
  const [seqKey, setSeqKey] = useState(0);
  const [selectedScenario, setSelectedScenario] = useState<ScenarioId>("change_pharmacy");
  const activeScenario = selectedScenario;

  // Pharmacy sub-flow state
  const [showMapPins, setShowMapPins] = useState(false);
  const [selectedPharmacyId, setSelectedPharmacyId] = useState<string | null>(null);
  const [pharmacyConfirmed, setPharmacyConfirmed] = useState(false);

  // Refill summary fields
  const [pharmacyName, setPharmacyName] = useState("CVS Main St");
  const [pharmacyHighlight, setPharmacyHighlight] = useState(false);

  // Commitment bars
  const [showPharmacyBar, setShowPharmacyBar] = useState(false);
  const [pharmacyBarSent, setPharmacyBarSent] = useState(false);
  const pharmacyProgress = useMotionValue(0);

  const [showMainBar, setShowMainBar] = useState(false);
  const [mainBarSent, setMainBarSent] = useState(false);
  const [isRetracting, setIsRetracting] = useState(false);
  const mainProgress = useMotionValue(0);

  const refillFields: RefillField[] = [
    { label: "Medication", value: "Lisinopril 10mg", checked: true },
    { label: "Pharmacy", value: pharmacyName, checked: pharmacyConfirmed, highlight: pharmacyHighlight },
    { label: "Insurance", value: "Applied", checked: true },
  ];

  // Determine which watch screen layers to show
  const showAmbient = phase === "ambient";
  const showContext = phase === "context";
  const showRefillSummary = [
    "composition", "composition_return", "commitment", "confirmed",
  ].includes(phase);
  const showMap = ["pharmacy_context", "pharmacy_select", "pharmacy_commit"].includes(phase);
  const showPharmacyCommitBar = phase === "pharmacy_commit" && showPharmacyBar;
  const showMainCommitBar = (phase === "commitment" || phase === "confirmed") && showMainBar;
  const showConfirmed = phase === "confirmed";

  const runSequence = useCallback(
    (scenario: ScenarioId) => {
      // Reset
      setPhase("ambient");
      setShowMapPins(false);
      setSelectedPharmacyId(null);
      setPharmacyConfirmed(false);
      setPharmacyName("CVS Main St");
      setPharmacyHighlight(false);
      setShowPharmacyBar(false);
      setPharmacyBarSent(false);
      pharmacyProgress.set(0);
      setShowMainBar(false);
      setMainBarSent(false);
      setIsRetracting(false);
      mainProgress.set(0);

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

      // ── Shared opening: ambient → context → composition ──
      defer(() => setPhase("context"), 2000);
      defer(() => setPhase("composition"), 4800);
      defer(() => setPharmacyHighlight(true), 5800);

      if (scenario === "change_pharmacy") {
        // Pharmacy sub-flow
        defer(() => {
          setPharmacyHighlight(false);
          setPhase("pharmacy_context");
        }, 7200);
        defer(() => setShowMapPins(true), 7600);

        // Select pharmacy
        defer(() => {
          setSelectedPharmacyId(SELECTED_PHARMACY.id);
          setPhase("pharmacy_select");
        }, 9200);

        // Pharmacy commitment (standard focus_bar)
        defer(() => {
          setPhase("pharmacy_commit");
          setShowPharmacyBar(true);
          const c = animate(pharmacyProgress, 1, {
            duration: 1.8,
            ease: [0.4, 0, 0.6, 1],
            onComplete: () => {
              safeLater(() => {
                setPharmacyBarSent(true);
                safeLater(() => {
                  setShowPharmacyBar(false);
                  setPharmacyBarSent(false);
                  pharmacyProgress.set(0);
                  setPharmacyConfirmed(true);
                  setPharmacyName("Walgreens Oak");
                  setShowMapPins(false);
                  setSelectedPharmacyId(null);
                  setPhase("composition_return");
                  setPharmacyHighlight(true);

                  safeLater(() => {
                    setPharmacyHighlight(false);
                    setPhase("commitment");
                    setShowMainBar(true);
                    const c2 = animate(mainProgress, 0.68, {
                      duration: 2.8,
                      ease: [0.4, 0, 0.6, 1],
                      onComplete: () => {
                        safeLater(() => {
                          const c3 = animate(mainProgress, 1, {
                            duration: 1.8,
                            ease: [0.3, 0, 0.5, 1],
                            onComplete: () => {
                              safeLater(() => {
                                setMainBarSent(true);
                                setPhase("confirmed");
                                safeLater(() => {
                                  setPhase("ambient");
                                  setShowMainBar(false);
                                  setMainBarSent(false);
                                  mainProgress.set(0);
                                  defer(() => setSeqKey((k) => k + 1), LOOP_GAP_MS);
                                }, 3000);
                              }, 300);
                            },
                          });
                          animControls.push(c3);
                        }, 1600);
                      },
                    });
                    animControls.push(c2);
                  }, 1800);
                }, 500);
              }, 250);
            },
          });
          animControls.push(c);
        }, 10400);
      }

      if (scenario === "quick_refill") {
        defer(() => {
          setPharmacyHighlight(false);
          setPharmacyConfirmed(true);
          setPhase("commitment");
          setShowMainBar(true);
          const c1 = animate(mainProgress, 0.68, {
            duration: 2.8,
            ease: [0.4, 0, 0.6, 1],
            onComplete: () => {
              safeLater(() => {
                const c2 = animate(mainProgress, 1, {
                  duration: 1.8,
                  ease: [0.3, 0, 0.5, 1],
                  onComplete: () => {
                    safeLater(() => {
                      setMainBarSent(true);
                      setPhase("confirmed");
                      safeLater(() => {
                        setPhase("ambient");
                        setShowMainBar(false);
                        setMainBarSent(false);
                        mainProgress.set(0);
                        defer(() => setSeqKey((k) => k + 1), LOOP_GAP_MS);
                      }, 3000);
                    }, 300);
                  },
                });
                animControls.push(c2);
              }, 1600);
            },
          });
          animControls.push(c1);
        }, 7800);
      }

      if (scenario === "cancel") {
        defer(() => {
          setPharmacyHighlight(false);
          setPharmacyConfirmed(true);
          setPhase("commitment");
          setShowMainBar(true);
          const c1 = animate(mainProgress, 0.64, {
            duration: 2.5,
            ease: [0.4, 0, 0.6, 1],
            onComplete: () => {
              if (aborted) return;
              setIsRetracting(true);
              const c2 = animate(mainProgress, 0, {
                duration: 1.1,
                ease: [0.55, 0, 1, 1],
                onComplete: () => {
                  if (aborted) return;
                  setIsRetracting(false);
                  safeLater(() => {
                    setShowMainBar(false);
                    setPhase("composition");
                    safeLater(() => {
                      setPhase("ambient");
                      mainProgress.set(0);
                      defer(() => setSeqKey((k) => k + 1), LOOP_GAP_MS);
                    }, 1400);
                  }, 600);
                },
              });
              animControls.push(c2);
            },
          });
          animControls.push(c1);
        }, 7800);
      }

      return cleanup;
    },
    [pharmacyProgress, mainProgress, setSeqKey],
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
        <PhaseLabels phase={toDisplayPhase(phase)} />
        <div style={{ marginTop: 80, paddingLeft: 36 }}>
          <ScenarioSelector
            options={SCENARIO_OPTIONS}
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
            <WatchFrame hideBezel={WATCH_OVERLAY.enabled} contentScale={SCREEN_CONTENT_SCALE}>
              <ClockFace visible={showAmbient} />

              <AnimatePresence mode="wait">
                {showContext && (
                  <motion.div
                    key="rx-ctx"
                    style={{ position: "absolute", inset: 0 }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.45 }}
                  >
                    <ReminderScreen visible />
                  </motion.div>
                )}
                {showRefillSummary && !showConfirmed && (
                  <motion.div
                    key="rx-summary"
                    style={{ position: "absolute", inset: 0 }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.45 }}
                  >
                    <RefillSummaryScreen
                      visible
                      fields={refillFields}
                      pharmacyHighlight={pharmacyHighlight}
                    />
                  </motion.div>
                )}
                {showMap && (
                  <motion.div
                    key="rx-map"
                    style={{ position: "absolute", inset: 0 }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.45 }}
                  >
                    <PharmacyMapScreen
                      visible
                      selectedId={selectedPharmacyId}
                      showPins={showMapPins}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <CommitmentBar
                variant="focus_bar"
                progress={pharmacyProgress}
                visible={showPharmacyCommitBar}
                isSent={pharmacyBarSent}
                isRetracting={false}
                label="focus to select"
              />

              <CommitmentBar
                variant="focus_bar_extended"
                progress={mainProgress}
                visible={showMainCommitBar}
                isSent={mainBarSent}
                isRetracting={isRetracting}
                label="focus to verify"
                checkpoint={0.68}
                checkpointDotPosition={0.5}
                checkpointLabel="hold to confirm"
              />

              <RefillConfirmed visible={showConfirmed} />
            </WatchFrame>
          </div>

          <WatchOverlayLayer src={WATCH_OVERLAY.src} enabled={WATCH_OVERLAY.enabled} />
        </div>
      </div>
    </div>
  );
}
