"use client"

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { formatCurrency, formatCurrencyCompact } from "@/lib/format"
import type { PlatformPoint } from "@/lib/royalty-analytics"

const SLICE_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--muted-foreground)",
]

export function PlatformPieChart({ data }: { data: PlatformPoint[] }) {
  const total = data.reduce((sum, row) => sum + row.grossRevenue, 0)
  const chartData = data.map((row, index) => ({
    name: row.platform,
    value: row.grossRevenue,
    units: row.units,
    color: SLICE_COLORS[index % SLICE_COLORS.length],
  }))

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Platform distribution</CardTitle>
        <CardDescription>Gross revenue share by streaming platform (DSP).</CardDescription>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <p className="py-8 text-center text-muted-foreground">
            No data in this range.
          </p>
        ) : (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative mx-auto h-56 w-56 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius="62%"
                    outerRadius="100%"
                    paddingAngle={2}
                    cornerRadius={4}
                    stroke="var(--card)"
                    strokeWidth={2}
                  >
                    {chartData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, _name, item) => [
                      formatCurrency(Number(value)),
                      item?.payload?.name,
                    ]}
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      fontSize: 12,
                      color: "var(--popover-foreground)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[0.65rem] text-muted-foreground">Total</span>
                <span className="font-heading text-sm font-medium text-foreground">
                  {formatCurrencyCompact(total)}
                </span>
              </div>
            </div>

            <div className="flex flex-1 flex-col gap-2">
              {chartData
                .slice()
                .sort((a, b) => b.value - a.value)
                .map((entry) => {
                  const pct = total > 0 ? (entry.value / total) * 100 : 0
                  return (
                    <div key={entry.name} className="flex items-center justify-between gap-3">
                      <span className="flex min-w-0 items-center gap-2">
                        <span
                          className="size-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: entry.color }}
                        />
                        <span className="truncate">{entry.name}</span>
                      </span>
                      <span className="shrink-0 text-right font-medium text-foreground">
                        {formatCurrency(entry.value)}{" "}
                        <span className="text-muted-foreground">({pct.toFixed(1)}%)</span>
                      </span>
                    </div>
                  )
                })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
