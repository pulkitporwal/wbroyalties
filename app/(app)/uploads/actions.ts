"use server"

import { revalidatePath } from "next/cache"

import { auth } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import { UploadBatch } from "@/models/UploadBatch"
import { RoyaltyRecord } from "@/models/RoyaltyRecord"
import { IsrcClaim } from "@/models/IsrcClaim"
import { Admin } from "@/models/Admin"

async function requireSuperAdmin() {
  const session = await auth()
  if (session?.user.role !== "super_admin") {
    throw new Error("Forbidden")
  }
}

export async function deleteBatch(id: string) {
  await requireSuperAdmin()
  await connectToDatabase()

  const vendorIds = await RoyaltyRecord.distinct("vendorId", {
    batchId: id,
    vendorId: { $ne: null },
  })

  await RoyaltyRecord.deleteMany({ batchId: id })

  // A vendor whose only records lived in this batch has no data left once
  // it's gone — drop the vendor account and any ISRC claims it holds too.
  for (const vendorId of vendorIds) {
    const remaining = await RoyaltyRecord.countDocuments({ vendorId })
    if (remaining === 0) {
      await IsrcClaim.deleteMany({ vendorId })
      await Admin.findOneAndDelete({ _id: vendorId, role: "vendor" })
    }
  }

  await UploadBatch.findByIdAndDelete(id)

  revalidatePath("/uploads")
  revalidatePath("/dashboard")
  revalidatePath("/analytics")
  revalidatePath("/vendors")
}
