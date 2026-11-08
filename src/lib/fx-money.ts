/** Currency-sensitive precision for cross-border previews, without rounding cents away. */
export function fxMinorDigits(currency: string): number {
  try {
    const digits = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).resolvedOptions().maximumFractionDigits;
    return typeof digits === "number" && Number.isInteger(digits) && digits >= 0 && digits <= 20
      ? digits
      : 2;
  } catch {
    return 2;
  }
}

export function fmtFxMoney(amount: number | string, currency: string) {
  const num = Number(amount);
  if (!Number.isFinite(num)) return `— ${currency}`;
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency", currency,
      minimumFractionDigits: fxMinorDigits(currency),
      maximumFractionDigits: fxMinorDigits(currency),
    }).format(num);
  } catch {
    return `${num.toFixed(2)} ${currency}`;
  }
}
