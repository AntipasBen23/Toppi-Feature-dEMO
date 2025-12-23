export type DemoScenarioId = "canal_cafe" | "bistro_oud_west" | "hotel_bar";

export type SeatYieldSettings = {
  currency: "EUR" | "USD" | "GBP";
  capacitySeats: number;
  avgSpendPerSeat: number;
  openHour: number;
  closeHour: number;
  targetDateISO: string;
};

export type ScenarioContext = {
  weather: "Sunny" | "Rainy" | "Windy" | "Snowy";
  localEvent: "None" | "Concert nearby" | "Football match" | "Conference week";
  dayType: "Weekday" | "Weekend";
  reviewVelocity: "Positive" | "Neutral" | "Negative";
};

export type DemoScenario = {
  id: DemoScenarioId;
  name: string;
  city: string;
  context: ScenarioContext;

  // “Historical” signals (fake inputs)
  historicalFillByHour: Record<number, number>; // 0..1
  noShowRate: number; // 0..1
  walkInStrength: number; // 0..1
};

export type SeatRiskBlock = {
  startHour: number;
  endHour: number;
  riskScore: number; // 0..1
  atRiskSeats: number;
  note: string;
};

export type SeatYieldForecast = {
  scenarioId: DemoScenarioId;
  confidenceScore: number; // 0..1
  blocks: SeatRiskBlock[];
  explanations: string[];
};

export type SeatYieldActionType =
  | "Google Profile Boost"
  | "Hyperlocal Offer"
  | "Review Nudge"
  | "Menu Highlight"
  | "Last-Minute Inventory Push";

export type SeatYieldAction = {
  id: string;
  title: string;
  type: SeatYieldActionType;
  window: { startHour: number; endHour: number };
  description: string;
  whyThisWorks: string;
  estimatedCostLabel: string;
  confidence: number; // 0..1
  defaultEnabled: boolean;
  impactHint: {
    seatsRecoveredRange: [number, number];
    fillLiftRange: [number, number]; // 0..1
  };
};

export type ImpactSnapshot = {
  expectedFillRate: number; // 0..1
  expectedRevenue: number;
  expectedNoShows: number;
};

export type SeatYieldImpact = {
  scenarioId: DemoScenarioId;
  baseline: ImpactSnapshot;
  withPlan: ImpactSnapshot;
  delta: {
    fillRateLift: number;
    revenueLift: number;
    seatsRecovered: number;
  };
  explanations: string[];
};
