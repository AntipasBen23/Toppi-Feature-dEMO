import { SeatYieldSettings } from "./types";

const KEY = "toppi_seat_yield_demo_v1";

export type PersistedState = {
  settings: SeatYieldSettings;
  activeActions: Record<string, boolean>;
};

export function loadState(): PersistedState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedState;
  } catch {
    return null;
  }
}

export function saveState(state: PersistedState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}
