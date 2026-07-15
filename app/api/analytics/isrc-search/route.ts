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

  const match: Record<string, unknown> = {
    isrc: { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" },
  }
  if (session.user.role === "vendor" && mongoose.isValidObjectId(session.user.id)) {
    match.vendorId = new mongoose.Types.ObjectId(session.user.id)
  }

  const results = await RoyaltyRecord.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$isrc",
        productTitle: { $first: "$productTitle" },
        productArtistName: { $first: "$productArtistName" },
      },
    },
    { $limit: 8 },
    {
      $project: {
        _id: 0,
        isrc: "$_id",
        productTitle: 1,
        productArtistName: 1,
      },
    },
  ])

  return NextResponse.json({ results })
}
