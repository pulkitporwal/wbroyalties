"use server"

import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"
import { z } from "zod"

import { auth } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import { Admin } from "@/models/Admin"
import { ensureVendorAccounts } from "@/lib/vendor-provisioning"

export type ActionState = { error?: string; success?: boolean } | undefined
export type ResetPasswordState =
  | { error?: string; success?: boolean; tempPassword?: string }
  | undefined

async function requireSuperAdmin() {
  const session = await auth()
  if (session?.user.role !== "super_admin") {
    throw new Error("Forbidden")
  }
}

const createVendorSchema = z.object({
  vendorName: z.string().trim().min(1, "Vendor name is required."),
})

export async function createVendor(
  _prevState: ResetPasswordState,
  formData: FormData
): Promise<ResetPasswordState> {
  await requireSuperAdmin()

  const parsed = createVendorSchema.safeParse({
    vendorName: formData.get("vendorName"),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." }
  }

  await connectToDatabase()

  const existing = await Admin.findOne({
    role: "vendor",
    vendorName: parsed.data.vendorName,
  })
  if (existing) {
    return { error: "A vendor with this name already exists." }
  }

  const { newVendors } = await ensureVendorAccounts(new Set([parsed.data.vendorName]))

  revalidatePath("/vendors")
  return { success: true, tempPassword: newVendors[0]?.tempPassword }
}

const updateVendorSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1, "Display name is required."),
  email: z.email("Please enter a valid email."),
  ottCommissionPercent: z.coerce.number().min(0).max(100),
  ytCommissionPercent: z.coerce.number().min(0).max(100),
})

export async function updateVendor(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireSuperAdmin()

  const parsed = updateVendorSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    email: formData.get("email"),
    ottCommissionPercent: formData.get("ottCommissionPercent"),
    ytCommissionPercent: formData.get("ytCommissionPercent"),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." }
  }

  const { id, name, email, ottCommissionPercent, ytCommissionPercent } = parsed.data

  await connectToDatabase()

  const existing = await Admin.findOne({ email: email.toLowerCase(), _id: { $ne: id } })
  if (existing) {
    return { error: "An account with this email already exists." }
  }

  await Admin.findByIdAndUpdate(id, {
    name,
    email: email.toLowerCase(),
    ottCommissionPercent,
    ytCommissionPercent,
  })

  revalidatePath("/vendors")
  return { success: true }
}

const resetVendorPasswordSchema = z.object({
  id: z.string().min(1),
})

export async function resetVendorPassword(
  _prevState: ResetPasswordState,
  formData: FormData
): Promise<ResetPasswordState> {
  await requireSuperAdmin()

  const parsed = resetVendorPasswordSchema.safeParse({ id: formData.get("id") })
  if (!parsed.success) {
    return { error: "Invalid vendor." }
  }

  await connectToDatabase()

  const tempPassword = Array.from({ length: 12 }, () =>
    "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789".charAt(
      Math.floor(Math.random() * 54)
    )
  ).join("")
  const passwordHash = await bcrypt.hash(tempPassword, 10)

  await Admin.findByIdAndUpdate(parsed.data.id, {
    passwordHash,
    mustChangePassword: true,
  })

  revalidatePath("/vendors")
  return { success: true, tempPassword }
}

export async function setVendorStatus(id: string, status: "active" | "suspended") {
  await requireSuperAdmin()
  await connectToDatabase()
  await Admin.findByIdAndUpdate(id, { status })
  revalidatePath("/vendors")
}

export async function deleteVendor(id: string) {
  await requireSuperAdmin()
  await connectToDatabase()
  await Admin.findByIdAndDelete(id)
  revalidatePath("/vendors")
}
