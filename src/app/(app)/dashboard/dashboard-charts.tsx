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
        <CardTitle className="text-base">Monthly Performance (Last 6 Months)</CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className="h-[300px] w-full"
          role="img"
          aria-label="Bar chart of sales and profit for each of the last six months"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8e2db" vertical={false} />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#6b6560", fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#6b6560", fontSize: 12 }}
                tickFormatter={(value) => `$${value >= 1000 ? `${+(value / 1000).toFixed(1)}k` : value}`}
              />
              <Tooltip
                cursor={{ fill: "#f5f0eb" }}
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e8e2db",
                  borderRadius: "0.75rem",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)",
                }}
                labelStyle={{ color: "#1a1a1a", fontWeight: 500 }}
                formatter={(value, name) => [formatCurrency(Number(value)), name]}
              />
              <Legend />
              <Bar
                dataKey="sales"
                fill="#ad4f2d"
                radius={[4, 4, 0, 0]}
                name="Sales"
              />
              <Bar
                dataKey="profit"
                fill="#16a34a"
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
