import { handleUpload, type HandleUploadBody } from "@vercel/blob/client"
import { NextResponse } from "next/server"

import { auth } from "@/lib/auth"

export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        const session = await auth()
        if (session?.user.role !== "super_admin") {
          throw new Error("Forbidden")
        }
        if (!pathname.toLowerCase().endsWith(".xlsx")) {
          throw new Error("Only .xlsx files are supported.")
        }

        return {
          allowedContentTypes: [
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          ],
          addRandomSuffix: true,
          maximumSizeInBytes: 100 * 1024 * 1024,
        }
      },
      onUploadCompleted: async () => {},
    })

    return NextResponse.json(jsonResponse)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed."
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
