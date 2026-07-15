"use client"

import Image from "next/image"
import { useActionState } from "react"
import { AlertCircle, ArrowRight } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

import { changePassword } from "./actions"

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(changePassword, undefined)

  return (
    <div className="flex w-full max-w-sm flex-col gap-8">
      <div className="flex flex-col items-center gap-4 text-center">
        <Image
          src="/logo.webp"
          alt="Logo"
          width={40}
          height={40}
          className="rounded-md"
        />
      </div>

      <div className="flex flex-col gap-1.5 text-center">
        <h1 className="font-heading text-2xl font-medium">Set a new password</h1>
        <p className="text-sm text-muted-foreground">
          You&rsquo;re signing in with a temporary password. Choose a new
          password to continue.
        </p>
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">New password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            required
            minLength={8}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="confirmPassword">Confirm new password</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            required
            minLength={8}
          />
        </div>

        {state?.error && (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" disabled={pending} size="lg" className="mt-1 w-full">
          {pending ? "Updating..." : "Update password"}
          {!pending && <ArrowRight data-icon="inline-end" />}
        </Button>
      </form>
    </div>
  )
}
