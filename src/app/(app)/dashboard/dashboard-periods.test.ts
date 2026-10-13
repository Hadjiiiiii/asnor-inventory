import assert from "node:assert/strict";
import { test } from "node:test";
import { buildDashboardPeriods } from "./dashboard-periods";

test("builds zero-filled monthly chart and reverse-chronological daily totals", () => {
  const result = buildDashboardPeriods(
    [
      { period: "month", bucket: "2024-08-01T00:00:00.000Z", sales: "20", profit: "4" },
      { period: "month", bucket: "2025-01-01T00:00:00.000Z", sales: "90", profit: "12" },
      { period: "day", bucket: "2025-01-01T00:00:00.000Z", sales: "50", profit: "7" },
      { period: "day", bucket: "2025-01-03T00:00:00.000Z", sales: "40", profit: "5" },
      { period: "day", bucket: "2025-01-04T00:00:00.000Z", sales: "100", profit: "30" },
    ],
    new Date("2025-01-03T12:00:00.000Z"),
  );

  assert.deepEqual(result, {
    monthlyChart: [
      { month: "Aug", sales: 20, profit: 4 },
      { month: "Sep", sales: 0, profit: 0 },
      { month: "Oct", sales: 0, profit: 0 },
      { month: "Nov", sales: 0, profit: 0 },
      { month: "Dec", sales: 0, profit: 0 },
      { month: "Jan", sales: 90, profit: 12 },
    ],
    dailyBreakdown: [
      { date: "2025-01-03", sales: 40, profit: 5 },
      { date: "2025-01-02", sales: 0, profit: 0 },
      { date: "2025-01-01", sales: 50, profit: 7 },
    ],
  });
});
