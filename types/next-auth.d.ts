import type { DefaultSession } from "next-auth"

export type UserRole = "super_admin" | "admin" | "vendor"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: UserRole
      vendorName?: string
      mustChangePassword: boolean
    } & DefaultSession["user"]
  }

  interface User {
    role: UserRole
    vendorName?: string
    mustChangePassword: boolean
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string
    role: UserRole
    vendorName?: string
    mustChangePassword: boolean
  }
}
