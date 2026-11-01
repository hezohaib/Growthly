import { DAYS, DAY_MS, END } from "./constants";
import { calcMrr } from "./customer";
import { COUNTRIES, type AnalyticsData, type Customer, type DayPoint, type Plan } from "./types";
import { isoDay, mulberry32, slugify } from "./utils";

const NAMES =
  "Northwind,Acme Labs,Bluefin,Cedar & Co,Dune Studio,Evergreen,Foxglove,Granite,Harbor,Ionic,Juniper,Kestrel,Lumen,Meridian,Nimbus,Orchard,Pinecone,Quarry,Riverside,Sable,Tidewater,Umbra,Vantage,Willow,Yarrow,Zephyr,Atlas,Beacon,Cobalt,Delta".split(
    ",",
  );

function generate(): AnalyticsData {
  const rand = mulberry32(42);

  const series: DayPoint[] = Array.from({ length: DAYS }, (_, i) => {
    const t = END - (DAYS - 1 - i) * DAY_MS;
    const day = new Date(t).getUTCDay();
    const growth = 1 + (i / DAYS) * 0.6;
    const weekend = day === 0 || day === 6 ? 0.7 : 1;
    return {
      date: isoDay(t),
      revenue: Math.round(3000 * growth * weekend * (0.9 + rand() * 0.2)),
      signups: Math.round(14 * growth * weekend * (0.7 + rand() * 0.6)),
      active: Math.round(1800 * growth * (0.97 + rand() * 0.06)),
      churned: Math.round(2 + rand() * 4),
    };
  });

  const plans: Plan[] = ["Starter", "Pro", "Business"];
  // a second generator for the extra fields, so the original numbers never change
  const extra = mulberry32(7);

  const customers: Customer[] = NAMES.map((name) => {
    const plan = plans[Math.floor(rand() * 3)];
    const maxSeats = plan === "Starter" ? 3 : plan === "Pro" ? 10 : 30;
    const seats = 1 + Math.floor(rand() * maxSeats);
    const joined = isoDay(END - Math.floor(rand() * 400) * DAY_MS);
    const status = rand() < 0.15 ? "Churned" : "Active";
    const id = slugify(name);
    return {
      id,
      name,
      email: `hello@${id.replace(/-/g, "")}.com`,
      country: COUNTRIES[Math.floor(extra() * COUNTRIES.length)],
      plan,
      seats,
      mrr: calcMrr(plan, seats),
      status,
      joined,
    };
  });

  return { series, customers };
}

let cache: AnalyticsData | undefined;

/** Deterministic dataset, generated once per process. */
export function getAnalytics(): AnalyticsData {
  return (cache ??= generate());
}
