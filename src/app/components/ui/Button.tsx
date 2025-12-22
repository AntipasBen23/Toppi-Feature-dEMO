"use client";

import React from "react";

type Variant = "primary" | "ghost";

export function Button({
  children,
  onClick,
  variant = "primary",
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: Variant;
  disabled?: boolean;
}) {
  const base =
    "rounded-full px-4 py-2 text-sm font-semibold border transition " +
    "disabled:opacity-50 disabled:cursor-not-allowed";

  const styles =
    variant === "primary"
      ? "border-accent/60 bg-accent/15 hover:bg-accent/20"
      : "border-border bg-black/10 hover:bg-black/20";

  return (
    <button type="button" className={`${base} ${styles}`} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}
