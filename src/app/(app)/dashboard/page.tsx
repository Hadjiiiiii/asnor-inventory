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
    watchedAccessories,
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
    // Accessories with a low-stock alert set; the product page defines it as "Below N", so quantity < N.
    prisma.product.findMany({
      where: { type: "ACCESSORY", lowStockThreshold: { gt: 0 } },
      select: { id: true, name: true, quantity: true, lowStockThreshold: true },
    }),
  ]);

  const lowStock = watchedAccessories
    .filter((p) => p.lowStockThreshold !== null && p.quantity < p.lowStockThreshold)
    .sort((a, b) => a.quantity - b.quantity || a.name.localeCompare(b.name));

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
    lowStock,
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

  const todayTotal = data.todaysSales.reduce((sum, tx) => sum + tx.totalPrice, 0);
  // Null when no sale today has a recorded cost, so an unknown profit is never shown as $0.
  const profitKnown = data.todaysSales.filter((tx) => tx.profit !== null);
  const todayProfit = profitKnown.length > 0 ? profitKnown.reduce((sum, tx) => sum + (tx.profit ?? 0), 0) : null;
  const hasChart = data.monthlyChart.some((m) => m.sales > 0);

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

      {/* Today first: what has come in, and what needs attention before the next customer */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Today&apos;s sales</CardTitle>
            {data.todaysSales.length > 0 && (
              <Badge variant="success">
                {data.todaysSales.length}
                <span className="sr-only"> {data.todaysSales.length === 1 ? "sale" : "sales"}</span>
              </Badge>
            )}
          </CardHeader>
          <CardContent>
            {data.todaysSales.length === 0 ? (
              <p className="text-sm text-muted-foreground">No sales yet today</p>
            ) : (
              <>
                <p className="mb-2 text-sm">
                  <span className="font-semibold tabular-nums">{formatCurrency(todayTotal)}</span>{" "}
                  <span className="text-muted-foreground">sold</span>
                  {todayProfit !== null && (
                    <>
                      <span className="text-muted-foreground"> · </span>
                      <span className={todayProfit >= 0 ? "font-semibold text-success-ink tabular-nums" : "font-semibold text-destructive tabular-nums"}>
                        {todayProfit >= 0 ? "Profit" : "Loss"} {formatCurrency(Math.abs(todayProfit))}
                      </span>
                    </>
                  )}
                </p>
                <div>
                  {data.todaysSales.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between gap-4 py-2 border-b last:border-0">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{tx.product.name}</p>
                        {tx.contact?.name && (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">to {tx.contact.name}</p>
                        )}
                      </div>
                      <span className="text-sm font-medium tabular-nums shrink-0">
                        {formatCurrency(tx.totalPrice)}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Needs restocking</CardTitle>
          </CardHeader>
          <CardContent>
            {data.lowStock.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No accessory is below its low-stock alert. Set an alert on an accessory to watch it here.
              </p>
            ) : (
              <>
                <ul>
                  {data.lowStock.slice(0, 5).map((item) => (
                    <li key={item.id} className="border-b last:border-0">
                      <Link
                        href={`/inventory/${item.id}`}
                        className="flex items-center justify-between gap-3 rounded-sm py-2 hover:underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium">{item.name}</span>
                          <span className="block text-xs text-muted-foreground">Alert below {item.lowStockThreshold}</span>
                        </span>
                        <Badge variant={item.quantity === 0 ? "destructive" : "warning"} className="shrink-0">
                          {item.quantity === 0 ? "Out of stock" : `${item.quantity} left`}
                        </Badge>
                      </Link>
                    </li>
                  ))}
                </ul>
                {data.lowStock.length > 5 && (
                  <Link href="/inventory?type=ACCESSORY" className="mt-3 inline-block text-sm text-primary hover:underline">
                    View all {data.lowStock.length} in accessories
                  </Link>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* This month: the money first, then what is on the shelf */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricDialogCard
          title="Sales this month"
          value={formatCurrency(data.monthlySalesTotal)}
          icon={<ArrowLeftRight className="h-4 w-4 text-muted-foreground" />}
          description={
            <>
              {data.monthlySalesCount} {data.monthlySalesCount === 1 ? "sale" : "sales"}
              {salesGrowth && (
                <>
                  {" · "}
                  <span className={Number(salesGrowth) >= 0 ? "text-success-ink" : "text-destructive"}>
                    {Number(salesGrowth) >= 0 ? "+" : ""}{salesGrowth}%
                  </span>{" "}
                  vs all of last month
                </>
              )}
            </>
          }
          dialogTitle="Sales this month"
          metric="sales"
          breakdown={data.dailyBreakdown}
        />

        <MetricDialogCard
          title="Profit this month"
          value={formatCurrency(data.monthlyProfit)}
          valueClassName={data.monthlyProfit >= 0 ? "text-success" : "text-destructive"}
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
          description="sale price minus purchase cost"
          dialogTitle="Profit this month"
          dialogNote="Sale price minus purchase cost. Sales of units with no recorded cost aren't included."
          metric="profit"
          breakdown={data.dailyBreakdown}
        />

        <Link href="/inventory" className={cardLinkClass}>
          <Card className="h-full transition-shadow hover:shadow-md cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Devices in stock
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums">{data.deviceInventory}</div>
              <p className="text-xs text-muted-foreground mt-1">
                unsold device units
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/inventory" className={cardLinkClass}>
          <Card className="h-full transition-shadow hover:shadow-md cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Stock value
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums">{formatCurrency(data.deviceValue)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                listed price of unsold devices
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Trend, with the latest transactions beside it */}
      <div className="grid gap-6 lg:grid-cols-3">
        {hasChart && (
          <div className="lg:col-span-2">
            <DashboardCharts data={data.monthlyChart} />
          </div>
        )}

        <Card className={hasChart ? undefined : "lg:col-span-3"}>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent transactions</CardTitle>
            <Link href="/transactions" className="text-sm text-primary hover:underline">
              View all transactions
            </Link>
          </CardHeader>
          <CardContent>
            {data.recentTransactions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No transactions yet</p>
            ) : (
              <div>
                {data.recentTransactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between gap-4 py-2 border-b last:border-0">
                    <div className="min-w-0">
                      <div className="text-sm flex items-center">
                        <Badge variant={tx.type === "BUY" ? "secondary" : "success"} className="mr-2 text-xs shrink-0">
                          {tx.type === "BUY" ? "Purchase" : "Sale"}
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
