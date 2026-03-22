import type { ReactNode } from "react";

export type BciNumericField =
  | "consequence"
  | "reversibility"
  | "routineness"
  | "commitment_friction"
  | "context_richness"
  | "composition_complexity";

export interface BciInteraction {
  /** URL segment for `/interactions/:id` */
  id: string;
  action: string;
  tool: string;
  domain: string;
  consequence: number;
  reversibility: number;
  routineness: number;
  commitment_friction: number;
  context_richness: number;
  composition_complexity: number;
  commitment_mechanism: string;
  context_inputs: string;
  composition_output: string;
  notes: string;
}

/** Runtime interaction: CSV/JSON fields plus an optional in-app demo (not serializable). */
export interface BciInteractionRecord extends BciInteraction {
  demo: ReactNode | null;
}
