import type { ConfirmState } from "./types";

// The safety gate: every suggested slot confirmed by a tap, and the paper comparison ticked.
export function canMakePlan(state: ConfirmState): boolean {
  return state.compared && state.rows.every((r) => r.schedule.status !== "suggested" || r.confirmed);
}
