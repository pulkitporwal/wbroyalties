import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { formatCurrency, formatNumber } from "@/lib/format"

export function ConcentrationMeter({
  top10TracksRevenue,
  top10SharePercent,
  trackCount,
}: {
  top10TracksRevenue: number
  top10SharePercent: number
  trackCount: number
}) {
  const isHitDriven = top10SharePercent >= 30

  return (
    <Card>
      <CardHeader>
        <CardTitle>Catalog concentration</CardTitle>
        <CardDescription>
          {isHitDriven
            ? "Hit-driven — a small set of tracks carries the business."
            : "Catalog-driven — revenue is spread across the long tail."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <span className="font-heading text-2xl font-medium text-foreground">
            {top10SharePercent.toFixed(1)}%
          </span>
          <span className="text-muted-foreground">
            of revenue from the top 10 tracks
          </span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-chart-1"
            style={{ width: `${Math.min(100, top10SharePercent)}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-muted-foreground">
          <span>{formatCurrency(top10TracksRevenue)} from top 10</span>
          <span>{formatNumber(trackCount)} tracks total</span>
        </div>
      </CardContent>
    </Card>
  )
}
