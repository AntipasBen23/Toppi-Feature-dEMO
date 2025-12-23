export function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="inline-flex items-baseline gap-2 rounded-full border border-border bg-black/20 px-3 py-2">
      <span className="text-[10px] uppercase tracking-widest text-muted2">{label}</span>
      <span className="text-xs font-semibold text-text">{value}</span>
    </div>
  );
}
