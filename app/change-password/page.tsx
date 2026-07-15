import { redirect } from "next/navigation"
import type { Metadata } from "next"

import { auth } from "@/lib/auth"
import { ChangePasswordForm } from "./change-password-form"

export const metadata: Metadata = {
  title: "Set a new password",
}

export default async function ChangePasswordPage() {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  if (!session.user.mustChangePassword) {
    redirect("/dashboard")
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,color-mix(in_oklch,var(--primary),transparent_92%),transparent_55%)]"
      />
      <ChangePasswordForm />
    </div>
  )
}
