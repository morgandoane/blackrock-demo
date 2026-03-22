import { Link, useParams } from "react-router-dom";
import { getBciInteractionById } from "../data/bci-interactions.data";
import type { BciInteractionRecord } from "../data/bci-interactions.types";

function InteractionMetaMinimal({ row }: { row: BciInteractionRecord }) {
  const notes = row.notes.trim();
  return (
    <div className="mt-8 border-t border-white/10 pt-6">
      {notes ? (
        <p className="text-sm leading-relaxed text-white/65">{notes}</p>
      ) : null}
      <p className={`font-mono text-[11px] text-white/40 ${notes ? "mt-4" : ""}`}>
        {row.domain} · {row.commitment_mechanism} · {row.tool}
      </p>
      <p className="mt-2 text-xs text-white/45">
        <span className="text-white/30">in</span> {row.context_inputs}
      </p>
      <p className="mt-1 text-xs text-white/45">
        <span className="text-white/30">out</span> {row.composition_output}
      </p>
      <details className="mt-5 group">
        <summary className="cursor-pointer text-xs text-white/35 transition-colors hover:text-white/55">
          Scales (1–10)
        </summary>
        <p className="mt-2 font-mono text-[11px] leading-relaxed text-white/45">
          consequence {row.consequence} · reversibility {row.reversibility} · routineness{" "}
          {row.routineness} · commitment friction {row.commitment_friction} · context richness{" "}
          {row.context_richness} · composition {row.composition_complexity}
        </p>
      </details>
    </div>
  );
}

export default function InteractionDetailPage() {
  const { interactionId } = useParams<{ interactionId: string }>();
  const id = interactionId ?? "";
  const row = id ? getBciInteractionById(id) : undefined;

  if (!row) {
    return (
      <div className="min-h-full bg-[#0C4C2B] px-4 pb-16 pt-6 text-white">
        <div className="mx-auto max-w-2xl">
          <Link
            to="/interactions"
            className="text-sm text-white/60 underline-offset-2 hover:text-white hover:underline"
          >
            ← Back to interactions
          </Link>
          <div className="mt-10 rounded-xl border border-white/10 bg-black/20 px-6 py-12 text-center">
            <h1 className="text-lg font-semibold text-white">Interaction not found</h1>
            <p className="mt-2 text-sm text-white/55">
              There is no interaction with id{" "}
              <code className="rounded bg-white/10 px-1.5 py-0.5 text-white/80">{id || "(empty)"}</code>{" "}
              in this dataset yet.
            </p>
            <p className="mt-4 text-sm text-white/45">
              Return to the chart to pick an action, or add a row to{" "}
              <code className="text-white/60">bci-interactions.csv</code> and run{" "}
              <code className="text-white/60">npm run data:bci</code>.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const hasDemo = row.demo != null;

  return (
    <div className="min-h-full w-full bg-[#0C4C2B] pb-16 pt-6 text-white">
      <div className="w-full max-w-none">
        <div className="px-4 sm:px-6 lg:px-8">
          <Link
            to="/interactions"
            className="text-sm text-white/60 underline-offset-2 hover:text-white hover:underline"
          >
            ← Back to interactions
          </Link>
        </div>

        {hasDemo ? (
          <>
            <div className="mt-5 mb-4 flex flex-wrap items-baseline justify-between gap-3 px-4 sm:px-6 lg:px-8">
              <h1 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
                {row.action}
              </h1>
              <span className="font-mono text-xs text-white/40">{row.tool}</span>
            </div>

            <div className="w-full overflow-hidden border-y border-white/10 bg-[#0a2818] sm:border-x sm:border-white/10">
              {row.demo}
            </div>

            <div className="px-4 sm:px-6 lg:px-8">
              <InteractionMetaMinimal row={row} />
            </div>
          </>
        ) : (
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <header className="mt-6 border-b border-white/10 pb-6">
              <p className="text-xs font-medium uppercase tracking-wide text-white/45">Interaction</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight">{row.action}</h1>
              <p className="mt-2 font-mono text-sm text-white/50">{row.tool}</p>
              <p className="mt-3 text-xs text-white/40">
                <span className="text-white/50">id:</span> {row.id}
              </p>
            </header>

            <InteractionMetaMinimal row={row} />
          </div>
        )}
      </div>
    </div>
  );
}
