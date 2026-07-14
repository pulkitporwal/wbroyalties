import type { Metadata } from "next"

import { auth } from "@/lib/auth"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export const metadata: Metadata = {
  title: "Profile",
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

export default async function ProfilePage() {
  const session = await auth()
  const user = session!.user

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-medium">Profile</h1>
        <p className="text-sm text-muted-foreground">
          Your account details for the royalties admin portal.
        </p>
      </div>

      <Card className="max-w-md">
        <CardHeader className="flex-row items-center gap-3">
          <Avatar size="lg">
            <AvatarFallback>{initials(user.name ?? "U")}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-1">
            <CardTitle>{user.name}</CardTitle>
            <CardDescription>{user.email}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Separator />
          <div className="flex items-center justify-between text-xs/relaxed">
            <span className="text-muted-foreground">Role</span>
            <Badge variant="outline">
              {user.role === "super_admin" ? "Super Admin" : "Admin"}
            </Badge>
          </div>
          <div className="flex items-center justify-between text-xs/relaxed">
            <span className="text-muted-foreground">Access</span>
            <span>
              {user.role === "super_admin"
                ? "Full platform access"
                : "Standard admin access"}
            </span>
          </div>
        </CardContent>
      </Card>

      {user.role === "admin" && (
        <p className="max-w-md text-xs text-muted-foreground">
          Need your name, email, or password updated? Ask a super admin —
          admin accounts are managed from the Admins page.
        </p>
      )}
    </div>
  )
}
