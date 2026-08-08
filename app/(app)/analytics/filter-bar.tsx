"use client"

import { useRouter, usePathname } from "next/navigation"
import { useState } from "react"
import { X } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import type { AnalyticsFilters, FilterOptions } from "@/lib/royalty-analytics"
import { SearchCombobox } from "./search-combobox"

type IsrcResult = { isrc: string; productTitle: string | null; productArtistName: string | null }
type TrackResult = { isrc: string | null; productTitle: string | null; productArtistName: string | null }

async function fetchIsrcSuggestions(query: string): Promise<IsrcResult[]> {
  const res = await fetch(`/api/analytics/isrc-search?q=${encodeURIComponent(query)}`)
  const data = await res.json()
  return data.results ?? []
}

async function fetchTrackSuggestions(query: string): Promise<TrackResult[]> {
  const res = await fetch(`/api/analytics/track-search?q=${encodeURIComponent(query)}`)
  const data = await res.json()
  return data.results ?? []
}

const ALL = "__all__"

export function FilterBar({
  options,
  current,
  lockedVendorName,
}: {
  options: FilterOptions | null
  current: AnalyticsFilters
  lockedVendorName?: string
}) {
  const router = useRouter()
  const pathname = usePathname()

  const [vendor, setVendor] = useState(current.vendorId ?? "")
  const [dateFrom, setDateFrom] = useState(current.dateFrom ?? "")
  const [dateTo, setDateTo] = useState(current.dateTo ?? "")
  const [dspBreak, setDspBreak] = useState(current.dspBreak ?? "")
  const [revDsp, setRevDsp] = useState(current.revDsp ?? "")
  const [country, setCountry] = useState(current.country ?? "")
  const [revenueType, setRevenueType] = useState(current.revenueType ?? "")
  const [label, setLabel] = useState(current.label ?? "")
  const [isrc, setIsrc] = useState(current.isrc ?? "")
  const [q, setQ] = useState(current.q ?? "")
  const [postedPeriodCode, setPostedPeriodCode] = useState(current.postedPeriodCode ?? "")

  function apply(overrides: Partial<Record<string, string>> = {}) {
    const next = {
      vendor,
      dateFrom,
      dateTo,
      dspBreak,
      revDsp,
      country,
      revenueType,
      label,
      isrc,
      q,
      postedPeriodCode,
      ...overrides,
    }

    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(next)) {
      if (value) params.set(key, value)
    }

    router.push(`${pathname}?${params.toString()}`)
  }

  function clearAll() {
    setVendor("")
    setDateFrom("")
    setDateTo("")
    setDspBreak("")
    setRevDsp("")
    setCountry("")
    setRevenueType("")
    setLabel("")
    setIsrc("")
    setQ("")
    setPostedPeriodCode("")
    router.push(pathname)
  }

  return (
    <Card>
      <CardContent className="flex flex-wrap items-end gap-3">
        {lockedVendorName ? (
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">Vendor</span>
            <span className="flex h-7 items-center rounded-md border border-input bg-input/20 px-2 text-xs">
              {lockedVendorName}
            </span>
          </div>
        ) : (
          options && (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-muted-foreground">Vendor</span>
              <Select
                value={vendor || ALL}
                onValueChange={(value) => {
                  const next = value === ALL ? "" : (value ?? "")
                  setVendor(next)
                  apply({ vendor: next })
                }}
              >
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="All vendors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All vendors</SelectItem>
                  {options.vendors.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.vendorName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )
        )}

        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-muted-foreground">From</span>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            onBlur={() => apply()}
            className="w-36"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-muted-foreground">To</span>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            onBlur={() => apply()}
            className="w-36"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-muted-foreground">Category</span>
          <Select
            value={dspBreak || ALL}
            onValueChange={(value) => {
              const next = value === ALL ? "" : (value ?? "")
              setDspBreak(next)
              apply({ dspBreak: next })
            }}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All</SelectItem>
              <SelectItem value="Others">OTT</SelectItem>
              <SelectItem value="Youtube">YouTube</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {options && options.revDspOptions.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">Platform</span>
            <Select
              value={revDsp || ALL}
              onValueChange={(value) => {
                const next = value === ALL ? "" : (value ?? "")
                setRevDsp(next)
                apply({ revDsp: next })
              }}
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder="All platforms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All platforms</SelectItem>
                {options.revDspOptions.map((platform) => (
                  <SelectItem key={platform} value={platform}>
                    {platform}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {options && options.countryOptions.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">Country</span>
            <Select
              value={country || ALL}
              onValueChange={(value) => {
                const next = value === ALL ? "" : (value ?? "")
                setCountry(next)
                apply({ country: next })
              }}
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder="All countries" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All countries</SelectItem>
                {options.countryOptions.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {options && options.revenueTypeOptions.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">Customer type</span>
            <Select
              value={revenueType || ALL}
              onValueChange={(value) => {
                const next = value === ALL ? "" : (value ?? "")
                setRevenueType(next)
                apply({ revenueType: next })
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All types</SelectItem>
                {options.revenueTypeOptions.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {options && options.labelOptions.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">Label</span>
            <Select
              value={label || ALL}
              onValueChange={(value) => {
                const next = value === ALL ? "" : (value ?? "")
                setLabel(next)
                apply({ label: next })
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All labels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All labels</SelectItem>
                {options.labelOptions.map((l) => (
                  <SelectItem key={l} value={l}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {options && options.postedPeriodCodeOptions.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">Posted Period Code</span>
            <Select
              value={postedPeriodCode || ALL}
              onValueChange={(value) => {
                const next = value === ALL ? "" : (value ?? "")
                setPostedPeriodCode(next)
                apply({ postedPeriodCode: next })
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All periods" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All periods</SelectItem>
                {options.postedPeriodCodeOptions.map((code) => (
                  <SelectItem key={code} value={code}>
                    {code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <SearchCombobox<IsrcResult>
          label="ISRC"
          placeholder="Search ISRC..."
          displayValue={isrc}
          hasValue={isrc.length > 0}
          search={fetchIsrcSuggestions}
          getResultKey={(item) => item.isrc}
          className="w-44"
          renderResult={(item) => (
            <>
              <span className="font-mono text-[0.7rem] text-foreground">{item.isrc}</span>
              {item.productTitle && (
                <span className="truncate text-[0.7rem] text-muted-foreground">
                  {item.productTitle}
                  {item.productArtistName ? ` — ${item.productArtistName}` : ""}
                </span>
              )}
            </>
          )}
          onSelect={(item) => {
            setIsrc(item.isrc)
            apply({ isrc: item.isrc })
          }}
          onClear={() => {
            setIsrc("")
            apply({ isrc: "" })
          }}
        />

        <SearchCombobox<TrackResult>
          label="Search"
          placeholder="Track, artist, ISRC..."
          displayValue={q}
          hasValue={q.length > 0}
          search={fetchTrackSuggestions}
          getResultKey={(item) => `${item.isrc ?? ""}-${item.productTitle ?? ""}`}
          className="min-w-40 flex-1"
          renderResult={(item) => (
            <>
              <span className="truncate text-[0.7rem] text-foreground">
                {item.productTitle ?? "Untitled"}
              </span>
              <span className="truncate text-[0.7rem] text-muted-foreground">
                {[item.productArtistName, item.isrc].filter(Boolean).join(" — ")}
              </span>
            </>
          )}
          onSelect={(item) => {
            const next = item.isrc ?? item.productTitle ?? ""
            setQ(next)
            apply({ q: next })
          }}
          onClear={() => {
            setQ("")
            apply({ q: "" })
          }}
        />

        <Button variant="secondary" onClick={() => apply()}>
          Apply
        </Button>
        <Button variant="ghost" onClick={clearAll}>
          <X data-icon="inline-start" />
          Clear
        </Button>
      </CardContent>
    </Card>
  )
}
