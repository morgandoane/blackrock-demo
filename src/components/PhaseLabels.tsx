import { motion } from "framer-motion";

export type DisplayPhase = "ambient" | "context" | "composition" | "commitment";

const PHASE_ROWS: { key: DisplayPhase; num: string; label: string }[] = [
  { key: "context", num: "01", label: "Context" },
  { key: "composition", num: "02", label: "Composition" },
  { key: "commitment", num: "03", label: "Commitment" },
];

const ROW_PITCH = 138;
const LINE_H = 84;
const LINE_TOP_OFFSET = (106 - LINE_H) / 2;

export default function PhaseLabels({ phase }: { phase: DisplayPhase }) {
  const activeIdx = PHASE_ROWS.findIndex((r) => r.key === phase);
  const lineActive = activeIdx >= 0;
  const lineY = LINE_TOP_OFFSET + activeIdx * ROW_PITCH;

  return (
    <div style={{ position: "relative", paddingLeft: 36 }}>
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
