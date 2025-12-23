"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";
import { Toggle } from "./ui/Toggle";
import { Select } from "./ui/Select";
import { StatPill } from "./ui/StatPill";
import { Divider } from "./ui/Divider";
import { TimelineHeatmap } from "./charts/TimelineHeatmap";
import { MiniBarChart } from "./charts/MiniBarChart";

import {
  DemoScenarioId,
  SeatYieldAction,
  SeatYieldForecast,
  SeatYieldImpact,
  SeatYieldSettings,
} from "../lib/seatYield/types";
import { DEMO_SCENARIOS } from "../lib/seatYield/demoData";
import { apiGetForecast, apiGetImpact, apiListActions } from "../lib/seatYield/apiMock";
import { loadState, saveState } from "../lib/seatYield/storage";
import { formatCurrency, formatPct, humanTime } from "../lib/seatYield/utils";

type View = "radar" | "actions" | "impact";

export default function FeatureShell() {
  const [view, setView] = useState<View>("radar");
  const [scenarioId, setScenarioId] = useState<DemoScenarioId>("canal_cafe");
  const [loading, setLoading] = useState(false);

  const [settings, setSettings] = useState<SeatYieldSettings>(() => {
    const s = loadState();
    return (
      s?.settings ?? {
        currency: "EUR",
        capacitySeats: 40,
        avgSpendPerSeat: 42,
        openHour: 12,
        closeHour: 23,
        targetDateISO: new Date().toISOString().slice(0, 10),
      }
    );
  });

  const [forecast, setForecast] = useState<SeatYieldForecast | null>(null);
  const [actions, setActions] = useState<SeatYieldAction[]>([]);
  const [activeActions, setActiveActions] = useState<Record<string, boolean>>(
    () => loadState()?.activeActions ?? {}
  );
  const [impact, setImpact] = useState<SeatYieldImpact | null>(null);

  const scenario = useMemo(() => DEMO_SCENARIOS[scenarioId], [scenarioId]);

  useEffect(() => {
    saveState({ settings, activeActions });
  }, [settings, activeActions]);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      setLoading(true);
      try {
        const [f, a] = await Promise.all([
          apiGetForecast({ scenarioId, settings }),
          apiListActions({ scenarioId, settings }),
        ]);
        if (cancelled) return;

        setForecast(f);
        setActions(a);

        setActiveActions((prev) => {
          const next = { ...prev };
          for (const act of a) if (next[act.id] === undefined) next[act.id] = act.defaultEnabled;
          return next;
        });

        const imp = await apiGetImpact({
          scenarioId,
          settings,
          activeActionIds: Object.entries(activeActions).filter(([, on]) => on).map(([id]) => id),
        });
        if (!cancelled) setImpact(imp);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenarioId]);

  useEffect(() => {
    let cancelled = false;

    async function recompute() {
      if (!forecast || actions.length === 0) return;
      setLoading(true);
      try {
        const imp = await apiGetImpact({
          scenarioId,
          settings,
          activeActionIds: Object.entries(activeActions).filter(([, on]) => on).map(([id]) => id),
        });
        if (!cancelled) setImpact(imp);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    recompute();
    return () => {
      cancelled = true;
    };
  }, [activeActions, settings, scenarioId, forecast, actions.length]);

  const summary = useMemo(() => {
    if (!forecast) return null;
    const atRiskSeats = forecast.blocks.reduce((sum, b) => sum + b.atRiskSeats, 0);
    const confidence = Math.round((forecast.confidenceScore ?? 0.72) * 100);
    return { atRiskSeats, confidence };
  }, [forecast]);

  const activeCount = useMemo(() => Object.values(activeActions).filter(Boolean).length, [activeActions]);

  function setSetting<K extends keyof SeatYieldSettings>(key: K, value: SeatYieldSettings[K]) {
    setSettings((s) => ({ ...s, [key]: value }));
  }

  function toggleAction(actionId: string) {
    setActiveActions((s) => ({ ...s, [actionId]: !s[actionId] }));
  }

  return (
    <div className="mx-auto max-w-[1100px] px-4 pb-16 pt-9">
      {/* Header */}
      <div className="mb-5">
        <div className="font-mono text-xs uppercase tracking-[0.18em] text-muted2">Seat Yield Engine</div>
        <div className="mt-2 text-3xl font-extrabold">Ghost Table Radar</div>
        <div className="mt-2 max-w-[840px] text-sm leading-relaxed text-muted">
          Forecast → minimal actions → simulated impact. Frontend-only prototype with mocked APIs + localStorage “DB”.
        </div>
      </div>

      {/* Top row */}
      <div className="grid gap-4 lg:grid-cols-[1.05fr_1fr]">
        <Card className="p-4">
          <div className="text-sm font-semibold">Demo scenario</div>
          <div className="mt-3 space-y-3">
            <Select
              value={scenarioId}
              onChange={(v) => setScenarioId(v as DemoScenarioId)}
              options={Object.values(DEMO_SCENARIOS).map((s) => ({
                value: s.id,
                label: `${s.name} — ${s.city}`,
              }))}
            />

            <Divider />

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <div className="mb-1 text-xs text-muted2">Capacity (seats)</div>
                <input
                  className="w-full rounded-xl border border-border bg-black/20 px-3 py-2 text-sm outline-none
                             focus:border-accent/60 focus:ring-2 focus:ring-accent/20"
                  type="number"
                  min={10}
                  max={300}
                  value={settings.capacitySeats}
                  onChange={(e) => setSetting("capacitySeats", Number(e.target.value))}
                />
              </div>

              <div>
                <div className="mb-1 text-xs text-muted2">Avg spend / seat</div>
                <input
                  className="w-full rounded-xl border border-border bg-black/20 px-3 py-2 text-sm outline-none
                             focus:border-accent/60 focus:ring-2 focus:ring-accent/20"
                  type="number"
                  min={5}
                  max={500}
                  value={settings.avgSpendPerSeat}
                  onChange={(e) => setSetting("avgSpendPerSeat", Number(e.target.value))}
                />
              </div>

              <div>
                <div className="mb-1 text-xs text-muted2">Open hour</div>
                <input
                  className="w-full rounded-xl border border-border bg-black/20 px-3 py-2 text-sm outline-none
                             focus:border-accent/60 focus:ring-2 focus:ring-accent/20"
                  type="number"
                  min={0}
                  max={23}
                  value={settings.openHour}
                  onChange={(e) => setSetting("openHour", Number(e.target.value))}
                />
              </div>

              <div>
                <div className="mb-1 text-xs text-muted2">Close hour</div>
                <input
                  className="w-full rounded-xl border border-border bg-black/20 px-3 py-2 text-sm outline-none
                             focus:border-accent/60 focus:ring-2 focus:ring-accent/20"
                  type="number"
                  min={0}
                  max={23}
                  value={settings.closeHour}
                  onChange={(e) => setSetting("closeHour", Number(e.target.value))}
                />
              </div>
            </div>

            <Divider />

            <div className="flex flex-wrap gap-2">
              <StatPill label="Weather" value={scenario.context.weather} />
              <StatPill label="Local events" value={scenario.context.localEvent} />
              <StatPill label="Day type" value={scenario.context.dayType} />
              <StatPill label="Review velocity" value={scenario.context.reviewVelocity} />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold">Live summary</div>
              <div className="mt-1 text-xs text-muted2">Updates like a real backend recompute.</div>
            </div>
            {loading ? (
              <div className="font-mono text-xs text-muted2">Syncing…</div>
            ) : (
              <div className="font-mono text-xs text-muted2">Up to date</div>
            )}
          </div>

          <Divider />

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-black/15 p-3">
              <div className="text-2xl font-extrabold">{summary ? summary.atRiskSeats : "—"}</div>
              <div className="mt-1 text-xs text-muted">Seats at risk tonight</div>
            </div>

            <div className="rounded-xl border border-border bg-black/15 p-3">
              <div className="text-2xl font-extrabold">{summary ? `${summary.confidence}%` : "—"}</div>
              <div className="mt-1 text-xs text-muted">Forecast confidence</div>
            </div>

            <div className="rounded-xl border border-border bg-black/15 p-3">
              <div className="text-2xl font-extrabold">{activeCount}</div>
              <div className="mt-1 text-xs text-muted">Actions active</div>
            </div>
          </div>

          <Divider />

          {impact ? (
            <div className="grid gap-3 lg:grid-cols-3">
              <div className="rounded-xl border border-border bg-black/15 p-3">
                <div className="text-xs text-muted2">Do nothing</div>
                <div className="mt-2 text-lg font-bold">
                  {formatCurrency(impact.baseline.expectedRevenue, settings.currency)}
                </div>
                <div className="mt-1 text-xs text-muted">
                  Fill {formatPct(impact.baseline.expectedFillRate)}
                </div>
              </div>

              <div className="rounded-xl border border-accent/60 bg-accent/15 p-3">
                <div className="text-xs text-muted2">With plan</div>
                <div className="mt-2 text-lg font-bold">
                  {formatCurrency(impact.withPlan.expectedRevenue, settings.currency)}
                </div>
                <div className="mt-1 text-xs text-muted">
                  Fill {formatPct(impact.withPlan.expectedFillRate)}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-black/15 p-3">
                <div className="text-xs text-muted2">Projected lift</div>
                <div className="mt-2 text-lg font-bold">
                  +{formatCurrency(impact.delta.revenueLift, settings.currency)}
                </div>
                <div className="mt-1 text-xs text-muted">
                  {impact.delta.seatsRecovered} seats recovered
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted">Computing impact…</div>
          )}

          <Divider />

          <div className="flex flex-wrap gap-2">
            <Button variant={view === "radar" ? "primary" : "ghost"} onClick={() => setView("radar")}>
              Seat Risk Radar
            </Button>
            <Button variant={view === "actions" ? "primary" : "ghost"} onClick={() => setView("actions")}>
              Action Plan
            </Button>
            <Button variant={view === "impact" ? "primary" : "ghost"} onClick={() => setView("impact")}>
              Impact Simulator
            </Button>
          </div>
        </Card>
      </div>

      {/* Views */}
      {view === "radar" && (
        <Card className="mt-4 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold">Tonight’s seat-risk timeline</div>
              <div className="mt-1 text-xs text-muted">Red blocks are likely to remain unsold.</div>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted">
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400" /> Low
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-yellow-400" /> Medium
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-red-400" /> High
              </span>
            </div>
          </div>

          <Divider />

          <TimelineHeatmap openHour={settings.openHour} closeHour={settings.closeHour} blocks={forecast?.blocks ?? []} />

          <Divider />

          <div className="grid gap-3 lg:grid-cols-[1.1fr_1fr]">
            <div className="rounded-xl border border-border bg-black/15 p-3">
              <div className="text-sm font-semibold">Why seats go unsold (simulated signals)</div>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-relaxed text-muted">
                {(forecast?.explanations ?? []).map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-border bg-black/15 p-3">
              <div className="text-sm font-semibold">Top risk windows</div>
              <div className="mt-3">
                <MiniBarChart
                  items={(forecast?.blocks ?? [])
                    .slice()
                    .sort((a, b) => b.riskScore - a.riskScore)
                    .slice(0, 6)
                    .map((b) => ({
                      label: `${humanTime(b.startHour)}–${humanTime(b.endHour)}`,
                      value: Math.round(b.riskScore * 100),
                      sub: `${b.atRiskSeats} seats`,
                    }))}
                />
              </div>
            </div>
          </div>
        </Card>
      )}

      {view === "actions" && (
        <Card className="mt-4 p-4">
          <div>
            <div className="text-sm font-semibold">Minimal action plan (ranked)</div>
            <div className="mt-1 text-xs text-muted">
              Designed to recover specific time windows with minimal cost.
            </div>
          </div>

          <Divider />

          <div className="space-y-3">
            {actions.map((a) => {
              const on = !!activeActions[a.id];
              return (
                <div
                  key={a.id}
                  className={[
                    "flex flex-col gap-3 rounded-xl border p-3 lg:flex-row lg:items-center lg:justify-between",
                    on ? "border-accent/50 bg-accent/10" : "border-border bg-black/15",
                  ].join(" ")}
                >
                  <div className="space-y-2">
                    <div className="text-sm font-bold">{a.title}</div>
                    <div className="flex flex-wrap gap-2 text-[11px]">
                      <span className="rounded-full border border-border bg-black/10 px-2 py-1 text-text/80">
                        Type: {a.type}
                      </span>
                      <span className="rounded-full border border-border bg-black/10 px-2 py-1 text-text/80">
                        Window: {humanTime(a.window.startHour)}–{humanTime(a.window.endHour)}
                      </span>
                      <span className="rounded-full border border-border bg-black/10 px-2 py-1 text-text/80">
                        Cost: {a.estimatedCostLabel}
                      </span>
                      <span className="rounded-full border border-border bg-black/10 px-2 py-1 text-text/80">
                        Confidence: {Math.round(a.confidence * 100)}%
                      </span>
                    </div>
                    <div className="text-xs leading-relaxed text-muted">{a.description}</div>
                    <div className="text-xs leading-relaxed text-text/75">
                      <span className="font-semibold text-text/90">Why:</span> {a.whyThisWorks}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 lg:flex-col lg:items-end">
                    <Toggle checked={on} onChange={() => toggleAction(a.id)} />
                    <div className="text-xs text-muted2">{on ? "Active" : "Off"}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <Divider />

          <div className="text-xs text-muted">
            Frontend-only simulation. In production, these actions would connect to channels like Google Business Profile,
            review workflows, and hyper-local promotion.
          </div>
        </Card>
      )}

      {view === "impact" && (
        <Card className="mt-4 p-4">
          <div>
            <div className="text-sm font-semibold">Impact simulator</div>
            <div className="mt-1 text-xs text-muted">
              Compare baseline vs plan outcomes (mimics backend forecasting + ROI logic).
            </div>
          </div>

          <Divider />

          {impact ? (
            <div className="grid gap-3 lg:grid-cols-3">
              <div className="rounded-xl border border-border bg-black/15 p-3">
                <div className="text-xs text-muted2">Baseline</div>
                <div className="mt-2 text-xl font-extrabold">
                  {formatCurrency(impact.baseline.expectedRevenue, settings.currency)}
                </div>
                <div className="mt-1 text-xs text-muted">
                  Fill {formatPct(impact.baseline.expectedFillRate)} · No-shows {impact.baseline.expectedNoShows}
                </div>
              </div>

              <div className="rounded-xl border border-accent/60 bg-accent/15 p-3">
                <div className="text-xs text-muted2">With plan</div>
                <div className="mt-2 text-xl font-extrabold">
                  {formatCurrency(impact.withPlan.expectedRevenue, settings.currency)}
                </div>
                <div className="mt-1 text-xs text-muted">
                  Fill {formatPct(impact.withPlan.expectedFillRate)} · Seats recovered {impact.delta.seatsRecovered}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-black/15 p-3">
                <div className="text-xs text-muted2">Lift</div>
                <div className="mt-2 text-xl font-extrabold">
                  +{formatCurrency(impact.delta.revenueLift, settings.currency)}
                </div>
                <div className="mt-1 text-xs text-muted">
                  {formatPct(impact.delta.fillRateLift)} fill lift
                </div>
              </div>

              <div className="lg:col-span-3 rounded-xl border border-border bg-black/15 p-3">
                <div className="text-sm font-semibold">How this simulation works</div>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-relaxed text-muted">
                  {impact.explanations.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted">Computing impact…</div>
          )}
        </Card>
      )}
    </div>
  );
}
