import { NextResponse } from "next/server"
import mongoose from "mongoose"

import { auth } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import { UploadBatch } from "@/models/UploadBatch"

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

  const batch = await UploadBatch.findById(batchId)
    .select("status rowCount skippedRowCount vendorsCreated totalRowCount processedRowCount errorMessage")
    .lean()
  if (!batch) {
    return NextResponse.json({ error: "Batch not found." }, { status: 404 })
  }

  return NextResponse.json({
    status: batch.status,
    rowCount: batch.rowCount ?? 0,
    skippedRowCount: batch.skippedRowCount ?? 0,
    vendorsCreated: batch.vendorsCreated ?? 0,
    totalRowCount: batch.totalRowCount ?? 0,
    processedRowCount: batch.processedRowCount ?? 0,
    errorMessage: batch.errorMessage ?? null,
  })
}
