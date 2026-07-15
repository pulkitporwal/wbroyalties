import { NextResponse } from "next/server"
import mongoose from "mongoose"

import { auth } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import { RoyaltyRecord } from "@/models/RoyaltyRecord"

export async function GET(request: Request) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const q = searchParams.get("q")?.trim() ?? ""
  if (q.length < 2) {
    return NextResponse.json({ results: [] })
  }

  await connectToDatabase()

  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const regex = { $regex: escaped, $options: "i" }
  const match: Record<string, unknown> = {
    $or: [{ productTitle: regex }, { productArtistName: regex }, { isrc: regex }],
  }
  if (session.user.role === "vendor" && mongoose.isValidObjectId(session.user.id)) {
    match.vendorId = new mongoose.Types.ObjectId(session.user.id)
  }

  const results = await RoyaltyRecord.aggregate([
    { $match: match },
    {
      $group: {
        _id: { productTitle: "$productTitle", productArtistName: "$productArtistName" },
        isrc: { $first: "$isrc" },
      },
    },
    { $limit: 8 },
    {
      $project: {
        _id: 0,
        productTitle: "$_id.productTitle",
        productArtistName: "$_id.productArtistName",
        isrc: 1,
      },
    },
  ])

  return NextResponse.json({ results })
}
