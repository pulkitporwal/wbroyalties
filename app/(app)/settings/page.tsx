import type { Metadata } from "next"

import { auth } from "@/lib/auth"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ThemeSettings } from "./theme-settings"

export const metadata: Metadata = {
  title: "Settings",
}

export default async function SettingsPage() {
  const session = await auth()
  const user = session!.user

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-medium">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage how the portal looks and behaves for your account.
        </p>
      </div>

      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>
            Choose how WB Royalties looks on this device.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ThemeSettings />
        </CardContent>
      </Card>

      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Security</CardTitle>
          <CardDescription>
            {user.role === "super_admin"
              ? "The super admin password is set via environment configuration."
              : "Password resets are handled by a super admin from the Admins page."}
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}
