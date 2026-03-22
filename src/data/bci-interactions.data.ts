import raw from "./bci-interactions.json";
import { INTERACTION_DEMO_BY_ID } from "./bci-interaction-demos";
import type { BciInteraction, BciInteractionRecord } from "./bci-interactions.types";

export const BCI_INTERACTIONS: BciInteractionRecord[] = (raw as BciInteraction[]).map(
  (row) => ({
    ...row,
    demo: INTERACTION_DEMO_BY_ID[row.id] ?? null,
  })
);

export function getBciInteractionById(id: string): BciInteractionRecord | undefined {
  return BCI_INTERACTIONS.find((r) => r.id === id);
}
