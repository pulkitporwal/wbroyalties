"use client"

import { usePathname } from "next/navigation"

import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import type { UserRole } from "@/types/next-auth"

import { ThemeToggle } from "./theme-toggle"
import { UserMenu } from "./user-menu"

const titles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/admins": "Admins",
  "/profile": "Profile",
  "/settings": "Settings",
}

function pageTitle(pathname: string) {
  const match = Object.keys(titles).find((path) => pathname.startsWith(path))
  return match ? titles[match] : "WB Royalties"
}

export function TopBar({
  name,
  email,
  role,
}: {
  name: string
  email: string
  role: UserRole
}) {
  const pathname = usePathname()

  return (
    <header className="sticky bg-background border-b border-neutral-400/20 top-0 z-40 flex h-12 items-center gap-3 px-4 backdrop-blur supports-backdrop-filter:bg-card/60 sm:px-6">
      <SidebarTrigger />
      <h1 className="font-heading text-sm font-medium">{pageTitle(pathname)}</h1>
      <div className="ml-auto flex items-center gap-4">
        <ThemeToggle />
        <UserMenu name={name} email={email} role={role} />
      </div>
    </header>
  )
}
