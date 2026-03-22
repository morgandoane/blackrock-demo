import { motion } from "framer-motion";

export default function ClockFace({ visible }: { visible: boolean }) {
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
