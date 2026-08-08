"use client"

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import type { MonthlyPoint } from "@/lib/royalty-analytics"
import { formatCurrencyCompact } from "@/lib/format"

export function RevenueTrendChart({
  data,
  showGrossRevenue = true,
}: {
  data: MonthlyPoint[]
  showGrossRevenue?: boolean
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Month-over-month trend</CardTitle>
        <CardDescription>
          {showGrossRevenue
            ? "Gross revenue and vendor payout by transaction month."
            : "Your payout by transaction month."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">
            No data in this range.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickFormatter={formatCurrencyCompact}
                tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                width={56}
              />
              <Tooltip
                cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
                formatter={(value) => formatCurrencyCompact(Number(value))}
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  fontSize: 12,
                  color: "var(--popover-foreground)",
                }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                height={32}
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 12, color: "var(--muted-foreground)" }}
              />
              {showGrossRevenue && (
                <Line
                  type="monotone"
                  dataKey="grossRevenue"
                  name="Gross revenue"
                  stroke="var(--chart-1)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              )}
              <Line
                type="monotone"
                dataKey="payout"
                name="Vendor payout"
                stroke="var(--chart-2)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
