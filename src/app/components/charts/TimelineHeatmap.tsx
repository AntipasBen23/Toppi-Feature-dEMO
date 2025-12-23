"use client";

import React, { useMemo, useState } from "react";
import { SeatRiskBlock } from "../../lib/seatYield/types";
import { humanTime } from "../../lib/seatYield/utils";

export function TimelineHeatmap({
  openHour,
  closeHour,
  blocks,
}: {
  openHour: number;
  closeHour: number;
  blocks: SeatRiskBlock[];
}) {
  const [selected, setSelected] = useState<SeatRiskBlock | null>(null);

  const hours = useMemo(() => {
    const arr: number[] = [];
    for (let h = openHour; h < closeHour; h++) arr.push(h);
    return arr;
  }, [openHour, closeHour]);

  const byStart = useMemo(() => {
    const m = new Map<number, SeatRiskBlock>();
    for (const b of blocks) m.set(b.startHour, b);
    return m;
  }, [blocks]);

  function level(risk: number) {
    if (risk >= 0.7) return "high";
    if (risk >= 0.4) return "mid";
    return "low";
  }

  const levelClasses: Record<string, string> = {
    low: "bg-emerald-500/10",
    mid: "bg-yellow-500/10",
    high: "bg-red-500/10",
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {hours.map((h) => {
          const b = byStart.get(h);
          const risk = b?.riskScore ?? 0;
          const lv = level(risk);

          const isSelected = selected?.startHour === h;

          return (
            <button
              key={h}
              type="button"
              onClick={() => setSelected(b ?? null)}
              className={[
                "rounded-xl border p-3 text-left transition",
                "border-border bg-black/15 hover:bg-black/25",
                b ? levelClasses[lv] : "",
                isSelected ? "border-accent/60 ring-2 ring-accent/20" : "",
              ].join(" ")}
              title={
                b
                  ? `${humanTime(b.startHour)}–${humanTime(b.endHour)} · ${b.atRiskSeats} seats at risk`
                  : `${humanTime(h)}–${humanTime(h + 1)}`
              }
            >
              <div className="font-mono text-xs text-muted2">{humanTime(h)}</div>
              <div className="mt-2 text-sm font-bold">{b ? `${b.atRiskSeats} seats` : "—"}</div>
              <div className="mt-1 text-xs text-muted">{b ? `${Math.round(b.riskScore * 100)}% risk` : ""}</div>
            </button>
          );
        })}
      </div>

      {selected ? (
        <div className="rounded-xl border border-border bg-black/15 p-3">
          <div className="text-sm font-semibold">
            {humanTime(selected.startHour)}–{humanTime(selected.endHour)} ·{" "}
            <span className="text-accent">{selected.atRiskSeats} seats at risk</span>
          </div>
          <div className="mt-1 text-xs text-muted leading-relaxed">
            Risk score: <b>{Math.round(selected.riskScore * 100)}%</b>
            <br />
            Notes: {selected.note}
          </div>
        </div>
      ) : (
        <div className="text-xs text-muted">Click a block to inspect a time window.</div>
      )}
    </div>
  );
}
