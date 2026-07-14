import { redirect } from "next/navigation"
import type { Metadata } from "next"

import { auth } from "@/lib/auth"
import { LoginForm } from "./login-form"
import { LoginShowcase } from "./login-showcase"

export const metadata: Metadata = {
  title: "Sign in",
}

export default async function LoginPage() {
  const session = await auth()

  if (session) {
    redirect("/dashboard")
  }

  return (
    <div className="grid min-h-screen flex-1 lg:grid-cols-2">
      <LoginShowcase />
      <div className="relative flex items-center justify-center overflow-hidden bg-background px-4 py-12">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,color-mix(in_oklch,var(--primary),transparent_92%),transparent_55%)]"
        />
        <LoginForm />
      </div>
    </div>
  )
}
