import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, UploadCloud } from "lucide-react"

import { auth } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import { UploadBatch } from "@/models/UploadBatch"
import { getAnalytics } from "@/lib/royalty-analytics"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { formatNumber } from "@/lib/format"
import { KpiCards } from "../analytics/kpi-cards"
import { HighlightCards } from "../analytics/highlight-cards"
import { RevenueTrendChart } from "../analytics/revenue-trend-chart"

export const metadata: Metadata = {
  title: "Dashboard",
}

const statusVariant = {
  completed: "default",
  processing: "outline",
  failed: "destructive",
} as const

export default async function DashboardPage() {
  const session = await auth()
  await connectToDatabase()

  const [analytics, recentUploads] = await Promise.all([
    getAnalytics({}),
    UploadBatch.find().sort({ createdAt: -1 }).limit(5).lean(),
  ])

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-medium">
          Welcome back, {session?.user.name}
        </h1>
        <p className="text-sm text-muted-foreground">
          A quick overview of business performance across all vendors.
        </p>
      </div>

      <KpiCards summary={analytics.summary} />

      <HighlightCards
        topPlatform={analytics.highlights.topPlatform}
        topCountry={analytics.highlights.topCountry}
        topTrack={analytics.highlights.topTrack}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RevenueTrendChart data={analytics.monthlyTrend} />
        </div>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Recent uploads</CardTitle>
              <CardDescription>Latest report imports.</CardDescription>
            </div>
            <div className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
              <UploadCloud className="size-3.5" />
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {recentUploads.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No uploads yet.
              </p>
            ) : (
              recentUploads.map((batch) => (
                <div
                  key={batch._id.toString()}
                  className="flex items-center justify-between gap-2 border-b border-neutral-400/10 pb-3 last:border-0 last:pb-0"
                >
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-medium text-foreground">
                      {batch.fileName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatNumber(batch.rowCount ?? 0)} rows &middot;{" "}
                      {batch.createdAt
                        ? new Date(batch.createdAt).toLocaleDateString("en-IN")
                        : "—"}
                    </span>
                  </div>
                  <Badge variant={statusVariant[batch.status ?? "processing"]}>
                    {batch.status ?? "processing"}
                  </Badge>
                </div>
              ))
            )}

            <Button variant="outline" size="sm" className="mt-1" render={<Link href="/uploads" />}>
              View all uploads
              <ArrowRight />
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button variant="ghost" size="sm" render={<Link href="/analytics" />}>
          Go to full analytics
          <ArrowRight />
        </Button>
      </div>
    </div>
  )
}
