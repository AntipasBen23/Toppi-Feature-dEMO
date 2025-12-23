export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function humanTime(hour: number) {
  const h = ((hour % 24) + 24) % 24;
  const suffix = h >= 12 ? "pm" : "am";
  const hr12 = h % 12 === 0 ? 12 : h % 12;
  return `${hr12}${suffix}`;
}

export function formatPct(x: number) {
  const v = Math.round(clamp(x, 0, 1) * 100);
  return `${v}%`;
}

export function formatCurrency(amount: number, currency: "EUR" | "USD" | "GBP") {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${Math.round(amount)}`;
  }
}
