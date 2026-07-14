import type { DefaultSession } from "next-auth"

export type UserRole = "super_admin" | "admin"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: UserRole
    } & DefaultSession["user"]
  }

  interface User {
    role: UserRole
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string
    role: UserRole
  }
}
