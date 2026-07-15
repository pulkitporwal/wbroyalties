import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { formatCurrency } from "@/lib/format"
import type { CountryRow } from "@/lib/royalty-analytics"

export function CountryChart({
  countries,
  totalGrossRevenue,
}: {
  countries: CountryRow[]
  totalGrossRevenue: number
}) {
  const top10Share = countries.reduce((sum, row) => sum + row.share, 0)
  const restShare = Math.max(0, 100 - top10Share)
  const restRevenue = Math.max(0, totalGrossRevenue - countries.reduce((s, r) => s + r.grossRevenue, 0))
  const maxRevenue = Math.max(1, ...countries.map((row) => row.grossRevenue))
  const topCountry = countries[0]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue by country</CardTitle>
        <CardDescription>
          {topCountry
            ? `${topCountry.label} accounts for ${topCountry.share.toFixed(1)}% of gross revenue.`
            : "Market concentration by country."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {countries.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">No data in this range.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {countries.map((row) => (
              <div key={row.label} className="flex items-center gap-3">
                <span className="w-24 shrink-0 truncate">{row.label}</span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-chart-1"
                    style={{ width: `${(row.grossRevenue / maxRevenue) * 100}%` }}
                  />
                </div>
                <span className="w-32 shrink-0 text-right text-muted-foreground">
                  {formatCurrency(row.grossRevenue)}{" "}
                  <span className="text-foreground">({row.share.toFixed(1)}%)</span>
                </span>
              </div>
            ))}
            {restRevenue > 0 && (
              <div className="flex items-center gap-3 border-t border-border pt-3">
                <span className="w-24 shrink-0 truncate text-muted-foreground">Rest of world</span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-muted-foreground/50"
                    style={{ width: `${(restRevenue / maxRevenue) * 100}%` }}
                  />
                </div>
                <span className="w-32 shrink-0 text-right text-muted-foreground">
                  {formatCurrency(restRevenue)}{" "}
                  <span className="text-foreground">({restShare.toFixed(1)}%)</span>
                </span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
