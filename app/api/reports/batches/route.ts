import { NextResponse } from "next/server"
import ExcelJS from "exceljs"

import { auth } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import { UploadBatch } from "@/models/UploadBatch"

export const runtime = "nodejs"

export async function GET() {
  const session = await auth()
  if (session?.user.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  await connectToDatabase()

  const batches = await UploadBatch.find().sort({ createdAt: -1 }).lean()

  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet("Upload Batches")
  sheet.columns = [
    { header: "File Name", key: "fileName", width: 32 },
    { header: "Uploaded By", key: "uploadedByName", width: 22 },
    { header: "Rows Imported", key: "rowCount", width: 16 },
    { header: "Skipped Rows", key: "skippedRowCount", width: 14 },
    { header: "New Vendors", key: "vendorsCreated", width: 14 },
    { header: "Status", key: "status", width: 12 },
    { header: "Uploaded At", key: "createdAt", width: 20 },
  ]
  for (const batch of batches) {
    sheet.addRow({
      fileName: batch.fileName,
      uploadedByName: batch.uploadedByName,
      rowCount: batch.rowCount,
      skippedRowCount: batch.skippedRowCount,
      vendorsCreated: batch.vendorsCreated,
      status: batch.status,
      createdAt: batch.createdAt
        ? new Date(batch.createdAt).toISOString().slice(0, 19).replace("T", " ")
        : "",
    })
  }

  const buffer = await workbook.xlsx.writeBuffer()

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="upload-batches-${Date.now()}.xlsx"`,
    },
  })
}
