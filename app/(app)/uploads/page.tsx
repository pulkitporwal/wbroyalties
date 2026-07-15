import type { Metadata } from "next"

import { connectToDatabase } from "@/lib/mongodb"
import { UploadBatch } from "@/models/UploadBatch"
import { UploadForm } from "./upload-form"
import { BatchHistoryTable, type BatchRow } from "./batch-history-table"

export const metadata: Metadata = {
  title: "Uploads",
}

export default async function UploadsPage() {
  await connectToDatabase()
  const batches = await UploadBatch.find().sort({ createdAt: -1 }).limit(50).lean()

  const rows: BatchRow[] = batches.map((batch) => ({
    id: batch._id.toString(),
    fileName: batch.fileName,
    uploadedByName: batch.uploadedByName,
    rowCount: batch.rowCount ?? 0,
    skippedRowCount: batch.skippedRowCount ?? 0,
    vendorsCreated: batch.vendorsCreated ?? 0,
    status: batch.status ?? "processing",
    errorMessage: batch.errorMessage,
    createdAt: batch.createdAt?.toISOString() ?? new Date().toISOString(),
  }))

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-medium">Uploads</h1>
        <p className="text-sm text-muted-foreground">
          Import an OTT/streaming royalty report (.xlsx). Vendors found in the
          file are created automatically as portal accounts.
        </p>
      </div>

      <UploadForm batches={rows} />

      <BatchHistoryTable batches={rows} />
    </div>
  )
}
