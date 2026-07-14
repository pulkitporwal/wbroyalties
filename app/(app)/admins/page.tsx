import type { Metadata } from "next"

import { connectToDatabase } from "@/lib/mongodb"
import { Admin } from "@/models/Admin"
import { AdminsTable, type AdminRow } from "./admins-table"

export const metadata: Metadata = {
  title: "Admins",
}

export default async function AdminsPage() {
  await connectToDatabase()
  const admins = await Admin.find().sort({ createdAt: -1 }).lean()

  const rows: AdminRow[] = admins.map((admin) => ({
    id: admin._id.toString(),
    name: admin.name,
    email: admin.email,
    status: admin.status ?? "active",
    createdAt: admin.createdAt?.toISOString() ?? new Date().toISOString(),
  }))

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-medium">Admins</h1>
        <p className="text-sm text-muted-foreground">
          Create and manage admin accounts for the portal.
        </p>
      </div>
      <AdminsTable admins={rows} />
    </div>
  )
}
