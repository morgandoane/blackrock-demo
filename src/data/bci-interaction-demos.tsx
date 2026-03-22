import type { ReactNode } from "react";
import MessagingPage from "../pages/MessagingPage";
import PrescriptionPage from "../pages/PrescriptionPage";

/**
 * Optional embedded demos keyed by interaction `id` (see `bci-interactions.json`).
 * Use `null` / omit for interactions with no demo; add JSX here when a route should show UI.
 */
export const INTERACTION_DEMO_BY_ID: Partial<Record<string, ReactNode>> = {
  "send-a-text-message": <MessagingPage embedded />,
  "refill-a-prescription": <PrescriptionPage embedded />,
};
