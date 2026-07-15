import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { formatCurrency, formatNumber } from "@/lib/format"
import type { RevenueTypeRow } from "@/lib/royalty-analytics"

const ROW_COLORS = ["bg-chart-1", "bg-chart-2", "bg-chart-3", "bg-chart-4", "bg-chart-5"]

export function RevenueTypeMix({ data }: { data: RevenueTypeRow[] }) {
  const maxRevenue = Math.max(1, ...data.map((row) => row.grossRevenue))
  const maxPerStream = Math.max(1, ...data.map((row) => row.revenuePerStream))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monetization mix</CardTitle>
        <CardDescription>
          Revenue by customer type — volume vs. how well each type actually pays per stream.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">No data in this range.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {data.map((row, index) => (
              <div key={row.revenueType} className="flex flex-col gap-1.5">
                <div className="flex items-baseline justify-between">
                  <span className="flex items-center gap-2 font-medium text-foreground">
                    <span
                      className={`size-2.5 rounded-full ${ROW_COLORS[index % ROW_COLORS.length]}`}
                    />
                    {row.revenueType}
                  </span>
                  <span className="text-muted-foreground">
                    {formatCurrency(row.grossRevenue)} · {formatNumber(row.units)} units
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full ${ROW_COLORS[index % ROW_COLORS.length]}`}
                    style={{ width: `${(row.grossRevenue / maxRevenue) * 100}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[0.7rem] text-muted-foreground">
                  <span>Revenue / stream</span>
                  <span className="font-medium text-foreground">
                    {formatCurrency(row.revenuePerStream)}
                  </span>
                </div>
                <div className="h-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-foreground/30"
                    style={{ width: `${(row.revenuePerStream / maxPerStream) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
