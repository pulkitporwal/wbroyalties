"use server"

import { revalidatePath } from "next/cache"

import { auth } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import { UploadBatch } from "@/models/UploadBatch"
import { RoyaltyRecord } from "@/models/RoyaltyRecord"

async function requireSuperAdmin() {
  const session = await auth()
  if (session?.user.role !== "super_admin") {
    throw new Error("Forbidden")
  }
}

export async function deleteBatch(id: string) {
  await requireSuperAdmin()
  await connectToDatabase()

  await RoyaltyRecord.deleteMany({ batchId: id })
  await UploadBatch.findByIdAndDelete(id)

  revalidatePath("/uploads")
  revalidatePath("/dashboard")
  revalidatePath("/analytics")
}
