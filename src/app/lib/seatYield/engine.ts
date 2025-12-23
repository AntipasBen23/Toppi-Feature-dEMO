import { DEMO_SCENARIOS } from "./demoData";
import {
  DemoScenarioId,
  SeatRiskBlock,
  SeatYieldAction,
  SeatYieldForecast,
  SeatYieldImpact,
  SeatYieldSettings,
} from "./types";
import { clamp } from "./utils";

function scenarioMultiplier(scenarioId: DemoScenarioId) {
  const s = DEMO_SCENARIOS[scenarioId];
  // crude signal mixing (good enough for a believable prototype)
  let m = 1;

  if (s.context.weather === "Rainy") m += 0.08;
  if (s.context.weather === "Sunny") m -= 0.05;

  if (s.context.localEvent === "Concert nearby") m += 0.06;
  if (s.context.localEvent === "Conference week") m += 0.04;

  if (s.context.reviewVelocity === "Negative") m += 0.07;
  if (s.context.reviewVelocity === "Positive") m -= 0.04;

  return clamp(m, 0.85, 1.2);
}

export function computeForecast(params: {
  scenarioId: DemoScenarioId;
  settings: SeatYieldSettings;
}): SeatYieldForecast {
  const { scenarioId, settings } = params;
  const s = DEMO_SCENARIOS[scenarioId];

  const mult = scenarioMultiplier(scenarioId);
  const blocks: SeatRiskBlock[] = [];

  for (let h = settings.openHour; h < settings.closeHour; h++) {
    const histFill = s.historicalFillByHour[h] ?? 0.35;

    // risk is inverse of fill, plus no-show and event/weather multipliers
    const baseRisk = (1 - histFill) * 0.85 + s.noShowRate * 0.35;
    const riskScore = clamp(baseRisk * mult, 0.05, 0.98);

    const expectedFill = clamp(1 - riskScore, 0, 1);
    const expectedSeatsSold = Math.round(expectedFill * settings.capacitySeats);
    const atRiskSeats = clamp(settings.capacitySeats - expectedSeatsSold, 0, settings.capacitySeats);

    blocks.push({
      startHour: h,
      endHour: h + 1,
      riskScore,
      atRiskSeats,
      note:
        riskScore >= 0.7
          ? "High risk: low historic demand + current conditions"
          : riskScore >= 0.4
          ? "Medium risk: moderate demand, monitor + light activation"
          : "Low risk: demand likely to absorb remaining capacity",
    });
  }

  // confidence: based on signal “stability”
  const confidenceScore = clamp(0.68 + (s.context.reviewVelocity === "Negative" ? -0.06 : 0.04), 0.55, 0.82);

  const explanations = [
    `Historical by-hour fill pattern for this venue type (simulated).`,
    `Adjusted by weather (${s.context.weather}) and local context (${s.context.localEvent}).`,
    `No-show rate baseline applied (${Math.round(s.noShowRate * 100)}%).`,
    `Walk-in strength affects late-hour risk (${Math.round(s.walkInStrength * 100)}%).`,
  ];

  return { scenarioId, confidenceScore, blocks, explanations };
}

export function computeActions(params: {
  scenarioId: DemoScenarioId;
  settings: SeatYieldSettings;
  forecast: SeatYieldForecast;
}): SeatYieldAction[] {
  const { scenarioId, settings, forecast } = params;

  // Pick top 2–3 risky windows
  const top = forecast.blocks
    .slice()
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 3)
    .sort((a, b) => a.startHour - b.startHour);

  const actions: SeatYieldAction[] = [];

  top.forEach((b, idx) => {
    const idBase = `${scenarioId}_${b.startHour}_${idx}`;

    actions.push({
      id: `${idBase}_gbp_boost`,
      title: "Google Profile Boost (micro-update)",
      type: "Google Profile Boost",
      window: { startHour: b.startHour, endHour: b.endHour },
      description:
        "Publish a small Google Business Profile update that increases local visibility during the at-risk window (e.g., fresh photo + short post).",
      whyThisWorks:
        "GBP recency and engagement can influence local pack visibility. A lightweight update is often enough to nudge discovery without discounting.",
      estimatedCostLabel: "Low (owner time or automated)",
      confidence: clamp(0.64 + (b.riskScore - 0.5) * 0.2, 0.45, 0.82),
      defaultEnabled: idx === 0,
      impactHint: {
        seatsRecoveredRange: [1, Math.max(2, Math.round(b.atRiskSeats * 0.25))],
        fillLiftRange: [0.02, 0.06],
      },
    });

    actions.push({
      id: `${idBase}_hyper_offer`,
      title: "Hyperlocal Offer (tight window)",
      type: "Hyperlocal Offer",
      window: { startHour: b.startHour, endHour: b.endHour },
      description:
        "Target first-time diners within a short radius with a time-boxed offer (no blanket discounts; limited inventory).",
      whyThisWorks:
        "It shifts a small number of undecided locals into the at-risk window without training your entire customer base to wait for discounts.",
      estimatedCostLabel: "Medium (controlled incentives)",
      confidence: clamp(0.58 + (b.riskScore - 0.5) * 0.25, 0.40, 0.78),
      defaultEnabled: idx === 0,
      impactHint: {
        seatsRecoveredRange: [2, Math.max(3, Math.round(b.atRiskSeats * 0.35))],
        fillLiftRange: [0.03, 0.09],
      },
    });

    // Add a “no discount” lever
    actions.push({
      id: `${idBase}_menu_highlight`,
      title: "Menu Highlight (high-margin push)",
      type: "Menu Highlight",
      window: { startHour: b.startHour, endHour: b.endHour },
      description:
        "Promote a high-margin item and a simple story (seasonal, signature, chef’s pick) during the at-risk period.",
      whyThisWorks:
        "You keep margins healthy while creating a compelling reason to visit now (not later).",
      estimatedCostLabel: "Low",
      confidence: clamp(0.60 + (b.riskScore - 0.5) * 0.15, 0.42, 0.76),
      defaultEnabled: idx === 1,
      impactHint: {
        seatsRecoveredRange: [1, Math.max(2, Math.round(b.atRiskSeats * 0.18))],
        fillLiftRange: [0.01, 0.05],
      },
    });
  });

  // De-duplicate by action type+window (in case)
  const seen = new Set<string>();
  return actions.filter((a) => {
    const k = `${a.type}_${a.window.startHour}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

export function computeImpact(params: {
  scenarioId: DemoScenarioId;
  settings: SeatYieldSettings;
  forecast: SeatYieldForecast;
  actions: SeatYieldAction[];
  activeActionIds: string[];
}): SeatYieldImpact {
  const { scenarioId, settings, forecast, actions, activeActionIds } = params;
  const scenario = DEMO_SCENARIOS[scenarioId];

  const baselineFill = averageExpectedFill(forecast, settings);
  const baselineNoShows = Math.round(settings.capacitySeats * scenario.noShowRate);
  const baselineRevenue = Math.round(baselineFill * settings.capacitySeats * settings.avgSpendPerSeat);

  // Apply active actions with diminishing returns
  let lift = 0;
  let seatsRecovered = 0;

  const active = actions.filter((a) => activeActionIds.includes(a.id));

  for (const a of active) {
    const block = forecast.blocks.find((b) => b.startHour === a.window.startHour);
    if (!block) continue;

    const riskFactor = clamp(block.riskScore, 0.2, 0.95);
    const base = (a.impactHint.fillLiftRange[0] + a.impactHint.fillLiftRange[1]) / 2;

    // diminishing returns: each extra action adds less
    const dim = 1 / (1 + lift * 6);
    const add = base * riskFactor * dim;

    lift += add;

    const recSeats = Math.round(
      clamp(((a.impactHint.seatsRecoveredRange[0] + a.impactHint.seatsRecoveredRange[1]) / 2) * dim, 0, settings.capacitySeats)
    );

    seatsRecovered += recSeats;
  }

  const withPlanFill = clamp(baselineFill + lift, 0, 0.98);
  const withPlanNoShows = Math.max(0, baselineNoShows - Math.round(active.length * 0.2));
  const withPlanRevenue = Math.round(withPlanFill * settings.capacitySeats * settings.avgSpendPerSeat);

  const explanations = [
    "Baseline revenue = expected fill × capacity × avg spend per seat (simulated).",
    "Actions add a constrained fill-rate lift with diminishing returns (prevents ‘magic’ results).",
    "Lift is weighted by risk in the targeted time window (higher risk = more upside).",
    "No-shows are slightly reduced when actions improve confirmation/intent (lightweight assumption).",
  ];

  return {
    scenarioId,
    baseline: {
      expectedFillRate: baselineFill,
      expectedRevenue: baselineRevenue,
      expectedNoShows: baselineNoShows,
    },
    withPlan: {
      expectedFillRate: withPlanFill,
      expectedRevenue: withPlanRevenue,
      expectedNoShows: withPlanNoShows,
    },
    delta: {
      fillRateLift: clamp(withPlanFill - baselineFill, 0, 1),
      revenueLift: Math.max(0, withPlanRevenue - baselineRevenue),
      seatsRecovered: Math.max(0, seatsRecovered),
    },
    explanations,
  };
}

function averageExpectedFill(forecast: SeatYieldForecast, settings: SeatYieldSettings) {
  if (forecast.blocks.length === 0) return 0.5;

  // Weighted by “important hours”: dinner hours count more
  let wSum = 0;
  let vSum = 0;

  for (const b of forecast.blocks) {
    const hour = b.startHour;
    const expectedFill = clamp(1 - b.riskScore, 0, 1);

    const dinnerWeight = hour >= 18 && hour <= 21 ? 1.6 : hour >= 12 && hour <= 14 ? 1.2 : 1.0;
    const within = hour >= settings.openHour && hour < settings.closeHour ? 1 : 0;

    const w = dinnerWeight * within;
    wSum += w;
    vSum += expectedFill * w;
  }

  return clamp(vSum / Math.max(1e-6, wSum), 0.05, 0.95);
}
