import { Disc3, Globe2, Radio } from "lucide-react"
import type { LucideIcon } from "lucide-react"

import {
  Card,
  CardHeader,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { formatCurrency, formatNumber } from "@/lib/format"
import type { RankedRow } from "@/lib/royalty-analytics"

type Highlight = (RankedRow & { share: number }) | null

function HighlightCard({
  label,
  icon: Icon,
  highlight,
}: {
  label: string
  icon: LucideIcon
  highlight: Highlight
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardDescription>{label}</CardDescription>
        <div className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Icon className="size-3.5" />
        </div>
      </CardHeader>
      <CardContent>
        {highlight ? (
          <div className="flex flex-col gap-1">
            <span className="truncate font-heading text-lg font-medium text-foreground">
              {highlight.label}
            </span>
            <span className="text-muted-foreground">
              {formatCurrency(highlight.grossRevenue)} · {highlight.share.toFixed(1)}% of revenue ·{" "}
              {formatNumber(highlight.units)} units
            </span>
          </div>
        ) : (
          <span className="text-muted-foreground">No data</span>
        )}
      </CardContent>
    </Card>
  )
}

export function HighlightCards({
  topPlatform,
  topCountry,
  topTrack,
}: {
  topPlatform: Highlight
  topCountry: Highlight
  topTrack: Highlight
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <HighlightCard label="Top platform" icon={Radio} highlight={topPlatform} />
      <HighlightCard label="Top country" icon={Globe2} highlight={topCountry} />
      <HighlightCard label="Top track" icon={Disc3} highlight={topTrack} />
    </div>
  )
}
