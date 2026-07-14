import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"

import { connectToDatabase } from "@/lib/mongodb"
import { Admin } from "@/models/Admin"

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email
        const password = credentials?.password

        if (typeof email !== "string" || typeof password !== "string") {
          return null
        }

        const normalizedEmail = email.trim().toLowerCase()

        if (
          normalizedEmail === process.env.SUPER_ADMIN_EMAIL?.toLowerCase() &&
          password === process.env.SUPER_ADMIN_PASSWORD
        ) {
          return {
            id: "super-admin",
            name: "Super Admin",
            email: normalizedEmail,
            role: "super_admin",
          }
        }

        await connectToDatabase()
        const admin = await Admin.findOne({ email: normalizedEmail })

        if (!admin || admin.status === "suspended") {
          return null
        }

        const isValidPassword = await bcrypt.compare(password, admin.passwordHash)
        if (!isValidPassword) {
          return null
        }

        return {
          id: admin._id.toString(),
          name: admin.name,
          email: admin.email,
          role: "admin",
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    session({ session, token }) {
      session.user.id = token.id
      session.user.role = token.role
      return session
    },
  },
})
