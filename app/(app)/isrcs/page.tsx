import type { Metadata } from "next"

import { auth } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import { IsrcClaim } from "@/models/IsrcClaim"
import { VendorIsrcView, type ClaimRow } from "./vendor-view"
import { AdminIsrcView } from "./admin-view"

export const metadata: Metadata = {
  title: "ISRCs",
}

function toClaimRow(doc: {
  _id: unknown
  vendorId: unknown
  vendorName: string
  isrc: string
  productTitle: string
  productArtistName: string
  productAlbumName?: string | null
  labelName?: string | null
  notes?: string | null
  status: "pending" | "approved" | "rejected"
  reviewedByName?: string | null
  reviewNote?: string | null
  reviewedAt?: Date | null
  createdAt?: Date
}): ClaimRow {
  return {
    id: String(doc._id),
    vendorId: String(doc.vendorId),
    vendorName: doc.vendorName,
    isrc: doc.isrc,
    productTitle: doc.productTitle,
    productArtistName: doc.productArtistName,
    productAlbumName: doc.productAlbumName ?? null,
    labelName: doc.labelName ?? null,
    notes: doc.notes ?? null,
    status: doc.status,
    reviewedByName: doc.reviewedByName ?? null,
    reviewNote: doc.reviewNote ?? null,
    reviewedAt: doc.reviewedAt ? doc.reviewedAt.toISOString() : null,
    createdAt: doc.createdAt ? doc.createdAt.toISOString() : new Date().toISOString(),
  }
}

export default async function IsrcsPage() {
  const session = await auth()
  await connectToDatabase()

  const isVendor = session?.user.role === "vendor"

  if (isVendor) {
    const claims = await IsrcClaim.find({ vendorId: session!.user.id })
      .sort({ createdAt: -1 })
      .lean()

    return (
      <VendorIsrcView
        vendorName={session!.user.vendorName ?? session!.user.name ?? "Vendor"}
        claims={claims.map(toClaimRow)}
      />
    )
  }

  const [pending, all] = await Promise.all([
    IsrcClaim.find({ status: "pending" }).sort({ createdAt: 1 }).lean(),
    IsrcClaim.find({}).sort({ createdAt: -1 }).lean(),
  ])

  return (
    <AdminIsrcView
      pendingClaims={pending.map(toClaimRow)}
      allClaims={all.map(toClaimRow)}
      isSuperAdmin={session?.user.role === "super_admin"}
    />
  )
}
