"use client"

import { usePathname } from "next/navigation"
import { LogOut } from "lucide-react"

import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"

import { logout } from "./actions"
import { ThemeToggle } from "./theme-toggle"

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

export function TopBar() {
  const pathname = usePathname()

  return (
    <header className="sticky bg-background border-b border-neutral-400/20 top-0 z-40 flex h-12 items-center gap-3 px-4 backdrop-blur supports-backdrop-filter:bg-card/60 sm:px-6">
      <SidebarTrigger />
      <h1 className="font-heading text-sm font-medium">{pageTitle(pathname)}</h1>
      <div className="ml-auto flex items-center gap-4">
        <ThemeToggle />
        <Button
          variant="ghost"
          size="icon"
          aria-label="Sign out"
          onClick={() => void logout()}
        >
          <LogOut />
        </Button>
      </div>
    </header>
  )
}
