import { auth } from "@/lib/auth"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "./app-sidebar"
import { TopBar } from "./top-bar"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  const user = session!.user

  return (
    <SidebarProvider>
      <AppSidebar role={user.role} />
      <SidebarInset className="border-[0.25px] overflow-x-hidden border-neutral-400/20">
        <TopBar />
        <main className="flex flex-1 flex-col px-4 py-8 sm:px-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
