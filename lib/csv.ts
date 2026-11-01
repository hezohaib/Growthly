import type { Customer } from "./types";

const esc = (v: string | number) => {
  const s = String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function toCsv(header: string[], rows: Array<Array<string | number>>): string {
  return [header, ...rows].map((r) => r.map(esc).join(",")).join("\n");
}

export function customersToCsv(customers: Customer[]): string {
  return toCsv(
    ["Name", "Email", "Country", "Plan", "Seats", "Monthly revenue (USD)", "Status", "Joined"],
    customers.map((c) => [c.name, c.email, c.country, c.plan, c.seats, c.mrr, c.status, c.joined]),
  );
}

/** Browser only: saves text as a file download. */
export function downloadFile(filename: string, content: string, type = "text/csv;charset=utf-8") {
  const blob = new Blob(["﻿" + content], { type }); // BOM so Excel reads UTF-8 correctly
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
