import { Disc3, HandCoins, IndianRupee, Layers, TrendingUp, Users2 } from "lucide-react"

import {
  Card,
  CardHeader,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { formatCurrency, formatNumber } from "@/lib/format"

export function KpiCards({
  summary,
  showVendorCount = true,
  showGrossRevenue = false,
}: {
  summary: {
    totalGrossRevenue: number
    totalPayout: number
    totalUnits: number
    totalRows: number
    vendorCount: number
    trackCount: number
    revenuePerStream: number
  }
  showVendorCount?: boolean
  showGrossRevenue?: boolean
}) {
  const stats = [
    ...(showGrossRevenue
      ? [
          {
            label: "Gross revenue",
            value: formatCurrency(summary.totalGrossRevenue),
            icon: IndianRupee,
          },
        ]
      : []),
    {
      label: "Vendor payout",
      value: formatCurrency(summary.totalPayout),
      icon: HandCoins,
    },
    {
      label: "Units sold",
      value: formatNumber(summary.totalUnits),
      icon: Layers,
    },
    {
      label: "Revenue / stream",
      value: formatCurrency(summary.revenuePerStream),
      icon: TrendingUp,
    },
    {
      label: "Tracks in catalog",
      value: formatNumber(summary.trackCount),
      icon: Disc3,
    },
    ...(showVendorCount
      ? [
          {
            label: "Vendors",
            value: formatNumber(summary.vendorCount),
            icon: Users2,
          },
        ]
      : []),
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {stats.map(({ label, value, icon: Icon }) => (
        <Card key={label}>
          <CardHeader className="flex-row items-center justify-between">
            <CardDescription>{label}</CardDescription>
            <div className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Icon className="size-3.5" />
            </div>
          </CardHeader>
          <CardContent>
            <span className="font-heading text-xl font-medium text-foreground">
              {value}
            </span>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
