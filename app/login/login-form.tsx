"use client"

import Image from "next/image"
import { useActionState } from "react"
import { AlertCircle, ArrowRight } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

import { authenticate } from "./actions"

export function LoginForm() {
  const [state, formAction, pending] = useActionState(authenticate, undefined)

  return (
    <div className="flex w-full max-w-sm flex-col gap-8">
      <div className="flex flex-col items-center gap-4 text-center lg:hidden">
        <Image
          src="/logo.webp"
          alt="Logo"
          width={40}
          height={40}
          className="rounded-md"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <h1 className="font-heading text-2xl font-medium">Welcome back</h1>
        <p className="text-sm text-muted-foreground">
          Sign in to access the royalties admin portal.
        </p>
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@company.com"
            autoComplete="email"
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />
        </div>

        {state?.error && (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" disabled={pending} size="lg" className="mt-1 w-full">
          {pending ? "Signing in..." : "Sign in"}
          {!pending && <ArrowRight data-icon="inline-end" />}
        </Button>
      </form>

      <p className="text-center text-xs text-muted-foreground">
        Protected access — authorized personnel only.
      </p>
    </div>
  )
}
