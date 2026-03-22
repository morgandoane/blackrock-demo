import { motion } from "framer-motion";

export interface ScenarioOption<T extends string = string> {
  id: T;
  label: string;
}

export default function ScenarioSelector<T extends string>({
  options,
  active,
  onChange,
}: {
  options: ScenarioOption<T>[];
  active: T;
  onChange: (id: T) => void;
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
      {options.map((s) => {
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
