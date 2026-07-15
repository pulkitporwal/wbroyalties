import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import type { DspSplitPoint } from "@/lib/royalty-analytics"
import { formatCurrency } from "@/lib/format"

export function DspSplitCard({ data }: { data: DspSplitPoint[] }) {
  const others = data.find((d) => d.dspBreak === "Others")
  const youtube = data.find((d) => d.dspBreak === "Youtube")
  const othersRevenue = others?.grossRevenue ?? 0
  const youtubeRevenue = youtube?.grossRevenue ?? 0
  const total = othersRevenue + youtubeRevenue

  const othersPct = total > 0 ? (othersRevenue / total) * 100 : 0
  const youtubePct = total > 0 ? (youtubeRevenue / total) * 100 : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>OTT vs YouTube</CardTitle>
        <CardDescription>Share of gross revenue by commission category.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {total === 0 ? (
          <p className="text-muted-foreground">No revenue in this range.</p>
        ) : (
          <>
            <div className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-chart-1"
                style={{ width: `${othersPct}%` }}
                title={`OTT: ${formatCurrency(othersRevenue)}`}
              />
              <div
                className="h-full rounded-full bg-chart-2"
                style={{ width: `${youtubePct}%` }}
                title={`YouTube: ${formatCurrency(youtubeRevenue)}`}
              />
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full bg-chart-1" />
                  OTT (Others)
                </span>
                <span className="font-medium text-foreground">
                  {formatCurrency(othersRevenue)}{" "}
                  <span className="text-muted-foreground">
                    ({othersPct.toFixed(1)}%)
                  </span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full bg-chart-2" />
                  YouTube
                </span>
                <span className="font-medium text-foreground">
                  {formatCurrency(youtubeRevenue)}{" "}
                  <span className="text-muted-foreground">
                    ({youtubePct.toFixed(1)}%)
                  </span>
                </span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
