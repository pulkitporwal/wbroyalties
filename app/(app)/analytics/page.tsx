import type { Metadata } from "next"

import { auth } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import { Admin } from "@/models/Admin"
import { getAnalytics, getFilterOptions, type AnalyticsFilters } from "@/lib/royalty-analytics"
import { FilterBar } from "./filter-bar"
import { KpiCards } from "./kpi-cards"
import { HighlightCards } from "./highlight-cards"
import { DspSplitCard } from "./dsp-split-card"
import { RevenueTrendChart } from "./revenue-trend-chart"
import { PlatformPieChart } from "./platform-pie-chart"
import { CountryChart } from "./country-chart"
import { TopPerformersCard } from "./top-performers-card"
import { ConcentrationMeter } from "./concentration-meter"
import { RevenueTypeMix } from "./revenue-type-mix"

export const metadata: Metadata = {
  title: "Analytics",
}

type SearchParams = { [key: string]: string | string[] | undefined }

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const session = await auth()
  await connectToDatabase()

  const isVendor = session?.user.role === "vendor"

  let lockedVendorId: string | undefined
  let lockedVendorName: string | undefined
  if (isVendor) {
    const vendor = await Admin.findById(session!.user.id).select({ vendorName: 1 }).lean()
    lockedVendorId = session!.user.id
    lockedVendorName = vendor?.vendorName ?? session!.user.name ?? undefined
  }

  const filters: AnalyticsFilters = {
    vendorId: isVendor ? lockedVendorId : first(params.vendor),
    dateFrom: first(params.dateFrom),
    dateTo: first(params.dateTo),
    dspBreak:
      first(params.dspBreak) === "Youtube" || first(params.dspBreak) === "Others"
        ? (first(params.dspBreak) as "Youtube" | "Others")
        : undefined,
    revDsp: first(params.revDsp),
    country: first(params.country),
    revenueType: first(params.revenueType),
    label: first(params.label),
    isrc: first(params.isrc),
    q: first(params.q),
    postedPeriodCode: first(params.postedPeriodCode),
  }

  const [analytics, filterOptions] = await Promise.all([
    getAnalytics(filters),
    isVendor ? Promise.resolve(null) : getFilterOptions(),
  ])

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-medium">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          {isVendor
            ? `Performance for ${lockedVendorName ?? "your account"}.`
            : "Royalty performance across all vendors and platforms."}
        </p>
      </div>

      <FilterBar
        options={filterOptions}
        current={filters}
        lockedVendorName={isVendor ? lockedVendorName : undefined}
      />

      <KpiCards
        summary={analytics.summary}
        showVendorCount={!isVendor}
        // showGrossRevenue={!isVendor}
      />

      <HighlightCards
        topPlatform={analytics.highlights.topPlatform}
        topCountry={analytics.highlights.topCountry}
        topTrack={analytics.highlights.topTrack}
        topLabel={analytics.highlights.topLabel}
      />

      {/* Anchor: revenue trend over time */}
      <RevenueTrendChart data={analytics.monthlyTrend} showGrossRevenue={!isVendor} />

      {/* Where the money comes from: platform + commission category */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PlatformPieChart data={analytics.platformSplit} />
        </div>
        <DspSplitCard data={analytics.dspSplit} />
      </div>

      {/* Market concentration */}
      <CountryChart
        countries={analytics.topCountries}
        totalGrossRevenue={analytics.summary.totalGrossRevenue}
      />

      {/* Pareto view: who and what drives revenue */}
      <div className="">
        <div className="">
          <TopPerformersCard
            topTracks={analytics.topTracks}
            topArtists={analytics.topArtists}
            topVendors={isVendor ? [] : analytics.topVendors}
            topLabels={analytics.topLabels}
            totalGrossRevenue={analytics.summary.totalGrossRevenue}
          />
        </div>
        {/* <ConcentrationMeter
          top10TracksRevenue={analytics.concentration.top10TracksRevenue}
          top10SharePercent={analytics.concentration.top10SharePercent}
          trackCount={analytics.concentration.trackCount}
        /> */}
      </div>

      {/* Monetization quality: volume vs. revenue per stream by customer type */}
      <RevenueTypeMix data={analytics.revenueTypeMix} />
    </div>
  )
}
