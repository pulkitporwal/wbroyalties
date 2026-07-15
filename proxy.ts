import { NextResponse } from "next/server"

import { auth } from "@/lib/auth"

const superAdminOnlyPrefixes = ["/admins", "/uploads", "/vendors"]

export default auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth

  const isLoginRoute = pathname === "/login"
  const isChangePasswordRoute = pathname === "/change-password"

  if (!session && !isLoginRoute) {
    return NextResponse.redirect(new URL("/login", req.nextUrl))
  }

  if (session && isLoginRoute) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl))
  }

  if (session?.user.mustChangePassword && !isChangePasswordRoute) {
    return NextResponse.redirect(new URL("/change-password", req.nextUrl))
  }

  if (
    session &&
    !session.user.mustChangePassword &&
    superAdminOnlyPrefixes.some((prefix) => pathname.startsWith(prefix)) &&
    session.user.role !== "super_admin"
  ) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    "/((?!api/auth|api/uploads|_next/static|_next/image|favicon.ico|logo.webp).*)",
  ],
}
