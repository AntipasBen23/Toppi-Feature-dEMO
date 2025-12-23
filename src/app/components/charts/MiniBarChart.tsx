export function MiniBarChart({
  items,
}: {
  items: { label: string; value: number; sub?: string }[];
}) {
  return (
    <div className="space-y-3">
      {items.map((it) => (
        <div key={it.label} className="grid grid-cols-[1fr_1.4fr_56px] items-center gap-3">
          <div>
            <div className="text-xs font-semibold">{it.label}</div>
            <div className="text-[11px] text-muted2">{it.sub ?? ""}</div>
          </div>

          <div className="h-2 overflow-hidden rounded-full border border-border bg-black/20">
            <div
              className="h-full rounded-full bg-accent"
              style={{ width: `${Math.max(2, Math.min(100, it.value))}%` }}
            />
          </div>

          <div className="text-right font-mono text-xs text-muted">{it.value}%</div>
        </div>
      ))}
    </div>
  );
}
