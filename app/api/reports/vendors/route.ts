import { NextResponse } from "next/server"
import ExcelJS from "exceljs"

import { auth } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import { Admin } from "@/models/Admin"

export const runtime = "nodejs"

export async function GET() {
  const session = await auth()
  if (session?.user.role !== "super_admin" && session?.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  await connectToDatabase()

  const vendors = await Admin.find({ role: "vendor" })
    .sort({ vendorName: 1 })
    .select({
      vendorName: 1,
      name: 1,
      email: 1,
      status: 1,
      ottCommissionPercent: 1,
      ytCommissionPercent: 1,
      createdAt: 1,
    })
    .lean()

  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet("Vendors")
  sheet.columns = [
    { header: "Vendor Name", key: "vendorName", width: 28 },
    { header: "Contact Name", key: "name", width: 22 },
    { header: "Email", key: "email", width: 28 },
    { header: "Status", key: "status", width: 12 },
    { header: "OTT Commission %", key: "ottCommissionPercent", width: 16 },
    { header: "YouTube Commission %", key: "ytCommissionPercent", width: 18 },
    { header: "Created", key: "createdAt", width: 14 },
  ]
  for (const vendor of vendors) {
    sheet.addRow({
      vendorName: vendor.vendorName ?? "",
      name: vendor.name,
      email: vendor.email,
      status: vendor.status,
      ottCommissionPercent: vendor.ottCommissionPercent,
      ytCommissionPercent: vendor.ytCommissionPercent,
      createdAt: vendor.createdAt ? new Date(vendor.createdAt).toISOString().slice(0, 10) : "",
    })
  }

  const buffer = await workbook.xlsx.writeBuffer()

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="vendor-directory-${Date.now()}.xlsx"`,
    },
  })
}
