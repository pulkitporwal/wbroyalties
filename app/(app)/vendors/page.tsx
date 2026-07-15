import type { Metadata } from "next"

import { connectToDatabase } from "@/lib/mongodb"
import { Admin } from "@/models/Admin"
import { VendorsTable, type VendorRow } from "./vendors-table"

export const metadata: Metadata = {
  title: "Vendors",
}

export default async function VendorsPage() {
  await connectToDatabase()
  const vendors = await Admin.find({ role: "vendor" }).sort({ createdAt: -1 }).lean()

  const rows: VendorRow[] = vendors.map((vendor) => ({
    id: vendor._id.toString(),
    name: vendor.name,
    vendorName: vendor.vendorName ?? vendor.name,
    email: vendor.email,
    status: vendor.status ?? "active",
    ottCommissionPercent: vendor.ottCommissionPercent ?? 25,
    ytCommissionPercent: vendor.ytCommissionPercent ?? 25,
    mustChangePassword: vendor.mustChangePassword ?? false,
    createdAt: vendor.createdAt?.toISOString() ?? new Date().toISOString(),
  }))

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-medium">Vendors</h1>
        <p className="text-sm text-muted-foreground">
          Vendor accounts are created automatically from uploaded reports.
          Manage commission percentages and credentials here.
        </p>
      </div>
      <VendorsTable vendors={rows} />
    </div>
  )
}
