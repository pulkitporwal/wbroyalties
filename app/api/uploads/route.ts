import mongoose from "mongoose"
import { del } from "@vercel/blob"

import { auth } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import { UploadBatch } from "@/models/UploadBatch"
import { RoyaltyRecord } from "@/models/RoyaltyRecord"
import { IsrcClaim } from "@/models/IsrcClaim"
import {
  streamRoyaltyRowsFromUrl,
  type ParsedRoyaltyRow,
} from "@/lib/royalty-import"
import { ensureVendorAccounts, type NewVendorCredential } from "@/lib/vendor-provisioning"

export const runtime = "nodejs"
export const maxDuration = 300

type UploadEvent =
  | { type: "file"; bytesRead: number; totalBytes: number | null }
  | { type: "progress"; processedRowCount: number; failedRowCount: number }
  | {
      type: "done"
      batchId: string
      rowCount: number
      skippedRowCount: number
      failedRowCount: number
      newVendors: { vendorName: string; email: string; tempPassword: string }[]
    }
  | { type: "error"; error: string }

const ISRC_CLAIM_FLUSH_SIZE = 1_000

export async function POST(request: Request) {
  const encoder = new TextEncoder()

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      function send(event: UploadEvent) {
        controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"))
      }

      let batchId: mongoose.Types.ObjectId | null = null
      let blobUrlToDelete: string | null = null

      try {
        const session = await auth()
        if (session?.user.role !== "super_admin") {
          send({ type: "error", error: "Forbidden" })
          return
        }

        let body: { blobUrl?: unknown; fileName?: unknown; replaceBatchId?: unknown }
        try {
          body = await request.json()
        } catch {
          send({ type: "error", error: "Couldn't read the upload request." })
          return
        }

        const { blobUrl, fileName, replaceBatchId } = body

        if (typeof blobUrl !== "string" || !blobUrl) {
          send({ type: "error", error: "No file was uploaded." })
          return
        }
        if (typeof fileName !== "string" || !fileName.toLowerCase().endsWith(".xlsx")) {
          send({ type: "error", error: "Only .xlsx files are supported." })
          return
        }
        if (
          typeof replaceBatchId === "string" &&
          replaceBatchId.length > 0 &&
          !mongoose.isValidObjectId(replaceBatchId)
        ) {
          send({ type: "error", error: "Invalid batch to replace." })
          return
        }

        await connectToDatabase()

        const batch = await UploadBatch.create({
          fileName,
          uploadedById: session.user.id,
          uploadedByName: session.user.name ?? session.user.email ?? "Super Admin",
          status: "processing",
        })
        batchId = batch._id

        blobUrlToDelete = blobUrl

        if (typeof replaceBatchId === "string" && replaceBatchId.length > 0) {
          await RoyaltyRecord.deleteMany({ batchId: replaceBatchId })
        }

        // Rows that fail to insert (e.g. a schema cast error on one bad row)
        // shouldn't abort the whole import — count and skip them instead.
        let insertFailedCount = 0
        const vendorIdByName = new Map<string, string>()
        const newVendors: NewVendorCredential[] = []

        // The report itself is proof a vendor owns the ISRCs it lists, so each
        // (vendor, ISRC) pair seen in the file is auto-registered as an
        // approved claim — flushed in chunks so unique ISRCs don't pile up.
        const isrcClaimCandidates = new Map<string, ParsedRoyaltyRow>()

        async function flushIsrcClaims(force = false) {
          if (!force && isrcClaimCandidates.size < ISRC_CLAIM_FLUSH_SIZE) return
          if (isrcClaimCandidates.size === 0) return

          const pending = Array.from(isrcClaimCandidates.values())
          isrcClaimCandidates.clear()

          const isrcClaimOps = pending.flatMap((row) => {
            const vendorId = vendorIdByName.get(row.vendorName)
            if (!row.isrc || !vendorId) return []
            return [
              {
                updateOne: {
                  filter: { isrc: row.isrc, status: "approved" as const },
                  update: {
                    $setOnInsert: {
                      isrc: row.isrc,
                      vendorId: new mongoose.Types.ObjectId(vendorId),
                      vendorName: row.vendorName,
                      productTitle: row.productTitle ?? "Unknown title",
                      productArtistName: row.productArtistName ?? "Unknown artist",
                      productAlbumName: row.productAlbumName ?? undefined,
                      labelName: row.labelName ?? undefined,
                      status: "approved" as const,
                      reviewedByName: "Auto-approved (report upload)",
                      reviewedAt: new Date(),
                    },
                  },
                  upsert: true,
                },
              },
            ]
          })

          if (isrcClaimOps.length === 0) return
          try {
            await IsrcClaim.bulkWrite(isrcClaimOps, { ordered: false })
          } catch (error) {
            console.error("[uploads] failed to auto-register some ISRC claims:", error)
          }
        }

        let lastFileEventAt = 0
        const { rowCount, skippedRowCount } = await streamRoyaltyRowsFromUrl(
          blobUrl,
          async (rows) => {
            const unknownVendors = new Set<string>()
            for (const row of rows) {
              if (!vendorIdByName.has(row.vendorName)) unknownVendors.add(row.vendorName)
            }
            if (unknownVendors.size > 0) {
              const ensured = await ensureVendorAccounts(unknownVendors)
              for (const [name, id] of ensured.vendorIdByName) {
                vendorIdByName.set(name, id)
              }
              newVendors.push(...ensured.newVendors)
            }

            const docs = rows.map((row) => ({
              ...row,
              batchId: batch._id,
              vendorId: vendorIdByName.get(row.vendorName) ?? null,
            }))
            try {
              await RoyaltyRecord.insertMany(docs, { ordered: false })
            } catch (error) {
              const writeErrors = (error as { writeErrors?: unknown[] }).writeErrors
              const failed = writeErrors?.length ?? docs.length
              insertFailedCount += failed
              console.error(`[uploads] ${failed} row(s) failed to insert:`, error)
            }

            for (const row of rows) {
              if (row.isrc && !isrcClaimCandidates.has(row.isrc)) {
                isrcClaimCandidates.set(row.isrc, row)
              }
            }
            await flushIsrcClaims()
          },
          {
            onFileBytes: (bytesRead, totalBytes) => {
              const now = Date.now()
              const isComplete = totalBytes !== null && bytesRead >= totalBytes
              if (!isComplete && now - lastFileEventAt < 400) return
              lastFileEventAt = now
              send({ type: "file", bytesRead, totalBytes })
            },
            onProgress: ({ processedRowCount, skippedRowCount }) => {
              send({
                type: "progress",
                processedRowCount,
                failedRowCount: skippedRowCount + insertFailedCount,
              })
              UploadBatch.findByIdAndUpdate(batch._id, { processedRowCount }).catch((updateError) => {
                console.error("[uploads] failed to persist progress:", updateError)
              })
            },
          }
        )

        await flushIsrcClaims(true)

        const failedRowCount = skippedRowCount + insertFailedCount
        const importedRowCount = rowCount - insertFailedCount
        const scannedRowCount = rowCount + skippedRowCount

        await UploadBatch.findByIdAndUpdate(batch._id, {
          status: "completed",
          rowCount: importedRowCount,
          skippedRowCount: failedRowCount,
          vendorsCreated: newVendors.length,
          processedRowCount: scannedRowCount,
          totalRowCount: scannedRowCount,
        })

        send({
          type: "done",
          batchId: batch._id.toString(),
          rowCount: importedRowCount,
          skippedRowCount: failedRowCount,
          failedRowCount,
          newVendors,
        })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Import failed."
        console.error("[uploads] import failed:", error)
        if (batchId) {
          await UploadBatch.findByIdAndUpdate(batchId, {
            status: "failed",
            errorMessage,
          }).catch((updateError) => {
            console.error("[uploads] failed to mark batch as failed:", updateError)
          })
        }
        send({ type: "error", error: errorMessage })
      } finally {
        if (blobUrlToDelete) {
          await del(blobUrlToDelete).catch((deleteError) => {
            console.error("[uploads] failed to delete blob:", deleteError)
          })
        }
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  })
}
