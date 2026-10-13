import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, TrendingUp, ArrowLeftRight, DollarSign } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { DashboardCharts } from "./dashboard-charts";
import { MetricDialogCard } from "./metric-dialog-card";
import { buildDashboardPeriods, type DashboardPeriodRow } from "./dashboard-periods";
import Link from "next/link";

export const dynamic = "force-dynamic";

// The link wraps a Card, so the focus ring has to sit on the link and follow the card's 16px corners.
const cardLinkClass =
  "block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

async function getDashboardData() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const [
    deviceInventory,
    deviceValue,
    monthlySales,
    lastMonthSales,
    recentTransactions,
    dashboardPeriods,
    todaysSales,
  ] = await Promise.all([
    // Total device inventory (units), excludes accessories
    prisma.product.count({
      where: { type: "DEVICE", status: { not: "SOLD" } },
    }),
    // Total value of device units only (based on selling price)
    prisma.product.aggregate({
      where: { type: "DEVICE", status: { not: "SOLD" } },
      _sum: { sellingPrice: true },
    }),
    // This month's sales
    prisma.transaction.aggregate({
      where: { type: "SELL", date: { gte: startOfMonth } },
      _sum: { totalPrice: true, profit: true },
      _count: true,
    }),
    // Last month's sales (for comparison)
    prisma.transaction.aggregate({
      where: { type: "SELL", date: { gte: startOfLastMonth, lte: endOfLastMonth } },
      _sum: { totalPrice: true },
      _count: true,
    }),
    // Recent transactions
    prisma.transaction.findMany({
      include: {
        product: { select: { name: true } },
        contact: { select: { name: true } },
      },
      orderBy: { date: "desc" },
      take: 8,
    }),
    // Aggregate the six-month chart and current-month breakdown in the database.
    prisma.$queryRaw<DashboardPeriodRow[]>`
      WITH sales AS MATERIALIZED (
        SELECT date, "totalPrice", profit
        FROM transactions
        WHERE type = 'SELL' AND date >= ${new Date(now.getFullYear(), now.getMonth() - 5, 1)}
      ),
      monthly AS (
        SELECT
          'month'::text AS period,
          date_trunc('month', date)::date AS bucket,
          SUM("totalPrice") AS sales,
          SUM(COALESCE(profit, 0)) AS profit
        FROM sales
        WHERE date <= date_trunc('month', date) + INTERVAL '1 month' - INTERVAL '1 day'
        GROUP BY date_trunc('month', date)
      ),
      daily AS (
        SELECT
          'day'::text AS period,
          date_trunc('day', date)::date AS bucket,
          SUM("totalPrice") AS sales,
          SUM(COALESCE(profit, 0)) AS profit
        FROM sales
        WHERE date >= ${startOfMonth} AND date <= ${now}
        GROUP BY date_trunc('day', date)
      )
      SELECT period, bucket, sales, profit FROM monthly
      UNION ALL
      SELECT period, bucket, sales, profit FROM daily
    `,
    // Today's sales
    prisma.transaction.findMany({
      where: { type: "SELL", date: { gte: startOfToday } },
      include: {
        product: { select: { name: true } },
        contact: { select: { name: true } },
      },
      orderBy: { date: "desc" },
    }),
  ]);

  const { monthlyChart, dailyBreakdown } = buildDashboardPeriods(dashboardPeriods, now);

  return {
    deviceInventory,
    deviceValue: Number(deviceValue._sum.sellingPrice || 0),
    monthlySalesTotal: Number(monthlySales._sum.totalPrice || 0),
    monthlySalesCount: monthlySales._count,
    monthlyProfit: Number(monthlySales._sum.profit || 0),
    lastMonthSalesTotal: Number(lastMonthSales._sum.totalPrice || 0),
    recentTransactions,
    monthlyChart,
    dailyBreakdown,
    todaysSales: todaysSales.map((tx) => ({
      ...tx,
      unitPrice: Number(tx.unitPrice),
      totalPrice: Number(tx.totalPrice),
      profit: tx.profit ? Number(tx.profit) : null,
    })),
  };
}

export default async function DashboardPage() {
  const session = await auth();
  const data = await getDashboardData();

  const salesGrowth = data.lastMonthSalesTotal > 0
    ? ((data.monthlySalesTotal - data.lastMonthSalesTotal) / data.lastMonthSalesTotal * 100).toFixed(0)
    : null;

  const todayLabel = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date());

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-muted-foreground mt-1 truncate">
            Welcome back, {session?.user?.name}
          </p>
        </div>
        <p className="text-sm text-muted-foreground sm:pt-1 sm:whitespace-nowrap">{todayLabel}</p>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/inventory" className={cardLinkClass}>
          <Card className="h-full transition-shadow hover:shadow-md cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Inventory
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums">{data.deviceInventory}</div>
              <p className="text-xs text-muted-foreground mt-1">
                device units available
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/inventory" className={cardLinkClass}>
          <Card className="h-full transition-shadow hover:shadow-md cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Value
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums">{formatCurrency(data.deviceValue)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                total value of device units
              </p>
            </CardContent>
          </Card>
        </Link>

        <MetricDialogCard
          title="Monthly Sales"
          value={formatCurrency(data.monthlySalesTotal)}
          icon={<ArrowLeftRight className="h-4 w-4 text-muted-foreground" />}
          description={
            <>
              {data.monthlySalesCount} transaction{data.monthlySalesCount !== 1 ? "s" : ""} this month
              {salesGrowth && (
                <span className={Number(salesGrowth) >= 0 ? " text-success-ink" : " text-destructive"}>
                  {" "}({Number(salesGrowth) >= 0 ? "+" : ""}{salesGrowth}%)
                </span>
              )}
            </>
          }
          dialogTitle="Sales This Month"
          metric="sales"
          breakdown={data.dailyBreakdown}
        />

        <MetricDialogCard
          title="Monthly Profit"
          value={formatCurrency(data.monthlyProfit)}
          valueClassName={data.monthlyProfit >= 0 ? "text-success" : "text-destructive"}
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
          description="net profit this month"
          dialogTitle="Profit This Month"
          metric="profit"
          breakdown={data.dailyBreakdown}
        />
      </div>

      {/* Charts */}
      {data.monthlyChart.some((m) => m.sales > 0) && (
        <DashboardCharts data={data.monthlyChart} />
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Today's Sales */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Today&apos;s Sales</CardTitle>
            {data.todaysSales.length > 0 && (
              <Badge variant="success">{data.todaysSales.length}</Badge>
            )}
          </CardHeader>
          <CardContent>
            {data.todaysSales.length === 0 ? (
              <p className="text-sm text-muted-foreground">No sales yet today</p>
            ) : (
              <div className="space-y-3">
                {data.todaysSales.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between gap-4 py-2 border-b last:border-0">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{tx.product.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {tx.contact?.name ? `to ${tx.contact.name} • ` : ""}
                        {formatDate(tx.date)}
                      </p>
                    </div>
                    <span className="text-sm font-medium tabular-nums shrink-0">
                      {formatCurrency(tx.totalPrice)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent Activity</CardTitle>
            <Link href="/transactions" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {data.recentTransactions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No transactions yet</p>
            ) : (
              <div className="space-y-3">
                {data.recentTransactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between gap-4 py-2 border-b last:border-0">
                    <div className="min-w-0">
                      <div className="text-sm flex items-center">
                        <Badge variant={tx.type === "BUY" ? "secondary" : "success"} className="mr-2 text-xs shrink-0">
                          {tx.type === "BUY" ? "Buy" : "Sell"}
                        </Badge>
                        <span className="font-medium truncate">{tx.product.name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {tx.contact?.name ? `${tx.type === "BUY" ? "from" : "to"} ${tx.contact.name} • ` : ""}
                        {formatDate(tx.date)}
                      </p>
                    </div>
                    <span className="text-sm font-medium tabular-nums shrink-0">
                      {formatCurrency(tx.totalPrice.toString())}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
