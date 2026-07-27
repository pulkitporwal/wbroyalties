import mongoose from "mongoose"

import { auth } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import { UploadBatch } from "@/models/UploadBatch"
import { RoyaltyRecord } from "@/models/RoyaltyRecord"
import { IsrcClaim } from "@/models/IsrcClaim"
import { collectVendorNames, streamRoyaltyRows, type ParsedRoyaltyRow } from "@/lib/royalty-import"
import { ensureVendorAccounts } from "@/lib/vendor-provisioning"

export const runtime = "nodejs"
export const maxDuration = 300

type UploadEvent =
  | { type: "total"; totalRowCount: number }
  | { type: "progress"; processedRowCount: number; failedRowCount: number; totalRowCount: number }
  | {
      type: "done"
      batchId: string
      rowCount: number
      skippedRowCount: number
      failedRowCount: number
      newVendors: { vendorName: string; email: string; tempPassword: string }[]
    }
  | { type: "error"; error: string }

export async function POST(request: Request) {
  const encoder = new TextEncoder()

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      function send(event: UploadEvent) {
        controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"))
      }

      let batchId: mongoose.Types.ObjectId | null = null

      try {
        const session = await auth()
        if (session?.user.role !== "super_admin") {
          send({ type: "error", error: "Forbidden" })
          return
        }

        let formData: FormData
        try {
          formData = await request.formData()
        } catch {
          send({
            type: "error",
            error:
              "Couldn't read the uploaded file. It may be too large or the connection was interrupted.",
          })
          return
        }

        const file = formData.get("file")
        const replaceBatchId = formData.get("replaceBatchId")

        if (!(file instanceof File)) {
          send({ type: "error", error: "No file was uploaded." })
          return
        }
        if (!file.name.toLowerCase().endsWith(".xlsx")) {
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
          fileName: file.name,
          uploadedById: session.user.id,
          uploadedByName: session.user.name ?? session.user.email ?? "Super Admin",
          status: "processing",
        })
        batchId = batch._id

        const buffer = Buffer.from(await file.arrayBuffer())

        const { vendorNames, totalRowCount } = await collectVendorNames(buffer)
        send({ type: "total", totalRowCount })

        const { vendorIdByName, newVendors } = await ensureVendorAccounts(vendorNames)

        if (typeof replaceBatchId === "string" && replaceBatchId.length > 0) {
          await RoyaltyRecord.deleteMany({ batchId: replaceBatchId })
        }

        // Rows that fail to insert (e.g. a schema cast error on one bad row)
        // shouldn't abort the whole import — count and skip them instead.
        let insertFailedCount = 0

        // The report itself is proof a vendor owns the ISRCs it lists, so each
        // (vendor, ISRC) pair seen in the file is auto-registered as an
        // approved claim — no separate manual claim/review needed.
        const isrcClaimCandidates = new Map<string, ParsedRoyaltyRow>()

        const { rowCount, skippedRowCount } = await streamRoyaltyRows(
          buffer,
          async (rows) => {
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
          },
          ({ processedRowCount, skippedRowCount }) => {
            send({
              type: "progress",
              processedRowCount,
              failedRowCount: skippedRowCount + insertFailedCount,
              totalRowCount,
            })
          }
        )

        const failedRowCount = skippedRowCount + insertFailedCount

        const isrcClaimOps = Array.from(isrcClaimCandidates.values()).flatMap((row) => {
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

        if (isrcClaimOps.length > 0) {
          try {
            await IsrcClaim.bulkWrite(isrcClaimOps, { ordered: false })
          } catch (error) {
            console.error("[uploads] failed to auto-register some ISRC claims:", error)
          }
        }

        await UploadBatch.findByIdAndUpdate(batch._id, {
          status: "completed",
          rowCount: rowCount - insertFailedCount,
          skippedRowCount: failedRowCount,
          vendorsCreated: newVendors.length,
        })

        send({
          type: "done",
          batchId: batch._id.toString(),
          rowCount: rowCount - insertFailedCount,
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
