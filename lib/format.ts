const usdFmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
const numFmt = new Intl.NumberFormat("en-US");
// Dates are ISO calendar days, so format them in UTC to avoid off-by-one shifts.
const shortFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
const fullFmt = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});
const monthFmt = new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" });

const toDate = (iso: string) => new Date(`${iso}T00:00:00Z`);

export const usd = (n: number) => usdFmt.format(n);
export const num = (n: number) => numFmt.format(Math.round(n));
export const percent = (n: number) => `${n.toFixed(2)}%`;
export const shortDate = (iso: string) => shortFmt.format(toDate(iso));
export const fullDate = (iso: string) => fullFmt.format(toDate(iso));
export const monthName = (iso: string) => monthFmt.format(toDate(iso));
export const year = (iso: string) => iso.slice(0, 4);
export const compactUsd = (v: number) => (v >= 1000 ? `$${Math.round(v / 100) / 10}k` : `$${Math.round(v)}`);
