import { NextResponse } from "next/server"
import ExcelJS from "exceljs"
import mongoose from "mongoose"

import { auth } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import { UploadBatch } from "@/models/UploadBatch"
import { RoyaltyRecord } from "@/models/RoyaltyRecord"
import { EXPECTED_HEADERS } from "@/lib/royalty-import"

export const runtime = "nodejs"
export const maxDuration = 300

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ batchId: string }> }
) {
  const session = await auth()
  if (session?.user.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { batchId } = await params
  if (!mongoose.isValidObjectId(batchId)) {
    return NextResponse.json({ error: "Invalid batch." }, { status: 400 })
  }

  await connectToDatabase()

  const batch = await UploadBatch.findById(batchId).lean()
  if (!batch) {
    return NextResponse.json({ error: "Batch not found." }, { status: 404 })
  }

  const columns = Object.entries(EXPECTED_HEADERS) as [string, string][]

  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet("Royalty Data")
  sheet.columns = columns.map(([key, header]) => ({ header, key }))

  const cursor = RoyaltyRecord.find({ batchId }).lean().cursor()
  for await (const record of cursor) {
    sheet.addRow(record)
  }

  const buffer = await workbook.xlsx.writeBuffer()

  const safeName = (batch.fileName ?? "royalty-batch").replace(/\.xlsx$/i, "")

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${safeName}-export.xlsx"`,
    },
  })
}
