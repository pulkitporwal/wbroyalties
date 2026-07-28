import type { Metadata } from "next"

import { auth } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import { Admin } from "@/models/Admin"
import { getFilterOptions } from "@/lib/royalty-analytics"
import { ReportFilterCard } from "./report-filter-card"
import { SimpleDownloadCard } from "./simple-download-card"

export const metadata: Metadata = {
  title: "Reports",
}

export default async function ReportsPage() {
  const session = await auth()
  await connectToDatabase()

  const isVendor = session?.user.role === "vendor"
  const isSuperAdmin = session?.user.role === "super_admin"

  let lockedVendorName: string | undefined
  if (isVendor) {
    const vendor = await Admin.findById(session!.user.id).select({ vendorName: 1 }).lean()
    lockedVendorName = vendor?.vendorName ?? session!.user.name ?? undefined
  }

  const filterOptions = isVendor ? null : await getFilterOptions()

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-medium">Reports</h1>
        <p className="text-sm text-muted-foreground">
          {isVendor
            ? "Download statements and summaries for your own catalogue."
            : "Download royalty data and operational reports across all vendors."}
        </p>
      </div>

      <ReportFilterCard
        title={isVendor ? "My Royalty Statement" : "Royalty Detail Report"}
        description={
          isVendor
            ? "Every transaction row for your catalogue, matching the raw import format."
            : "Every transaction row across vendors, matching the raw import format."
        }
        apiPath="/api/reports/detail"
        vendorOptions={filterOptions?.vendors}
        lockedVendorName={isVendor ? lockedVendorName : undefined}
        revDspOptions={filterOptions?.revDspOptions}
        countryOptions={filterOptions?.countryOptions}
      />

      <ReportFilterCard
        title={isVendor ? "My Monthly Summary" : "Vendor Summary Report"}
        description={
          isVendor
            ? "Gross revenue, payout, and units grouped by month."
            : "Gross revenue, payout, and units grouped by vendor and month."
        }
        apiPath="/api/reports/summary"
        vendorOptions={filterOptions?.vendors}
        lockedVendorName={isVendor ? lockedVendorName : undefined}
        revDspOptions={filterOptions?.revDspOptions}
        countryOptions={filterOptions?.countryOptions}
      />

      {!isVendor && (
        <SimpleDownloadCard
          title="Vendor Directory"
          description="All vendors with contact details, status, and commission rates."
          href="/api/reports/vendors"
        />
      )}

      {isSuperAdmin && (
        <SimpleDownloadCard
          title="Upload Batch History"
          description="Every file import with row counts and status."
          href="/api/reports/batches"
        />
      )}
    </div>
  )
}
