import { NextResponse } from "next/server"
import mongoose from "mongoose"

import { auth } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import { UploadBatch } from "@/models/UploadBatch"
import { RoyaltyRecord } from "@/models/RoyaltyRecord"
import { collectVendorNames, streamRoyaltyRows } from "@/lib/royalty-import"
import { ensureVendorAccounts } from "@/lib/vendor-provisioning"

export const runtime = "nodejs"
export const maxDuration = 300

export async function POST(request: Request) {
  const session = await auth()
  if (session?.user.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const formData = await request.formData()
  const file = formData.get("file")
  const replaceBatchId = formData.get("replaceBatchId")

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file was uploaded." }, { status: 400 })
  }
  if (!file.name.toLowerCase().endsWith(".xlsx")) {
    return NextResponse.json(
      { error: "Only .xlsx files are supported." },
      { status: 400 }
    )
  }
  if (
    typeof replaceBatchId === "string" &&
    replaceBatchId.length > 0 &&
    !mongoose.isValidObjectId(replaceBatchId)
  ) {
    return NextResponse.json({ error: "Invalid batch to replace." }, { status: 400 })
  }

  await connectToDatabase()

  const batch = await UploadBatch.create({
    fileName: file.name,
    uploadedById: session.user.id,
    uploadedByName: session.user.name ?? session.user.email ?? "Super Admin",
    status: "processing",
  })

  try {
    const buffer = Buffer.from(await file.arrayBuffer())

    const vendorNames = await collectVendorNames(buffer)
    const { vendorIdByName, newVendors } = await ensureVendorAccounts(vendorNames)

    if (typeof replaceBatchId === "string" && replaceBatchId.length > 0) {
      await RoyaltyRecord.deleteMany({ batchId: replaceBatchId })
    }

    const { rowCount, skippedRowCount } = await streamRoyaltyRows(buffer, async (rows) => {
      const docs = rows.map((row) => ({
        ...row,
        batchId: batch._id,
        vendorId: vendorIdByName.get(row.vendorName) ?? null,
      }))
      await RoyaltyRecord.insertMany(docs, { ordered: false })
    })

    await UploadBatch.findByIdAndUpdate(batch._id, {
      status: "completed",
      rowCount,
      skippedRowCount,
      vendorsCreated: newVendors.length,
    })

    return NextResponse.json({
      batchId: batch._id.toString(),
      rowCount,
      skippedRowCount,
      newVendors,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Import failed."
    await UploadBatch.findByIdAndUpdate(batch._id, {
      status: "failed",
      errorMessage,
    })
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
