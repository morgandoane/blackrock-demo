import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { BCI_INTERACTIONS } from "../data/bci-interactions.data";
import type { BciInteractionRecord, BciNumericField } from "../data/bci-interactions.types";

const BCI_DATA = BCI_INTERACTIONS;

const NUM_FIELDS: { key: BciNumericField; label: string }[] = [
  { key: "consequence", label: "Consequence" },
  { key: "reversibility", label: "Reversibility" },
  { key: "routineness", label: "Routineness" },
  { key: "commitment_friction", label: "Commitment friction" },
  { key: "context_richness", label: "Context richness" },
  { key: "composition_complexity", label: "Composition complexity" },
];

const PALETTE = [
  "#7dd3c0",
  "#f5d76e",
  "#e8a0bf",
  "#a8d5e2",
  "#c4b5fd",
  "#fca5a5",
  "#86efac",
  "#fcd34d",
  "#f9a8d4",
  "#93c5fd",
];

type ChartRow = BciInteractionRecord & { x: number; y: number; z: number };

type ColorMode = "domain" | "commitment_mechanism";

function useCategoryColors(rows: BciInteractionRecord[], mode: ColorMode) {
  return useMemo(() => {
    const keys = [...new Set(rows.map((r) => r[mode]))].sort();
    const map: Record<string, string> = {};
    keys.forEach((k, i) => {
      map[k] = PALETTE[i % PALETTE.length]!;
    });
    return { keys, map };
  }, [rows, mode]);
}

type BciTooltipProps = {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: ChartRow }>;
  xLabel: string;
  yLabel: string;
  sizeLabel: string;
};

function BciTooltip({ active, payload, xLabel, yLabel, sizeLabel }: BciTooltipProps) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload as ChartRow | undefined;
  if (!row) return null;
  return (
    <div className="max-w-sm rounded-lg border border-white/15 bg-[#0a3220] px-3 py-2.5 text-left text-sm shadow-xl ring-1 ring-black/20">
      <p className="font-semibold text-white">{row.action}</p>
      <p className="mt-0.5 text-xs text-white/55">{row.tool}</p>
      <dl className="mt-2 space-y-1 text-xs text-white/85">
        <div className="flex justify-between gap-4">
          <dt className="text-white/50">{xLabel}</dt>
          <dd>{row.x}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-white/50">{yLabel}</dt>
          <dd>{row.y}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-white/50">{sizeLabel}</dt>
          <dd>{row.z}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-white/50">Domain</dt>
          <dd className="text-right">{row.domain}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-white/50">Mechanism</dt>
          <dd className="text-right">{row.commitment_mechanism}</dd>
        </div>
      </dl>
      {row.notes ? (
        <p className="mt-2 border-t border-white/10 pt-2 text-xs leading-snug text-white/65 line-clamp-3">
          {row.notes}
        </p>
      ) : null}
      <p className="mt-2 text-[11px] text-white/40">Click to open detail page</p>
    </div>
  );
}

export default function InteractionsPage() {
  const navigate = useNavigate();
  const [xKey, setXKey] = useState<BciNumericField>("consequence");
  const [yKey, setYKey] = useState<BciNumericField>("reversibility");
  const [sizeKey, setSizeKey] = useState<BciNumericField>("commitment_friction");
  const [colorMode, setColorMode] = useState<ColorMode>("domain");

  const allDomains = useMemo(
    () => [...new Set(BCI_DATA.map((r) => r.domain))].sort(),
    []
  );
  const allMechanisms = useMemo(
    () => [...new Set(BCI_DATA.map((r) => r.commitment_mechanism))].sort(),
    []
  );

  /** Empty = show all (All chip active). Non-empty = only rows in these sets. */
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [selectedMechanisms, setSelectedMechanisms] = useState<string[]>([]);

  const filtered = useMemo(
    () =>
      BCI_DATA.filter(
        (r) =>
          (!selectedDomains.length || selectedDomains.includes(r.domain)) &&
          (!selectedMechanisms.length || selectedMechanisms.includes(r.commitment_mechanism))
      ),
    [selectedDomains, selectedMechanisms]
  );

  const { map: colorMap } = useCategoryColors(filtered, colorMode);

  const chartRows: ChartRow[] = useMemo(
    () =>
      filtered.map((r) => ({
        ...r,
        x: r[xKey],
        y: r[yKey],
        z: r[sizeKey],
      })),
    [filtered, xKey, yKey, sizeKey]
  );

  const xLabel = NUM_FIELDS.find((f) => f.key === xKey)?.label ?? xKey;
  const yLabel = NUM_FIELDS.find((f) => f.key === yKey)?.label ?? yKey;
  const sizeLabel = NUM_FIELDS.find((f) => f.key === sizeKey)?.label ?? sizeKey;

  const handleScatterClick = useCallback(
    (item: unknown) => {
      const payload = (item as { payload?: ChartRow }).payload;
      if (payload?.id) navigate(`/interactions/${payload.id}`);
    },
    [navigate]
  );

  const toggleDomain = (d: string) => {
    setSelectedDomains((prev) => {
      if (prev.length === 0) return [d];
      if (prev.includes(d)) return prev.filter((x) => x !== d);
      return [...prev, d];
    });
  };
  const toggleMechanism = (m: string) => {
    setSelectedMechanisms((prev) => {
      if (prev.length === 0) return [m];
      if (prev.includes(m)) return prev.filter((x) => x !== m);
      return [...prev, m];
    });
  };

  const chipActive = "border-white/25 bg-white/10 text-white";
  const chipNeutral = "border-white/10 bg-black/20 text-white/60";
  const chipExcluded = "border-white/10 bg-black/20 text-white/35 line-through";

  return (
    <div className="min-h-full bg-[#0C4C2B] px-4 pb-16 pt-6 text-white">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-white">Explore actions</h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/70">
            The BCI is in charge of intent—the watch is mainly where that intent meets you: a small
            interface and a library of apps and actions. Each dot is one action type; set the menus,
            then tap for detail.
          </p>
        </header>

        <div className="mb-6 flex flex-wrap items-end gap-4 rounded-xl border border-white/10 bg-black/15 p-4">
          <label className="flex flex-col gap-1 text-xs font-medium text-white/60">
            Horizontal axis
            <select
              className="rounded-md border border-white/15 bg-[#0a3220] px-2 py-1.5 text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-white/30"
              value={xKey}
              onChange={(e) => setXKey(e.target.value as BciNumericField)}
            >
              {NUM_FIELDS.map((f) => (
                <option key={f.key} value={f.key}>
                  {f.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-white/60">
            Vertical axis
            <select
              className="rounded-md border border-white/15 bg-[#0a3220] px-2 py-1.5 text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-white/30"
              value={yKey}
              onChange={(e) => setYKey(e.target.value as BciNumericField)}
            >
              {NUM_FIELDS.map((f) => (
                <option key={f.key} value={f.key}>
                  {f.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-white/60">
            Bubble size
            <select
              className="rounded-md border border-white/15 bg-[#0a3220] px-2 py-1.5 text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-white/30"
              value={sizeKey}
              onChange={(e) => setSizeKey(e.target.value as BciNumericField)}
            >
              {NUM_FIELDS.map((f) => (
                <option key={f.key} value={f.key}>
                  {f.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-white/60">
            Point color
            <select
              className="rounded-md border border-white/15 bg-[#0a3220] px-2 py-1.5 text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-white/30"
              value={colorMode}
              onChange={(e) => setColorMode(e.target.value as ColorMode)}
            >
              <option value="domain">Domain</option>
              <option value="commitment_mechanism">Commitment mechanism</option>
            </select>
          </label>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_minmax(260px,320px)]">
          <section className="rounded-xl border border-white/10 bg-black/20 p-4 shadow-inner">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h2 className="text-sm font-medium text-white/90">Chart</h2>
              <span className="text-xs text-white/45">Further right or up = higher on that measure</span>
            </div>
            <div className="h-[480px] w-full min-w-0">
              {chartRows.length === 0 ? (
                <p className="flex h-full items-center justify-center text-sm text-white/50">
                  No rows match the current filters.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart
                    data={chartRows}
                    margin={{ top: 16, right: 16, bottom: 48, left: 16 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                    <XAxis
                      type="number"
                      dataKey="x"
                      name={xLabel}
                      domain={[0.5, 10.5]}
                      ticks={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
                      stroke="rgba(255,255,255,0.35)"
                      tick={{ fill: "rgba(255,255,255,0.65)", fontSize: 11 }}
                      label={{
                        value: xLabel,
                        position: "bottom",
                        offset: 28,
                        fill: "rgba(255,255,255,0.75)",
                        fontSize: 12,
                      }}
                    />
                    <YAxis
                      type="number"
                      dataKey="y"
                      name={yLabel}
                      domain={[0.5, 10.5]}
                      ticks={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
                      stroke="rgba(255,255,255,0.35)"
                      tick={{ fill: "rgba(255,255,255,0.65)", fontSize: 11 }}
                      label={{
                        value: yLabel,
                        angle: -90,
                        position: "insideLeft",
                        fill: "rgba(255,255,255,0.75)",
                        fontSize: 12,
                      }}
                    />
                    <ZAxis type="number" dataKey="z" domain={[1, 10]} range={[56, 220]} name={sizeLabel} />
                    <Tooltip
                      cursor={{ strokeDasharray: "3 3", stroke: "rgba(255,255,255,0.25)" }}
                      content={
                        <BciTooltip xLabel={xLabel} yLabel={yLabel} sizeLabel={sizeLabel} />
                      }
                    />
                    <Scatter
                      name="Actions"
                      data={chartRows}
                      fill="#8884d8"
                      onClick={handleScatterClick}
                    >
                      {chartRows.map((row) => (
                        <Cell
                          key={row.id}
                          fill={colorMap[row[colorMode]] ?? "#94a3b8"}
                          stroke="rgba(0,0,0,0.35)"
                          strokeWidth={1}
                        />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              )}
            </div>
            <p className="mt-2 text-center text-xs text-white/45">
              Larger bubbles score higher on {sizeLabel.toLowerCase()}. Hover for a quick readout;
              click to open the full page.
            </p>
          </section>

          <aside className="flex flex-col gap-6">
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/45">
                Legend ({colorMode === "domain" ? "domain" : "commitment mechanism"})
              </h3>
              <ul className="flex flex-col gap-1.5">
                {Object.entries(colorMap).map(([k, c]) => (
                  <li key={k} className="flex items-center gap-2 text-sm text-white/85">
                    <span
                      className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: c }}
                    />
                    <span className="break-all">{k}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/45">
                Filter by domain
              </h3>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedDomains([])}
                  className={[
                    "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                    selectedDomains.length === 0 ? chipActive : chipNeutral,
                  ].join(" ")}
                >
                  All
                </button>
                {allDomains.map((d) => {
                  const allMode = selectedDomains.length === 0;
                  const inSet = selectedDomains.includes(d);
                  const cls =
                    allMode ? chipNeutral : inSet ? chipActive : chipExcluded;
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => toggleDomain(d)}
                      className={[
                        "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                        cls,
                      ].join(" ")}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/45">
                Filter by commitment mechanism
              </h3>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedMechanisms([])}
                  className={[
                    "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                    selectedMechanisms.length === 0 ? chipActive : chipNeutral,
                  ].join(" ")}
                >
                  All
                </button>
                {allMechanisms.map((m) => {
                  const allMode = selectedMechanisms.length === 0;
                  const inSet = selectedMechanisms.includes(m);
                  const cls =
                    allMode ? chipNeutral : inSet ? chipActive : chipExcluded;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => toggleMechanism(m)}
                      className={[
                        "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                        cls,
                      ].join(" ")}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/15 p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-white/45">
                Detail pages
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-white/55">
                Click any bubble in the chart to navigate to a dedicated page for that interaction
                (URL includes its stable id).
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
