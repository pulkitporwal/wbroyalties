"use client"

import { useMemo, useState } from "react"
import { Download } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"

const ALL = "__all__"

export function ReportFilterCard({
  title,
  description,
  apiPath,
  vendorOptions,
  lockedVendorName,
  revDspOptions,
  countryOptions,
}: {
  title: string
  description: string
  apiPath: "/api/reports/detail" | "/api/reports/summary"
  vendorOptions?: { id: string; vendorName: string }[]
  lockedVendorName?: string
  revDspOptions?: string[]
  countryOptions?: string[]
}) {
  const [vendor, setVendor] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [dspBreak, setDspBreak] = useState("")
  const [revDsp, setRevDsp] = useState("")
  const [country, setCountry] = useState("")

  const href = useMemo(() => {
    const params = new URLSearchParams()
    if (vendor) params.set("vendorId", vendor)
    if (dateFrom) params.set("dateFrom", dateFrom)
    if (dateTo) params.set("dateTo", dateTo)
    if (dspBreak) params.set("dspBreak", dspBreak)
    if (revDsp) params.set("revDsp", revDsp)
    if (country) params.set("country", country)
    const query = params.toString()
    return query ? `${apiPath}?${query}` : apiPath
  }, [apiPath, vendor, dateFrom, dateTo, dspBreak, revDsp, country])

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-end gap-3">
        {lockedVendorName ? (
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">Vendor</span>
            <span className="flex h-7 items-center rounded-md border border-input bg-input/20 px-2 text-xs">
              {lockedVendorName}
            </span>
          </div>
        ) : (
          vendorOptions && (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-muted-foreground">Vendor</span>
              <Select
                value={vendor || ALL}
                onValueChange={(value) => setVendor(value === ALL ? "" : (value ?? ""))}
              >
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="All vendors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All vendors</SelectItem>
                  {vendorOptions.map((v) => (
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
            className="w-36"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-muted-foreground">To</span>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-36"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-muted-foreground">Category</span>
          <Select
            value={dspBreak || ALL}
            onValueChange={(value) => setDspBreak(value === ALL ? "" : (value ?? ""))}
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

        {revDspOptions && revDspOptions.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">Platform</span>
            <Select
              value={revDsp || ALL}
              onValueChange={(value) => setRevDsp(value === ALL ? "" : (value ?? ""))}
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder="All platforms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All platforms</SelectItem>
                {revDspOptions.map((platform) => (
                  <SelectItem key={platform} value={platform}>
                    {platform}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {countryOptions && countryOptions.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">Country</span>
            <Select
              value={country || ALL}
              onValueChange={(value) => setCountry(value === ALL ? "" : (value ?? ""))}
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder="All countries" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All countries</SelectItem>
                {countryOptions.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <Button render={<a href={href} download />}>
          <Download data-icon="inline-start" />
          Download
        </Button>
      </CardContent>
    </Card>
  )
}
