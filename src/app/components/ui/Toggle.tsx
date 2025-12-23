"use client";

export function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      aria-pressed={checked}
      className={[
        "relative h-8 w-14 rounded-full border transition",
        checked ? "border-accent/60 bg-accent/15" : "border-border bg-black/20",
      ].join(" ")}
    >
      <span
        className={[
          "absolute top-[3px] left-[3px] h-6 w-6 rounded-full transition",
          checked ? "translate-x-6 bg-accent" : "translate-x-0 bg-white/80",
        ].join(" ")}
      />
    </button>
  );
}
