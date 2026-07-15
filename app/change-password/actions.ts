"use server"

import bcrypt from "bcryptjs"
import { z } from "zod"

import { auth, signOut } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import { Admin } from "@/models/Admin"

export type ChangePasswordState = { error?: string } | undefined

const changePasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters long."),
    confirmPassword: z.string().min(8, "Please confirm your new password."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  })

export async function changePassword(
  _prevState: ChangePasswordState,
  formData: FormData
): Promise<ChangePasswordState> {
  const session = await auth()
  if (!session || session.user.role === "super_admin") {
    return { error: "This account cannot change its password here." }
  }

  const parsed = changePasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." }
  }

  await connectToDatabase()
  const passwordHash = await bcrypt.hash(parsed.data.password, 10)
  await Admin.findByIdAndUpdate(session.user.id, {
    passwordHash,
    mustChangePassword: false,
  })

  await signOut({ redirectTo: "/login" })
}
