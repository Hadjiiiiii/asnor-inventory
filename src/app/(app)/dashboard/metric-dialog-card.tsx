"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";

interface DayBreakdown {
  date: string; // YYYY-MM-DD
  sales: number;
  profit: number;
}

interface MetricDialogCardProps {
  title: string;
  value: string;
  description: React.ReactNode;
  icon: React.ReactNode;
  dialogTitle: string;
  /** Which figure to display per day in the breakdown list. */
  metric: "sales" | "profit";
  breakdown: DayBreakdown[];
  valueClassName?: string;
}

function formatDayLabel(dateStr: string): string {
  // Parse as a local date (not UTC) to avoid off-by-one day issues.
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(d);
}

/**
 * A dashboard metric card that opens a dialog listing a day-by-day
 * breakdown of the metric for the current month when clicked.
 */
export function MetricDialogCard({
  title,
  value,
  description,
  icon,
  dialogTitle,
  metric,
  breakdown,
  valueClassName,
}: MetricDialogCardProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Card
        className="h-full transition-shadow hover:shadow-md cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        onClick={() => setOpen(true)}
        role="button"
        aria-haspopup="dialog"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(true);
          }
        }}
      >
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          {icon}
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold tabular-nums ${valueClassName || ""}`}>{value}</div>
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent onClose={() => setOpen(false)} className="max-w-md">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
          </DialogHeader>
          {breakdown.length === 0 ? (
            <p className="text-sm text-muted-foreground">No data for this month yet</p>
          ) : (
            <div className="max-h-96 overflow-y-auto -mx-2">
              <div className="space-y-1">
                {breakdown.map((day) => {
                  const amount = metric === "sales" ? day.sales : day.profit;
                  return (
                    <div
                      key={day.date}
                      className="flex items-center justify-between py-2 px-2 border-b last:border-0"
                    >
                      <span className="text-sm text-muted-foreground">
                        {formatDayLabel(day.date)}
                      </span>
                      <span
                        className={`text-sm font-medium tabular-nums ${
                          metric === "profit"
                            ? amount >= 0
                              ? "text-success-ink"
                              : "text-destructive"
                            : ""
                        }`}
                      >
                        {formatCurrency(amount)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
