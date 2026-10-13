"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface ChartData {
  month: string;
  sales: number;
  profit: number;
}

export function DashboardCharts({ data }: { data: ChartData[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Sales and profit, last 6 months</CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className="h-[300px] w-full"
          role="img"
          aria-label="Bar chart of sales and profit for each of the last six months"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
                tickFormatter={(value) => `$${value >= 1000 ? `${+(value / 1000).toFixed(1)}k` : value}`}
              />
              <Tooltip
                cursor={{ fill: "var(--color-muted)" }}
                contentStyle={{
                  backgroundColor: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "0.75rem",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)",
                }}
                labelStyle={{ color: "var(--color-card-foreground)", fontWeight: 500 }}
                formatter={(value, name) => [formatCurrency(Number(value)), name]}
              />
              <Legend />
              <Bar
                dataKey="sales"
                fill="var(--color-primary)"
                radius={[4, 4, 0, 0]}
                name="Sales"
              />
              <Bar
                dataKey="profit"
                fill="var(--color-success)"
                radius={[4, 4, 0, 0]}
                name="Profit"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
