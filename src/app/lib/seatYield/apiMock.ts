import { DemoScenarioId, SeatYieldForecast, SeatYieldImpact, SeatYieldSettings, SeatYieldAction } from "./types";
import { computeActions, computeForecast, computeImpact } from "./engine";

// Fake latency so it feels like real APIs
function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function apiGetForecast(params: {
  scenarioId: DemoScenarioId;
  settings: SeatYieldSettings;
}): Promise<SeatYieldForecast> {
  await sleep(250 + Math.random() * 300);
  return computeForecast(params);
}

export async function apiListActions(params: {
  scenarioId: DemoScenarioId;
  settings: SeatYieldSettings;
}): Promise<SeatYieldAction[]> {
  await sleep(200 + Math.random() * 300);
  const forecast = computeForecast({ scenarioId: params.scenarioId, settings: params.settings });
  return computeActions({ scenarioId: params.scenarioId, settings: params.settings, forecast });
}

export async function apiGetImpact(params: {
  scenarioId: DemoScenarioId;
  settings: SeatYieldSettings;
  activeActionIds: string[];
}): Promise<SeatYieldImpact> {
  await sleep(220 + Math.random() * 350);
  const forecast = computeForecast({ scenarioId: params.scenarioId, settings: params.settings });
  const actions = computeActions({ scenarioId: params.scenarioId, settings: params.settings, forecast });
  return computeImpact({
    scenarioId: params.scenarioId,
    settings: params.settings,
    forecast,
    actions,
    activeActionIds: params.activeActionIds,
  });
}
