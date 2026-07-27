"use client"

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatCurrency, formatNumber } from "@/lib/format"
import type { RankedRow } from "@/lib/royalty-analytics"

export function RankedList({ rows, totalGrossRevenue }: { rows: RankedRow[]; totalGrossRevenue: number }) {
  const maxRevenue = Math.max(1, ...rows.map((row) => row.grossRevenue))

  if (rows.length === 0) {
    return <p className="py-8 text-center text-muted-foreground">No data.</p>
  }

  return (
    <div className="flex max-h-96 flex-col gap-3 overflow-y-auto pr-1">
      {rows.map((row, index) => {
        const pct = totalGrossRevenue > 0 ? (row.grossRevenue / totalGrossRevenue) * 100 : 0
        const barPct = (row.grossRevenue / maxRevenue) * 100
        return (
          <div key={row.label} className="flex items-center gap-3">
            <span className="w-4 shrink-0 text-right text-muted-foreground">{index + 1}</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate font-medium text-foreground">{row.label}</span>
                <span className="shrink-0 text-right">
                  {formatCurrency(row.grossRevenue)}{" "}
                  <span className="text-muted-foreground">({pct.toFixed(1)}%)</span>
                </span>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-chart-1"
                    style={{ width: `${barPct}%` }}
                  />
                </div>
                <span className="w-16 shrink-0 text-right text-[0.7rem] text-muted-foreground">
                  {formatNumber(row.units)} units
                </span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function TopPerformersCard({
  topTracks,
  topArtists,
  topVendors,
  topLabels,
  totalGrossRevenue,
}: {
  topTracks: RankedRow[]
  topArtists: RankedRow[]
  topVendors: RankedRow[]
  topLabels: RankedRow[]
  totalGrossRevenue: number
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top performers</CardTitle>
        <CardDescription>The Pareto view — who and what drives the revenue.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="labels">
          <TabsList>
            <TabsTrigger value="labels">Labels</TabsTrigger>
            <TabsTrigger value="tracks">Tracks</TabsTrigger>
            <TabsTrigger value="artists">Artists</TabsTrigger>
            {topVendors.length > 0 && <TabsTrigger value="vendors">Vendors</TabsTrigger>}
          </TabsList>
          <TabsContent value="labels" className="pt-4">
            <RankedList rows={topLabels} totalGrossRevenue={totalGrossRevenue} />
          </TabsContent>
          <TabsContent value="tracks" className="pt-4">
            <RankedList rows={topTracks} totalGrossRevenue={totalGrossRevenue} />
          </TabsContent>
          <TabsContent value="artists" className="pt-4">
            <RankedList rows={topArtists} totalGrossRevenue={totalGrossRevenue} />
          </TabsContent>
          {topVendors.length > 0 && (
            <TabsContent value="vendors" className="pt-4">
              <RankedList rows={topVendors} totalGrossRevenue={totalGrossRevenue} />
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  )
}
