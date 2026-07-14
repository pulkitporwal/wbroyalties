"use server"

import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"
import { z } from "zod"

import { auth } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import { Admin } from "@/models/Admin"

export type ActionState = { error?: string; success?: boolean } | undefined

async function requireSuperAdmin() {
  const session = await auth()
  if (session?.user.role !== "super_admin") {
    throw new Error("Forbidden")
  }
}

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long.")

const createAdminSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters long."),
  email: z.email("Please enter a valid email."),
  password: passwordSchema,
})

export async function createAdmin(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireSuperAdmin()

  const parsed = createAdminSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." }
  }

  const { name, email, password } = parsed.data

  await connectToDatabase()

  const existing = await Admin.findOne({ email: email.toLowerCase() })
  if (existing) {
    return { error: "An admin with this email already exists." }
  }

  const passwordHash = await bcrypt.hash(password, 10)
  await Admin.create({ name, email: email.toLowerCase(), passwordHash })

  revalidatePath("/admins")
  return { success: true }
}

const updateAdminSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(2, "Name must be at least 2 characters long."),
  email: z.email("Please enter a valid email."),
})

export async function updateAdmin(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireSuperAdmin()

  const parsed = updateAdminSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    email: formData.get("email"),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." }
  }

  const { id, name, email } = parsed.data

  await connectToDatabase()

  const existing = await Admin.findOne({
    email: email.toLowerCase(),
    _id: { $ne: id },
  })
  if (existing) {
    return { error: "An admin with this email already exists." }
  }

  await Admin.findByIdAndUpdate(id, { name, email: email.toLowerCase() })

  revalidatePath("/admins")
  return { success: true }
}

const resetPasswordSchema = z.object({
  id: z.string().min(1),
  password: passwordSchema,
})

export async function resetAdminPassword(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireSuperAdmin()

  const parsed = resetPasswordSchema.safeParse({
    id: formData.get("id"),
    password: formData.get("password"),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." }
  }

  await connectToDatabase()
  const passwordHash = await bcrypt.hash(parsed.data.password, 10)
  await Admin.findByIdAndUpdate(parsed.data.id, { passwordHash })

  revalidatePath("/admins")
  return { success: true }
}

export async function setAdminStatus(id: string, status: "active" | "suspended") {
  await requireSuperAdmin()
  await connectToDatabase()
  await Admin.findByIdAndUpdate(id, { status })
  revalidatePath("/admins")
}

export async function deleteAdmin(id: string) {
  await requireSuperAdmin()
  await connectToDatabase()
  await Admin.findByIdAndDelete(id)
  revalidatePath("/admins")
}
