export type DashboardPeriodRow = {
  period: "month" | "day";
  bucket: Date | string;
  sales: number | string;
  profit: number | string | null;
};

type Totals = { sales: number; profit: number };

export function buildDashboardPeriods(rows: DashboardPeriodRow[], now: Date) {
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

  const monthlyChart: { month: string; sales: number; profit: number }[] = [];
  for (let offset = 5; offset >= 0; offset--) {
    const month = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const key = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`;
    const totals = monthlyTotals.get(key) ?? { sales: 0, profit: 0 };

    monthlyChart.push({
      month: month.toLocaleDateString("en-US", { month: "short" }),
      sales: totals.sales,
      profit: totals.profit,
    });
  }

  const dailyBreakdown: { date: string; sales: number; profit: number }[] = [];
  for (
    let day = new Date(now.getFullYear(), now.getMonth(), 1);
    day <= now;
    day.setDate(day.getDate() + 1)
  ) {
    const key = day.toISOString().slice(0, 10);
    const totals = dailyTotals.get(key) ?? { sales: 0, profit: 0 };
    dailyBreakdown.push({ date: key, ...totals });
  }
  dailyBreakdown.reverse();

  return { monthlyChart, dailyBreakdown };
}
