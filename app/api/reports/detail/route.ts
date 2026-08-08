import { NextResponse } from "next/server"

import { auth } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import { Admin } from "@/models/Admin"
import { buildDetailWorkbook, type ReportFilters } from "@/lib/reports"

export const runtime = "nodejs"
export const maxDuration = 300

function param(searchParams: URLSearchParams, key: string) {
  return searchParams.get(key) ?? undefined
}

export async function GET(request: Request) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const isVendor = session.user.role === "vendor"
  const dspBreak = param(searchParams, "dspBreak")

  const filters: ReportFilters = {
    vendorId: isVendor ? session.user.id : param(searchParams, "vendorId"),
    dateFrom: param(searchParams, "dateFrom"),
    dateTo: param(searchParams, "dateTo"),
    dspBreak: dspBreak === "Youtube" || dspBreak === "Others" ? dspBreak : undefined,
    revDsp: param(searchParams, "revDsp"),
    country: param(searchParams, "country"),
    revenueType: param(searchParams, "revenueType"),
    label: param(searchParams, "label"),
    isrc: param(searchParams, "isrc"),
  }

  await connectToDatabase()

  let vendorCommission: { ytCommissionPercent: number; ottCommissionPercent: number } | undefined
  if (isVendor) {
    const vendor = await Admin.findById(session.user.id)
      .select({ ytCommissionPercent: 1, ottCommissionPercent: 1 })
      .lean()
    vendorCommission = {
      ytCommissionPercent: vendor?.ytCommissionPercent ?? 75,
      ottCommissionPercent: vendor?.ottCommissionPercent ?? 75,
    }
  }

  const workbook = await buildDetailWorkbook(filters, vendorCommission)
  const buffer = await workbook.xlsx.writeBuffer()

  const filenamePrefix = isVendor ? "my-royalty-statement" : "royalty-detail-report"

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filenamePrefix}-${Date.now()}.xlsx"`,
    },
  })
}
