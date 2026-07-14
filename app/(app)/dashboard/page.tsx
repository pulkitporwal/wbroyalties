import type { Metadata } from "next"
import { DollarSign, Music2, Radio, Users2 } from "lucide-react"

import { auth } from "@/lib/auth"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Dashboard",
}

const stats = [
  { label: "Total revenue", icon: DollarSign },
  { label: "Active artists", icon: Users2 },
  { label: "Tracked releases", icon: Music2 },
  { label: "Connected platforms", icon: Radio },
] as const

export default async function DashboardPage() {
  const session = await auth()

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-medium">
          Welcome back, {session?.user.name}
        </h1>
        <p className="text-sm text-muted-foreground">
          Here&rsquo;s where your business performance stats will live.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, icon: Icon }) => (
          <Card key={label}>
            <CardHeader className="flex-row items-center justify-between">
              <CardDescription>{label}</CardDescription>
              <div className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Icon className="size-3.5" />
              </div>
            </CardHeader>
            <CardContent>
              <span className="font-heading text-xl font-medium text-muted-foreground">
                —
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>No data connected yet</CardTitle>
          <CardDescription>
            Once artist, revenue, and platform data is wired up, this
            dashboard will surface your key business metrics here.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}
