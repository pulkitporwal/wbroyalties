"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { auth } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import { IsrcClaim } from "@/models/IsrcClaim"

export type ActionState = { error?: string; success?: boolean } | undefined

async function requireVendor() {
  const session = await auth()
  if (session?.user.role !== "vendor") {
    throw new Error("Forbidden")
  }
  return session
}

async function requireReviewer() {
  const session = await auth()
  if (session?.user.role !== "super_admin" && session?.user.role !== "admin") {
    throw new Error("Forbidden")
  }
  return session
}

async function requireSuperAdmin() {
  const session = await auth()
  if (session?.user.role !== "super_admin") {
    throw new Error("Forbidden")
  }
  return session
}

const submitClaimSchema = z.object({
  isrc: z.string().trim().min(1, "ISRC is required."),
  productTitle: z.string().trim().min(1, "Title is required."),
  productArtistName: z.string().trim().min(1, "Artist is required."),
  productAlbumName: z.string().trim().optional(),
  labelName: z.string().trim().optional(),
  notes: z.string().trim().optional(),
})

export async function submitIsrcClaim(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireVendor()

  const parsed = submitClaimSchema.safeParse({
    isrc: formData.get("isrc"),
    productTitle: formData.get("productTitle"),
    productArtistName: formData.get("productArtistName"),
    productAlbumName: formData.get("productAlbumName") || undefined,
    labelName: formData.get("labelName") || undefined,
    notes: formData.get("notes") || undefined,
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." }
  }

  await connectToDatabase()

  const existing = await IsrcClaim.findOne({
    isrc: parsed.data.isrc.toUpperCase(),
    status: { $in: ["pending", "approved"] },
  })
  if (existing) {
    return {
      error:
        existing.status === "approved"
          ? "This ISRC is already assigned to a vendor."
          : "This ISRC already has a pending claim.",
    }
  }

  await IsrcClaim.create({
    vendorId: session.user.id,
    vendorName: session.user.vendorName ?? session.user.name ?? "Vendor",
    ...parsed.data,
  })

  revalidatePath("/isrcs")
  return { success: true }
}

export async function approveClaim(id: string) {
  const session = await requireReviewer()
  await connectToDatabase()

  try {
    const claim = await IsrcClaim.findOneAndUpdate(
      { _id: id, status: "pending" },
      {
        status: "approved",
        reviewedById: session.user.id,
        reviewedByName: session.user.name ?? session.user.email ?? "Admin",
        reviewedAt: new Date(),
        reviewNote: undefined,
      },
      { new: true }
    )
    revalidatePath("/isrcs")
    return claim ? { success: true } : { error: "Claim is no longer pending." }
  } catch (error) {
    if (error instanceof Error && "code" in error && (error as { code?: number }).code === 11000) {
      return { error: "This ISRC is already assigned to a vendor." }
    }
    throw error
  }
}

export async function revertClaimToPending(id: string) {
  await requireSuperAdmin()
  await connectToDatabase()

  const claim = await IsrcClaim.findOneAndUpdate(
    { _id: id, status: { $in: ["approved", "rejected"] } },
    {
      status: "pending",
      reviewedById: undefined,
      reviewedByName: undefined,
      reviewedAt: undefined,
      reviewNote: undefined,
    },
    { new: true }
  )

  revalidatePath("/isrcs")
  return claim ? { success: true } : { error: "Claim is already pending." }
}

export async function deleteIsrcClaim(id: string) {
  await requireSuperAdmin()
  await connectToDatabase()

  const claim = await IsrcClaim.findByIdAndDelete(id)

  revalidatePath("/isrcs")
  return claim ? { success: true } : { error: "Claim not found." }
}

export async function rejectClaim(id: string, reviewNote?: string) {
  const session = await requireReviewer()
  await connectToDatabase()

  const claim = await IsrcClaim.findOneAndUpdate(
    { _id: id, status: "pending" },
    {
      status: "rejected",
      reviewedById: session.user.id,
      reviewedByName: session.user.name ?? session.user.email ?? "Admin",
      reviewedAt: new Date(),
      reviewNote: reviewNote?.trim() || undefined,
    },
    { new: true }
  )

  revalidatePath("/isrcs")
  return claim ? { success: true } : { error: "Claim is no longer pending." }
}
