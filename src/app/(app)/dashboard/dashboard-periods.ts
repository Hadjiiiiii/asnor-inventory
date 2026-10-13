import { shopDate } from "@/lib/shop-time";

export type DashboardPeriodRow = {
  period: "month" | "day";
  bucket: Date | string;
  sales: number | string;
  profit: number | string | null;
};

type Totals = { sales: number; profit: number };

const pad = (n: number) => String(n).padStart(2, "0");

/** `now` is read as a calendar day in `timeZone`, so "this month" and its day list follow the shop's calendar. */
export function buildDashboardPeriods(rows: DashboardPeriodRow[], now: Date, timeZone?: string) {
  const monthlyTotals = new Map<string, Totals>();
  const dailyTotals = new Map<string, Totals>();

  for (const row of rows) {
    const bucket = row.bucket instanceof Date ? row.bucket : new Date(row.bucket);
    const key = bucket.toISOString().slice(0, row.period === "month" ? 7 : 10);
    const totals = {
      sales: Number(row.sales),
      profit: Number(row.profit ?? 0),
    };

    if (row.period === "month") monthlyTotals.set(key, totals);
    else dailyTotals.set(key, totals);
  }

  const today = shopDate(now, timeZone);

  const monthlyChart: { month: string; sales: number; profit: number }[] = [];
  for (let offset = 5; offset >= 0; offset--) {
    // UTC arithmetic only, so the server's own zone cannot shift a month.
    const month = new Date(Date.UTC(today.year, today.month - 1 - offset, 1));
    const key = `${month.getUTCFullYear()}-${pad(month.getUTCMonth() + 1)}`;
    const totals = monthlyTotals.get(key) ?? { sales: 0, profit: 0 };

    monthlyChart.push({
      month: month.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" }),
      sales: totals.sales,
      profit: totals.profit,
    });
  }

  const dailyBreakdown: { date: string; sales: number; profit: number }[] = [];
  for (let day = 1; day <= today.day; day++) {
    const key = `${today.year}-${pad(today.month)}-${pad(day)}`;
    const totals = dailyTotals.get(key) ?? { sales: 0, profit: 0 };
    dailyBreakdown.push({ date: key, ...totals });
  }
  dailyBreakdown.reverse();

  return { monthlyChart, dailyBreakdown };
}
